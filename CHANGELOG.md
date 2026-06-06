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
