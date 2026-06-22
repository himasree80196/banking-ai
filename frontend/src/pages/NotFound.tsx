import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-extrabold text-primary-600 dark:text-primary-400">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">Page not found</h2>
        <p className="text-gray-500 mt-2 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate(-1)} className="btn-secondary flex items-center gap-2"><ArrowLeft size={16} />Go Back</button>
          <button onClick={() => navigate('/')} className="btn-primary flex items-center gap-2"><Home size={16} />Home</button>
        </div>
      </div>
    </div>
  )
}
