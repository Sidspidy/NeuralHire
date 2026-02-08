import { createProxyMiddleware } from "http-proxy-middleware";
import services from "../config/services.js";

export default createProxyMiddleware({
    target: services.aiEngine,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding to AI engine
    },
});
