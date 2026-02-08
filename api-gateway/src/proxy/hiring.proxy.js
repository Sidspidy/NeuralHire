import { createProxyMiddleware } from "http-proxy-middleware";
import services from "../config/services.js";

export default createProxyMiddleware({
    target: services.hiring,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding to hiring service
    },
});
