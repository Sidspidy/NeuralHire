import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CreatePaymentDto, PaymentProviderType } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { ProviderFactory } from './providers/provider.factory';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from './idempotency.service';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private readonly providerFactory: ProviderFactory,
        private readonly prisma: PrismaService,
        private readonly idempotencyService: IdempotencyService,
    ) { }

    async createPayment(createPaymentDto: CreatePaymentDto) {
        this.logger.log(`Creating payment with provider: ${createPaymentDto.provider}`);
        const provider = this.providerFactory.getProvider(createPaymentDto.provider);

        // 1. Create payment with provider
        const providerResponse = await provider.createPayment(createPaymentDto);

        // 2. Persist transaction
        const transaction = await this.prisma.paymentTransaction.create({
            data: {
                amount: createPaymentDto.amount,
                currency: createPaymentDto.currency,
                provider: createPaymentDto.provider,
                orderId: providerResponse.id || createPaymentDto.orderId || 'unknown',
                paymentId: providerResponse.id, // Depending on provider this might map differently
                status: 'pending',
                metadata: createPaymentDto.metadata || {},
            },
        });

        return { ...providerResponse, transactionId: transaction.id };
    }

    async verifyPayment(verifyPaymentDto: VerifyPaymentDto, providerType: string) {
        const provider = this.providerFactory.getProvider(providerType as any);
        this.logger.log(`Verifying payment ${verifyPaymentDto.paymentId} with ${providerType}`);
        const isValid = await provider.verifyPayment(verifyPaymentDto);

        if (isValid) {
            await this.prisma.paymentTransaction.updateMany({
                where: {
                    OR: [
                        { paymentId: verifyPaymentDto.paymentId },
                        { orderId: verifyPaymentDto.orderId }
                    ]
                },
                data: { status: 'success' },
            });
        }

        return isValid;
    }

    async getPaymentStatus(paymentId: string, providerType: string) {
        // Try to find in DB first
        const transaction = await this.prisma.paymentTransaction.findFirst({
            where: { OR: [{ paymentId }, { orderId: paymentId }] }
        });

        if (transaction) {
            return transaction.status;
        }

        // Fallback to provider check if not found or if strictly requested
        const provider = this.providerFactory.getProvider(providerType as any);
        return provider.getPaymentStatus(paymentId);
    }

    async handleWebhook(providerType: string, payload: any, signature: string) {
        this.logger.log(`Received webhook for ${providerType}`);
        const provider = this.providerFactory.getProvider(providerType as any);

        // 1. Verify Signature
        const isValid = await provider.verifyWebhook(payload, signature || '');
        if (!isValid) {
            this.logger.warn(`Invalid webhook signature for ${providerType}`);
            throw new BadRequestException('Invalid webhook signature');
        }

        // 2. Check Idempotency
        const eventId = this.extractEventId(providerType, payload);
        const idempotencyKey = this.idempotencyService.generateWebhookKey(providerType, eventId);

        const canProceed = await this.idempotencyService.checkAndSet(idempotencyKey, {
            provider: providerType,
            eventId,
            timestamp: new Date().toISOString()
        });

        if (!canProceed) {
            this.logger.log(`Webhook ${eventId} already processed, returning cached response`);
            const cachedResponse = await this.idempotencyService.get(idempotencyKey);
            return cachedResponse || { received: true, status: 'already_processed' };
        }

        // 3. Process Event
        // Map provider status to internal status
        let status = 'pending';
        let transactionIdOrOrderId: string | null = null;

        if (providerType === PaymentProviderType.RAZORPAY) {
            const event = payload.event;
            if (event === 'payment.captured' || event === 'order.paid') {
                status = 'success';
                // Razorpay payload structure extraction
                transactionIdOrOrderId = payload.payload?.payment?.entity?.order_id || payload.payload?.order?.entity?.id;
            } else if (event === 'payment.failed') {
                status = 'failed';
                transactionIdOrOrderId = payload.payload?.payment?.entity?.order_id;
            }
        } else if (providerType === PaymentProviderType.STRIPE) {
            const type = payload.type;
            if (type === 'payment_intent.succeeded') {
                status = 'success';
                transactionIdOrOrderId = payload.data?.object?.id;
            } else if (type === 'payment_intent.payment_failed') {
                status = 'failed';
                transactionIdOrOrderId = payload.data?.object?.id;
            }
        }

        if (transactionIdOrOrderId && status !== 'pending') {
            await this.prisma.paymentTransaction.updateMany({
                where: {
                    OR: [
                        { paymentId: transactionIdOrOrderId },
                        { orderId: transactionIdOrOrderId }
                    ]
                },
                data: { status },
            });
            this.logger.log(`Updated transaction ${transactionIdOrOrderId} to ${status}`);
        }

        const response = { received: true, status: 'processed' };

        // Update idempotency cache with response
        await this.idempotencyService.checkAndSet(
            `${idempotencyKey}:response`,
            response,
            86400
        );

        return response;
    }

    private extractEventId(provider: string, payload: any): string {
        if (provider === PaymentProviderType.RAZORPAY) {
            return payload.payload?.payment?.entity?.id || payload.payload?.order?.entity?.id || 'unknown';
        } else if (provider === PaymentProviderType.STRIPE) {
            return payload.id || 'unknown';
        }
        return 'unknown';
    }

    // Check if user has active subscription for interview features
    async checkSubscriptionStatus(userId: string): Promise<{ active: boolean; plan?: string; expiresAt?: string }> {
        this.logger.log(`Checking subscription status for user: ${userId}`);

        // For development/testing: Allow mock subscriptions
        if (process.env.TEST_SUBSCRIPTIONS === 'true') {
            this.logger.log('TEST_SUBSCRIPTIONS mode: returning active subscription');
            return { active: true, plan: 'test_plan', expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() };
        }

        if (!userId) {
            return { active: false };
        }

        try {
            // Check for any successful payment by this user (simple subscription check)
            // In production, you'd have a dedicated Subscription model
            const successfulPayment = await this.prisma.paymentTransaction.findFirst({
                where: {
                    status: 'success',
                    metadata: {
                        path: ['userId'],
                        equals: userId,
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            if (successfulPayment) {
                // Check if payment is within last 30 days (simple subscription period)
                const paymentDate = new Date(successfulPayment.createdAt);
                const expiryDate = new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
                const isActive = expiryDate > new Date();

                return {
                    active: isActive,
                    plan: 'basic_interview',
                    expiresAt: expiryDate.toISOString(),
                };
            }

            return { active: false };
        } catch (error) {
            this.logger.error(`Error checking subscription: ${error.message}`);
            // For MVP safety, allow interviews if payment service has DB issues
            return { active: true, plan: 'fallback' };
        }
    }
}
