export interface Result {
  image: string; // base64 encoded
  width: number;
  height: number;
  operation: string;
  kernelSize?: number;
}

export interface ProcessImageResponse {
  success: boolean;
  image: string;
  width?: number;
  height?: number;
  operation?: string;
  kernelSize?: number;
  sessionId?: string;
  error?: string;
}

export interface HistoryItem {
  name: string;
  index: number;
}

export interface HistoryResponse {
  success: boolean;
  totalOperations?: number;
  currentPosition?: number;
  operationNames?: string[];
  image?: string;
  width?: number;
  height?: number;
  error?: string;
}
