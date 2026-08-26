const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const GrpcClient = require("./grpc-client");

const app = express();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.use(cors());
app.use(express.json());

const grpcClient = new GrpcClient();

// Convert image to raw RGB
async function imageToRawRGB(imagePath) {
  try {
    // Use sharp to decode and convert to raw RGB
    const { data, info } = await sharp(imagePath)
      .ensureAlpha() // Ensure 4 channels (RGBA)
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert RGBA to RGB (remove alpha channel)
    const rgbData = Buffer.alloc(info.width * info.height * 3);

    for (let i = 0; i < info.width * info.height; i++) {
      const rgbaIndex = i * 4;
      const rgbIndex = i * 3;

      rgbData[rgbIndex] = data[rgbaIndex]; // R
      rgbData[rgbIndex + 1] = data[rgbaIndex + 1]; // G
      rgbData[rgbIndex + 2] = data[rgbaIndex + 2]; // B
    }

    return {
      data: rgbData,
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    throw new Error(`Failed to decode image: ${error.message}`);
  }
}

// Convert raw RGB back to PNG
async function rawRGBToPNG(rawData, width, height) {
  try {
    // Convert RGB to RGBA
    const rgbaData = Buffer.alloc(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      const rgbIndex = i * 3;
      const rgbaIndex = i * 4;

      rgbaData[rgbaIndex] = rawData[rgbIndex]; // R
      rgbaData[rgbaIndex + 1] = rawData[rgbIndex + 1]; // G
      rgbaData[rgbaIndex + 2] = rawData[rgbIndex + 2]; // B
      rgbaData[rgbaIndex + 3] = 255; // A (fully opaque)
    }

    // Convert RGBA buffer to PNG
    const pngBuffer = await sharp(rgbaData, {
      raw: {
        width: width,
        height: height,
        channels: 4,
      },
    })
      .png()
      .toBuffer();

    return pngBuffer;
  } catch (error) {
    throw new Error(`Failed to encode image: ${error.message}`);
  }
}

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Upload and process image
app.post("/process", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    const operation = req.body.operation || "box_blur";
    const kernelSize = parseInt(req.body.kernelSize) || 3;

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
      operation: operation,
      kernelSize: kernelSize,
    });
  } catch (error) {
    console.error("Error processing image:", error);

    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Node.js server running on http://localhost:${PORT}`);
});
