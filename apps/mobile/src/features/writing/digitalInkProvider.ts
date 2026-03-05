import type { TracePoint } from "./writingService";

export type DigitalInkRecognitionInput = {
  points: TracePoint[];
  canvasWidth: number;
  canvasHeight: number;
  promptGlyph: string;
};

export type DigitalInkRecognitionResult = {
  status: "recognized" | "fallback";
  provider: string;
  confidence: number;
  matchedGlyph: string | null;
  reason: string | null;
};

export interface DigitalInkProvider {
  recognize(input: DigitalInkRecognitionInput): Promise<DigitalInkRecognitionResult>;
}

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export class HeuristicDigitalInkProvider implements DigitalInkProvider {
  async recognize(input: DigitalInkRecognitionInput): Promise<DigitalInkRecognitionResult> {
    const { points, canvasWidth, canvasHeight, promptGlyph } = input;

    if (points.length < 12) {
      return {
        status: "fallback",
        provider: "heuristic-local",
        confidence: 0,
        matchedGlyph: null,
        reason: "insufficient_points",
      };
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const point of points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    const bboxArea = Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
    const coverage = clamp(bboxArea / Math.max(canvasWidth * canvasHeight, 1), 0, 1);
    const confidence = clamp(Math.round((coverage / 0.2) * 100), 0, 100);

    if (confidence < 25) {
      return {
        status: "fallback",
        provider: "heuristic-local",
        confidence,
        matchedGlyph: null,
        reason: "low_confidence",
      };
    }

    return {
      status: "recognized",
      provider: "heuristic-local",
      confidence,
      matchedGlyph: promptGlyph,
      reason: null,
    };
  }
}

export const recognizeWithFallback = async (
  provider: DigitalInkProvider,
  input: DigitalInkRecognitionInput,
): Promise<DigitalInkRecognitionResult> => {
  try {
    const result = await provider.recognize(input);
    return result;
  } catch (_error) {
    return {
      status: "fallback",
      provider: "fallback",
      confidence: 0,
      matchedGlyph: null,
      reason: "provider_error",
    };
  }
};
