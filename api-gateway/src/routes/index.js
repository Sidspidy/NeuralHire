import { Router } from "express";
import authProxy from "../proxy/auth.proxy.js";
import hiringProxy from "../proxy/hiring.proxy.js";
import aiProxy from "../proxy/ai.proxy.js";
import paymentProxy from "../proxy/payment.proxy.js";

const router = Router();

// Auth Service routes
router.use("/auth", authProxy);

// Hiring Service routes (jobs, candidates)
router.use("/api/jobs", hiringProxy);
router.use("/api/candidates", hiringProxy);

// AI Engine routes (resumes)
router.use("/api/resumes", aiProxy);

// Payment Service routes
router.use("/api/payments", paymentProxy);
router.use("/webhooks", paymentProxy);

export default router;

