'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Info, Lightbulb } from 'lucide-react'

export default function Flashcard({ data }: { data: any }) {
  const [isFlipped, setIsFlipped] = useState(false)

  const playAudio = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    window.speechSynthesis.speak(utterance)
  }

  // Hàm xác định màu sắc theo loại từ
  const getTypeColor = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('verb')) return 'text-blue-600'
    if (t.includes('noun')) return 'text-red-600'
    return 'text-amber-600'
  }

  return (
    <div className="w-full max-w-2xl h-[550px] cursor-pointer perspective-1000">
      <motion.div
        className="relative w-full h-full preserve-3d transition-all duration-700"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* MẶT TRƯỚC */}
        <div className="absolute inset-0 bg-white rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center p-12 border border-slate-100 backface-hidden">
           <span className={`font-black uppercase tracking-widest mb-4 ${getTypeColor(data.type)}`}>
            {data.type}
          </span>
          <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tight">{data.word}</h2>
          <div className="flex items-center gap-3 text-slate-400 text-xl font-medium">
            {data.ipa}
            <button onClick={(e) => { e.stopPropagation(); playAudio(data.word) }} className="p-2 bg-slate-50 text-blue-600 rounded-full hover:bg-blue-100">
              <Volume2 size={24} />
            </button>
          </div>
        </div>

        {/* MẶT SAU: Cấu trúc chuyên sâu đúng Ideas đã chốt */}
        <div className="absolute inset-0 bg-slate-50 rounded-[2.5rem] p-8 overflow-y-auto border border-slate-200 shadow-xl rotate-y-180 backface-hidden">
          <div className="space-y-5">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{data.word} <span className="text-sm font-medium text-slate-400">{data.ipa}</span></h3>
                <p className="text-lg font-bold text-slate-700">Nghĩa: {data.definition}</p>
              </div>
            </div>

            <section>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Word Family</h4>
              <div className="flex flex-wrap gap-2">
                {data.wordFamily.map((wf: any, i: number) => (
                  <span key={i} className="px-3 py-1 bg-white border rounded-xl text-sm font-bold shadow-sm">
                    <span className="text-red-600">{wf.form}</span> ({wf.type})
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Word Patterns</h4>
              <p className="font-mono text-blue-700 font-black bg-blue-50 p-2 rounded-lg">{data.patterns}</p>
            </section>

            <section className="bg-yellow-100 p-4 rounded-2xl border border-yellow-200">
              <h4 className="text-xs font-black text-yellow-800 uppercase tracking-widest mb-2">Collocations</h4>
              <ul className="space-y-1">
                {data.collocations.map((col: string, i: number) => (
                  <li key={i} className="text-sm font-black text-slate-800 italic">★ {col}</li>
                ))}
              </ul>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <section>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Synonyms</h4>
                <p className="text-sm font-bold text-slate-600">{data.synonyms?.join(', ')}</p>
              </section>
              <section>
                 <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Topic</h4>
                 <p className="text-sm font-bold text-blue-500">{data.topic}</p>
              </section>
            </div>

            <section className="bg-white p-4 rounded-2xl border-l-4 border-blue-500 shadow-sm">
              <h4 className="text-xs font-black text-slate-400 uppercase mb-2">Examples</h4>
              <ul className="space-y-2">
                {data.examples.map((ex: string, i: number) => (
                  <li key={i} className="text-sm italic text-slate-700 font-medium">"{ex}"</li>
                ))}
              </ul>
            </section>

            <div className="flex gap-2 bg-blue-600 text-white p-4 rounded-2xl text-xs font-bold leading-relaxed">
              <Info size={24} className="shrink-0" />
              <p>Note: {data.note}</p>
            </div>
            
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 p-3 rounded-xl">
              <Lightbulb size={16} />
              <span>🚀 Mẹo: Dùng màu xanh cho Động từ, đỏ cho Danh từ, vàng cho Collocations.</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}