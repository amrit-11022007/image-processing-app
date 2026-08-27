import * as grpc from "@grpc/grpc-js";

export interface ProcessImageRequest {
  image_data: Buffer;
  width: number;
  height: number;
  operation: string;
  kernel_size: number;
  sigma: number;
}

export interface ProcessImageResponse {
  processed_data: Buffer;
  width: number;
  height: number;
  error: string;
}

export interface ProcessImageResult {
  data: Buffer;
  width: number;
  height: number;
}

export interface ImageProcessorClient extends grpc.Client {
  processImage(
    request: ProcessImageRequest,
    callback: (
      error: grpc.ServiceError | null,
      response: ProcessImageResponse,
    ) => void,
  ): grpc.ClientUnaryCall;
}

export interface RawImageData {
  data: Buffer;
  width: number;
  height: number;
}

export interface ProcessResponse {
  success: boolean;
  image?: string;
  width?: number;
  height?: number;
  operation?: string;
  kernelSize?: number;
  error?: string;
}
