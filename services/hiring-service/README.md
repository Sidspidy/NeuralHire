# Hiring Service

Production-ready NestJS microservice for managing job postings and candidate applications.

## Features

- Create and manage job postings
- Upload and store candidate resumes (metadata)
- Async resume processing with BullMQ
- MongoDB with Mongoose ODM
- Redis queue for background jobs
- DTO validation with class-validator
- Comprehensive error handling
- Clean separation of concerns

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Queue**: BullMQ with Redis
- **Validation**: class-validator, class-transformer

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/hiring-service
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Running

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Endpoints

### Jobs

- `POST /jobs` - Create job posting
- `GET /jobs` - List all jobs (with filters)
- `GET /jobs/:id` - Get job by ID
- `PUT /jobs/:id` - Update job
- `DELETE /jobs/:id` - Delete job

### Candidates

- `POST /candidates` - Create candidate (triggers resume analysis)
- `GET /candidates` - List all candidates (with filters)
- `GET /candidates/:id` - Get candidate by ID
- `PUT /candidates/:id` - Update candidate
- `DELETE /candidates/:id` - Delete candidate

## Architecture

```
src/
├── jobs/
│   ├── dto/
│   │   ├── create-job.dto.ts
│   │   └── update-job.dto.ts
│   ├── schemas/
│   │   └── job.schema.ts
│   ├── jobs.controller.ts
│   ├── jobs.service.ts
│   └── jobs.module.ts
├── candidates/
│   ├── dto/
│   │   ├── create-candidate.dto.ts
│   │   └── update-candidate.dto.ts
│   ├── schemas/
│   │   └── candidate.schema.ts
│   ├── candidates.controller.ts
│   ├── candidates.service.ts
│   └── candidates.module.ts
├── queues/
│   ├── resume.processor.ts
│   └── queues.module.ts
├── app.module.ts
└── main.ts
```

## Background Processing

Resume analysis jobs are automatically queued when a candidate is created. The `ResumeProcessor` handles async processing with mock analysis logic.

## License

MIT
