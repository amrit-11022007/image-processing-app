#pragma once

#include "history_stack.h"
#include "image_processor.h"

class HistoryProcessor
{
public:
  HistoryProcessor(int max_history = 50) : history(max_history) {}
  void loadImage(const Image &img)
  {
    current_image = img;
    history.clear();
  }
  Image applyOperation(const std::string &operation, int kernelSize = 3, double sigma = 0.0)
  {
    Image before = current_image;
    Image after;
    if (operation == "box_blur")
      after = core.applyBoxBlur(before, kernelSize);
    else if (operation == "gaussian_blur")
      after = core.applyGaussianBlur(before, kernelSize, sigma);
    else if (operation == "grayscale")
      after = core.toGrayscale(before);
    else
      after = before;
    history.push(before, after, operation, kernelSize, sigma);
    current_image = after;
    return after;
  }
  Image undo()
  {
    Image result;
    if (history.undo(result))
      current_image = result;
    return current_image;
  }
  Image redo()
  {
    Image result;
    if (history.redo(result))
    {
      current_image = result;
    }
    return current_image;
  }
  Image getCurrentImage() const { return current_image; }

  bool canUndo() const { return history.canUndo(); }
  bool canRedo() const { return history.canRedo(); }
  int getHistorySize() const { return history.getHistorySize(); }
  int getCurrentPosition() const { return history.getCurrentPosition(); }

  std::string getOperationName(int index)
  {
    return history.getOperationName(index);
  }

private:
  ImageProcessingCore core;
  HistoryStack history;
  Image current_image;
};