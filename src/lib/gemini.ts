import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

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
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    你是一位资深的各学科教育专家。你的任务是：
    1. 识别图片中的错题内容（题目文本、选项、答案）。
    2. 判断该题目所属的核心知识点（例如“一元二次方程根的判别式”）。
    3. 基于该知识点生成3道举一反三的练习题。
    4. 题目要求：
       - 覆盖同一知识点的不同角度或变式。
       - 难度与原题相当或略有梯度。
       - 附带正确答案。
       - 附带解析，解析必须侧重易错点分析（例如“注意分母不能为零”、“注意二次项系数的讨论”等）。
    
    输出必须为JSON格式。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "请分析这张图片中的错题，并生成3道举一反三的题目。" },
        { inlineData: { data: imageData.split(',')[1] || imageData, mimeType } }
      ]
    },
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originalText: { type: Type.STRING, description: "识别出的原题内容" },
          knowledgePoint: { type: Type.STRING, description: "核心知识点" },
          variations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "举一反三题目内容" },
                answer: { type: Type.STRING, description: "题目答案" },
                explanation: { type: Type.STRING, description: "侧重易错点的详细解析" }
              },
              required: ["question", "answer", "explanation"]
            }
          }
        },
        required: ["originalText", "knowledgePoint", "variations"]
      }
    }
  });

  if (!response.text) {
    throw new Error("AI 响应为空");
  }

  return JSON.parse(response.text) as MistakeAnalysis;
}

export async function regenerateVariations(originalText: string, knowledgePoint: string): Promise<Variation[]> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    你是一位资深的各学科教育专家。
    给定原题内容和核心知识点，请生成3道新的举一反三练习题。
    要求同上：覆盖变式、难度相当、带答案、侧重易错点解析。
    输出为JSON格式。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: `原题：${originalText}\n知识点：${knowledgePoint}\n请重新生成3道举一反三题目。`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["question", "answer", "explanation"]
        }
      }
    }
  });

  if (!response.text) {
    throw new Error("AI 响应为空");
  }

  return JSON.parse(response.text) as Variation[];
}
