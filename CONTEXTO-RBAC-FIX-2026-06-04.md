````markdown
# 📋 Contexto Completo — Correção RBAC (Frontend + Backend)
**Data:** 2026-06-04
**Workflow ativo:** ProblemSolver
**Status atual:** Plano aprovado, execução pausada para reinício do Opencode

---

## 1. 🎯 Resumo do Problema

**Sintoma reportado pelo usuário:**
> "Estou com um problema na aplicação. A parte do gerente tá funcionando bem (o que criou o restaurante). O problema é mais sobre os funcionários. Exemplo: um usuário funcionário com cargo **cozinheiro** (`KITCHEN`) não pode criar pedido, ele só pode visualizar e alterar status. Mas no frontend ele tem a tela de 'criar pedido' visível. No fim aparece uma mensagem de toast falando que não tem permissão, mas essa tela nem deveria estar ali para começo de conversa."

**Causa raiz:** O frontend **não consulta o `permissionStore`** em ~15 elementos de UI. Botões de mutação (criar, editar, excluir, cancelar, avançar status) renderizam para qualquer role, independente da permissão. O componente `ProtectedRoute` existe e está completo, mas **nunca foi importado** em lugar nenhum. O guard global `app/+middleware.ts` está **100% comentado**. O `app/(auth)/_layout.tsx` só checa autenticação, não checa role.

Adicionalmente, o backend tem **dois bugs relacionados**:
- `OrderController:47` lista KITCHEN em `@Roles('WAITER', 'KITCHEN', 'OWNER', 'MANAGER')` para `POST /api/order` — KITCHEN não deveria poder criar pedido.
- `RolesGuard:47-57` usa lógica de hierarquia por rank (`Math.min(...ranks)`), o que permite CASHIER (rank 30) e DELIVERY (rank 30) passarem por guards cujo rank mínimo é WAITER (também 30). Bug de design que precisa ser corrigido.

---

## 2. 🏗️ Arquitetura do Projeto

**Almocu ADM Native** — Sistema SaaS multi-tenant para restaurantes.

- **Frontend** (`/workspaces/almocu-adm-native`): React Native + Expo Router, MobX (com `observer()`), NativeWind (Tailwind para RN), TypeScript.
- **Backend** (`/workspaces/almocu-adm-native/almocu-back`): NestJS 11 monorepo com Bun, MongoDB (Mongoose 8), Redis (ioredis), microserviços (`auth`, `menu`, `stock`, `order`).
- **Documentação principal:** `PROJETO.md` (raiz) e `almocu-back/AGENTS.md` (regras do backend).
- **AGENTS.md raiz** define o sistema multiagentes: SuperAgentes (Builder, ProblemSolver, Discussion), Workflow Agents (Architect, Task Planner, Problem Identifier, Root Cause Analyzer, Solution Designer, Implementation Manager), Execution Subagents (Coder, Code Reviewer, Security Reviewer, Tester, Documenter).

### Roles existentes
- `OWNER` (dono do restaurante)
- `MANAGER` (gerente)
- `WAITER` (garçom)
- `KITCHEN` (cozinheiro)
- `CASHIER` (caixa)
- `DELIVERY` (entregador)
- `COMMON` (usuário comum)

**Observação importante:** O usuário instruiu que **NÃO existe cargo `INDEFINIDO`**. O que era chamado de "INDEFINIDO" no `PermissionStore.ts` é na verdade `COMUM`. Deve ser removido/substituído.

---

## 3. 📊 Investigação Realizada

### 3.1 Problem Identifier (concluído)

**Sintomas identificados:**
1. Botão "Criar Pedido" (`app/(auth)/pedidos/index.tsx:151-159`) renderiza para qualquer role.
2. Mesma classe de bug em **~15 elementos de UI** espalhados por:
   - `pedidos/index.tsx` (botão criar)
   - `cardapio/index.tsx` (botão novo item)
   - `estoque/index.tsx` (botão +)
   - `OrderCard.tsx` (avançar status, cancelar, fechar conta, retirar itens)
   - `addPedido.tsx`, `addItem.tsx` (cardápio/estoque/fornecedores) — acessíveis por deep link
