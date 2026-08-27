import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type {
  ProcessImageRequest,
  ProcessImageResponse,
  ProcessImageResult,
  ImageProcessorClient,
} from "./types.js";

const PROTO_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../proto/image_processor.proto",
);

class GrpcClient {
  private client: ImageProcessorClient;

  constructor(serverAddress: string = "localhost:50051") {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDefinition) as any;

    // ============ FIX: Create channel with increased limits ============
    // Create a channel with max receive message size of 50 MB
    const channelOptions = {
      "grpc.max_receive_message_length": 50 * 1024 * 1024, // 50 MB
      "grpc.max_send_message_length": 50 * 1024 * 1024, // 50 MB
    };

    this.client = new proto.imageprocessor.ImageProcessor(
      serverAddress,
      grpc.credentials.createInsecure(),
      channelOptions,
    ) as ImageProcessorClient;
  }

  processImage(
    imageData: Buffer,
    width: number,
    height: number,
    operation: string,
    kernelSize: number = 3,
    sigma: number = 0,
  ): Promise<ProcessImageResult> {
    return new Promise((resolve, reject) => {
      const request: ProcessImageRequest = {
        image_data: imageData,
        width: width,
        height: height,
        operation: operation,
        kernel_size: kernelSize,
        sigma: sigma,
      };

      this.client.processImage(request, (error, response) => {
        if (error) {
          reject(error);
        } else if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve({
            data: response.processed_data,
            width: response.width,
            height: response.height,
          });
        }
      });
    });
  }
}

export default GrpcClient;
export type { ProcessImageResult, ProcessImageRequest, ProcessImageResponse };
