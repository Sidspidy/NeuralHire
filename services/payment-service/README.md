# Payment Microservice

A production-grade, multi-provider payment service built with NestJS.

## Overview

This service handles all payment processing operations, abstracting the underlying payment providers (Razorpay, Stripe) to ensure flexibility and prevent vendor lock-in.

## Architecture

The service follows **Clean Architecture** principles:

- **Controllers**: Handle HTTP requests and DTO validation.
- **Services**: Orchestrate business logic and persistence.
- **Providers**: Encapsulate vendor-specific logic.
- **Interfaces**: Define the contract that all providers must implement.

### Why Abstraction?

By defining a `PaymentProvider` interface (`createPayment`, `verifyPayment`, `refundPayment`), the core business logic remains agnostic to the specific payment gateway.

**Benefits:**
1.  **Vendor Independence**: Switching or adding providers (e.g., adding Cashfree) requires *zero* changes to the core `PaymentService`. You simply implement the interface and register the new provider.
2.  **Testing**: We can easily inject mock providers for testing without making real API calls.
3.  **Resilience**: We can implement fallback strategies (e.g., if Razorpay is down, switch to Stripe) dynamically.

## Supported Providers

- **Razorpay** (Primary - India)
- **Stripe** (Global)

### Provider Selection

The provider is selected dynamically using the `ProviderFactory`.

1.  **Request Parameter**: The client can specify `provider: 'razorpay' | 'stripe'` in the request body.
2.  **Environment Default**: If not specified, the system can default to a preferred provider (logic extensible in `ProviderFactory`).

## Project Structure

```
src/
├── payment/
│   ├── dto/                # Data Transfer Objects
│   ├── interfaces/         # PaymentProvider Interface
│   ├── providers/          # Razorpay, Stripe Implementations
│   ├── payment.controller.ts
│   ├── payment.service.ts
│   └── payment.module.ts
├── prisma/                 # Database Schema & Service
├── app.module.ts
└── main.ts
```

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in the keys.
    ```env
    RAZORPAY_KEY_ID=...
    STRIPE_SECRET_KEY=...
    DATABASE_URL=...
    ```

3.  **Database**:
    ```bash
    npx prisma generate
    npx prisma migrate dev
    ```

4.  **Run**:
    ```bash
    npm run start:dev
    ```

## Webhooks

Webhooks are handled at `/payments/webhooks/:provider`.
- **Razorpay**: Validates `x-razorpay-signature` and updates transaction status.
- **Stripe**: Validates `stripe-signature` and updates transaction status.