3. Existe `stores/PermissionStore.ts` completo e correto definindo que COZINHA tem `orders:view` + `orders:update-status` (sem `orders:create`).
4. Existe `components/shared/ProtectedRoute.tsx` — implementado, mas **nunca importado em lugar nenhum**.
5. `app/+middleware.ts` — todo o corpo comentado (1-26), sem guard global.
6. `app/(auth)/_layout.tsx` — só checa `isAuthenticated` e `restaurantId`, não checa role.
7. Verificações ad-hoc inconsistentes: `funcionarios/index.tsx:47` usa `permissionStore.can()` corretamente; já `fornecedores/index.tsx:126` e `config/index.tsx:441,519` usam `activeRole === 'GERENTE'` hard-coded; várias telas **não têm nenhuma checagem**.

### 3.2 Root Cause Analyzer (concluído)

**Causa raiz arquitetural:** A camada de RBAC do frontend foi **planejada mas não foi integrada sistematicamente**. O `PermissionStore` e `ProtectedRoute` foram escritos, a Navbar os usa para filtrar módulos, mas a esmagadora maioria das telas (Pedidos, Cardápio, Estoque, Fornecedores, Config, AddPedido, AddItem) ainda depende de checagens `activeRole === 'X'` hard-coded ou não tem checagem alguma.

**Causa raiz técnica:** O botão "Criar Pedido" em `app/(auth)/pedidos/index.tsx:151-159` não consulta `permissionStore`. Como o backend permite KITCHEN criar pedido (via `order.controller.ts:47` e a hierarquia de roles), não há barreira efetiva em nenhuma das 4 camadas (layout, página, componente, handler).

**Causa raiz de processo:** Ausência de "permission contract" — não há script que sincronize `PermissionStore` com o backend, não há teste automatizado que valide a matriz, e o time possui **três fontes divergentes** para a mesma regra (spec `novasTelas.md` que é pessoal, doc `PROJETO.md`, código `PermissionStore.ts`/`order.controller.ts`) sem um owner claro de qual é a canônica.

**Bug crítico detectado no RolesGuard:**
**Arquivo:** `almocu-back/libs/common/src/guards/roles.guard.ts:47-57`
```typescript
const userRank = getRoleRank(user.role);
const minimumRank = Math.min(
  ...requiredRoles.map((r) => getRoleRank(r)),
);
if (userRank < minimumRank || userRank === 0) {
  throw new ForbiddenException(...);
}
return true;
```
Como `WAITER`, `CASHIER` e `DELIVERY` têm o mesmo rank 30 (vide `almocu-back/libs/common/src/constants/role-hierarchy.ts:13-15`), um endpoint com `@Roles('WAITER', 'OWNER', 'MANAGER')` (mínimo = 30) **autoriza CASHIER e DELIVERY** a passar, mesmo não estando na lista.

**Observação do usuário (validada):** O usuário testou CASHIER no swagger e foi rejeitado. Isso significa que a rejeição está vindo de uma **chamada interna secundária** (a `OrderService.create()` chama `PATCH /api/stock/:id/adjust` que é restrito a OWNER/MANAGER). A RolesGuard tem o bug, mas o efeito colateral mascara o problema. Isso precisa ser investigado durante a implementação.

---

## 4. ✅ Decisões Aprovadas pelo Usuário

