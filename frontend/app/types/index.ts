export interface Result {
  image: string; // base64 encoded
  width: number;
  height: number;
  operation: string;
  kernelSize?: number;
}
export interface ProcessImageResponse {
  success: boolean;
  image: string;
  width?: number;
  height?: number;
  operation?: string;
  kernelSize?: number;
  error?: string;
}
