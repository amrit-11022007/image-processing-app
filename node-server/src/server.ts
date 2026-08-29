import express from "express";
import cors from "cors";
import routes from "./router/route.js";
import { config } from "./config/config.js";

const app = express();

// Middleware
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

// Routes
app.use("/api", routes);
app.use("/", routes);

// Start server
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
