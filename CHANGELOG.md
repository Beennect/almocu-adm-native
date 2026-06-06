# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não lançado] — 2026-06-04

### Corrigido
- **RBAC Frontend:** KITCHEN não pode mais criar pedido via UI. Camadas 1, 2 e 3 implementadas em `app/(auth)/_layout.tsx` (ROUTE_GUARDS), 10 páginas com `<ProtectedRoute>`, e botões de mutação usando `permissionStore.can(...)`.
- **RBAC Backend:** KITCHEN removido de `POST /api/order` em `apps/order/src/order/order.controller.ts:47`. `RolesGuard` reescrito com **membership estrito** (PRIVILEGED_ROLES = [MANAGER, OWNER]).
- **Cobertura de testes:** 11 testes RBAC em `apps/order/src/order/order.controller.spec.ts` cobrindo 7 roles × endpoints críticos.
- **Limpeza de código:** `INDEFINIDO` removido do `FrontRole` (substituído por `COMUM`).
- **Documentação:** `PROJETO.md:455` corrigido, `DECISIONS.md` (DEC-001, DEC-002) e `docs/PERMISSION-CONTRACT.md` criados.
- **Pendências residuais resolvidas (2026-06-06):** corrigidos hard-coded `activeRole === 'GERENTE'` em `app/(auth)/config/index.tsx` (linhas 442, 520) e `app/(auth)/fornecedores/index.tsx:125` (substituídos por `permissionStore.can(...)`); removidos fallbacks `'Indefinido'` em `app/(auth)/config/perfil.tsx:69` e `app/(auth)/funcionarios/[id].tsx:79`.

## [2026-06-06] — waiter-order-bug

### Corrigido
- **WAITER não conseguia criar pedido.** Sintoma: toast `Acesso negado: necessário cargo OWNER ou MANAGER` ao clicar em "Finalizar Pedido". Causa raiz: `OrderService.create()` (`almocu-back/apps/order/src/order/order.service.ts:218-235`) chamava a rota pública `PATCH /stock/:id/adjust` propagando `x-user-role: WAITER`, que o `StockController` rejeitava por class-level `@Roles('OWNER', 'MANAGER')`. Solução: criada rota interna `PATCH /internal/stock/:id/adjust` no `InternalStockController` (autenticada apenas por `x-internal-key`). `OrderService.create()` (criação + rollback) agora chama essa rota e deixa de propagar `x-user-role`.

### Modificado
- `stores/PermissionStore.ts`: **mantidas** as abilities `orders:cancel`, `orders:close-bill`, `orders:edit-items` para GARCOM e `orders:close-bill` para CAIXA (decisão de produto de 2026-06-06 — UI continua exibindo botões; correção do backend será feita em sessão futura). Adicionados comentários `// TODO 2026-06-06: ...` ao lado de cada ability sinalizando que o backend ainda rejeita (ver DEC-004).

### Adicionado
- `almocu-back/apps/stock/src/internal/internal.controller.ts`: novo método `adjustInternal` (PATCH `:id/adjust`) na rota `/internal/stock/`.
- `almocu-back/apps/order/test/order.e2e-spec.ts`: novo cenário "WAITER creating an order (e2e RBAC)".
- `almocu-back/apps/stock/test/stock.e2e-spec.ts`: novo cenário "InternalStockController.adjustInternal (e2e)" com 2 testes.

### Documentado
- DEC-003: Service-to-service pattern via `/internal/*` + `x-internal-key`.
- DEC-004: Manutenção de abilities pendentes no `PermissionStore` (alinhamento front/back).
