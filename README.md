# NeuralHire (TalentOS) – AI-Powered Hiring Platform

**NeuralHire (TalentOS)** is a microservices-based hiring platform that automates job posting, candidate applications, resume analysis, and AI-assisted voice interviews.
The system is designed with **production-style architecture** and includes **graceful fallback handling** when external AI services are unavailable.

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# Start all backend services (Gateway, Auth, Hiring, AI, Payment, Databases)
docker-compose up -d

# Start frontend
cd frontend
npm install
npm run dev
```

### Option 2: Manual Local Run

For development or debugging:

1. Ensure databases are running:

   * PostgreSQL (Auth, Payment)
   * MongoDB (Hiring)

2. Start services individually or via script:

```powershell
.\start_all_local.ps1
```

### Access Points

* **Frontend:** [http://localhost:5173](http://localhost:5173)
* **API Gateway:** [http://localhost:3000](http://localhost:3000)
* **Auth Service:** [http://localhost:4000](http://localhost:4000)
* **Hiring Service:** [http://localhost:3002](http://localhost:3002)
* **AI Engine:** [http://localhost:8001](http://localhost:8001)
* **Payment Service:** [http://localhost:8002](http://localhost:8002)

---

## 🏗️ System Architecture

NeuralHire follows a **microservices architecture** with clear ownership per service.

### Tech Stack

* **Frontend:** React (Vite), Tailwind CSS
* **Backend:** Node.js (Express, NestJS), Python (FastAPI)
* **Databases:** PostgreSQL, MongoDB
* **AI / Voice:** OpenAI (LLM), ElevenLabs (TTS), Browser Speech Synthesis (Fallback)
* **Infra:** Docker, Docker Compose

---

### Why Microservices?

* **Separation of concerns:** Auth, Hiring, AI, and Payments are isolated
* **Tech flexibility:** Python for AI, Node.js for core services
* **Fault tolerance:** AI or Payment failures do not block core flows
* **Real-world simulation:** Mirrors production SaaS architectures

---

## 🔐 Role-Based User Flows

### Recruiter

* Register & login
* Create job postings
* View candidates per job
* Review AI-generated resume match score
* Shortlist candidates
* Schedule AI voice interviews

### Candidate

* Register & login
* Browse jobs
* Apply with resume upload
* View application status
* Attend AI-assisted voice interview

### Super Admin

* System-level monitoring and management

---

## 🤖 AI & Voice Capabilities

### 1. Resume Scoring (FastAPI)

* Resume uploaded by candidate
* Job description + resume text analyzed
* Keyword and relevance-based scoring
* Score (0–100) shown to recruiters

> ⚠️ **Note:** If OpenAI API is unavailable (rate limits / billing), the system automatically switches to a mock scoring strategy while preserving full user flow.

---

### 2. AI Voice Interview

* WebSocket-based real-time interaction
* ElevenLabs used for text-to-speech
* AI prompts generated using LLM
* Interview state managed by Hiring Service

---

### 3. AI Fallback Mode (Important Feature)

When external AI services fail:

* Backend detects AI failure
* Frontend displays fallback status
* Interview continues using:

  * Predefined AI responses
  * Browser `speechSynthesis` (local TTS)

> This ensures uninterrupted interviews even when AI APIs are unavailable.

---

## ⚠️ Known Limitations (Honest & Professional)

1. **AI Evaluation Mode**

   * Live AI scoring and interview intelligence may run in fallback mode if API quotas are exceeded.

2. **Event Synchronization**

   * Services communicate via HTTP; no event bus is implemented yet.

3. **Voice Session Recovery**

   * Voice interviews do not yet auto-resume after network drops.

---

## 🗺️ Future Roadmap

* Event-driven communication (Kafka / RabbitMQ)
* Advanced recruiter analytics
* Video interview support
* Paid subscription enforcement
* Mobile client (React Native)

---

## 📁 Project Structure

```bash
talentos/
├── api-gateway/        # Express.js entry point
├── services/
│   ├── auth-service/   # Users & roles (PostgreSQL)
│   ├── hiring-service/ # Jobs & candidates (MongoDB)
│   ├── ai-engine/      # Resume analysis (FastAPI)
│   └── payment-service/# Subscriptions (PostgreSQL)
├── frontend/           # React UI
└── docker-compose.yml
```

---

## 🧠 My Role

> Sole backend developer and system designer.

* Designed microservice architecture
* Built API Gateway and RBAC
* Implemented resume scoring pipeline
* Integrated AI voice interviews with fallback handling
* Dockerized all services for local development

---

## 🐛 Troubleshooting

| Issue                 | Solution                                |
| --------------------- | --------------------------------------- |
| 401 / 403 errors      | Check JWT role claims                   |
| AI audio not playing  | Verify ElevenLabs keys or fallback mode |
| Resume score missing  | AI Engine may be in fallback mode       |
| Service not reachable | Restart via `docker-compose restart`    |

---

**License:** MIT

---
