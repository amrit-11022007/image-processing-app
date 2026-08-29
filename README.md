# Image Processing App

A distributed image processing application with a Next.js frontend, Node.js API gateway, and C++ gRPC backend.

## Features

- **Box Blur** - Adjustable kernel size (3×3 to 9×9)
- **Grayscale** - Convert images to grayscale
- **Real-time Processing** - Client-server architecture with gRPC
- **Docker Support** - Containerized deployment
- **CMake Supports** - For low memory people
- **Streaming** - For larger files than 50mb.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- C++ compiler with gRPC (for local development)
- CMake and Ninja (if not using docker)

### Run with Docker

terminal 1:

```
docker-compose up --build
```

terminal 2:

```
cd frontend && pnpm install && pnpm build && pnpm dev
```

terminal 3:

```
cd node-server && npm i && npm run build && npm run dev
```

### Run with CMake (If you are nerdy enough)

terminal 1:

```
protoc --proto_path=/d/Coding/image-processing-app --cpp_out=/d/Coding/image-processing-app --grpc_out=/d/Coding/image-processing-app --plugin=protoc-gen-grpc=/ucrt64/bin/grpc_cpp_plugin.exe /d/Coding/image-processing-app/proto/image_processor.proto

cmake -S cpp-server -B cpp-server/build -G Ninja

cmake --build cpp-server/build --target grpc_server
```

terminal 2:

```
cd frontend && pnpm install && pnpm build && pnpm dev
```

terminal 3:

```
cd node-server && npm i && npm run build && npm run dev
```
