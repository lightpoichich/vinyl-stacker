"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Search, Loader2, Eye, Type } from "lucide-react";

interface ImageAnalyzerProps {
  imageData: string;
  onSearchQuery: (query: string) => void;
}

interface AnalysisState {
  ocrProgress: number;
  ocrText: string;
  ocrDone: boolean;
  captionProgress: number;
  captionText: string;
  captionDone: boolean;
  analyzing: boolean;
  suggestedQuery: string;
}

function extractMeaningfulWords(text: string): string[] {
  const stopWords = new Set([
    "the", "a", "an", "is", "it", "and", "or", "of", "in", "on", "at",
    "to", "for", "with", "by", "from", "up", "as", "no", "not", "but",
    "this", "that", "these", "those", "be", "been", "being", "have",
    "has", "had", "do", "does", "did", "will", "would", "could", "should",
    "may", "might", "shall", "can", "need", "dare", "ought", "used",
  ]);
  return text
    .replace(/[^a-zA-Z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w.toLowerCase()));
}

export function ImageAnalyzer({ imageData, onSearchQuery }: ImageAnalyzerProps) {
  const [state, setState] = useState<AnalysisState>({
    ocrProgress: 0,
    ocrText: "",
    ocrDone: false,
    captionProgress: 0,
    captionText: "",
    captionDone: false,
    analyzing: false,
    suggestedQuery: "",
  });

  const analyze = useCallback(async () => {
    setState((s) => ({ ...s, analyzing: true, ocrProgress: 0, captionProgress: 0 }));

    // Run both pipelines in parallel
    const ocrPromise = runOCR();
    const captionPromise = runCaption();

    const [ocrResult, captionResult] = await Promise.allSettled([
      ocrPromise,
      captionPromise,
    ]);

    const ocr = ocrResult.status === "fulfilled" ? ocrResult.value : "";
    const caption = captionResult.status === "fulfilled" ? captionResult.value : "";

    // Determine best query: use OCR if it has >3 meaningful words, else caption
    const meaningfulWords = extractMeaningfulWords(ocr);
    const query = meaningfulWords.length > 3
      ? meaningfulWords.slice(0, 8).join(" ")
      : caption || meaningfulWords.join(" ");

    setState((s) => ({
      ...s,
      analyzing: false,
      suggestedQuery: query,
      ocrText: ocr,
      captionText: caption,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageData]);

  async function runOCR(): Promise<string> {
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", undefined, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setState((s) => ({ ...s, ocrProgress: Math.round(m.progress * 100) }));
          }
        },
      });

      setState((s) => ({ ...s, ocrProgress: 10 }));
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      setState((s) => ({ ...s, ocrDone: true, ocrProgress: 100, ocrText: text.trim() }));
      return text.trim();
    } catch {
      setState((s) => ({ ...s, ocrDone: true, ocrProgress: 100, ocrText: "" }));
      return "";
    }
  }

  async function runCaption(): Promise<string> {
    try {
      setState((s) => ({ ...s, captionProgress: 10 }));
      // Load transformers.js from CDN to avoid webpack bundling issues with onnxruntime
      const cdnUrl = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";
      const transformers = await import(/* webpackIgnore: true */ cdnUrl);
      setState((s) => ({ ...s, captionProgress: 40 }));
      const captioner = await transformers.pipeline(
        "image-to-text",
        "Xenova/vit-gpt2-image-captioning"
      );
      setState((s) => ({ ...s, captionProgress: 70 }));
      const result = await captioner(imageData);
      const caption = Array.isArray(result)
        ? (result[0] as { generated_text: string }).generated_text
        : "";
      setState((s) => ({
        ...s,
        captionDone: true,
        captionProgress: 100,
        captionText: caption,
      }));
      return caption;
    } catch {
      setState((s) => ({ ...s, captionDone: true, captionProgress: 100, captionText: "" }));
      return "";
    }
  }

  const handleSearch = () => {
    if (state.suggestedQuery.trim()) {
      onSearchQuery(state.suggestedQuery.trim());
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-[family-name:var(--font-space-grotesk)] font-semibold">
          Image Analysis
        </h3>
        {!state.analyzing && !state.ocrDone && (
          <Button onClick={analyze} className="gap-2">
            <Search className="h-4 w-4" />
            Analyze Image
          </Button>
        )}
        {state.analyzing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing...
          </div>
        )}
      </div>

      {/* OCR Progress */}
      {(state.analyzing || state.ocrDone) && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Type className="h-3 w-3" />
            OCR Text Recognition
          </div>
          <Progress value={state.ocrProgress}>
            <ProgressLabel className="sr-only">OCR Progress</ProgressLabel>
            <ProgressValue />
          </Progress>
          {state.ocrDone && state.ocrText && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              Detected: {state.ocrText.slice(0, 120)}
              {state.ocrText.length > 120 ? "..." : ""}
            </p>
          )}
        </div>
      )}

      {/* Caption Progress */}
      {(state.analyzing || state.captionDone) && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" />
            AI Image Description
          </div>
          <Progress value={state.captionProgress}>
            <ProgressLabel className="sr-only">Caption Progress</ProgressLabel>
            <ProgressValue />
          </Progress>
          {state.captionDone && state.captionText && (
            <p className="mt-1 text-xs text-muted-foreground">
              Caption: {state.captionText}
            </p>
          )}
        </div>
      )}

      {/* Editable query */}
      {(state.ocrDone || state.captionDone) && state.suggestedQuery && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Suggested Search Query</label>
          <Textarea
            value={state.suggestedQuery}
            onChange={(e) =>
              setState((s) => ({ ...s, suggestedQuery: e.target.value }))
            }
            rows={2}
            className="resize-none"
          />
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            Search Discogs
          </Button>
        </div>
      )}
    </div>
  );
}
