# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build TypeScript using tsc directly
RUN ./node_modules/.bin/tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production --legacy-peer-deps

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Assuming 5000 based on standard, will check .env)
EXPOSE 5000

# Start the application
CMD ["node", "dist/main.js"]
