import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { Users, Briefcase, FileCheck, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useDashboardData } from '@/hooks/useDashboardData';

export default function Dashboard() {
    const { metrics, activityData, scoreData, isLoading, error } = useDashboardData();

    const metricCards = [
        {
            label: 'Total Jobs',
            value: metrics.totalJobs.toString(),
            change: '+2',
            icon: Briefcase,
            color: 'text-primary',
            bg: 'bg-primary/10'
        },
        {
            label: 'Total Applicants',
            value: metrics.totalApplicants.toString(),
            change: '+24',
            icon: Users,
            color: 'text-secondary',
            bg: 'bg-secondary/10'
        },
        {
            label: 'Interviews',
            value: metrics.totalInterviews.toString(),
            change: '+8',
            icon: FileCheck,
            color: 'text-warning',
            bg: 'bg-warning/10'
        },
        {
            label: 'Hire Rate',
            value: metrics.hireRate,
            change: '+2%',
            icon: TrendingUp,
            color: 'text-success',
            bg: 'bg-success/10'
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-error mb-2">Failed to load dashboard</p>
                    <p className="text-text-secondary text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {metricCards.map((metric) => (
                    <div key={metric.label} className="glass p-6 rounded-xl border border-white/5 relative overflow-hidden group">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-text-secondary">{metric.label}</p>
                                <p className="text-3xl font-bold mt-2 text-text-primary">{metric.value}</p>
                            </div>
                            <div className={cn("p-3 rounded-lg", metric.bg)}>
                                <metric.icon className={cn("h-6 w-6", metric.color)} />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className="text-success font-medium">{metric.change}</span>
                            <span className="text-text-secondary ml-2">from last month</span>
                        </div>
                        {/* Hover Glow */}
                        <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500", metric.bg.replace('/10', '/30'))} />
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Activity Chart */}
                <div className="glass p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-semibold mb-6">Application Activity</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={activityData}>
                                <defs>
                                    <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" stroke="#4B5563" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                                <YAxis stroke="#4B5563" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                                    itemStyle={{ color: '#E5E7EB' }}
                                />
                                <Area type="monotone" dataKey="apps" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Score Distribution */}
                <div className="glass p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-semibold mb-6">Resume Score Distribution</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreData} layout="vertical">
                                <XAxis type="number" stroke="#4B5563" tick={{ fill: '#9CA3AF' }} hide />
                                <YAxis dataKey="range" type="category" stroke="#4B5563" tick={{ fill: '#9CA3AF' }} tickLine={false} axisLine={false} width={60} />
                                <Tooltip
                                    cursor={{ fill: '#1F2937' }}
                                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '8px' }}
                                    itemStyle={{ color: '#E5E7EB' }}
                                />
                                <Bar dataKey="count" fill="#22D3EE" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

