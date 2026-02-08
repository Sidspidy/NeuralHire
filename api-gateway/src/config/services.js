export default {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4000',
    hiring: process.env.HIRING_SERVICE_URL || 'http://localhost:3002',
    aiEngine: process.env.AI_SERVICE_URL || 'http://localhost:8001',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:8002',
};
