import { useState } from 'react';
import MistakeRecognition from './components/MistakeRecognition';
import MistakeBook from './components/MistakeBook';
import { Toaster } from 'react-hot-toast';
import { BookOpen, Camera, Github, Settings, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'recognition' | 'book';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('recognition');

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">AI 错题打印机</h1>
          </div>
          <div className="flex items-center gap-4 text-gray-400">
            <button className="hover:text-gray-600 transition-colors"><HelpCircle className="w-5 h-5" /></button>
            <button className="hover:text-gray-600 transition-colors"><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {/* Hero Section (Only on Recognition Tab) */}
      <AnimatePresence mode="wait">
        {activeTab === 'recognition' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-600 text-white py-12 px-4 mb-8"
          >
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">掌握每一道错题</h2>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto font-medium">
                拍照即可识别错题，智能生成变式练习，帮建立专属的知识盲点库。
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="container mx-auto px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'recognition' ? (
            <motion.div
              key="recognition"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <MistakeRecognition />
            </motion.div>
          ) : (
            <motion.div
              key="book"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="max-w-5xl mx-auto mb-6 px-4">
                <h2 className="text-2xl font-bold text-gray-900">我的错题本</h2>
                <p className="text-gray-500">记录你的点滴进步</p>
              </div>
              <MistakeBook />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-around md:max-w-md md:mx-auto md:mb-6 md:rounded-full md:shadow-2xl md:border-none">
        <button 
          onClick={() => setActiveTab('recognition')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'recognition' ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Camera className={`w-6 h-6 ${activeTab === 'recognition' ? 'fill-blue-50' : ''}`} />
          <span className="text-[10px] font-bold">错题识别</span>
        </button>
        
        <div className="w-px h-8 bg-gray-100" />
        
        <button 
          onClick={() => setActiveTab('book')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'book' ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <BookOpen className={`w-6 h-6 ${activeTab === 'book' ? 'fill-blue-50' : ''}`} />
          <span className="text-[10px] font-bold">错题本</span>
        </button>
      </nav>

      <footer className="mt-20 text-center text-gray-300 text-xs pb-32">
        <div className="flex items-center justify-center gap-4 mb-2">
          <span className="hover:text-gray-400 transition-colors">隐私权政策</span>
          <span className="hover:text-gray-400 transition-colors">服务条款</span>
          <span className="hover:text-gray-400 transition-colors">关于我们</span>
        </div>
        <p>&copy; 2026 AI Mistake Printer. All rights reserved.</p>
      </footer>
    </div>
  );
}
