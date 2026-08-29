#include "history_stack.h"
#include "image_processor.h"
#include <string>
#include <vector>
#include <memory>

void HistoryStack::push(const Image &before, const Image &after, const std::string &operation, int kernelSize, double sigma)
{
  // removing redo
  if (current_position < (int)history.size() - 1)
  {
    history.resize(current_position + 1);
  }
  HistoryCmd cmd;
  cmd.operation = operation;
  cmd.kernelSize = kernelSize;
  cmd.sigma = sigma;
  cmd.after = after;
  cmd.before = before;
  history.push_back(cmd);
  current_position++;
  if (history.size() >= max_history)
  {
    history.erase(history.begin());
    current_position--;
  }
}

bool HistoryStack::undo(Image &result)
{
  if (current_position < 0)
    return false;
  result = history[current_position].before;
  current_position--;
  return true;
}

bool HistoryStack::redo(Image &result)
{
  if (current_position + 1 >= history.size())
    return false;
  current_position++;
  result = history[current_position].after;
  return true;
}

Image HistoryStack::getCurrentState()
{
  if (history.empty())
    return Image();
  return history[current_position].after;
}

std::string HistoryStack::getOperationName(int index)
{
  if (index < 0 || index >= (int)history.size())
    return "";
  return history[index].operation;
}
