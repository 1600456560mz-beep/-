import { useState, useEffect } from 'react';
import { db, Mistake } from '../lib/db';
import { Trash2, Printer, ChevronRight, Calendar, Search, CheckSquare, Square, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePDF } from '../lib/print';

export default function MistakeBook() {
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [detailMistake, setDetailMistake] = useState<Mistake | null>(null);

  useEffect(() => {
    loadMistakes();
  }, []);

  const loadMistakes = async () => {
    const list = await db.getAllMistakes();
    setMistakes(list);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredMistakes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMistakes.map(m => m.id)));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定删除选中的 ${selectedIds.size} 项吗？`)) return;
    
    try {
      await db.deleteMistakes(Array.from(selectedIds));
      toast.success('删除成功');
      setSelectedIds(new Set());
      loadMistakes();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handlePrint = async () => {
    if (selectedIds.size === 0) return;
    setIsPrinting(true);
    const toPrint = mistakes.filter(m => selectedIds.has(m.id));
    try {
      await generatePDF(toPrint);
      toast.success('PDF 已生成');
    } catch (error) {
      console.error(error);
      toast.error('生成 PDF 失败');
    } finally {
      setIsPrinting(false);
    }
  };

  const filteredMistakes = mistakes.filter(m => 
    m.knowledgePoint.toLowerCase().includes(search.toLowerCase()) ||
    m.originalText.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="搜索知识点或题目..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              <button 
                onClick={handleDelete}
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1 font-bold"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-bold disabled:opacity-50"
              >
                {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
                打印所选 ({selectedIds.size})
              </button>
            </motion.div>
          )}
          <button 
            onClick={toggleAll}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium flex items-center gap-2"
          >
            {selectedIds.size === filteredMistakes.length && filteredMistakes.length > 0 ? <CheckSquare className="w-5 h-5 text-blue-500" /> : <Square className="w-5 h-5" />}
            全选
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredMistakes.map((mistake) => (
            <motion.div 
              layout
              key={mistake.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`group relative bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer ${
                selectedIds.has(mistake.id) ? 'border-blue-500 bg-blue-50/10' : 'border-transparent hover:border-gray-200'
              } shadow-sm`}
              onClick={() => toggleSelect(mistake.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg uppercase">
                  {mistake.knowledgePoint}
                </span>
                <div 
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    selectedIds.has(mistake.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                  }`}
                >
                  {selectedIds.has(mistake.id) && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              
              <p className="text-gray-800 text-sm line-clamp-3 mb-4 font-medium h-[4.5rem]">
                {mistake.originalText}
              </p>
              
              <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(mistake.createdAt).toLocaleDateString()}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDetailMistake(mistake);
                  }}
                  className="flex items-center gap-1 text-blue-500 hover:underline"
                >
                  查看详情 <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {mistakes.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <History className="text-gray-300 w-8 h-8" />
          </div>
          <h3 className="text-gray-500 font-medium">暂无错题记录</h3>
          <p className="text-gray-400 text-sm mt-1">去识别页添加你的第一份错题吧</p>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailMistake && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setDetailMistake(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{detailMistake.knowledgePoint}</h3>
                  <p className="text-xs text-gray-400 mt-1">{new Date(detailMistake.createdAt).toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => setDetailMistake(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-6">
                {detailMistake.originalImageUrl && (
                  <img src={detailMistake.originalImageUrl} alt="Original" className="w-full rounded-2xl border" />
                )}
                
                <section>
                  <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">原题内容</h4>
                  <div className="p-4 bg-gray-50 rounded-2xl text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                    {detailMistake.originalText}
                  </div>
                </section>

                <section className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-widest">举一反三练习</h4>
                  {detailMistake.variations.map((v, i) => (
                    <div key={i} className="p-4 border rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-amber-50 text-amber-600 rounded text-[10px] flex items-center justify-center font-bold">Q{i+1}</span>
                        <span className="text-sm font-bold">相似题</span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{v.question}</p>
                      <div className="p-3 bg-blue-50 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-blue-900">答案：{v.answer}</p>
                        <p className="text-blue-700 leading-relaxed"><span className="font-bold">解析：</span>{v.explanation}</p>
                      </div>
                    </div>
                  ))}
                </section>
              </div>

              <div className="p-6 border-t bg-gray-50/50 flex gap-3">
                <button 
                  onClick={() => {
                    generatePDF([detailMistake]);
                    toast.success('开始下载 PDF...');
                  }}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <Download className="w-5 h-5" /> 下载 PDF
                </button>
                <button 
                  onClick={() => setDetailMistake(null)}
                  className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition-colors"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => <Loader2Icon className={className} />;
import { Loader2 as Loader2Icon, History, Check } from 'lucide-react';
