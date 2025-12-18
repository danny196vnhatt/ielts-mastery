'use client'
import { useState, useEffect, useRef } from 'react'
import { 
  LayoutGrid, BookOpen, Flame, ChevronLeft, ChevronRight, 
  Trophy, Lightbulb, CheckCircle2, ArrowRight, Plus, X, Save, Edit2, Trash2, FolderPlus, LogOut
} from 'lucide-react'
import Flashcard from '@/components/Flashcard' 
import { createBrowserClient } from '@supabase/ssr' 
import { useRouter } from 'next/navigation'

// --- KIỂU DỮ LIỆU ---
interface Vocabulary {
  id: string;
  user_id: string;
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
  user_id: string;
  label: string;
  topics: string[];
  color: string;
}

export default function IpadDashboard() {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // --- 1. STATE MANAGEMENT ---
  const [user, setUser] = useState<any>(null)
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const [showMotivation, setShowMotivation] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'learning'>('grid') 
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [showDeleteFolderId, setShowDeleteFolderId] = useState<string | null>(null)
  const [showDeleteWordId, setShowDeleteWordId] = useState<string | null>(null)

  const [vocabList, setVocabList] = useState<Vocabulary[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [activeFolderId, setActiveFolderId] = useState('')
  
  // State cho Streak thực tế
  const [streak, setStreak] = useState(0)
  const [dailyCount, setDailyCount] = useState(0)

  const [formData, setFormData] = useState({
    word: '', ipa: '', type: 'Verb', definition: '', wordFamily: '', 
    patterns: '', synonyms: '', collocations: '', examples: '', note: '', topic: ''
  })
  const [folderFormData, setFolderFormData] = useState({ label: '', topics: '', color: 'bg-green-500' })

  // --- 2. LOGIC AUTH & DATA FETCHING ---
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      if (session) {
        setUser(session.user)
        fetchCloudData(session.user.id)
        fetchStreakData(session.user.id)
      } else {
        router.replace('/login')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchCloudData = async (userId: string) => {
    const { data: vData } = await supabase.from('vocabularies').select('*').eq('user_id', userId)
    const { data: fData } = await supabase.from('folders').select('*').eq('user_id', userId)
    
    if (vData) setVocabList(vData as Vocabulary[])
    if (fData && fData.length > 0) {
      setFolders(fData as Folder[])
      if (!activeFolderId) setActiveFolderId(fData[0].id)
    }
  }

  const fetchStreakData = async (userId: string) => {
    const { data } = await supabase.from('user_stats').select('*').eq('user_id', userId).single();
    if (data) {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = data.last_study_date;

      if (lastDate !== today) {
        setDailyCount(0);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastDate && lastDate < yesterdayStr) {
          await supabase.from('user_stats').update({ streak_count: 0, daily_review_count: 0 }).eq('user_id', userId);
          setStreak(0);
        } else {
          setStreak(data.streak_count);
        }
      } else {
        setStreak(data.streak_count);
        setDailyCount(data.daily_review_count);
      }
    } else {
      await supabase.from('user_stats').insert([{ user_id: userId, streak_count: 0, daily_review_count: 0 }]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // --- 3. QUẢN LÝ DỮ LIỆU ---
  const handleSaveFolder = async () => {
    if (!folderFormData.label.trim() || !user) return
    const newFolder = {
      user_id: user.id,
      label: folderFormData.label,
      topics: folderFormData.topics.split(',').map(t => t.trim()).filter(t => t !== ""),
      color: folderFormData.color
    }
    const { error } = await supabase.from('folders').insert([newFolder])
    if (!error) {
      fetchCloudData(user.id)
      setIsFolderModalOpen(false)
      setFolderFormData({ label: '', topics: '', color: 'bg-green-500' })
    }
  }

  const handleSaveWord = async () => {
    if (!user) return
    const currentStatus = editingId 
      ? (vocabList.find(v => v.id === editingId)?.status || 'new') 
      : 'new';
    
    const formattedWord = {
      user_id: user.id,
      word: formData.word,
      ipa: formData.ipa,
      type: formData.type,
      definition: formData.definition,
      patterns: formData.patterns,
      note: formData.note,
      topic: formData.topic || (folders.find(f => f.id === activeFolderId)?.topics[0] || 'General'),
      status: currentStatus,
      wordFamily: formData.wordFamily.split(',').map(f => {
        const parts = f.trim().split('(');
        return { form: parts[0].trim(), type: parts[1] ? parts[1].replace(')', '') : 'n' };
      }),
      synonyms: formData.synonyms.split(',').map(s => s.trim()),
      collocations: formData.collocations.split('\n').filter(l => l.trim() !== ""),
      examples: formData.examples.split('\n').filter(l => l.trim() !== ""),
    }

    const { error } = editingId 
      ? await supabase.from('vocabularies').update(formattedWord).eq('id', editingId)
      : await supabase.from('vocabularies').insert([formattedWord])

    if (!error) {
      fetchCloudData(user.id)
      setIsModalOpen(false)
      setEditingId(null)
      setFormData({ word: '', ipa: '', type: 'Verb', definition: '', wordFamily: '', patterns: '', synonyms: '', collocations: '', examples: '', note: '', topic: '' })
    }
  }

  const deleteFolder = async (id: string) => {
    if (folders.length <= 1) return
    await supabase.from('folders').delete().eq('id', id)
    fetchCloudData(user?.id)
    setShowDeleteFolderId(null)
  }

  const deleteWord = async (id: string) => {
    await supabase.from('vocabularies').delete().eq('id', id)
    fetchCloudData(user?.id)
    setShowDeleteWordId(null)
  }

  const markAsMastered = async (id: string) => {
    if (!user) return
    const { error } = await supabase.from('vocabularies').update({ status: 'mastered' }).eq('id', id)
    
    if (!error) {
      const newDailyCount = dailyCount + 1;
      setDailyCount(newDailyCount);
      const today = new Date().toISOString().split('T')[0];
      let newStreak = streak;

      if (newDailyCount === 3) {
        newStreak = streak + 1;
        setStreak(newStreak);
      }

      await supabase.from('user_stats').upsert({
        user_id: user.id,
        streak_count: newStreak,
        daily_review_count: newDailyCount,
        last_study_date: today
      });

      fetchCloudData(user.id)
      if (learningQueue.length <= 1) setViewMode('grid')
    }
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

  // --- 4. UI LOGIC ---
  const handleTouchStart = (id: string, type: 'folder' | 'word') => {
    timerRef.current = setTimeout(() => {
      if (type === 'folder') setShowDeleteFolderId(id);
      else setShowDeleteWordId(id);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const activeFolder = folders.find(f => f.id === activeFolderId) || folders[0]
  const filteredVocab = vocabList.filter(v => activeFolder?.topics.includes(v.topic))
  const learningQueue = filteredVocab.filter(v => v.status !== 'mastered')

  if (!user) return <div className="h-screen bg-[#F8F9FA]" />; 

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-slate-900 overflow-hidden font-sans select-none">
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-100 flex flex-col overflow-hidden shadow-sm`}>
        <div className="p-6 font-black text-2xl text-blue-600 italic tracking-tighter">IELTS MASTER</div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <NavItem icon={<LayoutGrid size={20}/>} label="Tổng quan" active={viewMode === 'grid'} onClick={() => setViewMode('grid')} />
          <div className="mt-8 mb-2 px-3 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Folders</span>
            <button onClick={() => setIsFolderModalOpen(true)} className="p-1 hover:bg-blue-50 text-blue-600 rounded-md"><FolderPlus size={16}/></button>
          </div>
          {folders.map(folder => (
            <div key={folder.id} className="relative group" onMouseDown={() => handleTouchStart(folder.id, 'folder')} onMouseUp={() => clearTimeout(timerRef.current!)} onTouchStart={() => handleTouchStart(folder.id, 'folder')} onTouchEnd={() => clearTimeout(timerRef.current!)}>
              <FolderItem label={folder.label} count={vocabList.filter(v => folder.topics.includes(v.topic)).length} color={folder.color} active={activeFolderId === folder.id} onClick={() => { if(!showDeleteFolderId) {setActiveFolderId(folder.id); setViewMode('grid'); }}} />
              {showDeleteFolderId === folder.id && (
                <button onClick={(e: any) => { e.stopPropagation(); deleteFolder(folder.id); }} className="absolute right-0 inset-y-0 w-12 bg-red-500 text-white flex items-center justify-center rounded-xl animate-in slide-in-from-right-full"><Trash2 size={16}/></button>
              )}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t space-y-2">
          <button onClick={() => {setEditingId(null); setIsModalOpen(true)}} className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:bg-blue-700 active:scale-95 transition-all"><Plus size={20}/> THÊM TỪ MỚI</button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-slate-400 font-bold hover:text-red-500 transition-all"><LogOut size={18}/> Đăng xuất</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative bg-[#F2F4F7]">
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute top-6 left-4 z-50 p-2 bg-white shadow-sm rounded-xl border border-gray-100 hover:bg-slate-50 transition-colors">{isSidebarOpen ? <ChevronLeft size={20}/> : <ChevronRight size={20}/>}</button>

        {viewMode === 'grid' ? (
          <div className="p-8 pt-16 overflow-y-auto">
            <h1 className="text-4xl font-black mb-8 tracking-tight text-slate-800">{activeFolder?.label}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {activeFolder?.topics.map(topic => (
                <TopicCard key={topic} title={topic} progress={vocabList.filter(v => v.topic === topic && v.status === 'mastered').length} total={vocabList.filter(v => v.topic === topic).length || 0} onStudy={() => setViewMode('learning')} />
              ))}
            </div>

            {/* Daily Streak Progress */}
            <div className="mb-12 p-8 bg-white rounded-[3rem] border border-white shadow-sm flex items-center justify-between">
               <div>
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Mục tiêu hằng ngày</h3>
                  <p className="text-2xl font-black text-slate-800">{dailyCount >= 3 ? 'Đã hoàn thành! 🔥' : `Ôn thêm ${3-dailyCount} từ để giữ Streak`}</p>
               </div>
               <div className="flex gap-3">
                  {[1,2,3].map(i => (
                    <div key={i} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${dailyCount >= i ? 'bg-orange-500 text-white shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-300'}`}>
                      <CheckCircle2 size={24} />
                    </div>
                  ))}
               </div>
            </div>
            
            <h2 className="mb-6 text-sm font-black flex items-center gap-2 text-slate-400 uppercase tracking-widest"><BookOpen size={16}/> Quản lý kho từ</h2>
            <div className="space-y-3">
              {filteredVocab.map(word => (
                <div key={word.id} className="relative overflow-hidden rounded-2xl shadow-sm" onMouseDown={() => handleTouchStart(word.id, 'word')} onMouseUp={() => clearTimeout(timerRef.current!)} onTouchStart={() => handleTouchStart(word.id, 'word')} onTouchEnd={() => clearTimeout(timerRef.current!)}>
                  <div className="bg-white p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="font-black text-lg text-slate-700">{word.word}</span>
                      <span className="ml-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{word.type}</span>
                    </div>
                    <button onClick={() => openEditModal(word)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={18}/></button>
                  </div>
                  {showDeleteWordId === word.id && (
                    <button onClick={(e: any) => { e.stopPropagation(); deleteWord(word.id); }} className="absolute right-0 inset-y-0 w-16 bg-red-500 text-white font-black flex items-center justify-center animate-in slide-in-from-right-full uppercase text-xs">Xóa</button>
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

      {/* MOTIVATION BAR */}
      <aside className={`${showMotivation ? 'w-80' : 'w-0'} transition-all duration-300 bg-white border-l border-gray-100 p-6 overflow-hidden flex flex-col`}>
        <div className="bg-gradient-to-br from-orange-400 to-red-500 p-8 rounded-[3rem] text-white shadow-xl shadow-orange-100">
          <div className="flex justify-between items-start mb-2"><Flame size={40} fill="white" /><span className="text-5xl font-black">{streak}</span></div>
          <p className="font-bold uppercase text-[10px] tracking-widest text-white/80">Streak thực tế</p>
        </div>
        <div className="mt-6 p-8 bg-indigo-50 rounded-[3rem] border border-indigo-100/50">
          <Lightbulb className="text-indigo-600 mb-3" size={24} />
          <p className="text-indigo-900 font-bold italic text-sm">Học đủ 3 từ mỗi ngày để duy trì ngọn lửa!</p>
        </div>
      </aside>

      {/* MODALS SECTION */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsFolderModalOpen(false)}>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl space-y-6 animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-black italic text-slate-800">Tạo Folder Mới</h2>
            <div className="space-y-4">
              <Input label="Tên Folder" value={folderFormData.label} onChange={(v:any) => setFolderFormData({...folderFormData, label: v})} placeholder="VD: Writing Task 1" />
              <Input label="Topics nhỏ (cách nhau dấu phẩy)" value={folderFormData.topics} onChange={(v:any) => setFolderFormData({...folderFormData, topics: v})} placeholder="Map, Process, Chart" />
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
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 duration-300" onClick={e => e.stopPropagation()}>
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
                <Input label="Patterns" value={formData.patterns} onChange={(v:any) => setFormData({...formData, patterns: v})} />
                <Select label="Topic" options={activeFolder?.topics || []} value={formData.topic} onChange={(v:any) => setFormData({...formData, topic: v})} />
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
              <button onClick={handleSaveWord} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-blue-700">
                <Save size={20}/> {editingId ? 'CẬP NHẬT' : 'LƯU VÀO KHO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// --- SUB-COMPONENTS (GIỮ NGUYÊN CSS) ---
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