import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "../config/config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__dirname);

const PROTO_PATH = path.join(__dirname, "../../../proto/image_processor.proto");

export interface ProcessImageResult {
  data: Buffer;
  width: number;
  height: number;
}

export interface UploadImageResult {
  success: boolean;
  message: string;
  requestId: string;
  totalBytes: number;
}

export class GRPCClient {
  private client: any;

  constructor() {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDefinition) as any;

    const channelOptions = {
      "grpc.max_receive_message_length": config.grpc.maxMessageSize,
      "grpc.max_send_message_length": config.grpc.maxMessageSize,
    };

    this.client = new proto.imageprocessor.ImageProcessor(
      config.grpc.address,
      grpc.credentials.createInsecure(),
      channelOptions,
    );
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
      this.client.processImage(
        {
          image_data: imageData,
          width,
          height,
          operation,
          kernel_size: kernelSize,
          sigma,
        },
        (error: any, response: any) => {
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
        },
      );
    });
  }

  uploadImage(
    imageData: Buffer,
    width: number,
    height: number,
    operation: string,
    kernelSize: number = 3,
    sigma: number = 0,
    requestId: string,
    chunkSize = 1024 * 1024,
  ): Promise<UploadImageResult> {
    return new Promise((resolve, reject) => {
      const call = this.client.uploadImage((error: any, response: any) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          success: response.success,
          message: response.message,
          requestId: response.request_id,
          totalBytes: response.total_bytes,
        });
      });

      const totalChunks = Math.ceil(imageData.length / chunkSize);
      for (
        let offset = 0, chunkNumber = 0;
        offset < imageData.length;
        offset += chunkSize, chunkNumber++
      ) {
        const data = imageData.subarray(offset, offset + chunkSize);
        call.write({
          data,
          chunk_number: chunkNumber,
          total_chunks: totalChunks,
          is_last: chunkNumber === totalChunks - 1,
          width,
          height,
          operation,
          kernel_size: kernelSize,
          sigma,
          request_id: requestId,
        });
      }

      call.end();
    });
  }
}
