import type { Request, Response } from "express";
import fs from "fs";
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

    console.log(`Processing ${file.originalname} with ${operation}`);

    // Convert to raw RGB
    const { data: rgbData, width, height } = await imageToRawRGB(file.path);

    // Send to gRPC server
    const result = await grpcClient.processImage(
      rgbData,
      width,
      height,
      operation,
      kernelSize,
      sigma,
    );

    // Clean up uploaded file
    fs.unlinkSync(file.path);

    // Convert processed raw RGB back to PNG
    const processedPng = await rawRGBToPNG(
      Buffer.from(result.data),
      result.width,
      result.height,
    );

    // Return processed image
    const base64Data = processedPng.toString("base64");

    res.json({
      success: true,
      image: `data:image/png;base64,${base64Data}`,
      width: result.width,
      height: result.height,
      operation,
      kernelSize,
    });
  } catch (error) {
    console.error("Error processing image:", error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
};
