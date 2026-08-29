cmake_minimum_required(VERSION 3.20)
project(pixidixi VERSION 1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(OpenCV REQUIRED)
find_package(gRPC CONFIG REQUIRED)

add_executable(grpc_server
  main.cpp
  image_processor.cpp
  history_stack.cpp
  ../proto/image_processor.pb.cc
  ../proto/image_processor.grpc.pb.cc
)

target_include_directories(grpc_server
  PRIVATE
    "${CMAKE_CURRENT_SOURCE_DIR}"
    "${CMAKE_CURRENT_SOURCE_DIR}/.."
    "${CMAKE_CURRENT_SOURCE_DIR}/../proto"
    ${OpenCV_INCLUDE_DIRS}
)

target_link_libraries(grpc_server
  PRIVATE
    ${OpenCV_LIBS}
    gRPC::grpc++
    gRPC::grpc++_reflection
    protobuf::libprotobuf
    pthread
)

message(STATUS "Configured gRPC server target: grpc_server")
