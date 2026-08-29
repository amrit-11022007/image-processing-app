#include <grpcpp/grpcpp.h>
#include "proto/image_processor.grpc.pb.h"
#include "image_processor.h"
#include "history_processor.h"
#include <unordered_map>
#include <iostream>
#include <memory>
#include <string>
#include <chrono>

using grpc::Server;
using grpc::ServerBuilder;
using grpc::ServerContext;
using grpc::ServerReader;
using grpc::Status;

using imageprocessor::HistoryRequest;
using imageprocessor::HistoryResponse;
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

      std::string session_id = request->session_id();
      auto session_state = getSession(session_id.empty() ? "default-session" : session_id);

      std::cout << "Processing " << input.width << "x" << input.height
                << " image with operation: " << request->operation() << std::endl;

      if (session_state->getCurrentImage().data.empty())
      {
        session_state->loadImage(input);
      }

      int kernel_size = request->kernel_size();
      if (kernel_size == 0)
        kernel_size = 3;

      Image result = session_state->applyOperation(request->operation(), kernel_size, request->sigma());

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
      std::string request_id;
      std::string session_id;

      std::cout << "Upload started..." << std::endl;

      while (reader->Read(&chunk))
      {
        chunk_count++;

        const std::string &chunk_data = chunk.data();
        full_image.insert(full_image.end(), chunk_data.begin(), chunk_data.end());
        total_bytes += static_cast<int>(chunk_data.size());

        if (chunk_count == 1)
        {
          operation = chunk.operation();
          kernel_size = chunk.kernel_size();
          sigma = chunk.sigma();
          width = chunk.width();
          height = chunk.height();
          request_id = chunk.request_id();
          session_id = chunk.session_id();
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

      if (session_id.empty())
      {
        session_id = "default-session";
      }

      std::cout << "  Upload complete!" << std::endl;
      std::cout << "  Session: " << session_id << std::endl;
      std::cout << "  Chunks: " << chunk_count << std::endl;
      std::cout << "  Total bytes: " << total_bytes << std::endl;
      std::cout << "  Operation: " << operation << std::endl;

      Image input;
      input.width = width;
      input.height = height;
      input.data = std::move(full_image);

      auto session_state = getSession(session_id);
      session_state->loadImage(input);

      Image result = session_state->applyOperation(operation, kernel_size, sigma);

      response->set_success(true);
      response->set_message("Image processed successfully");
      response->set_request_id(request_id.empty() ? "upload-" + std::to_string(
                                                                    std::chrono::system_clock::now().time_since_epoch().count())
                                                  : request_id);
      response->set_total_bytes(total_bytes);
      response->set_session_id(session_id);

      std::cout << "Processing complete for session " << session_id << std::endl;
      return Status::OK;
    }
    catch (const std::exception &e)
    {
      response->set_success(false);
      response->set_message(std::string("Error: ") + e.what());
      response->set_request_id("");
      response->set_session_id("");
      return Status(grpc::StatusCode::INTERNAL, e.what());
    }
  }

  Status Undo(ServerContext *context, const HistoryRequest *request, HistoryResponse *response) override
  {
    try
    {
      const std::string session_id = request->session_id();
      auto session_state = getSession(session_id);
      Image previous = session_state->undo();

      response->set_width(previous.width);
      response->set_height(previous.height);
      response->set_success(true);
      response->set_error("");
      response->set_image_data(reinterpret_cast<const char *>(previous.data.data()), previous.data.size());
      return Status::OK;
    }
    catch (const std::exception &e)
    {
      response->set_success(false);
      response->set_error(e.what());
      return Status(grpc::StatusCode::INTERNAL, e.what());
    }
  }

  Status Redo(ServerContext *context, const HistoryRequest *request, HistoryResponse *response) override
  {
    try
    {
      const std::string session_id = request->session_id();
      auto session_state = getSession(session_id);
      Image next = session_state->redo();

      response->set_width(next.width);
      response->set_height(next.height);
      response->set_success(true);
      response->set_error("");
      response->set_image_data(reinterpret_cast<const char *>(next.data.data()), next.data.size());
      return Status::OK;
    }
    catch (const std::exception &e)
    {
      response->set_success(false);
      response->set_error(e.what());
      return Status(grpc::StatusCode::INTERNAL, e.what());
    }
  }

  Status GetHistory(ServerContext *context, const HistoryRequest *request, imageprocessor::HistoryInfo *response) override
  {
    try
    {
      std::string session_id = request->session_id();
      if (session_id.empty())
        session_id = "default-session";

      auto session_state = getSession(session_id);
      response->set_total_operations(session_state->getHistorySize());
      response->set_current_position(session_state->getCurrentPosition());
      for (int i = 0; i < session_state->getHistorySize(); ++i)
      {
        response->add_operation_names(session_state->getOperationName(i));
      }
      return Status::OK;
    }
    catch (const std::exception &e)
    {
      return Status(grpc::StatusCode::INTERNAL, e.what());
    }
  }

private:
  std::unordered_map<std::string, std::shared_ptr<HistoryProcessor>> session;
  std::shared_ptr<HistoryProcessor> getSession(const std::string &session_id)
  {
    if (session.find(session_id) == session.end())
    {
      session[session_id] = std::make_shared<HistoryProcessor>(50);
    }
    return session[session_id];
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