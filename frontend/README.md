# NeuralHire Frontend - Production-Grade React Application

## Overview

This is the **production-ready frontend** for NeuralHire, an AI-powered automated recruitment platform. The frontend has been completely refactored to integrate with all backend microservices, removing all mock data and implementing real API integrations.

---

## Technology Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** Zustand
- **HTTP Client:** Axios
- **WebSocket:** Socket.IO Client
- **UI Components:** Headless UI / Radix UI

---

## Backend Services Integrated

### ✅ 1. Auth Service (Port: 4000)
- User registration and login
- JWT token management (access + refresh)
- Automatic token refresh on expiry
- Role-based authentication (Recruiter/Candidate)

### ✅ 2. Hiring Service (Port: 3002)
- **Jobs Module:** CRUD operations for job postings
- **Candidates Module:** Application management and tracking
- **Voice Interview:** Real-time WebSocket-based AI interviews

### ✅ 3. AI Engine (Port: 8001)
- Resume upload and analysis
- AI-powered scoring using GPT-4
- Semantic matching with job descriptions
- Queue-based asynchronous processing

### ✅ 4. Payment Service (Port: 8002)
- Payment order creation (Razorpay + Stripe)
- Payment verification
- Subscription management
- Webhook handling with idempotency

### ✅ 5. API Gateway (Port: 3000)
- Centralized routing for all services
- JWT validation
- Rate limiting
- CORS handling

---

## Architecture Highlights

### API Integration Layer

All API calls go through the **API Gateway** at `http://localhost:3000`:

```
Frontend → API Gateway (3000) → Backend Services
                ├─ /auth/* → Auth Service (4000)
                ├─ /api/jobs/* → Hiring Service (3002)
                ├─ /api/candidates/* → Hiring Service (3002)
                ├─ /api/resumes/* → AI Engine (8001)
                ├─ /api/payments/* → Payment Service (8002)
                └─ /webhooks/* → Payment Service (8002)
```

### WebSocket Integration

Voice interviews use **direct WebSocket connection** to the Hiring Service:

```
Frontend ←WebSocket→ Hiring Service (ws://localhost:3002/voice)
```

**Events:**
- `join_session` - Initialize interview with JWT + interviewId
- `audio_chunk` - Stream audio data for processing
- `interrupt` - Stop AI from speaking
- `ai_response` - Receive AI-generated audio
- `interview_completed` - Interview summary

---

## Project Structure

```
frontend/
├── src/
│   ├── api/                    # API service layer
│   │   ├── axios.ts            # Axios instance with interceptors
│   │   ├── auth.service.ts     # Authentication APIs
│   │   ├── jobs.service.ts     # Job management APIs
│   │   ├── candidates.service.ts  # Candidate APIs
│   │   ├── resumes.service.ts  # Resume upload & analysis APIs
│   │   ├── payment.service.ts  # Payment APIs
│   │   └── interviews.service.ts  # Interview APIs
│   │
│   ├── components/             # Reusable UI components
│   │   ├── layout/             # Header, Sidebar, Footer
│   │   └── ui/                 # Button, Input, Card, etc.
│   │
│   ├── pages/                  # Page components
│   │   ├── auth/               # Login, Register
│   │   ├── dashboard/          # Dashboard
│   │   ├── jobs/               # Job management
│   │   ├── resumes/            # Resume management
│   │   ├── interviews/         # Interview pages
│   │   └── payment/            # Payment pages
│   │
│   ├── store/                  # Zustand state management
│   │   ├── useAuthStore.ts     # Auth state
│   │   ├── useJobsStore.ts     # Jobs state
│   │   ├── useResumesStore.ts  # Resumes state
│   │   └── usePaymentStore.ts  # Payment state
│   │
│   ├── utils/                  # Utility functions
│   │   └── voiceWebSocket.ts   # WebSocket manager for voice
│   │
│   ├── config/                 # Configuration
│   │   └── api.config.ts       # API endpoints & WS events
│   │
│   ├── layouts/                # Layout components
│   │   ├── AuthLayout.tsx      # Auth pages layout
│   │   └── DashboardLayout.tsx # Protected pages layout
│   │
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # Entry point
│
├── .env                        # Environment variables
├── .env.example                # Environment template
├── BACKEND_ANALYSIS.md         # Backend architecture analysis
└── README.md                   # This file
```

---

## Environment Variables

Create a `.env` file in the frontend directory:

