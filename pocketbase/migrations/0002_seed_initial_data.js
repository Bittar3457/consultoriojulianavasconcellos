migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Usuário principal da psicóloga Juliana
    let julianaUser
    try {
      julianaUser = app.findAuthRecordByEmail('_pb_users_auth_', 'julianasmithvss@gmail.com')
    } catch (_) {
      const record = new Record(users)
      record.setEmail('julianasmithvss@gmail.com')
      record.setPassword('Acapulco1436')
      record.setVerified(true)
      record.set('name', 'Juliana Smith')
      app.save(record)
      julianaUser = record
    }

    // 2. Preferências do Consultório
    const prefCol = app.findCollectionByNameOrId('preferencias_usuario')
    try {
      app.findFirstRecordByData('preferencias_usuario', 'monograma', 'JV')
    } catch (_) {
      const pref = new Record(prefCol)
      pref.set('nome_profissional', 'Juliana T A S Vasconcellos')
      pref.set('cargo', 'Psicóloga')
      pref.set('monograma', 'JV')
      pref.set('modalidade_padrao', 'Mista')
      pref.set('valor_padrao_sessao', 220.0)
      app.save(pref)
    }

    // 3. Pacientes de exemplo realistas
    const pacCol = app.findCollectionByNameOrId('pacientes')
    const consCol = app.findCollectionByNameOrId('consultas')
    const pagCol = app.findCollectionByNameOrId('pagamentos')
    const anotCol = app.findCollectionByNameOrId('anotacoes_prontuario')

    const pacientesExemplo = [
      {
        nome: 'Mariana Duarte Siqueira',
        data_nascimento: '1992-05-14 00:00:00.000Z',
        telefone: '(11) 98765-4321',
        email: 'mariana.duarte@email.com',
        endereco: 'Rua Bela Cintra, 850 - Consolação, São Paulo - SP',
        observacoes: 'Queixa principal: ansiedade generalizada e transição de carreira.',
      },
      {
        nome: 'Carlos Eduardo Mendes',
        data_nascimento: '1987-11-23 00:00:00.000Z',
        telefone: '(11) 97654-3210',
        email: 'carlos.mendes@email.com',
        endereco: 'Av. Paulista, 1500 - Bela Vista, São Paulo - SP',
        observacoes: 'Encaminhamento psiquiátrico para manejo de estresse crônico.',
      },
      {
        nome: 'Beatriz Vasconcelos Lima',
        data_nascimento: '2001-08-09 00:00:00.000Z',
        telefone: '(11) 99123-4567',
        email: 'beatriz.v.lima@email.com',
        endereco: 'Rua Oscar Freire, 320 - Jardins, São Paulo - SP',
        observacoes: 'Atendimento online semanal. Foco em autoestima e relações interpessoais.',
      },
      {
        nome: 'Lucas Gabriel Pinheiro',
        data_nascimento: '1995-03-30 00:00:00.000Z',
        telefone: '(11) 98234-5678',
        email: 'lucas.pinheiro@email.com',
        endereco: 'Rua dos Pinheiros, 450 - Pinheiros, São Paulo - SP',
        observacoes: 'Sessões quinzenais presenciais. Sintomas depressivos leves.',
      },
    ]

    const seededPacientes = []
    for (let i = 0; i < pacientesExemplo.length; i++) {
      const item = pacientesExemplo[i]
      let pacRecord
      try {
        pacRecord = app.findFirstRecordByData('pacientes', 'email', item.email)
      } catch (_) {
        pacRecord = new Record(pacCol)
        pacRecord.set('nome', item.nome)
        pacRecord.set('data_nascimento', item.data_nascimento)
        pacRecord.set('telefone', item.telefone)
        pacRecord.set('email', item.email)
        pacRecord.set('endereco', item.endereco)
        pacRecord.set('observacoes', item.observacoes)
        app.save(pacRecord)
      }
      seededPacientes.push(pacRecord)
    }

    // 4. Anotações de prontuário de exemplo
    if (seededPacientes.length > 0) {
      const p1 = seededPacientes[0]
      try {
        app.findFirstRecordByData('anotacoes_prontuario', 'paciente_id', p1.id)
      } catch (_) {
        const a1 = new Record(anotCol)
        a1.set('paciente_id', p1.id)
        a1.set('data', '2025-02-01 10:00:00.000Z')
        a1.set(
          'conteudo',
          'Primeira sessão: acolhimento e escuta qualificada. Paciente relata crises de ansiedade associadas ao ritmo de trabalho corporativo. Estabelecido contrato terapêutico e combinada periodicidade semanal.',
        )
        a1.set('tags', ['Avaliação inicial'])
        app.save(a1)

        const a2 = new Record(anotCol)
        a2.set('paciente_id', p1.id)
        a2.set('data', '2025-02-15 10:00:00.000Z')
        a2.set(
          'conteudo',
          'Sessão 2: discussão sobre registros de pensamentos automáticos disfuncionais. Paciente conseguiu identificar gatilhos nas reuniões de equipe. Boa adesão às técnicas de respiração diafragmática.',
        )
        a2.set('tags', ['Revisão'])
        app.save(a2)
      }

      const p2 = seededPacientes[1]
      try {
        app.findFirstRecordByData('anotacoes_prontuario', 'paciente_id', p2.id)
      } catch (_) {
        const a3 = new Record(anotCol)
        a3.set('paciente_id', p2.id)
        a3.set('data', '2025-02-10 14:00:00.000Z')
        a3.set(
          'conteudo',
          'Sessão de alinhamento com psiquiatra assistente. Paciente em estabilização, relatando melhora no padrão do sono.',
        )
        a3.set('tags', ['Revisão'])
        app.save(a3)
      }
    }

    // 5. Consultas e Pagamentos de exemplo para preencher gráficos e dashboard
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    const todayDateStr = `${yyyy}-${mm}-${dd} 00:00:00.000Z`

    if (seededPacientes.length >= 4) {
      // Consulta Hoje
      try {
        app.findFirstRecordByData('consultas', 'hora_inicio', '10:00')
      } catch (_) {
        const c1 = new Record(consCol)
        c1.set('paciente_id', seededPacientes[0].id)
        c1.set('data', todayDateStr)
        c1.set('hora_inicio', '10:00')
        c1.set('duracao_minutos', 50)
        c1.set('modalidade', 'Presencial')
        c1.set('status', 'Confirmada')
        c1.set('observacoes', 'Sessão semanal presencial.')
        c1.set('valor_total', 220.0)
        app.save(c1)

        const pag1 = new Record(pagCol)
        pag1.set('consulta_id', c1.id)
        pag1.set('valor', 220.0)
        pag1.set('status', 'Pendente')
        pag1.set('forma_pagamento', 'Pix')
        app.save(pag1)

        // Consulta 2 Hoje
        const c2 = new Record(consCol)
        c2.set('paciente_id', seededPacientes[1].id)
        c2.set('data', todayDateStr)
        c2.set('hora_inicio', '15:00')
        c2.set('duracao_minutos', 50)
        c2.set('modalidade', 'Online')
        c2.set('status', 'Agendada')
        c2.set('observacoes', 'Link enviado por e-mail.')
        c2.set('valor_total', 220.0)
        app.save(c2)

        const pag2 = new Record(pagCol)
        pag2.set('consulta_id', c2.id)
        pag2.set('valor', 220.0)
        pag2.set('status', 'Pendente')
        pag2.set('forma_pagamento', 'Pix')
        app.save(pag2)

        // Consulta Passada Realizada e Paga
        const c3 = new Record(consCol)
        c3.set('paciente_id', seededPacientes[2].id)
        c3.set('data', `${yyyy}-${mm}-05 00:00:00.000Z`)
        c3.set('hora_inicio', '11:00')
        c3.set('duracao_minutos', 50)
        c3.set('modalidade', 'Online')
        c3.set('status', 'Realizada')
        c3.set('observacoes', 'Sessão realizada via Google Meet.')
        c3.set('valor_total', 220.0)
        app.save(c3)

        const pag3 = new Record(pagCol)
        pag3.set('consulta_id', c3.id)
        pag3.set('valor', 220.0)
        pag3.set('status', 'Pago')
        pag3.set('forma_pagamento', 'Pix')
        pag3.set('data_pagamento', `${yyyy}-${mm}-05 12:00:00.000Z`)
        app.save(pag3)

        // Consulta Passada 2 Realizada e Paga
        const c4 = new Record(consCol)
        c4.set('paciente_id', seededPacientes[3].id)
        c4.set('data', `${yyyy}-${mm}-08 00:00:00.000Z`)
        c4.set('hora_inicio', '16:00')
        c4.set('duracao_minutos', 50)
        c4.set('modalidade', 'Presencial')
        c4.set('status', 'Realizada')
        c4.set('observacoes', 'Pagamento recebido em cartão no consultório.')
        c4.set('valor_total', 250.0)
        app.save(c4)

        const pag4 = new Record(pagCol)
        pag4.set('consulta_id', c4.id)
        pag4.set('valor', 250.0)
        pag4.set('status', 'Pago')
        pag4.set('forma_pagamento', 'Cartão')
        pag4.set('data_pagamento', `${yyyy}-${mm}-08 17:00:00.000Z`)
        app.save(pag4)
      }
    }
  },
  (app) => {
    // down migration
  },
)
