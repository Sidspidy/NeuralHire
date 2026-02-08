import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/api/auth.service';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'RECRUITER' as 'RECRUITER' | 'CANDIDATE' | 'ADMIN',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        // Validate password strength
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        try {
            // Real API call to backend
            await authService.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
            });

            // Navigate to login page after successful registration
            navigate('/login', {
                state: { message: 'Registration successful! Please login.' }
            });
        } catch (err: any) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to register. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-center mb-6">Create Account</h2>
            {error && (
                <div className="bg-error/10 text-error text-sm p-3 rounded-md mb-4 border border-error/20">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-text-secondary">Full Name</label>
                    <Input
                        type="text"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-text-secondary">Email</label>
                    <Input
                        type="email"
                        name="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-text-secondary">Role</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                        disabled={isLoading}
                    >
                        <option value="RECRUITER">Recruiter</option>
                        <option value="CANDIDATE">Candidate</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-text-secondary">Password</label>
                    <Input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1 text-text-secondary">Confirm Password</label>
                    <Input
                        type="password"
                        name="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                    />
                </div>
                <Button type="submit" className="w-full" isLoading={isLoading}>
                    Sign Up
                </Button>
            </form>
            <div className="mt-6 text-center text-sm text-text-secondary">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                    Sign In
                </Link>
            </div>
        </div>
    );
}