| ID | Decisão |
|---|---|
| D1 | KITCHEN **NÃO PODE** criar pedido. Regra de negócio. |
| D2 | Estratégia: **Solução Completa** (frontend + backend + docs). |
| D3 | `PROJETO.md:455` deve ser corrigido (atualmente diz que KITCHEN pode). |
| D4 | Não existe cargo "INDEFINIDO" — é o **COMUM**. Remover INDEFINIDO das análises. |
| D5 | `novasTelas.md` é pessoal do usuário, **NÃO é documentação oficial** — ignorar. |
| D6 | `RolesGuard` deve ser **membership estrito**: se a Role do usuário NÃO estiver em `@Roles(...)`, **NÃO pode** (mesmo que a hierarquia seja maior). **Exceção**: GERENTE (`MANAGER`), DONO (`OWNER`) e `admin` (globalRole) **têm acesso amplo** a tudo por padrão. |
| D7 | **Sem deploy** — só validação local. O usuário vai testar. |
| D8 | KITCHEN **pode ver histórico** de pedidos. |
| D9 | Diferenciação OWNER vs MANAGER na UI: **deixar para o futuro**. |
| D10 | `addPedido` (compartilhado criar/editar): guard com `requireAll={false}` para `[orders:create, orders:edit-items]`. |

**Respostas do usuário às perguntas do Solution Designer:**
- §10.A: Sim — remover KITCHEN de `@Roles` em `POST /api/order`
- §10.B: Sim — investigar e corrigir inconsistência do `RolesGuard`
- §10.C: Sim — KITCHEN vê histórico
- §10.D: Deixar para o futuro
- §10.E: Sim — `addPedido` compartilhado, guard com `requireAll={false}`

**Observações operacionais do usuário:**
- O `coder` atual é especializado em **frontend** (React Native, Expo, MobX). Para o backend, é necessário criar um subagente `coder-backend` específico com domínio em **NestJS 11, Bun, Mongoose, class-validator, @nestjs/axios, Redis, JWT/passport, Stripe SDK, microserviços, http-proxy-middleware**.
- O `RolesGuard` é superior à hierarquia: se a Role não estiver listada, não pode (exceção: gerente, dono, admin).

---

## 5. 🛠️ PLANO DE IMPLEMENTAÇÃO (APROVADO)

### 5.1 Mudanças no BACKEND

#### Arquivo: `almocu-back/apps/order/src/order/order.controller.ts`
- **Linha 47:** Alterar `@Roles('WAITER', 'KITCHEN', 'OWNER', 'MANAGER')` → `@Roles('WAITER', 'OWNER', 'MANAGER')` (remover KITCHEN do POST /orders).
- **Linha 49:** Atualizar Swagger `@ApiForbiddenResponse` description: "Garçons, cozinheiros, gerentes e proprietários" → "Garçons, gerentes e proprietários".
- **Outros endpoints (70, 103, 128, 144, 164):** MANTER como estão (verificados OK).

#### Arquivo: `almocu-back/libs/common/src/guards/roles.guard.ts`
- **Linhas 47-57:** Reescrever a lógica de `Math.min(...ranks)` para **membership estrito** com exceção:
```typescript
// Hierarquia: roles com rank superior têm acesso amplo
const PRIVILEGED_ROLES = [UserRole.MANAGER, UserRole.OWNER];
if (PRIVILEGED_ROLES.includes(user.role) || user.globalRoles?.includes('admin')) {
  return true;
}
// Caso contrário: membership exato
if (!requiredRoles.includes(user.role)) {
  throw new ForbiddenException(`Acesso negado: necessário cargo ${requiredRoles.join(' ou ')}`);
}
return true;
```
- Manter imports de `@nestjs/common` e os paths relativos DENTRO de `libs/common/src/`.
- `getRoleRank` pode ficar sem uso ou ser removido se não usado em outro lugar.

