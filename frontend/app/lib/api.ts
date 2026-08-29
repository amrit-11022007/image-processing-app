import { HistoryResponse, ProcessImageResponse } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!res.ok) {
    let errorText = text;
    if (!text || text.trim().startsWith("<")) {
      errorText =
        "The image API is not responding. Start the Node server on port 3001 and try again.";
    }
    throw new Error(errorText);
  }

  if (!text) {
    throw new Error("Empty response from image API.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (text.trim().startsWith("<")) {
      throw new Error(
        "The server responded with HTML instead of JSON. Check the backend is running on port 3001.",
      );
    }
    throw new Error(`Invalid JSON response: ${text.slice(0, 120)}`);
  }
}

export async function processImage(
  file: File,
  operation: string,
  kernelSize: number,
  sigma: number = 0,
  sessionId?: string,
): Promise<ProcessImageResponse> {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("operation", operation);
  formData.append("kernelSize", String(kernelSize));
  formData.append("sigma", String(sigma));
  if (sessionId) {
    formData.append("sessionId", sessionId);
  }

  const res = await fetch(`${API_BASE}/process`, {
    method: "POST",
    body: formData,
  });

  return parseJsonResponse<ProcessImageResponse>(res);
}

export async function getHistory(sessionId: string): Promise<HistoryResponse> {
  const res = await fetch(
    `${API_BASE}/history?sessionId=${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
    },
  );

  return parseJsonResponse<HistoryResponse>(res);
}

export async function undoImage(sessionId: string): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/undo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  return parseJsonResponse<HistoryResponse>(res);
}

export async function redoImage(sessionId: string): Promise<HistoryResponse> {
  const res = await fetch(`${API_BASE}/redo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });

  return parseJsonResponse<HistoryResponse>(res);
}
