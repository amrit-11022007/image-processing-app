export interface Result {
  image: string; // base64 encoded
  width: number;
  height: number;
  operation: string;
  kernelSize?: number;
}