#### Arquivo: `almocu-back/apps/order/src/order/order.controller.spec.ts` (criar/editar)
Testes RBAC obrigatórios (regra `almocu-back/AGENTS.md` §13.9):
```typescript
describe('OrderController - RBAC', () => {
  describe('POST /orders', () => {
    it('OWNER pode criar pedido (201)', ...);
    it('MANAGER pode criar pedido (201)', ...);
    it('WAITER pode criar pedido (201)', ...);
    it('KITCHEN NÃO pode criar pedido (403)', ...);  // CRÍTICO
    it('CASHIER NÃO pode criar pedido (403)', ...);  // BUG ATUAL: passava!
    it('DELIVERY NÃO pode criar pedido (403)', ...); // BUG ATUAL: passava!
    it('COMMON NÃO pode criar pedido (403)', ...);
    it('Sem token NÃO pode criar pedido (401)', ...);
  });

  describe('PATCH /orders/:id/status', () => {
    it('KITCHEN pode mover pendente→em_preparo (200)', ...);
    it('KITCHEN pode mover em_preparo→pronto (200)', ...);
    it('KITCHEN NÃO pode mover para cancelado (400/403)', ...);
    it('CASHIER NÃO pode mover status (403)', ...);
  });

  describe('DELETE /orders/:id', () => {
    it('KITCHEN NÃO pode deletar pedido (403)', ...);
    it('MANAGER pode deletar pedido (204)', ...);
  });
});
```

### 5.2 Mudanças no FRONTEND

#### Arquivo: `stores/PermissionStore.ts`

**1. Adicionar 3 abilities ao union type (linhas 8-36):**
- `orders:cancel`
- `orders:close-bill`
- `orders:edit-items`

**2. Atualizar `ROLE_ABILITIES` (linhas 43-108):**
- `GERENTE` (linhas 44-73): adicionar `orders:cancel`, `orders:close-bill`, `orders:edit-items`
- `GARCOM` (linhas 74-80): adicionar `orders:cancel`, `orders:close-bill`, `orders:edit-items`
- `CAIXA` (linhas 88-93): adicionar `orders:close-bill`
- `COZINHA` (linhas 81-87): **nenhuma** das 3
- `ENTREGADOR` (linhas 94-100): **nenhuma** das 3
- `COMUM` (linhas 101-104): **nenhuma** das 3

**3. Remover `INDEFINIDO` (linhas 105-107):**
- Substituir todas as referências a `INDEFINIDO` no projeto por `COMUM`
- Verificar `stores/AuthStore.ts` e qualquer outro lugar que use `INDEFINIDO`
- Se `INDEFINIDO` é exportado em `FrontRole` enum, substituir por `COMUM` lá também

**4. Atualizar JSDoc** da linha 41-43: "A role 'GERENTE' cobre tanto OWNER quanto MANAGER."

#### Camada 1 — Layout: `app/(auth)/_layout.tsx`
Adicionar mapa `ROUTE_GUARDS` com `pathname → requiredAbility` e redirect:

```typescript
import { permissionStore, Ability } from '@/stores/PermissionStore';

interface RouteGuard {
  match: RegExp;
  abilities: Ability[];
  requireAll?: boolean;
}

const ROUTE_GUARDS: RouteGuard[] = [
  { match: /^\/(auth)\/pedidos\/addPedido/, abilities: ['orders:create', 'orders:edit-items'], requireAll: false },
  { match: /^\/(auth)\/pedidos\/historico/, abilities: ['orders:view'] },
  { match: /^\/(auth)\/pedidos/, abilities: ['orders:view'] },
  { match: /^\/(auth)\/cardapio\/addItem/, abilities: ['menu:create', 'menu:edit'], requireAll: false },
  { match: /^\/(auth)\/cardapio/, abilities: ['menu:view'] },
  { match: /^\/(auth)\/estoque\/addItem/, abilities: ['stock:create', 'stock:edit'], requireAll: false },
  { match: /^\/(auth)\/estoque/, abilities: ['stock:view'] },
  { match: /^\/(auth)\/fornecedores\/addItem/, abilities: ['suppliers:manage'] },
  { match: /^\/(auth)\/fornecedores/, abilities: ['suppliers:view'] },
  { match: /^\/(auth)\/funcionarios/, abilities: ['staff:view'] },
];

// Dentro do componente AuthLayout, adicionar novo useEffect:
useEffect(() => {
  if (!authStore.isAuthenticated || !hasRestaurant) return;

  for (const guard of ROUTE_GUARDS) {
    if (guard.match.test(pathname)) {
      const hasAccess = guard.requireAll
        ? permissionStore.canAll(...guard.abilities)
        : permissionStore.canAny(...guard.abilities);
      if (!hasAccess) {
        Toast.show({ type: 'error', text1: 'Acesso negado' });
        router.replace('/(auth)/dashboard');
        return;
      }
    }
  }
}, [pathname, authStore.isAuthenticated, hasRestaurant, router]);
```

