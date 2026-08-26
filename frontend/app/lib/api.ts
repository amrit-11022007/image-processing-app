export interface ProcessImageResponse {
  success: boolean;
  image: string;
  error?: string;
}

export async function processImage(
  file: File,
  operation: string,
  kernelSize: number,
): Promise<ProcessImageResponse> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("operation", operation);
  formData.append("kernelSize", String(kernelSize));

  const res = await fetch("http://localhost:3001/process", {
    method: "POST",
    body: formData,
  });

  return (await res.json()) as ProcessImageResponse;
}
