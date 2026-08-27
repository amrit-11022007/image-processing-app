#pragma once

#include <vector>
#include <cstdint>

struct Image
{
  int width;
  int height;
  std::vector<uint8_t> data; // RGB interleaved

  Image() : width(0), height(0) {}
  Image(int w, int h) : width(w), height(h)
  {
    data.resize(w * h * 3);
  }
};

class ImageProcessingCore
{
public:
  Image applyBoxBlur(const Image &input, int kernelSize);
  Image toGrayscale(const Image &input);
  Image applyGaussianBlur(const Image &input, int kernelSize, double sigma);
  std::vector<double> createGaussianKernel(int size, double sigma);

private:
  uint8_t clamp(int value);
  void validateKernelSize(int &kernelSize);
  void optimalSigma(double &sigma, int kernelSize);
  double gaussian1D(double x, double sigma);
};