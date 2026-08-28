FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies including OpenCV
RUN apt-get update && apt-get install -y \
    build-essential \
    pkg-config \
    libgrpc++-dev \
    protobuf-compiler-grpc \
    libprotobuf-dev \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all source files
COPY proto/ ./proto/
COPY cpp-server/ ./cpp-server/

# Generate gRPC code - output to the proto directory to keep includes consistent
RUN protoc --cpp_out=. proto/image_processor.proto
RUN protoc --grpc_out=. --plugin=protoc-gen-grpc=`which grpc_cpp_plugin` proto/image_processor.proto

# Compile with proper include paths and OpenCV libraries
RUN g++ -std=c++20 \
    -I/app \
    -I/app/proto \
    /app/cpp-server/main.cpp \
    /app/cpp-server/image_processor.cpp \
    /app/proto/image_processor.pb.cc \
    /app/proto/image_processor.grpc.pb.cc \
    `pkg-config --cflags --libs grpc++ protobuf` \
    `pkg-config --cflags --libs opencv4` \
    -lpthread \
    -o /app/grpc_server

EXPOSE 50051

CMD ["/app/grpc_server"]