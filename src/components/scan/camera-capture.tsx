"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, RotateCcw, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraAvailable, setCameraAvailable] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setCameraActive(true);
    } catch {
      setCameraAvailable(false);
      setCameraError("Camera not available. Use file upload instead.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    stopCamera();
    onCapture(dataUrl);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCapturedImage(dataUrl);
      onCapture(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function resetCapture() {
    setCapturedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Show captured image
  if (capturedImage) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/50">
        <img
          src={capturedImage}
          alt="Captured vinyl"
          className="w-full object-contain"
        />
        <Button
          variant="secondary"
          size="sm"
          className="absolute right-2 top-2 gap-1"
          onClick={resetCapture}
        >
          <RotateCcw className="h-3 w-3" />
          Retake
        </Button>
      </div>
    );
  }

  // Show camera feed
  if (cameraActive) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border/50">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full"
        />
        <canvas ref={canvasRef} className="hidden" />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
          <Button
            onClick={capturePhoto}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg"
          >
            <Camera className="h-6 w-6" />
          </Button>
          <Button
            onClick={stopCamera}
            variant="secondary"
            size="icon-lg"
            className="rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  // Show capture options
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-border/50 bg-card/30 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Camera className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <h3 className="font-medium">Capture a record</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Take a photo of the record cover or label to identify it
        </p>
      </div>

      {cameraError && (
        <p className="text-sm text-destructive">{cameraError}</p>
      )}

      <div className="flex gap-3">
        {cameraAvailable && (
          <Button onClick={startCamera} className="gap-2">
            <Camera className="h-4 w-4" />
            Open Camera
          </Button>
        )}
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Upload Photo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
