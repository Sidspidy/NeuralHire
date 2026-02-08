import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import { ToastContainer } from '@/components/ui/Toast';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function DashboardLayout() {
    const { isAuthenticated } = useAuthStore();
    const { toasts, removeToast } = useNotificationStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-background text-text-primary relative">
            <div className="fixed inset-0 pointer-events-none">
                {/* Subtle background gradient blob */}
                <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <Sidebar />
            <div className="lg:pl-64 flex flex-col min-h-screen relative z-0">
                <Navbar />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    );
}
