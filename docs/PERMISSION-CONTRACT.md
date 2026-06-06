# Permission Contract — Almocu

> Documento versionado que define a matriz de permissões frontend e backend. **Single source of truth** para o que cada role pode fazer.

---

## 1. Matriz de Abilities × Role (frontend)

Esta matriz é a **referência canônica** do que o `permissionStore.can(...)` retorna. Definida em `stores/PermissionStore.ts`.

| Ability | GERENTE | GARCOM | COZINHA | CAIXA | ENTREGADOR | COMUM |
|---------|---------|--------|---------|-------|------------|-------|
| `dashboard:view` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `menu:view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `menu:create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `menu:edit` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `menu:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `stock:view` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `stock:create` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `stock:edit` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `stock:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `orders:view` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `orders:create` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `orders:update-status` | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `orders:delete` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `orders:cancel` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `orders:close-bill` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| `orders:edit-items` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `staff:view` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `staff:manage-role` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `staff:remove` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `staff:invite` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `restaurant:manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `restaurant:suspend` | ✅ (OWNER only) | ❌ | ❌ | ❌ | ❌ | ❌ |
| `restaurant:create-branch` | ✅ (OWNER only) | ❌ | ❌ | ❌ | ❌ | ❌ |
| `suppliers:view` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `suppliers:manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `config:view` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `financeiro:view` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `fidelidade:view` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `mesas:view` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `delivery-module:view` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `modules-store:view` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> **Nota sobre OWNER vs MANAGER:** no frontend, ambos mapeiam para `GERENTE` (vide `AuthStore.ts:9-13`). A diferenciação OWNER-only é feita via flag `authStore.isOwner` (AuthStore.ts:91-94) e filtra `OWNER_ONLY_ABILITIES` em `PermissionStore.ts:140-143`. `restaurant:suspend` e `restaurant:create-branch` são as únicas abilities exclusivas de OWNER.

---

## 2. Matriz de Endpoints × Roles (backend)

Esta matriz é a **referência canônica** do que o `RolesGuard` (membership estrito, DEC-002) aceita. Os `@Roles(...)` decorators estão em `almocu-back/apps/*/src/*/*.controller.ts`.

### Auth (`/auth/*`)

| Endpoint | OWNER | MANAGER | WAITER | KITCHEN | CASHIER | DELIVERY | COMMON |
|----------|-------|---------|--------|---------|---------|----------|--------|
| `POST /auth/register` | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| `POST /auth/login` | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| `POST /auth/logout` | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| `GET /auth/me` | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| `PATCH /auth/password` | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| `GET /auth/google` | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |

*Autenticação requerida, mas role não checada explicitamente.*

### Orders (`/api/order/*`)

