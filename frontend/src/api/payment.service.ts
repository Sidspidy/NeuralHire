import api from './axios';
import { API_CONFIG } from '@/config/api.config';

export interface PaymentOrder {
    id: string;
    amount: number;
    currency: string;
    provider: 'razorpay' | 'stripe';
    orderId?: string;
    status: 'pending' | 'success' | 'failed';
    metadata?: Record<string, any>;
}

export interface CreatePaymentDto {
    amount: number;
    currency: string;
    provider: 'razorpay' | 'stripe';
    orderId?: string;
    metadata?: Record<string, any>;
}

export interface VerifyPaymentDto {
    orderId: string;
    paymentId: string;
    signature: string;
}

export interface Subscription {
    id: string;
    planId: string;
    planName: string;
    status: 'active' | 'cancelled' | 'expired';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    amount: number;
    currency: string;
}

export const paymentService = {
    // Create payment order
    async createOrder(data: CreatePaymentDto): Promise<PaymentOrder> {
        const response = await api.post(API_CONFIG.ENDPOINTS.PAYMENT.CREATE_ORDER, data);
        return response.data;
    },

    // Verify payment
    async verifyPayment(
        data: VerifyPaymentDto,
        provider: 'razorpay' | 'stripe'
    ): Promise<{ success: boolean; subscription?: Subscription }> {
        const response = await api.post(
            `${API_CONFIG.ENDPOINTS.PAYMENT.VERIFY}?provider=${provider}`,
            data
        );
        return response.data;
    },

    // Get payment status
    async getPaymentStatus(
        paymentId: string,
        provider: 'razorpay' | 'stripe'
    ): Promise<string> {
        const response = await api.get(
            `${API_CONFIG.ENDPOINTS.PAYMENT.GET_STATUS(paymentId)}?provider=${provider}`
        );
        return response.data;
    },

    // Get current subscription
    async getSubscription(): Promise<Subscription | null> {
        const response = await api.get(API_CONFIG.ENDPOINTS.PAYMENT.SUBSCRIPTION);
        return response.data;
    },

    // Cancel subscription
    async cancelSubscription(): Promise<void> {
        await api.delete(API_CONFIG.ENDPOINTS.PAYMENT.SUBSCRIPTION);
    },
};
