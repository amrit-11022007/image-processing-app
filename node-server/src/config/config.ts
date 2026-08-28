export const config = {
  server: {
    port: process.env.PORT || 3001,
    uploadLimit: 10 * 1024 * 1024,
  },
  grpc: {
    address: process.env.GRPC_SERVER_ADDRESS || "localhost:50051",
    maxMessageSize: 50 * 1024 * 1024,
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
  },
} as const;
