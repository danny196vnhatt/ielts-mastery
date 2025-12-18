'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

// Ép kiểu dynamic để tránh lỗi build khi thiếu biến môi trường
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  // --- 1. QUẢN LÝ TRẠNG THÁI (CẦN THÊM) ---
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()

  // Khởi tạo Supabase Client
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // --- 2. LOGIC XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ ---
  const handleAuth = async () => {
    if (!email || !password) return alert('Vui lòng nhập đầy đủ thông tin!')
    
    setLoading(true)
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: `${location.origin}/auth/callback`,
            }
          })
        : await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        alert(error.message)
      } else {
        if (isSignUp) {
          alert('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận (nếu có).')
        }
        router.push('/')
        router.refresh() // Làm mới để middleware nhận diện session mới
      }
    } catch (err) {
      alert('Đã xảy ra lỗi không xác định!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white p-12 rounded-[3rem] shadow-2xl w-full max-w-md border border-slate-100">
        <h1 className="text-4xl font-black text-blue-600 mb-8 italic text-center uppercase tracking-tighter">
          IELTS MASTER
        </h1>
        
        <div className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 transition-all" 
            onChange={e => setEmail(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Mật khẩu" 
            value={password}
            className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 ring-blue-500/20 transition-all" 
            onChange={e => setPassword(e.target.value)} 
          />
          
          <button 
            onClick={handleAuth} 
            disabled={loading}
            className={`w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg transition-all active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {loading ? 'ĐANG XỬ LÝ...' : (isSignUp ? 'ĐĂNG KÝ TÀI KHOẢN' : 'ĐĂNG NHẬP NGAY')}
          </button>
          
          <p 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="text-center text-slate-400 font-bold cursor-pointer hover:text-blue-500 uppercase text-[10px] tracking-widest mt-4 transition-colors"
          >
            {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
          </p>
        </div>
      </div>
    </div>
  )
}