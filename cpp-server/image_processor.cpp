#include "image_processor.h"
#include <algorithm>
#include <cmath>
#include <numbers>

void ImageProcessingCore::optimalSigma(double &sigma, int kernelSize)
{
  if (sigma <= 0)
    sigma = (kernelSize - 1) / 6.0; // kernel size = 6 * sigma + 1, it covers 99.7% for +- 3 sigma.
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

Image ImageProcessingCore::applyBoxBlur(const Image &input, int kernelSize)
{
  if (input.width <= 0 || input.height <= 0 || input.data.empty())
  {
    return Image();
  }

  validateKernelSize(kernelSize);
  Image output(input.width, input.height);

  int halfKernel = kernelSize / 2;

  for (int y = 0; y < input.height; y++)
  {
    for (int x = 0; x < input.width; x++)
    {
      int sumR = 0, sumG = 0, sumB = 0;
      int validPixels = 0;

      for (int ky = -halfKernel; ky <= halfKernel; ky++)
      {
        for (int kx = -halfKernel; kx <= halfKernel; kx++)
        {
          int neighborX = std::max(0, std::min(input.width - 1, x + kx));
          int neighborY = std::max(0, std::min(input.height - 1, y + ky));

          int idx = (neighborY * input.width + neighborX) * 3;

          sumR += input.data[idx];
          sumG += input.data[idx + 1];
          sumB += input.data[idx + 2];
          validPixels++;
        }
      }

      int outIdx = (y * input.width + x) * 3;
      output.data[outIdx] = clamp(sumR / validPixels);
      output.data[outIdx + 1] = clamp(sumG / validPixels);
      output.data[outIdx + 2] = clamp(sumB / validPixels);
    }
  }

  return output;
}

Image ImageProcessingCore::toGrayscale(const Image &input)
{
  Image output(input.width, input.height);

  for (int y = 0; y < input.height; y++)
  {
    for (int x = 0; x < input.width; x++)
    {
      int idx = (y * input.width + x) * 3;

      uint8_t gray = static_cast<uint8_t>(
          0.299 * input.data[idx] +
          0.587 * input.data[idx + 1] +
          0.114 * input.data[idx + 2]);

      output.data[idx] = gray;
      output.data[idx + 1] = gray;
      output.data[idx + 2] = gray;
    }
  }

  return output;
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

  std::vector<double> kernel = createGaussianKernel(kernelSize, sigma);
  int half = kernelSize / 2;

  // horizontal blur
  Image temp(input.width, input.height);
  for (int y = 0; y < input.height; y++)
  {
    for (int x = 0; x < input.width; x++)
    {
      double sumR = 0.0, sumG = 0.0, sumB = 0.0;
      for (int kx = -half; kx <= half; kx++)
      {
        int neighborX = std::max(0, std::min(input.width - 1, x + kx));
        int idx = (y * input.width + neighborX) * 3;
        double weight = kernel[kx + half];
        sumR += weight * input.data[idx];
        sumG += weight * input.data[idx + 1];
        sumB += weight * input.data[idx + 2];
      }
      int outIdx = (y * input.width + x) * 3;
      temp.data[outIdx] = clamp(static_cast<int>(std::round(sumR)));
      temp.data[outIdx + 1] = clamp(static_cast<int>(std::round(sumG)));
      temp.data[outIdx + 2] = clamp(static_cast<int>(std::round(sumB)));
    }
  }
  Image output(input.width, input.height);
  for (int y = 0; y < input.height; y++)
  {
    for (int x = 0; x < input.width; x++)
    {
      double sumR = 0.0, sumG = 0.0, sumB = 0.0;

      for (int ky = -half; ky <= half; ky++)
      {
        int neighborY = std::max(0, std::min(input.height - 1, y + ky));
        int idx = (neighborY * input.width + x) * 3;
        double weight = kernel[ky + half];

        sumR += weight * temp.data[idx];
        sumG += weight * temp.data[idx + 1];
        sumB += weight * temp.data[idx + 2];
      }
      int outIdx = (y * input.width + x) * 3;
      output.data[outIdx] = clamp(static_cast<int>(std::round(sumR)));
      output.data[outIdx + 1] = clamp(static_cast<int>(std::round(sumG)));
      output.data[outIdx + 2] = clamp(static_cast<int>(std::round(sumB)));
    }
  }
  return output;
}