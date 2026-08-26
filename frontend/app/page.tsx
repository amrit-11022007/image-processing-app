"use client";

import { useState } from "react";
import Image from "next/image";
import { processImage } from "@/app/lib/api";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [operation, setOperation] = useState("box_blur");
  const [kernelSize, setKernelSize] = useState(3);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(""); // Clear previous result
    }
  };

  // Process image
  const handleProcess = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const data = await processImage(file, operation, kernelSize);
      if (data.success) {
        setResult(data.image);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to process: " + err);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
      <h1 style={{ textAlign: "center" }}>🖼️ Image Processor</h1>

      {/* Upload */}
      <div
        style={{
          border: "2px dashed #ccc",
          padding: 30,
          borderRadius: 8,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: 10 }}
        />
        {preview && (
          <div>
            <Image
              src={preview}
              alt="Preview"
              width={300}
              height={300}
              unoptimized
              style={{ maxWidth: 300, maxHeight: 300 }}
            />
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: 20,
          justifyContent: "center",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value)}
          style={{ padding: 8 }}
        >
          <option value="box_blur">Box Blur</option>
          <option value="grayscale">Grayscale</option>
        </select>

        {operation === "box_blur" && (
          <select
            value={kernelSize}
            onChange={(e) => setKernelSize(Number(e.target.value))}
            style={{ padding: 8 }}
          >
            <option value={3}>3×3</option>
            <option value={5}>5×5</option>
            <option value={7}>7×7</option>
            <option value={9}>9×9</option>
          </select>
        )}

        <button
          onClick={handleProcess}
          disabled={!file || loading}
          style={{
            padding: "8px 24px",
            background: loading ? "#ccc" : "#0070f3",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⏳ Processing..." : "🚀 Process"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <h3>Result ({operation})</h3>
          <Image
            src={result}
            alt="Processed"
            width={900}
            height={500}
            unoptimized
            style={{ maxWidth: "100%", maxHeight: 500, borderRadius: 8 }}
          />
        </div>
      )}

      {/* Side-by-side comparison if both exist */}
      {preview && result && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
            marginTop: 30,
            borderTop: "1px solid #eee",
            paddingTop: 30,
          }}
        >
          <div>
            <h4 style={{ textAlign: "center" }}>Original</h4>
            <Image
              src={preview}
              alt="Original"
              width={900}
              height={600}
              unoptimized
              style={{ width: "100%", borderRadius: 8 }}
            />
          </div>
          <div>
            <h4 style={{ textAlign: "center" }}>Processed</h4>
            <Image
              src={result}
              alt="Processed"
              width={900}
              height={600}
              unoptimized
              style={{ width: "100%", borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