#### Camada 2 — Página: envolver com `<ProtectedRoute>`
| Arquivo | Wrap em |
|---|---|
| `app/(auth)/pedidos/index.tsx` | `<ProtectedRoute abilities="orders:view">` |
| `app/(auth)/pedidos/addPedido.tsx` | `<ProtectedRoute abilities={['orders:create', 'orders:edit-items']} requireAll={false} redirect>` |
| `app/(auth)/pedidos/historico.tsx` | `<ProtectedRoute abilities="orders:view">` |
| `app/(auth)/cardapio/index.tsx` | `<ProtectedRoute abilities="menu:view">` |
| `app/(auth)/cardapio/addItem.tsx` | `<ProtectedRoute abilities={['menu:create', 'menu:edit']} requireAll={false} redirect>` |
| `app/(auth)/estoque/index.tsx` | `<ProtectedRoute abilities="stock:view" redirect>` |
| `app/(auth)/estoque/addItem.tsx` | `<ProtectedRoute abilities={['stock:create', 'stock:edit']} requireAll={false} redirect>` |
| `app/(auth)/fornecedores/addItem.tsx` | `<ProtectedRoute abilities="suppliers:manage" redirect>` |
| `app/(auth)/fornecedores/[id].tsx` | `<ProtectedRoute abilities="suppliers:view" redirect>` |
| `app/(auth)/funcionarios/[id].tsx` | `<ProtectedRoute abilities="staff:view" redirect>` |

#### Camada 3 — Componente: guards inline em botões de mutação

| Arquivo:linha | Botão | Ability exigida |
|---|---|---|
| `app/(auth)/pedidos/index.tsx:151-159` | "Criar Pedido" / "+" | `orders:create` |
| `components/orders/OrderCard.tsx:241-248` | "Avançar status" | `orders:update-status` |
| `components/orders/OrderCard.tsx:483-492` | "Cancelar Pedido" | `orders:cancel` (novo) |
| `components/orders/OrderCard.tsx:461-481` | "Retirar Itens" | `orders:edit-items` (substituir `GARCOM \|\| GERENTE`) |
| `components/orders/OrderCard.tsx:461-481` | "Fechar Conta" | `orders:close-bill` (substituir `GARCOM \|\| GERENTE`) |
| `app/(auth)/cardapio/index.tsx:191-207` | "Novo Item" / "+" | `menu:create` |
| `app/(auth)/cardapio/index.tsx:282+` (MenuCard) | "Editar" / "Excluir" | `menu:edit` / `menu:delete` |
| `app/(auth)/estoque/index.tsx:257-263` | Botão "+" | `stock:create` |
| `app/(auth)/estoque/index.tsx:97-129` | +/- / Editar / Excluir | `stock:edit` / `stock:delete` |
| `app/(auth)/config/index.tsx:441, 519` | Seções sensíveis | `restaurant:manage` / `orders:delete` (substituir `activeRole === 'GERENTE'`) |

### 5.3 Mudanças na DOCUMENTAÇÃO

#### Arquivo: `PROJETO.md`
- **Linha 455:** Alterar `| WAITER, KITCHEN, OWNER, MANAGER |` → `| WAITER, OWNER, MANAGER |`
- Adicionar nota: `> ⚠️ KITCHEN não pode criar pedido — apenas visualizar e atualizar status.`