| Endpoint | OWNER | MANAGER | WAITER | KITCHEN | CASHIER | DELIVERY | COMMON |
|----------|-------|---------|--------|---------|---------|----------|--------|
| `POST /api/order` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/order` | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `GET /api/order/user` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `GET /api/order/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `PATCH /api/order/:id/status` | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| `DELETE /api/order/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Menu (`/api/menu/*`)

| Endpoint | OWNER | MANAGER | WAITER | KITCHEN | CASHIER | DELIVERY | COMMON |
|----------|-------|---------|--------|---------|---------|----------|--------|
| `POST /api/menu` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/menu` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `GET /api/menu/:id` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `PATCH /api/menu/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /api/menu/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /api/menu/batch` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Stock (`/api/stock/*`)

| Endpoint | OWNER | MANAGER | WAITER | KITCHEN | CASHIER | DELIVERY | COMMON |
|----------|-------|---------|--------|---------|---------|----------|--------|
| `POST /api/stock` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/stock` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /api/stock/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PATCH /api/stock/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PATCH /api/stock/:id/adjust` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /api/stock/:id` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Suppliers (`/api/stock/suppliers/*`)

| Endpoint | OWNER | MANAGER | WAITER | KITCHEN | CASHIER | DELIVERY | COMMON |
|----------|-------|---------|--------|---------|---------|----------|--------|
| Todos (POST/GET/PATCH/DELETE) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Restaurants (`/restaurants/*`)

| Endpoint | OWNER | MANAGER | WAITER | KITCHEN | CASHIER | DELIVERY | COMMON |
|----------|-------|---------|--------|---------|---------|----------|--------|
| `POST /restaurants` | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| `POST /restaurants/branch` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `POST /restaurants/join` | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| `GET /restaurants/:id/invite-code` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `GET /restaurants/my` | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* | ✅* |
| `GET /restaurants/:id/staff` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `PATCH /restaurants/:id/staff/:userId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `DELETE /restaurants/:id/staff/:userId` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 3. Checklist para Code Review

Toda PR que toca RBAC (frontend ou backend) **deve** cumprir:

- [ ] **Nenhuma checagem `activeRole === 'X'` hard-coded** em gates de UI — use `permissionStore.can(...)` (frontend) ou `@Roles(...)` (backend).
- [ ] **Defesa em profundidade mantida** se adicionou novo gate: Camada 1 (ROUTE_GUARDS no `_layout.tsx`), Camada 2 (`<ProtectedRoute>`), Camada 3 (botão com `permissionStore.can(...)`).
- [ ] **Nenhuma regressão visual** para roles com acesso: `GERENTE` (OWNER+MANAGER) continua vendo tudo o que via antes.
- [ ] **Testes RBAC adicionados** se backend foi tocado: mínimo 1 teste por role × endpoint crítico em `*.controller.spec.ts`.
- [ ] **Matriz de abilities atualizada** se nova ability foi introduzida: editar `stores/PermissionStore.ts` + esta matriz §1.
- [ ] **Matriz de endpoints atualizada** se `@Roles(...)` foi alterado: editar controllers relevantes + esta matriz §2.
- [ ] **Sem fallback `'Indefinido'`** em labels de role — usar `'Sem Cargo'`.
- [ ] **Sem `Math.min(...ranks)`** em guards — usar membership estrito (DEC-002).
- [ ] **Se adicionou nova role no backend**: atualizar `UserRole` enum (`almocu-back/libs/common/src/enums/user-role.enum.ts`), `mapBackendRoleToFrontend` (`stores/AuthStore.ts:9-27`), `ROLE_ABILITIES` (`stores/PermissionStore.ts:47-115`), e esta matriz (ambas §1 e §2).
- [ ] **Se adicionou nova ability**: atualizar `Ability` union (`stores/PermissionStore.ts:8-39`), `ROLE_ABILITIES`, esta matriz §1, e considerar se backend precisa de novo endpoint.

---

## 4. Como adicionar uma nova role (procedimento)

1. **Backend — `almocu-back/libs/common/src/enums/user-role.enum.ts`**: adicionar a role ao enum `UserRole`.
2. **Backend — `almocu-back/apps/auth/src/users/user-restaurant.schema.ts`**: a role já estará disponível via `UserRole` enum (vide `UserRestaurant.role: UserRole`).
3. **Frontend — `stores/AuthStore.ts`**: adicionar mapeamento em `mapBackendRoleToFrontend` (linhas 9-27).
4. **Frontend — `stores/PermissionStore.ts`**: adicionar array de abilities em `ROLE_ABILITIES` (linhas 47-115). Considerar se a role tem acesso amplo (OWNER/MANAGER style) — se sim, vai precisar de tratamento especial.
5. **Backend — controllers**: revisar todos os `@Roles(...)` e adicionar a role onde apropriado. **NÃO** adicionar em roles restritas que deveriam ser exclusivas de GERENTE.
6. **Esta matriz (§1 e §2)**: atualizar com a nova role e marcar as abilities/endpoints aplicáveis.
7. **Testes**: adicionar pelo menos 1 teste em `*.controller.spec.ts` validando a nova role × endpoint principal.
8. **DECISIONS.md**: se a role tem semântica especial (ex.: OWNER-only), adicionar ADR documentando a decisão.

---

## 5. Última atualização

**2026-06-06** — matriz criada após Etapa 9 do roteiro de execução RBAC (`rbac-fix-2026-06-06-restart/04-roteiro-execucao.md`).
