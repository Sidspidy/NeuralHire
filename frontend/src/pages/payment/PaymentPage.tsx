import { useState } from 'react';
import { CreditCard, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const plans = [
    {
        id: 'basic',
        name: 'Basic',
        price: 99,
        currency: 'USD',
        interval: 'month',
        features: [
            '10 AI Interviews per month',
            'Resume screening for 50 candidates',
            'Basic analytics dashboard',
            'Email support',
        ],
        popular: false,
    },
    {
        id: 'pro',
        name: 'Professional',
        price: 299,
        currency: 'USD',
        interval: 'month',
        features: [
            'Unlimited AI Interviews',
            'Resume screening for 500 candidates',
            'Advanced analytics & insights',
            'Priority support',
            'Custom interview templates',
            'API access',
        ],
        popular: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 999,
        currency: 'USD',
        interval: 'month',
        features: [
            'Everything in Professional',
            'Unlimited candidates',
            'Dedicated account manager',
            'Custom integrations',
            'SLA guarantee',
            'On-premise deployment option',
        ],
        popular: false,
    },
];

export default function PaymentPage() {
    const [selectedPlan, setSelectedPlan] = useState('pro');
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async (planId: string) => {
        setIsProcessing(true);
        try {
            // TODO: Integrate with Razorpay/Stripe
            console.log('Processing payment for plan:', planId);

            // Simulate payment processing
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Redirect to success page or show success message
            window.location.href = '/payment/success';
        } catch (error) {
            console.error('Payment error:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-text-primary mb-2">Choose Your Plan</h1>
                <p className="text-text-secondary">
                    Unlock the full power of AI-driven recruitment
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card
                        key={plan.id}
                        variant={selectedPlan === plan.id ? 'gradient' : 'default'}
                        hover="glow"
                        className={`relative ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}
                    >
                        {plan.popular && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <Badge variant="success">Most Popular</Badge>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle>{plan.name}</CardTitle>
                            <CardDescription>
                                <div className="mt-4 flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-text-primary">
                                        ${plan.price}
                                    </span>
                                    <span className="text-text-secondary">/{plan.interval}</span>
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <ul className="space-y-3">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm">
                                        <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                                        <span className="text-text-secondary">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button
                                className="w-full"
                                variant={selectedPlan === plan.id ? 'default' : 'outline'}
                                onClick={() => {
                                    setSelectedPlan(plan.id);
                                    handlePayment(plan.id);
                                }}
                                isLoading={isProcessing && selectedPlan === plan.id}
                            >
                                <CreditCard className="mr-2 h-4 w-4" />
                                {selectedPlan === plan.id && isProcessing ? 'Processing...' : 'Select Plan'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card variant="outline">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-text-primary mb-1">
                                Need a custom solution?
                            </h3>
                            <p className="text-sm text-text-secondary">
                                Contact our sales team for enterprise pricing and custom features
                            </p>
                        </div>
                        <Button variant="outline">Contact Sales</Button>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-sm text-text-secondary">
                <p>All plans include a 14-day free trial. No credit card required.</p>
                <p className="mt-2">Secure payment powered by Stripe & Razorpay</p>
            </div>
        </div>
    );
}
