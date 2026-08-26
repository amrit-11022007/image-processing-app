const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = "../proto/image_processor.proto";

class GrpcClient {
  constructor(serverAddress = "localhost:50051") {
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDefinition);
    this.client = new proto.imageprocessor.ImageProcessor(
      serverAddress,
      grpc.credentials.createInsecure(),
    );
  }

  processImage(imageData, width, height, operation, kernelSize = 3) {
    return new Promise((resolve, reject) => {
      this.client.ProcessImage(
        {
          image_data: imageData,
          width: width,
          height: height,
          operation: operation,
          kernel_size: kernelSize,
        },
        (error, response) => {
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
}

module.exports = GrpcClient;
