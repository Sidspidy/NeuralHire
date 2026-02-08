import { useAuthStore } from '@/store/useAuthStore';
import { Bell } from 'lucide-react';

export default function Navbar() {
    const user = useAuthStore((state) => state.user);

    return (
        <div className="h-16 border-b border-border bg-card/30 backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-10">
            <div>
                {/* Breadcrumbs or Title could go here */}
                <h2 className="text-lg font-medium text-text-primary">Overview</h2>
            </div>
            <div className="flex items-center gap-4">
                <button className="text-text-secondary hover:text-text-primary transition-colors relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-2 w-2 bg-error rounded-full ring-2 ring-background"></span>
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                        <p className="text-xs text-text-secondary">{user?.role}</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>
        </div>
    );
}
