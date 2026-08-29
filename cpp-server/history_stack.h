#include "image_processor.h"
#include <string>
#include <vector>

struct HistoryCmd
{
  std::string operation;
  int kernelSize = 3;
  double sigma = 0.0;
  Image before;
  Image after;
};

class HistoryStack
{
public:
  HistoryStack(int max = 50) : max_history(max) {}
  void push(const Image &before, const Image &after, const std::string &operation, int kernelSize = 3, double sigma = 0.0);
  bool undo(Image &result);
  bool redo(Image &result);
  Image getCurrentState();
  bool canUndo() const { return current_position >= 0; }
  bool canRedo() const { return current_position + 1 < (int)history.size(); }
  int getCurrentPosition() const { return current_position; }
  int getHistorySize() const { return history.size(); }
  void clear()
  {
    history.clear();
    current_position = -1;
  }
  std::string getOperationName(int index);

private:
  std::vector<HistoryCmd> history;
  int current_position = -1;
  int max_history = 50;
};