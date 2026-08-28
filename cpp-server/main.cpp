#include <grpcpp/grpcpp.h>
#include "proto/image_processor.grpc.pb.h"
#include "image_processor.h"
#include <iostream>
#include <memory>
#include <string>
#include <chrono>

using grpc::Server;
using grpc::ServerBuilder;
using grpc::ServerContext;
using grpc::ServerReader;
using grpc::Status;

using imageprocessor::ImageChunk;
using imageprocessor::ImageRequest;
using imageprocessor::ImageResponse;
using imageprocessor::UploadResponse;

class ImageProcessorServiceImpl final : public imageprocessor::ImageProcessor::Service
{
public:
  // ProcessImage
  Status ProcessImage(
      ServerContext *context,
      const ImageRequest *request,
      ImageResponse *response) override
  {
    try
    {
      Image input;
      input.width = request->width();
      input.height = request->height();

      const std::string &data = request->image_data();
      input.data.assign(data.begin(), data.end());

      std::cout << "Processing " << input.width << "x" << input.height
                << " image with operation: " << request->operation() << std::endl;

      ImageProcessingCore processor;
      Image result;

      if (request->operation() == "box_blur")
      {
        int kernelSize = request->kernel_size();
        if (kernelSize == 0)
          kernelSize = 3;
        result = processor.applyBoxBlur(input, kernelSize);
      }
      else if (request->operation() == "grayscale")
      {
        result = processor.toGrayscale(input);
      }
      else if (request->operation() == "gaussian_blur")
      {
        int kernelSize = request->kernel_size();
        if (kernelSize == 0)
          kernelSize = 3;
        double sigma = request->sigma();
        result = processor.applyGaussianBlur(input, kernelSize, sigma);
      }
      else
      {
        result = input;
      }

      response->set_processed_data(
          reinterpret_cast<const char *>(result.data.data()),
          result.data.size());
      response->set_width(result.width);
      response->set_height(result.height);
      response->set_error("");

      return Status::OK;
    }
    catch (const std::exception &e)
    {
      response->set_error(e.what());
      return Status(grpc::StatusCode::INTERNAL, e.what());
    }
  }

  Status UploadImage(
      ServerContext *context,
      ServerReader<ImageChunk> *reader,
      UploadResponse *response) override
  {
    try
    {
      std::vector<uint8_t> full_image;
      ImageChunk chunk;
      int chunk_count = 0;
      int total_bytes = 0;
      std::string operation;
      int kernel_size = 3;
      float sigma = 0.0f;
      int width = 0;
      int height = 0;

      std::cout << "Upload started..." << std::endl;

      // Read all chunks
      while (reader->Read(&chunk))
      {
        chunk_count++;

        const std::string &chunk_data = chunk.data();
        full_image.insert(full_image.end(),
                          chunk_data.begin(),
                          chunk_data.end());
        total_bytes += chunk_data.size();

        if (chunk_count == 1)
        {
          operation = chunk.operation();
          kernel_size = chunk.kernel_size();
          sigma = chunk.sigma();
          width = chunk.width();
          height = chunk.height();
        }

        if (chunk_count % 10 == 0)
        {
          std::cout << "Chunk : " << chunk_count
                    << " (" << total_bytes << " bytes)" << std::endl;
        }

        if (chunk.is_last())
        {
          break;
        }
      }

      std::cout << "  Upload complete!" << std::endl;
      std::cout << "  Chunks: " << chunk_count << std::endl;
      std::cout << "  Total bytes: " << total_bytes << std::endl;
      std::cout << "  Operation: " << operation << std::endl;

      Image input;
      input.width = width;
      input.height = height;
      input.data = std::move(full_image);

      ImageProcessingCore processor;
      Image result;

      if (operation == "box_blur")
      {
        result = processor.applyBoxBlur(input, kernel_size);
      }
      else if (operation == "grayscale")
      {
        result = processor.toGrayscale(input);
      }
      else if (operation == "gaussian_blur")
      {
        result = processor.applyGaussianBlur(input, kernel_size, sigma);
      }
      else
      {
        result = input;
      }

      response->set_success(true);
      response->set_message("Image processed successfully");
      response->set_request_id("upload-" + std::to_string(
                                               std::chrono::system_clock::now().time_since_epoch().count()));
      response->set_total_bytes(total_bytes);

      std::cout << "Processing complete" << std::endl;

      return Status::OK;
    }
    catch (const std::exception &e)
    {
      response->set_success(false);
      response->set_message(std::string("Error: ") + e.what());
      return Status(grpc::StatusCode::INTERNAL, e.what());
    }
  }
};

void RunServer()
{
  std::string server_address("0.0.0.0:50051");
  ImageProcessorServiceImpl service;

  grpc::ServerBuilder builder;
  builder.SetMaxReceiveMessageSize(50 * 1024 * 1024);
  builder.SetMaxSendMessageSize(50 * 1024 * 1024);
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);

  std::unique_ptr<Server> server(builder.BuildAndStart());
  std::cout << "C++ gRPC Server listening on " << server_address << std::endl;

  server->Wait();
}

int main(int argc, char **argv)
{
  std::cout << "Starting gRPC Image Processing Server..." << std::endl;
  RunServer();
  return 0;
}