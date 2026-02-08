import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';

interface RoleGuardProps {
    children: React.ReactNode;
    allowedRoles: ('ADMIN' | 'RECRUITER' | 'CANDIDATE')[];
    redirectTo?: string;
}

/**
 * Role Guard Component
 * Protects routes based on user role
 * Redirects unauthorized users to specified route or dashboard
 */
export function RoleGuard({ children, allowedRoles, redirectTo = '/dashboard' }: RoleGuardProps) {
    const { user, isAuthenticated } = useAuthStore();

    // Debug logging
    console.log('[RoleGuard] Checking access:', {
        isAuthenticated,
        userRole: user?.role,
        allowedRoles,
        path: window.location.pathname
    });

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        console.log('[RoleGuard] Not authenticated, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Check role with case-insensitive comparison
    const userRoleUpper = user?.role?.toUpperCase();
    const hasAccess = user && allowedRoles.some(role => role.toUpperCase() === userRoleUpper);

    // Redirect if user doesn't have required role
    if (!hasAccess) {
        console.log('[RoleGuard] Access denied, redirecting to:', redirectTo);
        return <Navigate to={redirectTo} replace />;
    }

    console.log('[RoleGuard] Access granted');
    // User has required role, render children
    return <>{children}</>;
}

