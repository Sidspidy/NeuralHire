import { IsString, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum PaymentProviderType {
    RAZORPAY = 'razorpay',
    STRIPE = 'stripe',
}

export class CreatePaymentDto {
    @IsNumber()
    amount: number;

    @IsString()
    currency: string;

    @IsEnum(PaymentProviderType)
    provider: PaymentProviderType;

    @IsString()
    @IsOptional()
    orderId?: string; // Internal system Order ID

    @IsString()
    @IsOptional()
    description?: string;

    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;
}
