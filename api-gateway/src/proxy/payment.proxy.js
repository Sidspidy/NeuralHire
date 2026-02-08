import { createProxyMiddleware } from "http-proxy-middleware";
import services from "../config/services.js";

export default createProxyMiddleware({
    target: services.payment,
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding to payment service
    },
});
