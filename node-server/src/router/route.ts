import { Router } from "express";
import multer from "multer";
import { config } from "../config/config.js";
import { healthCheck, processImage } from "../controller/grpc-controller.js";

const router = Router();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: config.server.uploadLimit },
});

router.get("/health", healthCheck);
router.post("/process", upload.single("image"), processImage);

export default router;
