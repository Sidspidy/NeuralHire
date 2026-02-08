import { IsString, IsObject, IsNotEmpty } from 'class-validator';

export class VerifyPaymentDto {
    @IsString()
    @IsNotEmpty()
    paymentId: string; // The provider's payment ID (e.g., pay_xxxxx or pi_xxxxx)

    @IsString()
    @IsNotEmpty()
    orderId: string; // The provider's order ID (e.g. order_xxxxx for Razorpay)

    @IsString()
    @IsNotEmpty()
    signature: string; // Signature to verify authenticity
}