```bash
# API Gateway Base URL (all API requests go through this)
VITE_API_BASE_URL=http://localhost:3000

# WebSocket URL for Voice Interview (connects directly to hiring service)
VITE_WS_URL=ws://localhost:3002

# Payment Provider Public Keys
VITE_STRIPE_PUBLIC_KEY=pk_test_sample
VITE_RAZORPAY_KEY=rzp_test_sample
```

---

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend services running (via Docker Compose)

### Install Dependencies
```bash
cd frontend
npm install
```

### Run Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## User Flows

### 1. Authentication Flow

**Registration:**
```
User → Register Page → POST /auth/register → JWT tokens → Redirect to Dashboard
```

**Login:**
```
User → Login Page → POST /auth/login → JWT tokens → Redirect to Dashboard
```

**Token Refresh:**
```
API Call → 401 Unauthorized → POST /auth/refresh → New access token → Retry original request
```

### 2. Job Management Flow (Recruiter)

**Create Job:**
```
Dashboard → Jobs Page → Create Job → POST /api/jobs → Job created → Redirect to Job Details
```

**View Applicants:**
```
Job Details → GET /api/candidates?jobId=xxx → Display applicants with AI scores
```

### 3. Resume Upload & AI Scoring Flow (Candidate)

**Upload Resume:**
```
User → Upload Resume → POST /api/resumes/upload → Job queued (202 Accepted)
                                                  ↓
                                        Background Worker processes
                                                  ↓
Poll for results → GET /api/resumes/:id → AI score + analysis
```

**Processing States:**
- `pending` - Waiting in queue
- `processing` - AI analysis in progress
- `completed` - Analysis complete
- `failed` - Processing error

### 4. Payment Flow

**Create Payment:**
```
User → Select Plan → POST /api/payments → Payment order created
                                        ↓
                            Razorpay/Stripe checkout page
                                        ↓
                            User completes payment
                                        ↓
                    Webhook → POST /webhooks/:provider → Payment verified
                                        ↓
                            Subscription activated
```

**Verify Payment:**
```
Payment Success → POST /api/payments/verify?provider=razorpay → Subscription details
```

### 5. Voice Interview Flow

**Start Interview:**
```
User → Interview Page → Connect WebSocket → ws://localhost:3002/voice
                                          ↓
                            Emit 'join_session' with token + interviewId
                                          ↓
                            Server validates and initializes session
                                          ↓
                            Listen for 'ai_response' events
```

**Audio Streaming:**
```
User speaks → Capture audio → Emit 'audio_chunk' → Server processes (STT → LLM → TTS)
                                                                      ↓
                                            Emit 'ai_response' with audio
                                                                      ↓
                                            Frontend plays audio
```

**Interview Completion:**
```
Interview ends → Server emits 'interview_completed' → Display summary
```

---

## Key Features Implemented

### ✅ No Mock Data
- All data comes from real backend APIs
- Proper error handling for API failures
- Loading states for async operations

### ✅ Authentication & Authorization
- JWT-based authentication
- Automatic token refresh
- Protected routes with auth guards
- Role-based routing (Recruiter/Candidate)

### ✅ Real-time Voice Interview
- WebSocket connection management
- Audio streaming (bidirectional)
- Session handling with reconnection logic
- Interrupt functionality

### ✅ Payment Integration
- Support for Razorpay and Stripe
- Payment verification
- Subscription management
- Error handling for failed payments

### ✅ AI-Powered Resume Analysis
- Resume upload with progress tracking
- Queue-based processing status
- AI score visualization
- Keyword match breakdown

### ✅ Production-Grade Error Handling
- Axios interceptors for global error handling
- Toast notifications for user feedback
- Error boundaries for React errors
- Graceful degradation on API failures

### ✅ Type Safety
- Full TypeScript coverage
- Type-safe API calls
- Interface definitions for all data models

---

## API Services Documentation

### Auth Service (`auth.service.ts`)

```typescript
// Login
authService.login({ email, password })

// Register
authService.register({ name, email, password, role })

// Refresh token
authService.refreshToken()

// Get current user
authService.getCurrentUser()

// Logout
authService.logout()
```

### Jobs Service (`jobs.service.ts`)

```typescript
// Get all jobs
jobsService.getJobs()

// Get single job
jobsService.getJob(id)

// Create job
jobsService.createJob(jobData)

// Update job
jobsService.updateJob(id, updates)

// Delete job
jobsService.deleteJob(id)

// Get applicants
jobsService.getJobApplicants(jobId)
```

