'use client'
import { useState, useEffect, useRef } from 'react'
import { 
  LayoutGrid, BookOpen, Flame, ChevronLeft, ChevronRight, 
  Target, Trophy, Lightbulb, CheckCircle2, ArrowRight, Plus, X, Save, Edit2, Trash2, FolderPlus
} from 'lucide-react'
import Flashcard from '@/components/Flashcard' 
import { vocabularyData as initialData } from '@/data/vocabulary'

// --- KIỂU DỮ LIỆU CHUẨN ĐỂ KHÔNG LỖI BẤT CỨ ĐÂU ---
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
  const [viewMode, setViewMode] = useState<'grid' | 'learning'>('grid'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [showDeleteFolderId, setShowDeleteFolderId] = useState<string | null>(null);
  const [showDeleteWordId, setShowDeleteWordId] = useState<string | null>(null);

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
      wordFamily: word.wordFamily.map((wf) => `${wf.form} (${wf.type})`).join(', '),
      synonyms: word.synonyms.join(', '),
      collocations: word.collocations.join('\n'),
      examples: word.examples.join('\n'),
    });
    setIsModalOpen(true);
  };

  const handleSaveWord = () => {
    const currentStatus = editingId ? (vocabList.find(v => v.id === editingId)?.status || 'new') : 'new';
    
    const formattedWord: Vocabulary = {
      ...formData,
      id: editingId || `custom-${Date.now()}`,
      status: currentStatus as any, 
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

    setVocabList(newList);
    localStorage.setItem('ielts-progress', JSON.stringify(newList));
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ word: '', ipa: '', type: 'Verb', definition: '', wordFamily: '', patterns: '', synonyms: '', collocations: '', examples: '', note: '', topic: activeFolder.topics[0] || 'Education' });
  };

  const deleteWord = (id: string) => {
    const newList = vocabList.filter(v => v.id !== id);
    setVocabList(newList);
    localStorage.setItem('ielts-progress', JSON.stringify(newList));
  };

  const markAsMastered = (id: string) => {
    const newList = vocabList.map(v => v.id === id ? { ...v, status: 'mastered' as const } : v);
    setVocabList(newList);
    localStorage.setItem('ielts-progress', JSON.stringify(newList));
    if (learningQueue.length <= 1) setViewMode('grid');
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-slate-900 overflow-hidden font-sans select-none">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-100 flex flex-col overflow-hidden shadow-sm`}>
        <div className="p-6 font-black text-2xl text-blue-600 italic tracking-tighter">IELTS MASTER</div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem icon={<LayoutGrid size={20}/>} label="Tổng quan" active={viewMode === 'grid'} onClick={() => setViewMode('grid')} />
          <div className="mt-8 mb-2 px-3 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Folders</span>
            <button onClick={() => setIsFolderModalOpen(true)} className="p-1 hover:bg-blue-50 text-blue-600 rounded-md transition-colors"><FolderPlus size={16}/></button>
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
        <div className="p-4 border-t">
          <button onClick={() => {setEditingId(null); setIsModalOpen(true);}} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 transition-all active:scale-95"><Plus size={20}/> THÊM TỪ MỚI</button>
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col relative bg-[#F2F4F7]">
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute top-6 left-4 z-50 p-2 bg-white shadow-sm rounded-xl border border-gray-100 hover:bg-slate-50 transition-colors">{isSidebarOpen ? <ChevronLeft size={20}/> : <ChevronRight size={20}/>}</button>

        {viewMode === 'grid' ? (
          <div className="p-8 pt-16 overflow-y-auto">
            <h1 className="text-4xl font-black mb-8 tracking-tight text-slate-800">{activeFolder.label}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {activeFolder.topics.map(topic => (
                <TopicCard 
                  key={topic} 
                  title={topic} 
                  progress={vocabList.filter(v => v.topic === topic && v.status === 'mastered').length} 
                  total={vocabList.filter(v => v.topic === topic).length || 0} 
                  onStudy={() => setViewMode('learning')} 
                />
              ))}
            </div>
            
            <h2 className="mb-6 text-sm font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest"><BookOpen size={16}/> Quản lý kho từ vựng</h2>
            <div className="space-y-3">
              {filteredVocab.map(word => (
                <div key={word.id} className="relative overflow-hidden rounded-2xl shadow-sm" onMouseDown={() => handleTouchStart(word.id, 'word')} onMouseUp={handleTouchEnd} onTouchStart={() => handleTouchStart(word.id, 'word')} onTouchEnd={handleTouchEnd}>
                  <div className="bg-white p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="font-black text-lg text-slate-700">{word.word}</span>
                      <span className="ml-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{word.type}</span>
                    </div>
                    <button onClick={() => openEditModal(word)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={18}/></button>
                  </div>
                  {showDeleteWordId === word.id && (
                    <button onClick={(e) => { e.stopPropagation(); deleteWord(word.id); }} className="absolute right-0 inset-y-0 w-16 bg-red-500 text-white font-black flex items-center justify-center animate-in slide-in-from-right-full">XÓA</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
            <button onClick={() => setViewMode('grid')} className="mb-6 font-bold text-blue-600 flex items-center gap-2 hover:underline"><ChevronLeft size={20}/> Dashboard</button>
            {learningQueue.length > 0 ? (
              <div className="w-full flex flex-col items-center max-w-2xl">
                <Flashcard data={learningQueue[0]} />
                <div className="flex gap-4 mt-10 w-full">
                  <button onClick={() => markAsMastered(learningQueue[0].id)} className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"><CheckCircle2 size={24}/> ĐÃ THUỘC</button>
                  <button onClick={() => {
                    const first = learningQueue.shift();
                    if(first) setVocabList([...vocabList]);
                  }} className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black flex items-center gap-3 active:scale-95 transition-transform">TIẾP THEO <ArrowRight size={24}/></button>
                </div>
              </div>
            ) : (
              <div className="text-center bg-white p-16 rounded-[4rem] shadow-xl border border-white">
                <Trophy size={100} className="text-yellow-400 mx-auto mb-6" />
                <h2 className="text-3xl font-black text-slate-800">Tuyệt vời!</h2>
                <button onClick={() => setViewMode('grid')} className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-full font-black">QUAY LẠI</button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODALS */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-6 animate-in zoom-in duration-200">
            <h2 className="text-2xl font-black italic text-slate-800">Tạo Folder Mới</h2>
            <div className="space-y-4">
              <Input label="Tên Folder" value={folderFormData.label} onChange={(v:any) => setFolderFormData({...folderFormData, label: v})} placeholder="VD: Writing Task 1" />
              <Input label="Topics nhỏ (cách nhau dấu phẩy)" value={folderFormData.topics} onChange={(v:any) => setFolderFormData({...folderFormData, topics: v})} placeholder="Traveling, Education, Music" />
              <Select label="Màu sắc" options={['bg-orange-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500']} value={folderFormData.color} onChange={(v:any) => setFolderFormData({...folderFormData, color: v})} />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsFolderModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Hủy</button>
              <button onClick={handleSaveFolder} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">TẠO NGAY</button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black italic text-slate-800">{editingId ? 'Chỉnh sửa từ vựng' : 'Thêm từ mới chuyên sâu'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X/></button>
            </div>
            <div className="p-8 overflow-y-auto space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-6">
                <Input label="Từ gốc" value={formData.word} onChange={(v:any) => setFormData({...formData, word: v})} />
                <Input label="Phiên âm" value={formData.ipa} onChange={(v:any) => setFormData({...formData, ipa: v})} />
              </div>
              <div className="grid grid-cols-3 gap-6">
                <Select label="Loại từ" options={['Verb', 'Noun', 'Adjective', 'Adverb']} value={formData.type} onChange={(v:any) => setFormData({...formData, type: v})} />
                <Input label="Patterns" value={formData.patterns} onChange={(v:any) => setFormData({...formData, patterns: v})} placeholder="TO something" />
                <Select label="Topic" options={activeFolder.topics} value={formData.topic} onChange={(v:any) => setFormData({...formData, topic: v})} />
              </div>
              <Input label="Định nghĩa (VN)" value={formData.definition} onChange={(v:any) => setFormData({...formData, definition: v})} />
              <Input label="Word Family" value={formData.wordFamily} onChange={(v:any) => setFormData({...formData, wordFamily: v})} placeholder="Contribution (n), Contributor (n)" />
              <Input label="Synonyms" value={formData.synonyms} onChange={(v:any) => setFormData({...formData, synonyms: v})} />
              <Textarea label="Collocations (màu vàng)" value={formData.collocations} onChange={(v:any) => setFormData({...formData, collocations: v})} />
              <Textarea label="Ví dụ thực tế" value={formData.examples} onChange={(v:any) => setFormData({...formData, examples: v})} />
              <Input label="Ghi chú (Note)" value={formData.note} onChange={(v:any) => setFormData({...formData, note: v})} />
            </div>
            <div className="p-8 bg-slate-50/50 border-t flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-bold text-slate-400">Hủy</button>
              <button onClick={handleSaveWord} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all">
                <Save size={20}/> {editingId ? 'CẬP NHẬT' : 'LƯU VÀO KHO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOTIVATION BAR */}
      <aside className={`${showMotivation ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-l border-gray-100 p-6 overflow-hidden flex flex-col`}>
        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-8 rounded-[3rem] text-white shadow-xl shadow-orange-100">
          <div className="flex justify-between items-start mb-2"><Flame size={40} fill="white" /><span className="text-5xl font-black">{streak}</span></div>
          <p className="font-bold uppercase text-[10px] tracking-widest text-white/80">Streak liên tục</p>
        </div>
        <div className="mt-6 p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100/50">
          <Lightbulb className="text-indigo-600 mb-3" size={24} />
          <p className="text-indigo-900 font-bold italic text-sm">"The only way to learn a language is to speak it."</p>
        </div>
      </aside>
    </div>
  )
}

// --- COMPONENTS PHỤ ---
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-slate-50 text-slate-500'}`}>
      {icon} <span className="font-black text-sm">{label}</span>
    </div>
  )
}

function FolderItem({ label, count, color, active, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${active ? 'bg-slate-50 ring-1 ring-slate-100 text-blue-600 shadow-sm' : 'text-slate-700 hover:bg-slate-50/50'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${color}`}></div>
        <span className="font-black text-sm tracking-tight">{label}</span>
      </div>
      <span className="bg-white shadow-sm px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-400">{count}</span>
    </div>
  )
}

function TopicCard({ title, progress, total, onStudy }: any) {
  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;
  return (
    <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <h3 className="text-xs font-black mb-6 italic uppercase tracking-[0.2em] text-slate-300">{title}</h3>
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="flex justify-between mb-8 px-1">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{progress}/{total} words</span>
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{percent}%</span>
      </div>
      <button onClick={onStudy} className="w-full py-4 bg-slate-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-[2rem] font-black transition-all active:scale-95 uppercase text-[10px] tracking-widest">Học ngay</button>
    </div>
  )
}

function Input({ label, value, onChange, placeholder }: any) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.15em]">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none ring-blue-500/20 focus:ring-4 focus:bg-white transition-all placeholder:text-slate-300" />
    </div>
  )
}

function Select({ label, options, value, onChange }: any) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.15em]">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-700 outline-none ring-blue-500/20 focus:ring-4 focus:bg-white transition-all appearance-none">
        {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
}

function Textarea({ label, value, onChange, placeholder }: any) {
  return (
    <div className="w-full">
      <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-[0.15em]">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full p-5 bg-slate-50 rounded-[2rem] h-28 font-bold text-slate-700 outline-none ring-blue-500/20 focus:ring-4 focus:bg-white transition-all placeholder:text-slate-300 leading-relaxed" />
    </div>
  )
}