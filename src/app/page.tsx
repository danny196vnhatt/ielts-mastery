'use client'
import { useState, useEffect, useRef } from 'react'
import { 
  LayoutGrid, BookOpen, Flame, ChevronLeft, ChevronRight, 
  Target, Trophy, Lightbulb, CheckCircle2, ArrowRight, Plus, X, Save, Edit2, Trash2, FolderPlus
} from 'lucide-react'
import Flashcard from '@/components/Flashcard' 
import { vocabularyData as initialData } from '@/data/vocabulary'

// --- KHẮC PHỤC LỖI VERCEL: ĐỊNH NGHĨA KIỂU DỮ LIỆU CHUẨN ---
interface Vocabulary {
  id: string;
  word: string;
  ipa: string;
  type: string;
  definition: string;
  wordFamily: { form: string; type: string }[];
  patterns: string;
  synonyms: string[];
  collocations: string[];
  examples: string[];
  note: string;
  topic: string;
  status: 'new' | 'learning' | 'mastered';
}

interface Folder {
  id: string;
  label: string;
  topics: string[];
  color: string;
}

export default function IpadDashboard() {
  // --- 1. STATE MANAGEMENT ---
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showMotivation, setShowMotivation] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showDeleteFolderId, setShowDeleteFolderId] = useState<string | null>(null);
  const [showDeleteWordId, setShowDeleteWordId] = useState<string | null>(null);

  // Ép kiểu dữ liệu để tránh lỗi Type Error trên Vercel
  const [vocabList, setVocabList] = useState<Vocabulary[]>(initialData as Vocabulary[]);
  const [folders, setFolders] = useState<Folder[]>([
    { id: 'f1', label: 'Writing Task 2', topics: ['Environment', 'Education', 'Society', 'Health'], color: 'bg-orange-500' },
    { id: 'f2', label: 'Speaking Part 1', topics: ['Speaking', 'Traveling', 'Work'], color: 'bg-blue-500' }
  ]);
  const [activeFolderId, setActiveFolderId] = useState('f1');
  const [streak, setStreak] = useState(12);

  const [formData, setFormData] = useState({
    word: '', ipa: '', type: 'Verb', definition: '', wordFamily: '', 
    patterns: '', synonyms: '', collocations: '', examples: '', note: '', topic: 'Education'
  });

  const [folderFormData, setFolderFormData] = useState({ label: '', topics: '', color: 'bg-green-500' });

  // --- 2. LOGIC LONG PRESS (ẤN GIỮ ĐỂ XÓA) ---
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (id: string, type: 'folder' | 'word') => {
    timerRef.current = setTimeout(() => {
      if (type === 'folder') setShowDeleteFolderId(id);
      else setShowDeleteWordId(id);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  // --- 3. LOGIC HỆ THỐNG ---
  useEffect(() => {
    const savedVocab = localStorage.getItem('ielts-progress');
    const savedFolders = localStorage.getItem('ielts-folders');
    if (savedVocab) setVocabList(JSON.parse(savedVocab));
    if (savedFolders) setFolders(JSON.parse(savedFolders));

    const handleClickOutside = () => {
      setShowDeleteFolderId(null);
      setShowDeleteWordId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const activeFolder = folders.find(f => f.id === activeFolderId) || folders[0];
  const filteredVocab = vocabList.filter(v => activeFolder.topics.includes(v.topic));
  const learningQueue = filteredVocab.filter(v => v.status !== 'mastered');

  const handleSaveFolder = () => {
    if (!folderFormData.label.trim()) return alert("Vui lòng nhập tên Folder");
    const newFolder: Folder = {
      id: `f-${Date.now()}`,
      label: folderFormData.label,
      topics: folderFormData.topics.split(',').map(t => t.trim()).filter(t => t !== ""),
      color: folderFormData.color
    };
    const newFolders = [...folders, newFolder];
    setFolders(newFolders);
    localStorage.setItem('ielts-folders', JSON.stringify(newFolders));
    setIsFolderModalOpen(false);
    setFolderFormData({ label: '', topics: '', color: 'bg-green-500' });
  };

  const deleteFolder = (id: string) => {
    if (folders.length <= 1) return alert("Phải giữ ít nhất 1 thư mục");
    const newList = folders.filter(f => f.id !== id);
    setFolders(newList);
    localStorage.setItem('ielts-folders', JSON.stringify(newList));
    if (activeFolderId === id) setActiveFolderId(newList[0].id);
  };

  const openEditModal = (word: Vocabulary) => {
    setEditingId(word.id);
    setFormData({
      ...word,
      wordFamily: word.wordFamily.map((wf: any) => `${wf.form} (${wf.type})`).join(', '),
      synonyms: word.synonyms.join(', '),
      collocations: word.collocations.join('\n'),
      examples: word.examples.join('\n'),
    });
    setIsModalOpen(true);
  };

  // --- FIX LỖI 126 TRÊN VERCEL ---
  const handleSaveWord = () => {
    const wordStatus = editingId ? (vocabList.find(v => v.id === editingId)?.status || 'new') : 'new';
    
    const formattedWord: Vocabulary = {
      ...formData,
      id: editingId || `custom-${Date.now()}`,
      status: wordStatus, 
      wordFamily: formData.wordFamily.split(',').map(f => {
        const parts = f.trim().split('(');
        return { form: parts[0].trim(), type: parts[1] ? parts[1].replace(')', '') : 'n' };
      }),
      synonyms: formData.synonyms.split(',').map(s => s.trim()),
      collocations: formData.collocations.split('\n').filter(l => l.trim() !== ""),
      examples: formData.examples.split('\n').filter(l => l.trim() !== ""),
    };

    let newList: Vocabulary[];
    if (editingId) {
      newList = vocabList.map(v => v.id === editingId ? formattedWord : v);
    } else {
      newList = [...vocabList, formattedWord];
    }

    setVocabList(newList); // Dòng 126 đã hết lỗi nhờ ép kiểu Vocabulary[]
    localStorage.setItem('ielts-progress', JSON.stringify(newList));
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ word: '', ipa: '', type: 'Verb', definition: '', wordFamily: '', patterns: '', synonyms: '', collocations: '', examples: '', note: '', topic: 'Education' });
  };

  const deleteWord = (id: string) => {
    const newList = vocabList.filter(v => v.id !== id);
    setVocabList(newList);
    localStorage.setItem('ielts-progress', JSON.stringify(newList));
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-slate-900 overflow-hidden font-sans select-none">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-100 flex flex-col overflow-hidden`}>
        <div className="p-6 font-black text-2xl text-blue-600 italic">IELTS MASTER</div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem icon={<LayoutGrid size={20}/>} label="Tổng quan" active={viewMode === 'grid'} onClick={() => setViewMode('grid')} />
          <div className="mt-8 mb-2 px-3 flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Folders</span>
            <button onClick={() => setIsFolderModalOpen(true)} className="p-1 hover:bg-blue-50 text-blue-600 rounded-md"><FolderPlus size={16}/></button>
          </div>
          {folders.map(folder => (
            <div key={folder.id} className="relative group" onMouseDown={() => handleTouchStart(folder.id, 'folder')} onMouseUp={handleTouchEnd} onTouchStart={() => handleTouchStart(folder.id, 'folder')} onTouchEnd={handleTouchEnd}>
              <FolderItem label={folder.label} count={vocabList.filter(v => folder.topics.includes(v.topic)).length} color={folder.color} active={activeFolderId === folder.id} onClick={() => { if(!showDeleteFolderId) { setActiveFolderId(folder.id); setViewMode('grid'); }}} />
              {showDeleteFolderId === folder.id && (
                <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }} className="absolute right-0 inset-y-0 w-12 bg-red-500 text-white flex items-center justify-center rounded-xl animate-in slide-in-from-right-full"><Trash2 size={16}/></button>
              )}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t space-y-2">
          <button onClick={() => {setEditingId(null); setIsModalOpen(true);}} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700"><Plus size={20}/> THÊM TỪ MỚI</button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#F2F4F7]">
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute top-6 left-4 z-50 p-2 bg-white shadow-sm rounded-xl border border-gray-100">{isSidebarOpen ? <ChevronLeft size={20}/> : <ChevronRight size={20}/>}</button>

        {viewMode === 'grid' ? (
          <div className="p-8 pt-16 overflow-y-auto">
            <h1 className="text-4xl font-black mb-8 tracking-tight">{activeFolder.label}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeFolder.topics.map(topic => (
                <TopicCard key={topic} title={topic} progress={vocabList.filter(v => v.topic === topic && v.status === 'mastered').length} total={vocabList.filter(v => v.topic === topic).length || 1} onStudy={() => setViewMode('learning')} />
              ))}
            </div>
            <h2 className="mt-12 mb-6 text-xl font-black flex items-center gap-2"><BookOpen size={20}/> Danh sách từ đã lưu</h2>
            <div className="space-y-3">
              {filteredVocab.map(word => (
                <div key={word.id} className="relative overflow-hidden rounded-2xl" onMouseDown={() => handleTouchStart(word.id, 'word')} onMouseUp={handleTouchEnd} onTouchStart={() => handleTouchStart(word.id, 'word')} onTouchEnd={handleTouchEnd}>
                  <div className="bg-white p-4 flex justify-between items-center shadow-sm">
                    <div><span className="font-black text-lg">{word.word}</span><span className="ml-3 text-xs font-bold text-slate-400 uppercase">{word.type}</span></div>
                    <button onClick={() => openEditModal(word)} className="p-2 text-blue-600 hover:bg-slate-50 rounded-xl"><Edit2 size={18}/></button>
                  </div>
                  {showDeleteWordId === word.id && (
                    <button onClick={(e) => { e.stopPropagation(); deleteWord(word.id); }} className="absolute right-0 inset-y-0 w-16 bg-red-500 text-white font-black flex items-center justify-center animate-in slide-in-from-right-full">XÓA</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <button onClick={() => setViewMode('grid')} className="mb-6 font-bold text-blue-600 flex items-center gap-2"><ChevronLeft size={20}/> Dashboard</button>
            {learningQueue.length > 0 ? (
              <>
                <Flashcard data={learningQueue[0]} />
                <div className="flex gap-4 mt-10">
                  <button onClick={() => {
                    const newList = vocabList.map(v => v.id === learningQueue[0].id ? {...v, status: 'mastered'} : v);
                    setVocabList(newList as Vocabulary[]);
                    localStorage.setItem('ielts-progress', JSON.stringify(newList));
                    if(learningQueue.length <=1) setViewMode('grid');
                  }} className="px-8 py-4 bg-green-500 text-white rounded-2xl font-black shadow-lg flex items-center gap-3 active:scale-95 transition-transform"><CheckCircle2 size={24}/> ĐÃ THUỘC</button>
                  <button onClick={() => {
                    const first = learningQueue.shift();
                    if(first) learningQueue.push(first);
                    setVocabList([...vocabList]);
                  }} className="px-8 py-4 bg-white text-slate-600 border rounded-2xl font-black flex items-center gap-3 active:scale-95 transition-transform">TIẾP THEO <ArrowRight size={24}/></button>
                </div>
              </>
            ) : <div className="text-center bg-white p-12 rounded-[3rem] shadow-xl"><Trophy size={80} className="text-yellow-500 mx-auto mb-4"/><h2 className="text-2xl font-black">Xong rồi!</h2></div>}
          </div>
        )}
      </main>

      {/* MODALS */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl space-y-4">
            <h2 className="text-2xl font-black mb-6 italic">Tạo Thư Mục Mới</h2>
            <Input label="Tên Folder" value={folderFormData.label} onChange={(v:any) => setFolderFormData({...folderFormData, label: v})} placeholder="Writing Task 1" />
            <Input label="Các Topics nhỏ (cách nhau bằng dấu phẩy)" value={folderFormData.topics} onChange={(v:any) => setFolderFormData({...folderFormData, topics: v})} placeholder="Traveling, Education, Music" />
            <Select label="Màu sắc" options={['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500']} value={folderFormData.color} onChange={(v:any) => setFolderFormData({...folderFormData, color: v})} />
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsFolderModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Hủy</button>
              <button onClick={handleSaveFolder} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">TẠO NGAY</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black italic">{editingId ? 'Chỉnh sửa từ vựng' : 'Thêm từ mới chuyên sâu'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X/></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Từ gốc" value={formData.word} onChange={(v:any) => setFormData({...formData, word: v})} />
                <Input label="Phiên âm" value={formData.ipa} onChange={(v:any) => setFormData({...formData, ipa: v})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Select label="Loại từ" options={['Verb', 'Noun', 'Adjective', 'Adverb']} value={formData.type} onChange={(v:any) => setFormData({...formData, type: v})} />
                <Input label="Patterns" value={formData.patterns} onChange={(v:any) => setFormData({...formData, patterns: v})} />
                <Select label="Topic" options={activeFolder.topics} value={formData.topic} onChange={(v:any) => setFormData({...formData, topic: v})} />
              </div>
              <Input label="Định nghĩa" value={formData.definition} onChange={(v:any) => setFormData({...formData, definition: v})} />
              <Input label="Word Family" value={formData.wordFamily} onChange={(v:any) => setFormData({...formData, wordFamily: v})} placeholder="Ví dụ: Contribution (n), Contributor (n)" />
              <Input label="Synonyms" value={formData.synonyms} onChange={(v:any) => setFormData({...formData, synonyms: v})} />
              <Textarea label="Collocations" value={formData.collocations} onChange={(v:any) => setFormData({...formData, collocations: v})} />
              <Textarea label="Ví dụ thực tế" value={formData.examples} onChange={(v:any) => setFormData({...formData, examples: v})} />
              <Input label="Ghi chú (Note)" value={formData.note} onChange={(v:any) => setFormData({...formData, note: v})} />
            </div>
            <div className="p-6 bg-slate-50 border-t flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Hủy</button>
              <button onClick={handleSaveWord} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2">
                <Save size={20}/> {editingId ? 'CẬP NHẬT' : 'LƯU VÀO KHO'}
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className={`${showMotivation ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-l border-gray-100 p-6 overflow-hidden`}>
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-[2.5rem] text-white shadow-xl">
            <div className="flex justify-between items-start mb-2"><Flame size={40} fill="white" /><span className="text-5xl font-black">{streak}</span></div>
            <p className="font-bold uppercase text-[10px] tracking-widest text-white/80">Streak liên tục</p>
          </div>
          <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100">
            <Lightbulb className="text-indigo-600 mb-2" size={24} />
            <p className="text-indigo-900 font-medium italic text-sm">"The only way to learn a language is to speak it."</p>
          </div>
        </div>
      </aside>
    </div>
  )
}

// --- SUB-COMPONENTS ---
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'}`}>
      {icon} <span className="font-black text-sm">{label}</span>
    </div>
  )
}

function FolderItem({ label, count, color, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-slate-50 ring-1 ring-slate-100 text-blue-600' : 'text-slate-700'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
        <span className="font-bold text-sm">{label}</span>
      </div>
      <span className="bg-white shadow-sm px-2.5 py-1 rounded-lg text-[10px] font-black">{count}</span>
    </div>
  )
}

function TopicCard({ title, progress, total, onStudy }: any) {
  const percent = Math.round((progress / total) * 100) || 0;
  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-white">
      <h3 className="text-xl font-black mb-6 italic uppercase tracking-widest text-slate-400">{title}</h3>
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="flex justify-between mb-8">
        <span className="text-[10px] font-black text-slate-400">{progress}/{total} TỪ</span>
        <span className="text-[10px] font-black text-blue-600">{percent}%</span>
      </div>
      <button onClick={onStudy} className="w-full py-3 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-xl font-bold transition-colors uppercase text-xs tracking-widest">Bắt đầu học</button>
    </div>
  )
}

function Input({ label, value, onChange, placeholder }: any) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3 bg-slate-100 rounded-xl font-bold outline-none ring-blue-500 focus:ring-2" />
    </div>
  )
}

function Select({ label, options, value, onChange }: any) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-3 bg-slate-100 rounded-xl font-bold outline-none ring-blue-500 focus:ring-2">
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

function Textarea({ label, value, onChange }: any) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-widest">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl h-24 outline-none focus:ring-2 ring-blue-500 font-medium" />
    </div>
  )
}