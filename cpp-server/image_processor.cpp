#include "image_processor.h"
#include <algorithm>
#include <cmath>

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