#### Arquivo: `CHANGELOG.md` (criar na raiz, se não existir)
```markdown
# Changelog

## [Não lançado] — 2026-06-04

### Corrigido
- **RBAC Frontend + Backend (KITCHEN não cria pedido)**
  - Backend: removido KITCHEN de @Roles em POST /api/order
  - Backend: corrigida inconsistência do RolesGuard (membership estrito, com exceção para MANAGER, OWNER, admin)
  - Frontend: adicionada defesa em profundidade em 3 camadas (Layout, Página, Componente)
  - OrderCard: substituídos hard-coded `activeRole === 'GARCOM' || 'GERENTE'` por `permissionStore.can(...)`
  - PermissionStore: adicionadas abilities `orders:cancel`, `orders:close-bill`, `orders:edit-items`; removido cargo `INDEFINIDO` (substituído por COMUM)
  - PROJETO.md:455 corrigido (KITCHEN não pode criar pedido)
```

#### Arquivo: `DECISIONS.md` (criar na raiz, se não existir)
```markdown
# Decisões Arquiteturais

## DEC-001 — KITCHEN não cria pedido (2026-06-04)
**Contexto:** Usuário KITCHEN via a tela "Criar Pedido"; backend rejeitava com 403 (defesa em profundidade faltando no frontend).
**Decisão:** KITCHEN é restrito a visualizar pedidos e atualizar status (pendente→em_preparo, em_preparo→pronto). Apenas WAITER, OWNER e MANAGER podem criar pedidos.
**Consequências:**
- Botão "Criar Pedido" escondido para COZINHA;
- Endpoint POST /api/order rejeita KITCHEN com 403;
- Tela `/(auth)/pedidos/addPedido` redireciona KITCHEN para dashboard.

## DEC-002 — RolesGuard membership estrito (2026-06-04)
**Contexto:** RolesGuard usava `Math.min(...ranks)`, permitindo CASHIER (rank 30) e DELIVERY (rank 30) passarem em guards cujo menor rank era WAITER (também 30).
**Decisão:** RolesGuard passa a ser **membership exato**: se a role do usuário NÃO está em @Roles, não pode. **Exceção:** MANAGER, OWNER e admin global têm acesso amplo.
**Consequências:** Decisão arquitetural que exige revisão de todos os @Roles existentes e seus testes.
**Alternativas consideradas:**
- Manter hierarquia mas com ranks únicos por role (rejeitada);
- Whitelist por endpoint (rejeitada).
```

#### Arquivo: `docs/PERMISSION-CONTRACT.md` (criar)
Documento versionado com:
- **Matriz de Abilities × Role (frontend):** 17 abilities × 6 roles
- **Matriz de Endpoints × Roles (backend):** 17 endpoints × 7 roles
- **Checklist para Code Review**

---

## 6. 🚧 Status da Execução

| Etapa | Status |
|---|---|
| Problem Identifier | ✅ Concluído |
| Root Cause Analyzer | ✅ Concluído |
| Solution Designer | ✅ Concluído |
| Aprovação do usuário | ✅ Concluído (5/5) |
| Workstream Backend | ⏸️ **Pausado — para reiniciar** |
| Workstream Frontend | ⏸️ **Pausado — para reiniciar** |
| Code Review | ⏸️ Pendente |
| Security Review | ⏸️ Pendente |
| Testes | ⏸️ Pendente |
| Documentação | ⏸️ Pendente |
| Relatório Final | ⏸️ Pendente |

**Observação:** O Implementation Manager não pôde executar via Task tool, mas o ProblemSolver (que iniciou este workflow) **TEM** essa capacidade. A execução deve ser retomada acionando diretamente:
- Subagente `general` com prompt especializado em NestJS para o **backend**
- Subagente `coder` para o **frontend**
- Subagentes `code-reviewer`, `security-reviewer`, `tester`, `documenter` em sequência

---

## 7. 📝 Prompts Prontos para Execução (após reiniciar)

### 7.1 Pré-requisito (recomendado): Criar `coder-backend` formal

Salvar em `.opencode/agent/coder-backend.md`:

