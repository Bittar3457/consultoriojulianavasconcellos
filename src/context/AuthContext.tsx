import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import type { Usuario, PreferenciasUsuario } from '@/types'
import { obterPreferencias } from '@/services/preferencias'

interface AuthContextType {
  usuario: Usuario | null
  preferencias: PreferenciasUsuario | null
  estaAutenticado: boolean
  carregando: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  recarregarUsuario: () => Promise<void>
  recarregarPreferencias: () => Promise<void>
  obterAvatarUrl: () => string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    return (pb.authStore.record as unknown as Usuario) || null
  })
  const [preferencias, setPreferencias] = useState<PreferenciasUsuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  const recarregarPreferencias = useCallback(async () => {
    try {
      const prefs = await obterPreferencias()
      setPreferencias(prefs)
    } catch {
      // continua
    }
  }, [])

  const recarregarUsuario = useCallback(async () => {
    if (pb.authStore.isValid && pb.authStore.record) {
      try {
        const atual = await pb.collection('users').getOne<Usuario>(pb.authStore.record.id, {
          requestKey: null,
        })
        setUsuario(atual)
      } catch {
        setUsuario((pb.authStore.record as unknown as Usuario) || null)
      }
    } else {
      setUsuario(null)
    }
  }, [])

  useEffect(() => {
    const unsub = pb.authStore.onChange((token, model) => {
      setUsuario((model as unknown as Usuario) || null)
    })

    async function init() {
      try {
        if (pb.authStore.isValid && pb.authStore.record) {
          await recarregarUsuario()
        }
        await recarregarPreferencias()
      } finally {
        setCarregando(false)
      }
    }

    init()

    return () => {
      unsub()
    }
  }, [recarregarUsuario, recarregarPreferencias])

  const login = async (email: string, senha: string) => {
    const authData = await pb.collection('users').authWithPassword<Usuario>(email, senha)
    setUsuario(authData.record)
    await recarregarPreferencias()
  }

  const logout = () => {
    pb.authStore.clear()
    setUsuario(null)
  }

  const obterAvatarUrl = useCallback(() => {
    if (!usuario || !usuario.avatar) return null
    return pb.files.getURL(usuario, usuario.avatar)
  }, [usuario])

  return (
    <AuthContext.Provider
      value={{
        usuario,
        preferencias,
        estaAutenticado: !!usuario && pb.authStore.isValid,
        carregando,
        login,
        logout,
        recarregarUsuario,
        recarregarPreferencias,
        obterAvatarUrl,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
