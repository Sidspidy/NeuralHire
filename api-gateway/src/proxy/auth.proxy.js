import { createProxyMiddleware } from "http-proxy-middleware";
import services from "../config/services.js";

export default createProxyMiddleware({
    target: services.auth,
    changeOrigin: true,
    ws: false,
    timeout: 60000, // 60 seconds
    proxyTimeout: 60000,
    followRedirects: true,
    selfHandleResponse: false, // Let proxy handle response automatically
    onProxyReq: (proxyReq, req, res) => {
        console.log(`[Auth Proxy] ${req.method} ${req.url} -> ${services.auth}${req.url}`);

        // Ensure content-type is set
        if (req.body && !proxyReq.getHeader('content-type')) {
            proxyReq.setHeader('Content-Type', 'application/json');
        }
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`[Auth Proxy] Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
    },
    onError: (err, req, res) => {
        console.error(`[Auth Proxy] Error for ${req.method} ${req.url}:`, err.message);
        if (!res.headersSent) {
            res.status(502).json({
                error: 'Bad Gateway',
                message: 'Failed to connect to auth service',
                details: err.message
            });
        }
    }
});
