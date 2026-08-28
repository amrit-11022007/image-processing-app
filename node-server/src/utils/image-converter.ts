import sharp from "sharp";

export interface RawImageData {
  data: Buffer;
  width: number;
  height: number;
}

// Convert any image to raw RGB
export async function imageToRawRGB(imagePath: string): Promise<RawImageData> {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // RGBA → RGB
  const rgbData = Buffer.alloc(info.width * info.height * 3);
  for (let i = 0; i < info.width * info.height; i++) {
    const rgbaIdx = i * 4;
    const rgbIdx = i * 3;
    rgbData[rgbIdx] = data[rgbaIdx]!;
    rgbData[rgbIdx + 1] = data[rgbaIdx + 1]!;
    rgbData[rgbIdx + 2] = data[rgbaIdx + 2]!;
  }

  return {
    data: rgbData,
    width: info.width,
    height: info.height,
  };
}

// Convert raw RGB back to PNG
export async function rawRGBToPNG(
  rawData: Buffer,
  width: number,
  height: number,
): Promise<Buffer> {
  // RGB → RGBA
  const rgbaData = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const rgbIdx = i * 3;
    const rgbaIdx = i * 4;
    rgbaData[rgbaIdx] = rawData[rgbIdx]!;
    rgbaData[rgbaIdx + 1] = rawData[rgbIdx + 1]!;
    rgbaData[rgbaIdx + 2] = rawData[rgbIdx + 2]!;
    rgbaData[rgbaIdx + 3] = 255;
  }

  return await sharp(rgbaData, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();
}
