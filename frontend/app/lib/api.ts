import { ProcessImageResponse } from "../types";

export async function processImage(
  file: File,
  operation: string,
  kernelSize: number,
  sigma: number = 0, // Default 0 means auto-calculate
): Promise<ProcessImageResponse> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("operation", operation);
  formData.append("kernelSize", String(kernelSize));
  formData.append("sigma", String(sigma));

  const res = await fetch("http://localhost:3001/process", {
    method: "POST",
    body: formData,
  });

  return (await res.json()) as ProcessImageResponse;
}
