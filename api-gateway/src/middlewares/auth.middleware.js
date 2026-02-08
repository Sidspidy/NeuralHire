import jwt from 'jsonwebtoken';

/**
 * JWT Authentication Middleware
 * Verifies JWT tokens and attaches user info to request
 */
export const authMiddleware = (req, res, next) => {
    // Skip authentication for public routes
    const publicRoutes = ['/auth', '/health'];
    const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));

    if (isPublicRoute) {
        return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No authorization header provided'
        });
    }

    const token = authHeader.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'No token provided'
        });
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        req.user = {
            id: decoded.sub,
            email: decoded.email,
            role: decoded.role
        };

        // Forward user info to downstream services via headers
        // We set these here because onProxyReq in the proxy middleware might not be reliable
        req.headers['x-user-id'] = decoded.sub;
        req.headers['x-user-email'] = decoded.email;
        req.headers['x-user-role'] = decoded.role;

        console.log(`[Auth] User authenticated: ${req.user.email} (${req.user.role})`);
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Token has expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }

        console.error('[Auth] Token verification error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token verification failed'
        });
    }
};
