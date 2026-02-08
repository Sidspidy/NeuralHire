import { Injectable, BadRequestException } from '@nestjs/common';
import { CreatePaymentDto, PaymentProviderType } from '../dto/create-payment.dto';
import { PaymentProvider } from '../interfaces/payment-provider.interface';
import { RazorpayProvider } from './razorpay.provider';
import { StripeProvider } from './stripe.provider';

@Injectable()
export class ProviderFactory {
    constructor(
        private readonly razorpayProvider: RazorpayProvider,
        private readonly stripeProvider: StripeProvider,
    ) { }

    getProvider(providerType: PaymentProviderType): PaymentProvider {
        switch (providerType) {
            case PaymentProviderType.RAZORPAY:
                return this.razorpayProvider;
            case PaymentProviderType.STRIPE:
                return this.stripeProvider;
            default:
                throw new BadRequestException(`Unsupported payment provider: ${providerType}`);
        }
    }
}
