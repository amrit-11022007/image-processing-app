# Image Processing App

A distributed image processing application with a Next.js frontend, Node.js API gateway, and C++ gRPC backend.

## Features

- **Box Blur** - Adjustable kernel size (3×3 to 9×9)
- **Grayscale** - Convert images to grayscale
- **Real-time Processing** - Client-server architecture with gRPC
- **Docker Support** - Containerized deployment

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- C++ compiler with gRPC (for local development)

### Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:3000
# API: http://localhost:3001
# gRPC: localhost:50051

cd cpp-server
./grpc_server

cd node-server
npm install
npm start

cd frontend
pnpm install
pnpm build
pnpm dev


```
