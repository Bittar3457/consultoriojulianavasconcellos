migrate(
  (app) => {
    // 1. Atualizar preferencias_usuario: adicionar campo JSON 'horarios_atendimento'
    const prefCol = app.findCollectionByNameOrId('preferencias_usuario')
    if (!prefCol.fields.getByName('horarios_atendimento')) {
      prefCol.fields.add(
        new JSONField({
          name: 'horarios_atendimento',
          required: false,
        }),
      )
      app.save(prefCol)
    }

    // Definir horário padrão para os registros existentes de preferências
    const defaultHorarios = {
      segunda: {
        ativo: true,
        horarios: [
          '08:00',
          '09:00',
          '10:00',
          '11:00',
          '12:00',
          '13:00',
          '14:00',
          '15:00',
          '16:00',
          '17:00',
          '18:00',
          '19:00',
        ],
      },
      terca: {
        ativo: true,
        horarios: [
          '08:00',
          '09:00',
          '10:00',
          '11:00',
          '12:00',
          '13:00',
          '14:00',
          '15:00',
          '16:00',
          '17:00',
          '18:00',
          '19:00',
        ],
      },
      quarta: {
        ativo: true,
        horarios: [
          '08:00',
          '09:00',
          '10:00',
          '11:00',
          '12:00',
          '13:00',
          '14:00',
          '15:00',
          '16:00',
          '17:00',
          '18:00',
          '19:00',
        ],
      },
      quinta: {
        ativo: true,
        horarios: [
          '08:00',
          '09:00',
          '10:00',
          '11:00',
          '12:00',
          '13:00',
          '14:00',
          '15:00',
          '16:00',
          '17:00',
          '18:00',
          '19:00',
        ],
      },
      sexta: {
        ativo: true,
        horarios: [
          '08:00',
          '09:00',
          '10:00',
          '11:00',
          '12:00',
          '13:00',
          '14:00',
          '15:00',
          '16:00',
          '17:00',
          '18:00',
          '19:00',
        ],
      },
      sabado: { ativo: false, horarios: [] },
      domingo: { ativo: false, horarios: [] },
    }

    try {
      const prefs = app.findRecordsByFilter('preferencias_usuario', "id != ''", 'created', 10, 0)
      for (let i = 0; i < prefs.length; i++) {
        const p = prefs[i]
        const atual = p.get('horarios_atendimento')
        if (!atual || (typeof atual === 'object' && Object.keys(atual).length === 0)) {
          p.set('horarios_atendimento', defaultHorarios)
          app.save(p)
        }
      }
    } catch (_) {}

    // 2. Atualizar pagamentos:
    // - consulta_id: tornar opcional (required: false)
    // - adicionar paciente_id (relation para pacientes, opcional)
    // - adicionar tipo_pagamento select ('Consulta', 'Mensal', default 'Consulta')
    // - adicionar mes_referencia text (ex.: "2026-03")
    // - adicionar descricao text (opcional)
    const pagCol = app.findCollectionByNameOrId('pagamentos')
    const pacCol = app.findCollectionByNameOrId('pacientes')

    const consultaField = pagCol.fields.getByName('consulta_id')
    if (consultaField) {
      consultaField.required = false
    }

    if (!pagCol.fields.getByName('paciente_id')) {
      pagCol.fields.add(
        new RelationField({
          name: 'paciente_id',
          collectionId: pacCol.id,
          maxSelect: 1,
          cascadeDelete: false,
          required: false,
        }),
      )
    }

    if (!pagCol.fields.getByName('tipo_pagamento')) {
      pagCol.fields.add(
        new SelectField({
          name: 'tipo_pagamento',
          values: ['Consulta', 'Mensal'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    if (!pagCol.fields.getByName('mes_referencia')) {
      pagCol.fields.add(
        new TextField({
          name: 'mes_referencia',
          required: false,
        }),
      )
    }

    if (!pagCol.fields.getByName('descricao')) {
      pagCol.fields.add(
        new TextField({
          name: 'descricao',
          required: false,
        }),
      )
    }

    app.save(pagCol)

    // Preencher tipo_pagamento = 'Consulta' em pagamentos legados onde estiver vazio
    try {
      app
        .db()
        .newQuery(
          "UPDATE pagamentos SET tipo_pagamento = 'Consulta' WHERE tipo_pagamento IS NULL OR tipo_pagamento = ''",
        )
        .execute()
    } catch (_) {}
  },
  (app) => {
    // down migration
    try {
      const prefCol = app.findCollectionByNameOrId('preferencias_usuario')
      prefCol.fields.removeByName('horarios_atendimento')
      app.save(prefCol)
    } catch (_) {}

    try {
      const pagCol = app.findCollectionByNameOrId('pagamentos')
      pagCol.fields.removeByName('paciente_id')
      pagCol.fields.removeByName('tipo_pagamento')
      pagCol.fields.removeByName('mes_referencia')
      pagCol.fields.removeByName('descricao')
      app.save(pagCol)
    } catch (_) {}
  },
)