```markdown
---
description: Agente local especializado em backend NestJS 11 do projeto Almocu.
mode: subagent
permission:
  edit: ask
  bash: ask
---

# Coder Backend

## Stack
- Runtime: Bun 1.x
- Framework: NestJS 11 (monorepo)
- Linguagem: TypeScript 5.7
- Banco: MongoDB 7.0 via Mongoose 8
- Cache: Redis via ioredis
- Auth: passport (jwt, local, google-oauth20)
- HTTP: @nestjs/axios
- Validação: class-validator + class-transformer
- Docs: @nestjs/swagger
- Testes: Bun test runner

## Padrões
- SEMPRE importar de `@app/common` (nunca relativo entre apps)
- SEMPRE usar `@UseGuards(JwtAuthGuard, RolesGuard)` em controllers protegidos
- Usar `@Roles()`, `@RestaurantId()`, `@PageableParams()`
- Testes OBRIGATÓRIOS para RBAC, TOTP e máquina de estados (§13.9 do almocu-back/AGENTS.md)

## Restrições
- Não altera o plano de implementação
- Não revisa o próprio código
- Não testa
- Não documenta
```

### 7.2 Prompt para Workstream Backend (subagente `general`)

```
Você é o Coder Backend do projeto Almocu. Implemente as alterações do
Workstream Backend conforme a seção 5.1 deste arquivo de contexto.
Siga rigorosamente `almocu-back/AGENTS.md`. Produza `almocu-back/implementation-report.md`.

## Arquivos a alterar

### A) almocu-back/apps/order/src/order/order.controller.ts
- Linha 47: Alterar `@Roles('WAITER', 'KITCHEN', 'OWNER', 'MANAGER')` → `@Roles('WAITER', 'OWNER', 'MANAGER')`
- Linha 49: Atualizar `@ApiForbiddenResponse({ description: 'Garçons, cozinheiros, gerentes e proprietários' })` → `@ApiForbiddenResponse({ description: 'Garçons, gerentes e proprietários' })`
- Manter todos os outros endpoints como estão

### B) almocu-back/libs/common/src/guards/roles.guard.ts
- Reescrever linhas 47-57 com membership estrito:
  - Se user.role é MANAGER ou OWNER, OU user.globalRoles inclui 'admin' → retorna true
  - Senão, se user.role NÃO está em requiredRoles → lança ForbiddenException
  - Senão → retorna true

### C) almocu-back/apps/order/src/order/order.controller.spec.ts (criar/editar)
- 12+ testes RBAC conforme seção 5.1 deste documento

## Comandos ao final
- cd almocu-back && bun run test:order
- cd almocu-back && bun run lint
- cd almocu-back && bun run build:all

## Saída esperada
`almocu-back/implementation-report.md` com diffs resumidos e resultados dos comandos.
```

### 7.3 Prompt para Workstream Frontend (subagente `coder`)

```
Você é o Coder do projeto Almocu ADM Native (frontend React Native + Expo).
Implemente as alterações do Workstream Frontend conforme a seção 5.2 deste
arquivo de contexto. Siga rigorosamente `AGENTS.md` (raiz). Produza
`implementation-report.md` na raiz.

## Decisões já aprovadas
- D1: KITCHEN não cria pedido
- D6: RolesGuard backend = membership estrito
- D8: KITCHEN pode ver histórico
- D10: addPedido usa requireAll={false} para [orders:create, orders:edit-items]

## Arquivos a alterar (resumo)
- stores/PermissionStore.ts: 3 novas abilities + remover INDEFINIDO + atualizar ROLE_ABILITIES
- app/(auth)/_layout.tsx: adicionar ROUTE_GUARDS
- 10 páginas com ProtectedRoute (ver seção 5.2)
- ~10 botões com guards inline (ver seção 5.2)

## Comandos ao final
- npm run lint
- npx tsc --noEmit

## Saída esperada
`implementation-report.md` (raiz) com diffs resumidos e resultados.
```

### 7.4 Prompt para Code Review (subagente `code-reviewer`)

