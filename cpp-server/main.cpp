#include <grpcpp/grpcpp.h>
#include "proto/image_processor.grpc.pb.h"
#include "image_processor.h"
#include <iostream>
#include <memory>
#include <string>

using grpc::Server;
using grpc::ServerBuilder;
using grpc::ServerContext;
using grpc::Status;

// Don't need to redefine ImageProcessingCore - it's in the header
using imageprocessor::ImageRequest;
using imageprocessor::ImageResponse;

class ImageProcessorServiceImpl final : public imageprocessor::ImageProcessor::Service
{
public:
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

      ImageProcessingCore processor; // This class is defined in image_processor.h
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
};

void RunServer()
{
  std::string server_address("0.0.0.0:50051");
  ImageProcessorServiceImpl service;

  ServerBuilder builder;
  builder.AddListeningPort(server_address, grpc::InsecureServerCredentials());
  builder.RegisterService(&service);

  std::unique_ptr<Server> server(builder.BuildAndStart());
  std::cout << "✅ C++ gRPC Server listening on " << server_address << std::endl;

  server->Wait();
}

int main(int argc, char **argv)
{
  std::cout << "🚀 Starting gRPC Image Processing Server..." << std::endl;
  RunServer();
  return 0;
}