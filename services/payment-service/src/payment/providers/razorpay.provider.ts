import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';

@Injectable()
export class RazorpayProvider implements PaymentProvider {
    private readonly logger = new Logger(RazorpayProvider.name);
    private client: Razorpay;

    constructor(private readonly configService: ConfigService) {
        this.client = new Razorpay({
            key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
            key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
        });
    }

    async createPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
        try {
            const options = {
                amount: createPaymentDto.amount * 100, // Razorpay expects amount in smallest currency unit (paise)
                currency: createPaymentDto.currency.toUpperCase(),
                receipt: createPaymentDto.orderId,
                notes: createPaymentDto.metadata || {},
            };

            const order = await this.client.orders.create(options);
            return {
                id: order.id,
                currency: order.currency,
                amount: order.amount,
                provider: 'razorpay',
            };
        } catch (error) {
            this.logger.error('Error creating Razorpay order', error);
            throw new InternalServerErrorException('Failed to create payment order with Razorpay');
        }
    }

    async verifyPayment(verifyPaymentDto: VerifyPaymentDto): Promise<boolean> {
        const { orderId, paymentId, signature } = verifyPaymentDto;
        const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(orderId + '|' + paymentId)
            .digest('hex');

        if (generatedSignature === signature) {
            return true;
        }
        throw new BadRequestException('Invalid payment signature');
    }

    async getPaymentStatus(paymentId: string): Promise<string> {
        try {
            const payment = await this.client.payments.fetch(paymentId);
            return payment.status;
        } catch (error) {
            this.logger.error(`Error fetching status for payment ${paymentId}`, error);
            throw new InternalServerErrorException('Failed to fetch payment status');
        }
    }

    async verifyWebhook(payload: any, signature: string): Promise<boolean> {
        const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET');
        if (!webhookSecret) {
            this.logger.warn('Razorpay webhook secret not configured');
            return false;
        }

        if (!signature) {
            this.logger.warn('No signature provided for webhook verification');
            return false;
        }

        try {
            // Razorpay webhook signature validation
            // Use the official Razorpay validation method
            const isValid = Razorpay.validateWebhookSignature(
                JSON.stringify(payload),
                signature,
                webhookSecret
            );

            if (isValid) {
                this.logger.log('Webhook signature verified successfully');
            } else {
                this.logger.warn('Webhook signature verification failed');
            }

            return isValid;
        } catch (error) {
            this.logger.error('Error during webhook verification', error);

            // Fallback to manual HMAC verification with timing-safe comparison
            try {
                const generatedSignature = crypto
                    .createHmac('sha256', webhookSecret)
                    .update(JSON.stringify(payload))
                    .digest('hex');

                // Use timing-safe comparison to prevent timing attacks
                const isValid = crypto.timingSafeEqual(
                    Buffer.from(signature),
                    Buffer.from(generatedSignature)
                );

                return isValid;
            } catch (fallbackError) {
                this.logger.error('Fallback webhook verification also failed', fallbackError);
                return false;
            }
        }
    }

    async refundPayment(paymentId: string, amount?: number): Promise<any> {
        try {
            const options: any = {};
            if (amount) {
                options.amount = amount * 100;
            }
            const refund = await this.client.payments.refund(paymentId, options);
            return refund;
        } catch (error) {
            this.logger.error(`Error refunding payment ${paymentId}`, error);
            throw new InternalServerErrorException('Failed to process refund');
        }
    }
}