```
Você é o Code Reviewer global. Revise as alterações do plano de RBAC
(implementation-report.md do coder e coder-backend). Produza
`code-review-report.md` (raiz).

## Escopo
- Frontend: PermissionStore.ts, _layout.tsx, 10 páginas com ProtectedRoute, ~10 botões com guards
- Backend: order.controller.ts (linhas 47, 49), roles.guard.ts (lógica membership estrito), order.controller.spec.ts

## Critérios
1. Sintaxe: TypeScript compila
2. RolesGuard membership estrito correto: MANAGER/OWNER/admin passam; outras roles precisam estar em @Roles
3. PermissionStore: INDEFINIDO removido, novas abilities presentes, ROLE_ABILITIES correto
4. Defesa em profundidade: Layout + Página + Componente
5. Testes backend: cobre 200/201/403/401 conforme esperado
6. Aderência: backend importa de @app/common, frontend usa observer() e NativeWind
7. Sem hard-coded `activeRole === 'X'` (deve ser permissionStore)

## Formato de saída
code-review-report.md com: status (APROVADO/REPROVADO), issues críticas, issues menores.
```

### 7.5 Prompt para Security Review (subagente `security-reviewer`)

```
Você é o Security Reviewer global. Analise riscos de segurança das alterações
do plano de RBAC. Produza `security-review-report.md` (raiz).

## Escopo
- RolesGuard agora é membership estrito
- KITCHEN perdeu acesso a POST /orders
- Novas abilities: orders:cancel, orders:close-bill, orders:edit-items

## Análise
1. Bypass de autorização (regex do ROUTE_GUARDS, deep links)
2. Princípio do menor privilégio (MANAGER/OWNER com acesso amplo)
3. Validação de input nos testes
4. Segredos / exposição
5. Audit log de operações sensíveis
```

### 7.6 Prompt para Testes (subagente `tester`)

```
Você é o Tester local. Valide as alterações do plano de RBAC. Produza
`test-report.md` (raiz).

## Comandos
### Backend
- cd almocu-back && bun run test:order
- cd almocu-back && bun run test
- cd almocu-back && bun run lint
- cd almocu-back && bun run build:all

### Frontend
- npm run lint
- npx tsc --noEmit

## Saída
test-report.md com resultados + matriz de testes manuais esperada.
```

### 7.7 Prompt para Documentação (subagente `documenter`)

```
Você é o Documenter global. Atualize documentação após plano de RBAC.
Produza `documentation-update-report.md` (raiz).

## Arquivos
### PROJETO.md
- Linha 455: alterar `| WAITER, KITCHEN, OWNER, MANAGER |` → `| WAITER, OWNER, MANAGER |`
- Adicionar nota após tabela de Pedidos

### CHANGELOG.md (criar)
- Entrada para 2026-06-04 com resumo das mudanças

### DECISIONS.md (criar)
- DEC-001: KITCHEN não cria pedido
- DEC-002: RolesGuard membership estrito

### docs/PERMISSION-CONTRACT.md (criar)
- Matriz de Abilities × Role (frontend)
- Matriz de Endpoints × Roles (backend)
- Checklist para Code Review
```

---

## 8. 🎯 Como Retomar Após Reiniciar o Opencode

1. Salvar o conteúdo da seção 7.1 em `.opencode/agent/coder-backend.md` (recomendado)
2. (Opcional) Criar branch: `git checkout -b fix/rbac-kitchen-no-create-order`
3. Acionar subagente `general` com prompt 7.2 (backend)
4. Acionar subagente `coder` com prompt 7.3 (frontend, em paralelo ou sequencial)
5. Acionar `code-reviewer` com prompt 7.4
6. Acionar `security-reviewer` com prompt 7.5
7. Acionar `tester` com prompt 7.6
8. Acionar `documenter` com prompt 7.7
9. ProblemSolver consolida tudo em `RELATORIO-FINAL-IMPLEMENTACAO.md`

---

## 9. 📞 Mensagem de Retomada (sugestão)

Ao reiniciar o Opencode, basta dizer:

> "Vou continuar o trabalho de correção de RBAC que estava fazendo. Leia o arquivo `CONTEXTO-RBAC-FIX-2026-06-04.md` na raiz e prossiga com o Workstream Backend (subagente `general` com prompt 7.2)."

---

**Fim do contexto. Bom trabalho! 🚀**
````
