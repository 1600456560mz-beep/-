import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Gemini Setup
  const getAi = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    return new GoogleGenAI(apiKey);
  };

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      const { imageData, mimeType } = req.body;
      const ai = getAi();
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use a stable alias

      const systemInstruction = `
        你是一位资深的各学科教育专家。你的任务是：
        1. 识别图片中的错题内容（题目文本、选项、答案）。
        2. 判断该题目所属的核心知识点（例如“一元二次方程根的判别式”）。
        3. 基于该知识点生成3道举一反三的练习题。
        4. 题目要求：
           - 覆盖同一知识点的不同角度或变式。
           - 难度与原题相当或略有梯度。
           - 附带正确答案。
           - 附带解析，解析必须侧重易错点分析。
        
        输出必须为JSON格式。
      `;

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: systemInstruction },
            { text: "请分析这张图片中的错题，并生成3道举一反三的题目。" },
            { inlineData: { data: imageData.split(',')[1] || imageData, mimeType } }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              originalText: { type: Type.STRING },
              knowledgePoint: { type: Type.STRING },
              variations: {
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
            },
            required: ["originalText", "knowledgePoint", "variations"]
          }
        }
      });

      res.json(JSON.parse(result.response.text()));
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/regenerate", async (req, res) => {
    try {
      const { originalText, knowledgePoint } = req.body;
      const ai = getAi();
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

      const systemInstruction = `
        你是一位资深的各学科教育专家。
        给定原题内容和核心知识点，请生成3道新的举一反三练习题。
        要求：覆盖变式、难度相当、带答案、侧重易错点解析。
        输出为JSON格式。
      `;

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: systemInstruction },
            { text: `原题：${originalText}\n知识点：${knowledgePoint}\n请重新生成3道举一反三题目。` }
          ]
        }],
        generationConfig: {
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

      res.json(JSON.parse(result.response.text()));
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
