# Plano de Implementação — Módulo de Mesas

## Visão Geral

O recurso de **Mesas** se tornará um módulo completo e independente no sistema, com seu próprio acesso na barra de navegação, gerenciamento dedicado e integração com pedidos. O backend já possui toda a estrutura de API necessária (CRUD de mesas, `tableId` em pedidos, `features.hasTables`), faltando apenas a implementação no frontend e alguns ajustes no backend para o fluxo de módulo.

---

## Fase 1 — Camada de API (api-order-service) e DataStore

**Backend** — Nenhuma mudança necessária nesta fase. Todos os endpoints já existem:
- `POST /api/order/tables` ✅
- `GET /api/order/tables/all` ✅
- `DELETE /api/order/tables/:id` ✅
- `PATCH /api/order/tables/:id` ✅
- `PATCH /restaurants/:id/features` ✅
- `features.hasTables` no schema Restaurant ✅
- Gateway proxy `/api/order/tables/*` → `/tables/*` ✅

**Frontend — services/api-order-service.ts**
- Adicionar:
  - `createTable(number: string, capacity: number)`
  - `getTables()`
  - `updateTable(id: string, data)`
  - `deleteTable(id: string)`
  - `enableTablesFeature(restaurantId: string, enabled: boolean)`
- Adicionar `tableId?: string` ao `OrderInput`

**Frontend — stores/DataStore.ts**
- Adicionar interface `TableItem`
- Adicionar estado `tables: TableItem[]` e `hasTablesFeature: boolean`
- Adicionar métodos `fetchTables()`, `createTable()`, `updateTable()`, `deleteTable()`, `enableTablesFeature()`
- Modificar `refreshWorkspaces()` para popular `hasTablesFeature` a partir do `features.hasTables`
- Adicionar `tableId` ao mapeamento em `refreshOrders()`
- Adicionar suporte a `tableId` em `addOrder()`

---

## Fase 2 — Tela de Gerenciamento de Mesas

**Criar `app/(auth)/mesas/gerenciar.tsx`** — página cheia navegável.

Layout:
- Header com voltar + título "Mesas"

Seção 1 — **Status do Módulo**
- Se `!hasTablesFeature`:
  - Card explicativo: "Ative o sistema de mesas para começar"
  - Botão "Ativar Sistema de Mesas" → chama `enableTablesFeature(true)`
- Se `hasTablesFeature`:
  - Badge "Sistema de Mesas Ativo"
  - Opção "Desativar"

Seção 2 — **Lista de Mesas Cadastradas**
- Se vazio: "Nenhuma mesa cadastrada."
- Lista de cards: Mesa N° {number} — Capacidade: {capacity}
- Cada card com editar (lápis) e excluir (lixeira)
- Confirmação antes de excluir

Seção 3 — **Adicionar/Editar Mesa** (modal inline)
- Campos: Número da Mesa, Capacidade (min 1)
- Botão Salvar

---

## Fase 3 — Integrar no Cadastro de Pedidos

**Modificar `app/(auth)/pedidos/addPedido.tsx`**

Substituir o `TextInput` de `origem` por:

**Caso 1: `!hasTablesFeature`**
- Botão secundário "Cadastrar Mesas" → navega para `/(auth)/mesas/gerenciar`
- Payload padrão: `origin: 'Balcão'`

**Caso 2: `hasTablesFeature`**
- Picker "Selecionar Mesa" → abre SelectModal com mesas disponíveis
- Ao selecionar: exibe "Mesa {number}" no picker
- Se selecionou: envia `tableId` + `origin: 'Mesa {number}'`
- Se não: envia `origin: 'Balcão'` sem `tableId`
- Botão "Gerenciar Mesas" ao lado

**Payload do pedido**
- Adicionar `tableId` opcional ao `DataStore.addOrder`
- Enviar `tableId` no `apiOrderService.createOrder`

**Validação**
- Remover validação de `origem` obrigatório
- Manter validação de cliente e itens

---

## Fase 4 — Módulo Independente na Navegação

**Backend — Criar sistema básico de módulos**

1. Schema `Module` em `apps/auth/src/modules/module.schema.ts`
2. `GET /modules` — Retorna módulos disponíveis + status do restaurante
3. `POST /modules/:id/acquire` — Ativa módulo para o restaurante

**Frontend — DataStore.modules**
- Adicionar "mesas" à lista de módulos carregados
- Quando `hasTablesFeature = true` → `mesas.acquired = true`

**Navbar**
- Módulo "mesas" aparece na navbar quando adquirido
- `PermissionStore` já mapeia `mesas:view` para `'mesas'`
- Ao clicar → navega para `/(auth)/mesas/gerenciar`

**Loja de Módulos (`modulos/[id].tsx`)**
- Detalhes do módulo "mesas" já existem com ícone `PinIcon`
- Botão "ADQUIRIR" → chama `POST /modules/mesas/acquire`
- Após aquisição: "Ir para Gerenciamento"

---

## Fase 5 — Criação de Restaurante Multi-etapa

**Criar `app/(auth)/criar-restaurante/index.tsx`** — página dedicada com etapas.

**Step 1 — Dados do Restaurante**
- Nome, CNPJ (com validação), Plano
- Botão "Próximo"

**Step 2 — Configuração Inicial**
- Card "Sistema de Mesas" com toggle
- Formulário para cadastrar mesas
- Botão "Finalizar"

**Preparação para Step 3 (Pagamento)**
- Estrutura de etapas extensível

**Modificar `app/(auth)/config/index.tsx`**
- Botão "Criar Novo Restaurante" → navega para nova página

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| `services/api-order-service.ts` | ✏️ Adicionar table CRUD + features |
| `stores/DataStore.ts` | ✏️ Adicionar `tables[]`, `hasTablesFeature`, métodos |
| `app/(auth)/mesas/gerenciar.tsx` | 🆕 Tela de gerenciamento |
| `app/(auth)/pedidos/addPedido.tsx` | ✏️ Substituir input origem |
| `app/(auth)/criar-restaurante/index.tsx` | 🆕 Criação multi-etapa |
| `app/(auth)/config/index.tsx` | ✏️ Redirecionar criar restaurante |
| `almocu-back/apps/auth/src/modules/` | 🆕 Backend de módulos |
