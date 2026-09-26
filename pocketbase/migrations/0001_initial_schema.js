migrate(
  (app) => {
    // 1. Coleção preferencias_usuario
    const preferencias = new Collection({
      name: 'preferencias_usuario',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome_profissional', type: 'text' },
        { name: 'cargo', type: 'text' },
        { name: 'monograma', type: 'text' },
        {
          name: 'modalidade_padrao',
          type: 'select',
          values: ['Presencial', 'Online', 'Mista'],
          maxSelect: 1,
        },
        { name: 'valor_padrao_sessao', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_pref_created ON preferencias_usuario (created DESC)'],
    })
    app.save(preferencias)

    // 2. Coleção pacientes
    const pacientes = new Collection({
      name: 'pacientes',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'nome', type: 'text', required: true },
        { name: 'data_nascimento', type: 'date' },
        { name: 'telefone', type: 'text' },
        { name: 'email', type: 'text' },
        { name: 'endereco', type: 'text' },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pacientes_nome ON pacientes (nome)',
        'CREATE INDEX idx_pacientes_created ON pacientes (created DESC)',
      ],
    })
    app.save(pacientes)

    const pacientesId = pacientes.id

    // 3. Coleção consultas
    const consultas = new Collection({
      name: 'consultas',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'paciente_id',
          type: 'relation',
          required: true,
          collectionId: pacientesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'hora_inicio', type: 'text', required: true },
        { name: 'duracao_minutos', type: 'number', onlyInt: true },
        {
          name: 'modalidade',
          type: 'select',
          values: ['Presencial', 'Online', 'Mista'],
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'select',
          values: ['Agendada', 'Confirmada', 'Realizada', 'Faltou', 'Cancelada'],
          maxSelect: 1,
        },
        { name: 'observacoes', type: 'text' },
        { name: 'valor_total', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_consultas_paciente ON consultas (paciente_id)',
        'CREATE INDEX idx_consultas_data ON consultas (data)',
        'CREATE INDEX idx_consultas_status ON consultas (status)',
        'CREATE INDEX idx_consultas_created ON consultas (created DESC)',
      ],
    })
    app.save(consultas)

    const consultasId = consultas.id

    // 4. Coleção pagamentos
    const pagamentos = new Collection({
      name: 'pagamentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'consulta_id',
          type: 'relation',
          required: true,
          collectionId: consultasId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'valor', type: 'number', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['Pago', 'Pendente', 'Cancelado'],
          maxSelect: 1,
        },
        {
          name: 'forma_pagamento',
          type: 'select',
          values: ['Pix', 'Cartão', 'Dinheiro', 'Transferência', 'Outro'],
          maxSelect: 1,
        },
        { name: 'data_pagamento', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pagamentos_consulta ON pagamentos (consulta_id)',
        'CREATE INDEX idx_pagamentos_status ON pagamentos (status)',
        'CREATE INDEX idx_pagamentos_data ON pagamentos (data_pagamento)',
      ],
    })
    app.save(pagamentos)

    // 5. Coleção anotacoes_prontuario
    const anotacoes = new Collection({
      name: 'anotacoes_prontuario',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'paciente_id',
          type: 'relation',
          required: true,
          collectionId: pacientesId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'consulta_id',
          type: 'relation',
          collectionId: consultasId,
          maxSelect: 1,
        },
        { name: 'data', type: 'date', required: true },
        { name: 'conteudo', type: 'text', required: true },
        {
          name: 'tags',
          type: 'select',
          values: ['Avaliação inicial', 'Revisão', 'Alta', 'Crise', 'Outro'],
          maxSelect: 5,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_anotacoes_paciente ON anotacoes_prontuario (paciente_id)',
        'CREATE INDEX idx_anotacoes_data ON anotacoes_prontuario (data DESC)',
        'CREATE INDEX idx_anotacoes_created ON anotacoes_prontuario (created DESC)',
      ],
    })
    app.save(anotacoes)
  },
  (app) => {
    const tryDelete = (name) => {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.delete(col)
      } catch (_) {}
    }
    tryDelete('anotacoes_prontuario')
    tryDelete('pagamentos')
    tryDelete('consultas')
    tryDelete('pacientes')
    tryDelete('preferencias_usuario')
  },
)
