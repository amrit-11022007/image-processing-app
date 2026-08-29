import { Router } from "express";
import multer from "multer";
import { config } from "../config/config.js";
import {
  getHistory,
  healthCheck,
  processImage,
  redoImage,
  undoImage,
  uploadImage,
} from "../controller/grpc-controller.js";

const router = Router();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: config.server.uploadLimit },
});

router.get("/health", healthCheck);
router.get("/history", getHistory);
router.post("/process", upload.single("image"), processImage);
router.post("/upload", upload.single("image"), uploadImage);
router.post("/undo", undoImage);
router.post("/redo", redoImage);

export default router;
