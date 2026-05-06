import { useState, useCallback, useRef } from 'react';
import { analyzeMistake, regenerateVariations, MistakeAnalysis, Variation } from '../lib/gemini';
import { db } from '../lib/db';
import { Camera, Image as ImageIcon, Loader2, Sparkles, Save, RefreshCcw, Check, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function MistakeRecognition() {
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MistakeAnalysis | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      processImage(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string, mimeType: string) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeMistake(base64, mimeType);
      setAnalysis(result);
      toast.success('识别成功并生成举一反三题目');
    } catch (error) {
      console.error(error);
      toast.error('识别失败，请换一张更清晰的图片');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!analysis) return;
    setGenerating(true);
    try {
      const newVariations = await regenerateVariations(analysis.originalText, analysis.knowledgePoint);
      setAnalysis({ ...analysis, variations: newVariations });
      toast.success('已重新生成题目');
    } catch (error) {
      console.error(error);
      toast.error('重新生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!analysis) return;
    try {
      await db.saveMistake({
        originalText: analysis.originalText,
        originalImageUrl: image || undefined,
        knowledgePoint: analysis.knowledgePoint,
        variations: analysis.variations,
      });
      toast.success('已保存到错题本');
      setAnalysis(null);
      setImage(null);
    } catch (error) {
      console.error(error);
      toast.error('保存失败');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Upload Area */}
      {!image && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center bg-white hover:border-blue-500 transition-colors cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
              <Camera className="w-12 h-12 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold">拍摄或上传错题图片</h3>
              <p className="text-gray-500 mt-2">支持 JPG、PNG 格式，确保题目清晰</p>
            </div>
            <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-full font-semibold">
              选择文件
            </button>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </motion.div>
      )}

      {/* Preview and Results */}
      {image && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Side: Original Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> 原图预览
            </h3>
            <div className="relative group">
              <img src={image} alt="Original" className="w-full rounded-2xl shadow-lg" />
              <button 
                onClick={() => { setImage(null); setAnalysis(null); }}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                更换图片
              </button>
            </div>
          </div>

          {/* Right Side: Analysis and Variations */}
          <div className="space-y-6">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <p className="text-gray-500 font-medium">AI 正在深度解析中...</p>
              </div>
            ) : analysis && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Knowledge Point */}
                <div className="bg-blue-50 p-4 rounded-2xl">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">核心知识点</span>
                  <div className="flex items-center justify-between mt-1">
                    {isEditing ? (
                      <input 
                        className="bg-transparent border-b border-blue-300 w-full font-bold text-lg focus:outline-none"
                        value={analysis.knowledgePoint}
                        onChange={(e) => setAnalysis({...analysis, knowledgePoint: e.target.value})}
                      />
                    ) : (
                      <h4 className="text-lg font-extrabold text-blue-900">{analysis.knowledgePoint}</h4>
                    )}
                    <button onClick={() => setIsEditing(!isEditing)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                      {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Original Content */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">题目识别结果</span>
                  {isEditing ? (
                    <textarea 
                      className="w-full mt-2 p-2 border rounded-xl h-24 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={analysis.originalText}
                      onChange={(e) => setAnalysis({...analysis, originalText: e.target.value})}
                    />
                  ) : (
                    <p className="mt-2 text-gray-700 leading-relaxed whitespace-pre-wrap">{analysis.originalText}</p>
                  )}
                </div>

                {/* Variations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-amber-500" /> 举一反三练习
                    </h4>
                    <button 
                      onClick={handleRegenerate}
                      disabled={generating}
                      className="text-sm font-medium text-blue-600 flex items-center gap-1 hover:underline disabled:opacity-50"
                    >
                      <RefreshCcw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} /> 重新生成
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={JSON.stringify(analysis.variations)}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {analysis.variations.map((v, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">
                              {i + 1}
                            </span>
                            <span className="text-sm font-bold text-gray-900">练习题</span>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap">{v.question}</p>
                          <details className="mt-2">
                            <summary className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">查看解析与答案</summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs space-y-2">
                              <p className="font-bold">答案：{v.answer}</p>
                              <p className="text-gray-600 leading-relaxed"><span className="text-amber-600 font-bold">易错点：</span>{v.explanation}</p>
                            </div>
                          </details>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Action Footer */}
                <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm p-4 -mx-4 rounded-t-3xl border-t">
                  <button 
                    onClick={handleSave}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all transform active:scale-95"
                  >
                    <Save className="w-5 h-5" /> 保存到错题本
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
