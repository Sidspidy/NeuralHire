import { Controller, Post, Body, Get, Query, Param, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post()
    create(@Body() createPaymentDto: CreatePaymentDto) {
        return this.paymentService.createPayment(createPaymentDto);
    }

    @Post('verify')
    verify(
        @Body() verifyPaymentDto: VerifyPaymentDto,
        @Query('provider') provider: string,
    ) {
        return this.paymentService.verifyPayment(verifyPaymentDto, provider);
    }

    @Get(':id/status')
    getStatus(
        @Param('id') id: string,
        @Query('provider') provider: string,
    ) {
        return this.paymentService.getPaymentStatus(id, provider);
    }

    // Subscription status check for interview gating
    @Get('subscription/status')
    async getSubscriptionStatus(@Headers('x-user-id') userId: string) {
        return this.paymentService.checkSubscriptionStatus(userId);
    }

    @Post('webhooks/:provider')
    async handleWebhook(
        @Param('provider') provider: string,
        @Body() body: any,
        @Headers() headers: any,
    ) {
        // Configurable signature header key
        let signature = '';
        if (provider === 'razorpay') signature = headers['x-razorpay-signature'];
        if (provider === 'stripe') signature = headers['stripe-signature'];

        return this.paymentService.handleWebhook(provider, body, signature);
    }
}
