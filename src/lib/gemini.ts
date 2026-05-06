export interface Variation {
  question: string;
  answer: string;
  explanation: string;
}

export interface MistakeAnalysis {
  originalText: string;
  knowledgePoint: string;
  variations: Variation[];
}

export async function analyzeMistake(imageData: string, mimeType: string): Promise<MistakeAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData, mimeType }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "识别失败");
  }

  return await response.json();
}

export async function regenerateVariations(originalText: string, knowledgePoint: string): Promise<Variation[]> {
  const response = await fetch("/api/regenerate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originalText, knowledgePoint }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "重新生成失败");
  }

  return await response.json();
}
