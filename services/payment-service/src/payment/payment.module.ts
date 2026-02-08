import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ProviderFactory } from './providers/provider.factory';
import { RazorpayProvider } from './providers/razorpay.provider';
import { StripeProvider } from './providers/stripe.provider';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from './idempotency.service';

@Module({
    imports: [ConfigModule],
    controllers: [PaymentController],
    providers: [
        PaymentService,
        ProviderFactory,
        RazorpayProvider,
        StripeProvider,
        PrismaService,
        IdempotencyService,
    ],
    exports: [PaymentService],
})
export class PaymentModule { }
