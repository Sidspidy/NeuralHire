import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';

@Injectable()
export class StripeProvider implements PaymentProvider {
    private readonly logger = new Logger(StripeProvider.name);
    private client: Stripe;

    constructor(private readonly configService: ConfigService) {
        this.client = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
            apiVersion: '2023-10-16', // Use a pinned version or latest
        });
    }

    async createPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
        try {
            const paymentIntent = await this.client.paymentIntents.create({
                amount: createPaymentDto.amount * 100, // Stripe expects cents
                currency: createPaymentDto.currency.toLowerCase(),
                metadata: {
                    orderId: createPaymentDto.orderId,
                    ...createPaymentDto.metadata,
                },
                description: createPaymentDto.description,
            });

            return {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                currency: paymentIntent.currency,
                amount: paymentIntent.amount,
                provider: 'stripe',
            };
        } catch (error) {
            this.logger.error('Error creating Stripe payment intent', error);
            throw new InternalServerErrorException('Failed to create payment intent with Stripe');
        }
    }

    // Stripe verification is usually done via Webhooks mostly, 
    // but client-side confirmation can be partly verified by checking status here.
    // The 'signature' in VerifyPaymentDto might not be relevant for Stripe in the same way as Razorpay.
    // We can check if the PaymentIntent is 'succeeded'.
    async verifyPayment(verifyPaymentDto: VerifyPaymentDto): Promise<boolean> {
        try {
            const { paymentId } = verifyPaymentDto;
            const paymentIntent = await this.client.paymentIntents.retrieve(paymentId);

            if (paymentIntent.status === 'succeeded') {
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Error verifying Stripe payment ${verifyPaymentDto.paymentId}`, error);
            return false;
        }
    }

    async getPaymentStatus(paymentId: string): Promise<string> {
        try {
            const paymentIntent = await this.client.paymentIntents.retrieve(paymentId);
            return paymentIntent.status;
        } catch (error) {
            this.logger.error(`Error fetching Stripe status for ${paymentId}`, error);
            throw new InternalServerErrorException('Failed to fetch payment status');
        }
    }

    async verifyWebhook(payload: any, signature: string): Promise<boolean> {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) return false;

        try {
            // payload must be the raw body buffer/string
            // constructEvent throws if invalid
            this.client.webhooks.constructEvent(payload, signature, webhookSecret);
            return true;
        } catch (err) {
            this.logger.error(`Webhook signature verification failed.`, err.message);
            return false;
        }
    }

    async refundPayment(paymentId: string, amount?: number): Promise<any> {
        try {
            const options: Stripe.RefundCreateParams = {
                payment_intent: paymentId,
            };
            if (amount) {
                options.amount = amount * 100;
            }
            const refund = await this.client.refunds.create(options);
            return refund;
        } catch (error) {
            this.logger.error(`Error refunding Stripe payment ${paymentId}`, error);
            throw new InternalServerErrorException('Failed to process refund');
        }
    }
}
