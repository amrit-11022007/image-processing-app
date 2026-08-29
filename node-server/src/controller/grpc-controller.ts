import type { Request, Response } from "express";
import fs from "fs";
import crypto from "crypto";
import { GRPCClient } from "../grpc/grpc-client.js";
import { imageToRawRGB, rawRGBToPNG } from "../utils/image-converter.js";

const grpcClient = new GRPCClient();

// Health check controller
export const healthCheck = (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() });
};

// Image processing controller
export const processImage = async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }

    const operation = req.body.operation || "box_blur";
    const kernelSize = parseInt(req.body.kernelSize) || 3;
    const sigma = Number(req.body.sigma) || 0;
    const sessionId = req.body.sessionId || crypto.randomUUID();

    console.log(
      `Processing ${file.originalname} with ${operation} for session ${sessionId}`,
    );

    const { data: rgbData, width, height } = await imageToRawRGB(file.path);

    const result = await grpcClient.processImage(
      rgbData,
      width,
      height,
      operation,
      kernelSize,
      sigma,
      sessionId,
    );

    fs.unlinkSync(file.path);

    const processedPng = await rawRGBToPNG(
      Buffer.from(result.data),
      result.width,
      result.height,
    );

    const base64Data = processedPng.toString("base64");

    res.json({
      success: true,
      image: `data:image/png;base64,${base64Data}`,
      width: result.width,
      height: result.height,
      operation,
      kernelSize,
      sessionId,
    });
  } catch (error) {
    console.error("Error processing image:", error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export interface UploadResult {
  success: boolean;
  message: string;
  requestId: string;
  totalBytes: number;
  sessionId: string;
}

export const getHistory = async (req: Request, res: Response) => {
  try {
    const sessionId = String(req.query.sessionId || "default-session");
    const history = await grpcClient.getHistory(sessionId);

    res.json({
      success: true,
      totalOperations: history.totalOperations,
      currentPosition: history.currentPosition,
      operationNames: history.operationNames,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const undoImage = async (req: Request, res: Response) => {
  try {
    const sessionId = String(req.body.sessionId || "default-session");
    const result = await grpcClient.undo(sessionId);
    const png = await rawRGBToPNG(
      Buffer.from(result.data),
      result.width,
      result.height,
    );

    res.json({
      success: true,
      image: `data:image/png;base64,${png.toString("base64")}`,
      width: result.width,
      height: result.height,
      sessionId,
    });
  } catch (error) {
    console.error("Error undoing image:", error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const redoImage = async (req: Request, res: Response) => {
  try {
    const sessionId = String(req.body.sessionId || "default-session");
    const result = await grpcClient.redo(sessionId);
    const png = await rawRGBToPNG(
      Buffer.from(result.data),
      result.width,
      result.height,
    );

    res.json({
      success: true,
      image: `data:image/png;base64,${png.toString("base64")}`,
      width: result.width,
      height: result.height,
      sessionId,
    });
  } catch (error) {
    console.error("Error redoing image:", error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "No image file provided",
      });
    }
    const operation = req.body.operation || "box_blur";
    const kernelSize = parseInt(req.body.kernelSize) || 3;
    const sigma = Number(req.body.sigma) || 0;
    const sessionId = req.body.sessionId || crypto.randomUUID();
    const { data: rgbData, width, height } = await imageToRawRGB(file.path);

    const result = await grpcClient.uploadImage(
      rgbData,
      width,
      height,
      operation,
      kernelSize,
      sigma,
      crypto.randomUUID(),
      sessionId,
    );

    res.json({
      ...result,
      sessionId: result.sessionId || sessionId,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  } finally {
    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
};
