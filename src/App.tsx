import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/common/Sidebar'
import { useState } from 'react'

// 导入你的页面组件
import Text2Img from './pages/Text2Img'
import Img2Img from './pages/Img2Img'
import MultiImg from './pages/MultiImg'
import Video from './pages/Video'
import History from './pages/History'
import Settings from './pages/Settings'
import Login from './pages/Login'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const token = localStorage.getItem('token')

  // 简单的路由保护
  if (!token && window.location.pathname !== '/login') {
    return <Navigate to="/login" />
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar 现在在 BrowserRouter 内部，可以使用 useLocation */}
      {token && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
      
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/text2img" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/text2img" element={<Text2Img />} />
          <Route path="/img2img" element={<Img2Img />} />
          <Route path="/multiimg" element={<MultiImg />} />
          <Route path="/video" element={<Video />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default App