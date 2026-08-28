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
  const [showOriginal, setShowOriginal] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult("");

      // Get image dimensions
      const img = new window.Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = URL.createObjectURL(selected);
    }
  };

  const handleProcess = async (op: string) => {
    if (!file) return;
    setLoading(true);
    setOperation(op);

    try {
      const data = await processImage(file, op, kernelSize);
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

  const operations = [
    {
      id: "box_blur",
      name: "Box Blur",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      gradient: "from-purple-500 to-violet-600",
    },
    {
      id: "gaussian_blur",
      name: "Gaussian Blur",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      gradient: "from-violet-500 to-fuchsia-600",
    },
    {
      id: "grayscale",
      name: "Grayscale",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
      gradient: "from-gray-400 to-slate-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a2e]/90 backdrop-blur-xl border-b border-violet-500/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Neural Editor
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            {imageDimensions.width > 0 && (
              <span className="text-sm text-violet-300 bg-violet-500/20 px-3 py-1 rounded-lg">
                {imageDimensions.width} × {imageDimensions.height}
              </span>
            )}
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="px-4 py-2 text-sm bg-violet-500/20 border border-violet-500/30 rounded-lg hover:bg-violet-500/30 transition-colors"
            >
              {showOriginal ? "Show Processed" : "Show Original"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="pt-20 h-screen flex">
        {/* Left Toolbar */}
        <div className="w-72 bg-[#1a1a2e]/50 border-r border-violet-500/20 flex flex-col">
          {/* Upload Section */}
          <div className="p-6 border-b border-violet-500/20">
            <h2 className="text-sm font-semibold text-violet-300 mb-4 uppercase tracking-wider">
              Workspace
            </h2>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="border-2 border-dashed border-violet-500/30 rounded-lg p-6 text-center hover:border-violet-500/60 transition-colors">
                {file ? (
                  <div className="space-y-2">
                    <svg
                      className="w-8 h-8 mx-auto text-violet-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <p className="text-sm text-violet-300">{file.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg
                      className="w-8 h-8 mx-auto text-violet-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <p className="text-sm text-violet-300">Upload Image</p>
                    <p className="text-xs text-violet-500">Click to browse</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Filters Section */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-sm font-semibold text-violet-300 mb-4 uppercase tracking-wider">
              Filters
            </h2>

            {/* Kernel Size Selector */}
            <div className="mb-6">
              <label className="text-sm text-violet-300 mb-2 block">
                Kernel Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 9].map((size) => (
                  <button
                    key={size}
                    onClick={() => setKernelSize(size)}
                    disabled={loading}
                    className={`py-2 rounded-lg text-sm transition-all ${
                      kernelSize === size
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                        : "bg-[#2a2a3e] text-violet-300 hover:bg-[#3a3a4e]"
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
            </div>

            {/* Operation Buttons */}
            <div className="space-y-3">
              {operations.map((op) => (
                <button
                  key={op.id}
                  onClick={() => handleProcess(op.id)}
                  disabled={!file || loading}
                  className={`w-full group relative overflow-hidden rounded-lg p-4 bg-gradient-to-r ${op.gradient} 
                    transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                    ${loading && operation === op.id ? "ring-2 ring-white" : ""}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="bg-white/20 rounded-lg p-2">
                      {op.icon}
                    </span>
                    <span className="font-semibold">{op.name}</span>
                  </div>
                  {loading && operation === op.id && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Info */}
          <div className="p-4 border-t border-violet-500/20">
            <p className="text-xs text-violet-400 text-center">
              {file ? "Ready to process" : "Upload an image to begin"}
            </p>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative bg-[#0a0a0f] overflow-hidden">
          {/* Grid Background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(139, 92, 246, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139, 92, 246, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />

          {/* Canvas Content */}
          <div className="relative h-full flex items-center justify-center p-8 overflow-auto">
            {preview || result ? (
              <div className="relative max-w-full max-h-full">
                <div className="relative rounded-lg overflow-hidden shadow-2xl shadow-violet-500/20 border border-violet-500/20">
                  <Image
                    src={showOriginal && preview ? preview : result || preview}
                    alt={showOriginal ? "Original" : "Processed"}
                    width={imageDimensions.width || 1200}
                    height={imageDimensions.height || 800}
                    unoptimized
                    className="w-auto h-auto max-w-full max-h-[calc(100vh-160px)] object-contain"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                      maxHeight: "calc(100vh - 160px)",
                    }}
                  />

                  {/* Processing Overlay */}
                  {loading && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-violet-300 font-semibold">
                          Processing{" "}
                          {operations.find((o) => o.id === operation)?.name}...
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Operation Badge */}
                {result && !loading && (
                  <div className="absolute top-4 right-4 bg-violet-600/90 backdrop-blur px-3 py-1 rounded-full text-sm">
                    {operations.find((o) => o.id === operation)?.name}
                  </div>
                )}
              </div>
            ) : (
              /* Empty State */
              <div className="text-center space-y-4">
                <svg
                  className="w-32 h-32 mx-auto text-violet-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-violet-300">
                  Drop your image here
                </h3>
                <p className="text-violet-500">
                  Upload an image from the left panel to start editing
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
