#include "image_processor.h"
#include <opencv2/opencv.hpp>
#include <opencv2/imgproc.hpp>
#include <algorithm>
#include <cmath>
#include <numbers>

// Helper functions to convert between your Image struct and cv::Mat
cv::Mat ImageProcessingCore::convertToMat(const Image &input)
{
  cv::Mat mat(input.height, input.width, CV_8UC3);
  std::memcpy(mat.data, input.data.data(), input.data.size());
  return mat;
}

Image ImageProcessingCore::convertToImage(const cv::Mat &mat)
{
  Image img(mat.cols, mat.rows);

  if (mat.channels() == 3)
  {
    std::memcpy(img.data.data(), mat.data, mat.total() * mat.channels());
  }
  else if (mat.channels() == 1)
  {
    // Convert grayscale back to RGB
    cv::Mat rgb;
    cv::cvtColor(mat, rgb, cv::COLOR_GRAY2BGR);
    std::memcpy(img.data.data(), rgb.data, rgb.total() * 3);
  }

  return img;
}

uint8_t ImageProcessingCore::clamp(int value)
{
  return static_cast<uint8_t>(std::max(0, std::min(255, value)));
}

void ImageProcessingCore::validateKernelSize(int &kernelSize)
{
  if (kernelSize < 3)
    kernelSize = 3;
  if (kernelSize % 2 == 0)
    kernelSize++;
  if (kernelSize > 15)
    kernelSize = 15;
}

void ImageProcessingCore::optimalSigma(double &sigma, int kernelSize)
{
  if (sigma <= 0)
    sigma = (kernelSize - 1) / 6.0;
}

Image ImageProcessingCore::applyBoxBlur(const Image &input, int kernelSize)
{
  if (input.width <= 0 || input.height <= 0 || input.data.empty())
  {
    return Image();
  }

  validateKernelSize(kernelSize);

  cv::Mat img = convertToMat(input);
  cv::Mat result;

  // OpenCV's optimized box filter
  cv::blur(img, result, cv::Size(kernelSize, kernelSize));

  return convertToImage(result);
}

Image ImageProcessingCore::toGrayscale(const Image &input)
{
  if (input.width <= 0 || input.height <= 0 || input.data.empty())
  {
    return Image();
  }

  cv::Mat img = convertToMat(input);
  cv::Mat gray, result;

  // Convert to grayscale using OpenCV's optimized conversion
  cv::cvtColor(img, gray, cv::COLOR_BGR2GRAY);
  // Convert back to 3-channel for consistency
  cv::cvtColor(gray, result, cv::COLOR_GRAY2BGR);

  return convertToImage(result);
}

double ImageProcessingCore::gaussian1D(double x, double sigma)
{
  return (1.0 / (sigma * std::sqrt(2.0 * std::numbers::pi)) * std::exp(-(x * x) / (2 * sigma * sigma)));
}

std::vector<double> ImageProcessingCore::createGaussianKernel(int size, double sigma)
{
  validateKernelSize(size);
  optimalSigma(sigma, size);

  std::vector<double> kernel(size);
  double sum = 0.0;
  int half = size / 2;

  for (int x = -half; x <= half; x++)
  {
    double value = gaussian1D(static_cast<double>(x), sigma);
    kernel[x + half] = value;
    sum += value;
  }

  if (sum > 0)
    for (auto &it : kernel)
      it /= sum;

  return kernel;
}

Image ImageProcessingCore::applyGaussianBlur(const Image &input, int kernelSize, double sigma)
{
  if (input.width <= 0 || input.height <= 0 || input.data.empty())
    return Image();

  validateKernelSize(kernelSize);
  optimalSigma(sigma, kernelSize);

  cv::Mat img = convertToMat(input);
  cv::Mat result;

  // OpenCV's optimized Gaussian blur (uses SIMD and multi-threading)
  cv::GaussianBlur(img, result, cv::Size(kernelSize, kernelSize), sigma, sigma, cv::BORDER_REPLICATE);

  return convertToImage(result);
}