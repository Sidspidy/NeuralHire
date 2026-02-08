import { CreatePaymentDto } from '../dto/create-payment.dto';
import { VerifyPaymentDto } from '../dto/verify-payment.dto';

export interface PaymentProvider {
    /**
     * Creates a payment order/intent with the provider
     */
    createPayment(createPaymentDto: CreatePaymentDto): Promise<any>;

    /**
     * Verifies a payment signature/status after client-side completion
     */
    verifyPayment(verifyPaymentDto: VerifyPaymentDto): Promise<boolean>;

    /**
     * Fetches the current status of a payment from the provider
     */
    getPaymentStatus(paymentId: string): Promise<string>;

    /**
   * Verifies the authenticity of a webhook event
   */
    verifyWebhook(payload: any, signature: string): Promise<boolean>;

    /**
     * Refunds a payment
     */
    refundPayment(paymentId: string, amount?: number): Promise<any>;
}
