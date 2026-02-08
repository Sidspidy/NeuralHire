import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PaymentSuccessPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Card variant="gradient" className="max-w-md w-full">
                <CardContent className="p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 rounded-full bg-success/10">
                            <CheckCircle className="h-16 w-16 text-success" />
                        </div>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-text-primary mb-2">
                            Payment Successful!
                        </h1>
                        <p className="text-text-secondary">
                            Your subscription has been activated. You now have full access to all features.
                        </p>
                    </div>

                    <div className="bg-card/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Plan</span>
                            <span className="text-text-primary font-medium">Professional</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Amount</span>
                            <span className="text-text-primary font-medium">$299/month</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Next billing</span>
                            <span className="text-text-primary font-medium">Feb 26, 2026</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Button className="w-full" onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => navigate('/interviews')}>
                            Start AI Interview
                        </Button>
                    </div>

                    <p className="text-xs text-text-secondary">
                        A confirmation email has been sent to your registered email address.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
