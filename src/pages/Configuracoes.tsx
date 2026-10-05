import React, { useState, useEffect, useRef } from 'react'
import {
  User,
  Camera,
  Save,
  KeyRound,
  LogOut,
  Sparkles,
  Check,
  DollarSign,
  Clock,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HorariosEditor } from '@/components/HorariosEditor'
import { HORARIOS_PADRAO_CONSULTORIO } from '@/services/preferencias'
import type { HorariosAtendimentoSemana, ModalidadeConsulta } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/context/AuthContext'
import { atualizarPreferencias } from '@/services/preferencias'

export default function ConfiguracoesPage() {
  const {
    usuario,
    preferencias,
    logout,
    recarregarUsuario,
    recarregarPreferencias,
    obterAvatarUrl,
  } = useAuth()

  // Perfil
  const [nome, setNome] = useState(preferencias?.nome_profissional || 'Juliana T A S Vasconcellos')
  const [email, setEmail] = useState(usuario?.email || 'julianasmithvss@gmail.com')
  const [monograma, setMonograma] = useState(preferencias?.monograma || 'JV')
  const [cargo, setCargo] = useState(preferencias?.cargo || 'Psicóloga')
  const [modalidade, setModalidade] = useState<ModalidadeConsulta>(
    preferencias?.modalidade_padrao || 'Mista',
  )
  const [valorSessao, setValorSessao] = useState<number>(preferencias?.valor_padrao_sessao || 220)
  const [horariosSemana, setHorariosSemana] = useState<HorariosAtendimentoSemana>(
    preferencias?.horarios_atendimento || HORARIOS_PADRAO_CONSULTORIO,
  )

  const [abaAtiva, setAbaAtiva] = useState('perfil')
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [enviandoResetSenha, setEnviandoResetSenha] = useState(false)
  const [enviandoFoto, setEnviandoFoto] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (preferencias) {
      setNome(preferencias.nome_profissional || 'Juliana T A S Vasconcellos')
      setMonograma(preferencias.monograma || 'JV')
      setCargo(preferencias.cargo || 'Psicóloga')
      setModalidade(preferencias.modalidade_padrao || 'Mista')
      setValorSessao(preferencias.valor_padrao_sessao || 220)
      if (
        preferencias.horarios_atendimento &&
        Object.keys(preferencias.horarios_atendimento).length > 0
      ) {
        setHorariosSemana(preferencias.horarios_atendimento)
      } else {
        setHorariosSemana(HORARIOS_PADRAO_CONSULTORIO)
      }
    }
    if (usuario) {
      setEmail(usuario.email || '')
    }
  }, [preferencias, usuario])

  // Troca de Foto de Perfil Persistente
  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !usuario) return

    try {
      setEnviandoFoto(true)
      const formData = new FormData()
      formData.append('avatar', file)

      // Atualiza o avatar no PocketBase e persiste imediatamente
      await pb.collection('users').update(usuario.id, formData)
      await recarregarUsuario()
      toast.success('Foto de perfil atualizada com sucesso!')
    } catch {
      toast.error('Erro ao salvar foto de perfil. Tente uma imagem JPG ou PNG menor.')
    } finally {
      setEnviandoFoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Salvar Preferências e Perfil
  const handleSalvarTudo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!monograma || monograma.trim().length < 2) {
      toast.error('O monograma deve conter no mínimo 2 letras.')
      return
    }

    try {
      setSalvandoPerfil(true)

      // 1. Atualizar e-mail e nome no users se necessário
      if (usuario) {
        const userUpdates: Record<string, unknown> = {}
        if (nome !== usuario.name) userUpdates.name = nome
        if (email !== usuario.email) userUpdates.email = email

        if (Object.keys(userUpdates).length > 0) {
          await pb.collection('users').update(usuario.id, userUpdates)
          await recarregarUsuario()
        }
      }

      // 2. Atualizar tabela de preferências do consultório
      await atualizarPreferencias(preferencias?.id || '', {
        nome_profissional: nome.trim(),
        cargo: cargo.trim(),
        monograma: monograma.trim().toUpperCase(),
        modalidade_padrao: modalidade,
        valor_padrao_sessao: valorSessao,
        horarios_atendimento: horariosSemana,
      })
      await recarregarPreferencias()

      toast.success('Configurações e horários de atendimento salvos com sucesso!')
    } catch {
      toast.error('Erro ao salvar configurações.')
    } finally {
      setSalvandoPerfil(false)
    }
  }

  // Disparar redefinição de senha
  const handleSolicitarResetSenha = async () => {
    if (!usuario?.email) return
    try {
      setEnviandoResetSenha(true)
      await pb.collection('users').requestPasswordReset(usuario.email)
      toast.success(`E-mail com link para alterar sua senha enviado para ${usuario.email}.`)
    } catch {
      toast.error('Erro ao solicitar redefinição de senha.')
    } finally {
      setEnviandoResetSenha(false)
    }
  }

  const avatarUrl = obterAvatarUrl()

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Abas Superiores de Configuração */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <TabsList className="bg-white border border-[#B9BDB8]/40 p-1 rounded-2xl shadow-xs self-start">
            <TabsTrigger
              value="perfil"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-[#8A9A83] data-[state=active]:text-white gap-2 transition-all"
            >
              <User className="w-4 h-4" />
              <span>Perfil e Consultório</span>
            </TabsTrigger>
            <TabsTrigger
              value="horarios"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-[#8A9A83] data-[state=active]:text-white gap-2 transition-all"
            >
              <Clock className="w-4 h-4" />
              <span>Horários de Atendimento</span>
            </TabsTrigger>
            <TabsTrigger
              value="seguranca"
              className="rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold data-[state=active]:bg-[#8A9A83] data-[state=active]:text-white gap-2 transition-all"
            >
              <KeyRound className="w-4 h-4" />
              <span>Segurança da Conta</span>
            </TabsTrigger>
          </TabsList>

          <Button
            type="button"
            onClick={handleSalvarTudo}
            disabled={salvandoPerfil}
            className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl gap-2 px-6 shadow-xs text-xs sm:text-sm self-end sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>{salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}</span>
          </Button>
        </div>

        {/* Aba 1: Perfil e Consultório */}
        <TabsContent value="perfil" className="space-y-8 mt-0 focus-visible:outline-hidden">
          <form onSubmit={handleSalvarTudo} className="space-y-8">
            {/* Bloco 1: Perfil e Foto */}
            <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-[#B9BDB8]/20">
                <User className="w-5 h-5 text-[#8A9A83]" />
                <h2 className="text-base font-bold text-[#2C3A2C]">Perfil da Profissional</h2>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative group">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={nome}
                      className="w-24 h-24 rounded-full object-cover border-4 border-[#8A9A83] shadow-sm"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-3xl shadow-sm">
                      {monograma}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={enviandoFoto}
                    className="absolute bottom-0 right-0 p-2 bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-full shadow-md transition-all disabled:opacity-50"
                    title="Trocar foto de perfil"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleUploadFoto}
                    className="hidden"
                  />
                </div>

                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-[#2C3A2C]">{nome}</h3>
                  <p className="text-xs text-[#8A9A83] font-medium">{cargo}</p>
                  <p className="text-xs text-[#4A4A48]">
                    Foto persistida diretamente na sua conta, visível na barra lateral e na página
                    inicial.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={enviandoFoto}
                    className="mt-2 text-xs rounded-xl border-[#B9BDB8]/50"
                  >
                    {enviandoFoto ? 'Salvando foto...' : 'Escolher nova foto'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <Label htmlFor="nome" className="text-xs font-semibold text-[#2C3A2C]">
                    Nome Completo
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1 rounded-xl border-[#B9BDB8]/50 text-sm"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-xs font-semibold text-[#2C3A2C]">
                    E-mail de Acesso
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 rounded-xl border-[#B9BDB8]/50 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Identidade Visual & Monograma */}
            <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b border-[#B9BDB8]/20">
                <Sparkles className="w-5 h-5 text-[#C8845F]" />
                <h2 className="text-base font-bold text-[#2C3A2C]">
                  Identidade Visual e Atendimento
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* Monograma Preview e Campo */}
                <div>
                  <Label htmlFor="monograma" className="text-xs font-semibold text-[#2C3A2C]">
                    Monograma (Mín. 2 letras)
                  </Label>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-11 h-11 rounded-xl bg-[#C8845F] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                      {monograma}
                    </div>
                    <Input
                      id="monograma"
                      maxLength={3}
                      value={monograma}
                      onChange={(e) => setMonograma(e.target.value.toUpperCase())}
                      className="rounded-xl border-[#B9BDB8]/50 font-bold uppercase text-sm"
                    />
                  </div>
                </div>

                {/* Cargo / Subtítulo */}
                <div>
                  <Label htmlFor="cargo" className="text-xs font-semibold text-[#2C3A2C]">
                    Subtítulo / Especialidade
                  </Label>
                  <Input
                    id="cargo"
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="mt-1 rounded-xl border-[#B9BDB8]/50 text-sm"
                  />
                </div>

                {/* Valor Padrão por Sessão */}
                <div>
                  <Label htmlFor="valorSessao" className="text-xs font-semibold text-[#2C3A2C]">
                    Valor Padrão por Sessão (R$)
                  </Label>
                  <div className="relative mt-1">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9A83]" />
                    <Input
                      id="valorSessao"
                      type="number"
                      step="0.01"
                      value={valorSessao}
                      onChange={(e) => setValorSessao(Number(e.target.value))}
                      className="pl-9 rounded-xl border-[#B9BDB8]/50 font-semibold text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Modalidade de Atendimento Padrão */}
              <div>
                <Label className="text-xs font-semibold text-[#2C3A2C] block mb-2">
                  Modalidade de Atendimento Padrão
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['Presencial', 'Online', 'Mista'] as ModalidadeConsulta[]).map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setModalidade(mod)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        modalidade === mod
                          ? 'border-[#8A9A83] bg-[#E4EADF]/60 text-[#3A4A3A] font-bold shadow-xs'
                          : 'border-[#B9BDB8]/40 bg-white text-[#4A4A48] hover:bg-[#F7F8F6]'
                      }`}
                    >
                      <span className="text-sm">{mod}</span>
                      {modalidade === mod && <Check className="w-4 h-4 text-[#8A9A83]" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Botão de Salvar Tudo */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={salvandoPerfil}
                className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl gap-2 px-6 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{salvandoPerfil ? 'Salvando...' : 'Salvar Alterações'}</span>
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Aba 2: Horários de Atendimento */}
        <TabsContent value="horarios" className="space-y-6 mt-0 focus-visible:outline-hidden">
          <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#B9BDB8]/20">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#8A9A83]" />
                <div>
                  <h2 className="text-base font-bold text-[#2C3A2C]">
                    Horários de Atendimento Livres por Dia da Semana
                  </h2>
                  <p className="text-xs text-[#8A9A83] mt-0.5">
                    Personalize os horários de início livres para cada dia (incluindo frações como
                    08:30, 09:15), ative ou desative dias inteiros e replique sua grade facilmente.
                  </p>
                </div>
              </div>
            </div>

            <HorariosEditor
              horariosSemana={horariosSemana}
              onChange={(novos) => setHorariosSemana(novos)}
            />

            <div className="pt-4 border-t border-[#B9BDB8]/20 flex justify-end">
              <Button
                type="button"
                onClick={handleSalvarTudo}
                disabled={salvandoPerfil}
                className="bg-[#8A9A83] hover:bg-[#75846F] text-white rounded-xl gap-2 px-6 shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>
                  {salvandoPerfil ? 'Salvando horários...' : 'Salvar Horários de Atendimento'}
                </span>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Aba 3: Segurança e Acesso */}
        <TabsContent value="seguranca" className="space-y-6 mt-0 focus-visible:outline-hidden">
          <div className="bg-white rounded-2xl border border-[#B9BDB8]/30 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-[#B9BDB8]/20">
              <KeyRound className="w-5 h-5 text-[#8A9A83]" />
              <h2 className="text-base font-bold text-[#2C3A2C]">Segurança da Conta</h2>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F7F8F6] border border-[#B9BDB8]/30">
              <div>
                <h4 className="text-sm font-semibold text-[#2C3A2C]">Alteração de Senha</h4>
                <p className="text-xs text-[#8A9A83] mt-0.5">
                  Enviaremos um link de recuperação e troca de senha seguro para o e-mail{' '}
                  {usuario?.email}.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSolicitarResetSenha}
                disabled={enviandoResetSenha}
                className="rounded-xl border-[#B9BDB8]/50 text-xs shrink-0"
              >
                {enviandoResetSenha ? 'Enviando link...' : 'Alterar senha por e-mail'}
              </Button>
            </div>

            {/* Sair da Conta com Confirmação */}
            <div className="pt-2 flex justify-start">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-[#C45545] border-[#FBE3DE] hover:bg-[#FBE3DE] rounded-xl text-xs gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da minha conta</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-[#2C3A2C]">
                      Deseja sair da sua conta?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[#4A4A48]">
                      Você precisará informar seu e-mail e senha para acessar o consultório
                      novamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={logout}
                      className="bg-[#C45545] hover:bg-[#B04535] text-white rounded-xl"
                    >
                      Sair da conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
