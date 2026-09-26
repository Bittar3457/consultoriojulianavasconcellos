import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { estaAutenticado, carregando } = useAuth()
  const location = useLocation()

  if (carregando) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F7F8F6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-xl shadow-md">
            JV
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-[#8A9A83]" />
          <p className="text-sm text-[#4A4A48]">Carregando consultório...</p>
        </div>
      </div>
    )
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
