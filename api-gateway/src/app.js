import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";
import services from "./config/services.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";

const app = express();

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
}));

// Logging middleware
app.use(morgan('combined'));

// CORS Configuration
const corsOptions = {
    origin: true, // Reflects the request origin, solving wildcard * issues with credentials
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['set-cookie'],
};

app.use(cors(corsOptions));

// JWT Authentication Middleware
app.use(authMiddleware);


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


// Common Proxy Options to handle duplicate CORS headers
const commonProxyOptions = {
    changeOrigin: true,
    onProxyRes: (proxyRes, req, res) => {
        // Strip CORS headers from the backend response so they don't conflict with the Gateway's CORS
        delete proxyRes.headers['access-control-allow-origin'];
        delete proxyRes.headers['access-control-allow-methods'];
        delete proxyRes.headers['access-control-allow-headers'];
        delete proxyRes.headers['access-control-allow-credentials']; // credential header must be unique

        console.log(`[Proxy] Response: ${proxyRes.statusCode} ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Proxy] Error:`, err.message);
        if (!res.headersSent) {
            res.status(502).json({ error: 'Bad Gateway', message: err.message });
        }
    }
};

// Auth Service Proxy
app.use('/auth', createProxyMiddleware({
    ...commonProxyOptions,
    target: services.auth,
    pathRewrite: { '^/': '/auth/' },
    onProxyReq: (proxyReq, req, res) => {
        // Forward user context to backend service
        if (req.user) {
            proxyReq.setHeader('X-User-Id', req.user.id);
            proxyReq.setHeader('X-User-Email', req.user.email);
            proxyReq.setHeader('X-User-Role', req.user.role);
        }
        console.log(`[Proxy] ${req.method} /auth${req.url} -> ${services.auth}/auth${req.url}`);
    }
}));

// Hiring Service Proxy - Jobs
app.use('/api/jobs', createProxyMiddleware({
    ...commonProxyOptions,
    target: services.hiring,
    pathRewrite: { '^/': '/jobs/' },
    onProxyReq: (proxyReq, req, res) => {
        console.log('[Proxy Jobs] req.user:', req.user);
        if (req.user) {
            proxyReq.setHeader('X-User-Id', req.user.id);
            proxyReq.setHeader('X-User-Email', req.user.email);
            proxyReq.setHeader('X-User-Role', req.user.role);
            console.log('[Proxy Jobs] Set headers:', { id: req.user.id, email: req.user.email, role: req.user.role });
        } else {
            console.log('[Proxy Jobs] NO USER CONTEXT!');
        }
        console.log(`[Proxy] ${req.method} /api/jobs${req.url} -> ${services.hiring}/jobs${req.url}`);
    }
}));

// Hiring Service Proxy - Candidates
app.use('/api/candidates', createProxyMiddleware({
    ...commonProxyOptions,
    target: services.hiring,
    pathRewrite: { '^/': '/candidates/' },
    onProxyReq: (proxyReq, req, res) => {
        if (req.user) {
            proxyReq.setHeader('X-User-Id', req.user.id);
            proxyReq.setHeader('X-User-Email', req.user.email);
            proxyReq.setHeader('X-User-Role', req.user.role);
        }
        console.log(`[Proxy] ${req.method} /api/candidates${req.url} -> ${services.hiring}/candidates${req.url}`);
    }
}));

// Hiring Service Proxy - Interviews
app.use('/api/interviews', createProxyMiddleware({
    ...commonProxyOptions,
    target: services.hiring,
    pathRewrite: { '^/': '/interviews/' },
    onProxyReq: (proxyReq, req, res) => {
        if (req.user) {
            proxyReq.setHeader('X-User-Id', req.user.id);
            proxyReq.setHeader('X-User-Email', req.user.email);
            proxyReq.setHeader('X-User-Role', req.user.role);
        }
        console.log(`[Proxy] ${req.method} /api/interviews${req.url} -> ${services.hiring}/interviews${req.url}`);
    }
}));

// Hiring Service Proxy - Resume Upload (Intercept and route to Hiring Service)
app.use('/api/resumes/upload', createProxyMiddleware({
    ...commonProxyOptions,
    target: services.hiring,
    pathRewrite: { '^/api/resumes/upload': '/resumes/upload' },
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} /api/resumes/upload -> ${services.hiring}/resumes/upload`);
    }
}));

// AI Engine Proxy
app.use('/api/resumes', createProxyMiddleware({
    ...commonProxyOptions,
    target: services.aiEngine,
    pathRewrite: { '^/': '/resumes/' },
    onProxyReq: (proxyReq, req, res) => {
        if (req.user) {
            proxyReq.setHeader('X-User-Id', req.user.id);
            proxyReq.setHeader('X-User-Email', req.user.email);
            proxyReq.setHeader('X-User-Role', req.user.role);
        }
        console.log(`[Proxy] ${req.method} /api/resumes${req.url} -> ${services.aiEngine}/resumes${req.url}`);
    }
}));

// Payment Service Proxy
app.use('/api/payments', createProxyMiddleware({
    ...commonProxyOptions,
    target: services.payment,
    pathRewrite: { '^/': '/payments/' },
    onProxyReq: (proxyReq, req, res) => {
        if (req.user) {
            proxyReq.setHeader('X-User-Id', req.user.id);
            proxyReq.setHeader('X-User-Email', req.user.email);
            proxyReq.setHeader('X-User-Role', req.user.role);
        }
        console.log(`[Proxy] ${req.method} /api/payments${req.url} -> ${services.payment}/payments${req.url}`);
    }
}));

app.use('/webhooks', createProxyMiddleware({
    ...commonProxyOptions,
    target: services.payment,
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Proxy] ${req.method} /webhooks${req.url} -> ${services.payment}/webhooks${req.url}`);
    }
}));

// 404 handler
app.use((req, res) => {
    console.log(`[404] ${req.method} ${req.url}`);
    res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.url}`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err);
    if (!res.headersSent) {
        res.status(err.status || 500).json({
            error: err.message || 'Internal Server Error'
        });
    }
});

console.log('[INIT] API Gateway configured');
export default app;