### Candidates Service (`candidates.service.ts`)

```typescript
// Get all candidates
candidatesService.getCandidates({ jobId, processingStatus, applicationStatus })

// Get single candidate
candidatesService.getCandidate(id)

// Create candidate
candidatesService.createCandidate(candidateData)

// Update candidate
candidatesService.updateCandidate(id, updates)

// Delete candidate
candidatesService.deleteCandidate(id)
```

### Resumes Service (`resumes.service.ts`)

```typescript
// Upload resume
resumesService.uploadResume(formData)

// Get resume
resumesService.getResume(id)

// Get AI analysis
resumesService.getAIAnalysis(id)

// Update status
resumesService.updateResumeStatus(id, status)

// Delete resume
resumesService.deleteResume(id)
```

### Payment Service (`payment.service.ts`)

```typescript
// Create payment order
paymentService.createOrder({ amount, currency, provider, metadata })

// Verify payment
paymentService.verifyPayment(verifyData, provider)

// Get payment status
paymentService.getPaymentStatus(paymentId, provider)

// Get subscription
paymentService.getSubscription()

// Cancel subscription
paymentService.cancelSubscription()
```

### Voice WebSocket (`voiceWebSocket.ts`)

```typescript
// Connect to WebSocket
await voiceWebSocket.connect(token)

// Join interview session
await voiceWebSocket.joinSession(interviewId)

// Send audio chunk
voiceWebSocket.sendAudioChunk(audioData)

// Listen for AI responses
voiceWebSocket.onAIResponse((audioData) => {
    // Play audio
})

// Listen for interview completion
voiceWebSocket.onInterviewCompleted((summary) => {
    // Display summary
})

// Disconnect
voiceWebSocket.disconnect()
```

---

## Backend Integration Summary

### Services Integrated:
1. ✅ **Auth Service** - Complete authentication flow
2. ✅ **Hiring Service** - Jobs, Candidates, Interviews
3. ✅ **AI Engine** - Resume analysis with GPT-4
4. ✅ **Payment Service** - Razorpay + Stripe integration
5. ✅ **API Gateway** - Centralized routing

### Missing Integrations:
- ❌ None - All backend capabilities are integrated

---

## Why This Frontend is Production-Grade

### 1. **Complete Backend Integration**
- No mock data or hardcoded values
- All features backed by real APIs
- Proper error handling and retry logic

### 2. **Type Safety**
- Full TypeScript coverage
- Type-safe API calls
- Interface definitions for all models

### 3. **Security**
- JWT-based authentication
- Automatic token refresh
- Protected routes
- CORS configuration

### 4. **Real-time Capabilities**
- WebSocket for voice interviews
- Automatic reconnection
- Session management

### 5. **Payment Processing**
- Multi-provider support (Razorpay + Stripe)
- Payment verification
- Subscription management
- Idempotency handling

### 6. **User Experience**
- Loading states for all async operations
- Error boundaries
- Toast notifications
- Responsive design

### 7. **Scalability**
- Centralized API layer
- Modular service architecture
- State management with Zustand
- Clean separation of concerns

---

## Next Steps

### For Developers:
1. Review `BACKEND_ANALYSIS.md` for complete backend architecture
2. Ensure all backend services are running via Docker Compose
3. Update environment variables in `.env`
4. Run `npm install` and `npm run dev`
5. Test all user flows end-to-end

### For QA:
1. Test authentication flow (register, login, logout, token refresh)
2. Test job management (create, edit, delete, view applicants)
3. Test resume upload and AI scoring
4. Test payment flow (create order, verify payment)
5. Test voice interview (WebSocket connection, audio streaming)

### For DevOps:
1. Set up production environment variables
2. Configure CORS for production frontend URL
3. Set up SSL certificates for WebSocket
4. Configure payment provider webhooks
5. Set up monitoring and logging

---

## Troubleshooting

### Issue: API calls failing with 404
**Solution:** Ensure API Gateway is running and routes are configured correctly

### Issue: WebSocket connection failing
**Solution:** Check that Hiring Service is running on port 3002 and CORS is configured

### Issue: Token refresh not working
**Solution:** Verify refresh token endpoint and cookie configuration

### Issue: Payment verification failing
**Solution:** Check payment provider credentials and webhook signatures

---

## Contact & Support

For backend architecture questions, refer to `BACKEND_ANALYSIS.md`

For frontend issues, check the console for detailed error messages.

---

**Built with ❤️ by the NeuralHire Team**
