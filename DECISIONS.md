# Decisões Arquiteturais

Este documento registra decisões arquiteturais relevantes (ADR — Architecture Decision Record).
Formato: Contexto, Decisão, Consequências, Alternativas consideradas.

## DEC-001 — KITCHEN não cria pedido (2026-06-04)

### Contexto

O usuário com cargo `KITCHEN` (cozinheiro) visualizava a tela "Criar Pedido" no frontend, embora o backend rejeitasse a requisição `POST /api/order` com 403. O resultado era uma UX ruim: o usuário clicava no botão, navegava para a tela, e só então recebia um toast de "Acesso negado". A tela **nem deveria estar acessível** para essa role.

Adicionalmente, a documentação `PROJETO.md:455` listava KITCHEN como role autorizada a criar pedido — o que estava em conflito com a intenção de negócio e com o código (em algumas combinações de headers, KITCHEN passava pelo `RolesGuard` por causa de um bug de rank — vide DEC-002).

### Decisão

**KITCHEN é restrito a visualizar pedidos e atualizar status** (transições `pendente → em_preparo` e `em_preparo → pronto`).

- **Roles autorizadas a CRIAR pedido (`POST /api/order`):** `WAITER`, `OWNER`, `MANAGER`.
- **Roles autorizadas a VISUALIZAR pedidos (`GET /api/order`, `GET /api/order/:id`, `GET /api/order/user`):** `WAITER`, `KITCHEN`, `DELIVERY`, `OWNER`, `MANAGER`.
- **Roles autorizadas a ATUALIZAR STATUS (`PATCH /api/order/:id/status`):** `KITCHEN`, `DELIVERY`, `OWNER`, `MANAGER`.
- **Roles autorizadas a DELETAR pedido (`DELETE /api/order/:id`):** `OWNER`, `MANAGER`.

KITCHEN **pode ver o histórico** de pedidos (D8), apenas não pode criá-los.

A diferenciação OWNER vs MANAGER na UI foi deixada para o futuro (D9) — ambos continuam com acesso amplo por padrão.

### Consequências

- Botão "Criar Pedido" fica escondido para KITCHEN no frontend (Camada 3 do RBAC).
- Endpoint `POST /api/order` rejeita KITCHEN com 403 (defesa em profundidade no backend).
- Tela `/(auth)/pedidos/addPedido` redireciona KITCHEN para `/dashboard` (Camada 1 do `ROUTE_GUARDS` + Camada 2 do `<ProtectedRoute>`).
- 11 testes RBAC no `order.controller.spec.ts` validam a matriz.

### Alternativas Consideradas (e Rejeitadas)

- **Permitir KITCHEN criar pedido** com itens restritos (ex.: pratos pré-prontos): rejeitada — complica a UX e abre brecha para garçom "terceirizar" pedido via cozinha.
- **Criar uma role intermediária `KITCHEN_LEAD`**: rejeitada — explode a matriz de roles sem necessidade clara.
- **Diferenciar OWNER vs MANAGER agora** (D9): rejeitada — fora de escopo desta correção; usuário pediu para deixar para o futuro.

## DEC-002 — RolesGuard membership estrito (2026-06-04)

### Contexto

O `RolesGuard` em `almocu-back/libs/common/src/guards/roles.guard.ts` usava a lógica `Math.min(...ranks)` para decidir se o usuário tinha acesso a um endpoint protegido. A tabela de ranks era:

| Role | Rank |
|------|------|
| `OWNER` | 100 |
| `MANAGER` | 80 |
| `WAITER` | 30 |
| `CASHIER` | 30 |
| `DELIVERY` | 30 |
| `KITCHEN` | 20 |
| `COMMON` | 10 |

**Problema:** `WAITER`, `CASHIER` e `DELIVERY` compartilhavam o rank 30. Um endpoint com `@Roles('WAITER', 'OWNER', 'MANAGER')` tinha `minimumRank = Math.min(30, 100, 80) = 30`. Como `CASHIER` e `DELIVERY` também tinham rank 30, ambos passavam pelo guard — **mesmo não estando na lista**.

Isso permitia que um usuário `CASHIER` ou `DELIVERY` fizesse `POST /api/order` (entre outras rotas), bastando o token ser válido.

Efeito colateral mascarava o problema: o `OrderService.create()` chama internamente `PATCH /api/stock/:id/adjust` (restrito a OWNER/MANAGER), que **era** a fonte real do 403 que o usuário via no Swagger. Mas o `RolesGuard` em si estava permitindo a chamada.

### Decisão

**`RolesGuard` passa a usar membership exato**: se a role do usuário NÃO está em `@Roles(...)`, a requisição é rejeitada com `ForbiddenException`. **Exceção:** `MANAGER`, `OWNER` e `admin` (globalRole) têm acesso amplo a qualquer rota por padrão (D6).

A nova lógica:
1. Se `user.globalRoles.includes('admin')` → `true`
2. Senão, se `user.role` é `MANAGER` ou `OWNER` → `true` (acesso amplo)
3. Senão, se `user.role` está em `requiredRoles` → `true`
4. Senão → lança `ForbiddenException`

A função `getRoleRank` foi mantida (pode ser usada em outro lugar) mas deixou de ser consultada no guard.

### Consequências

- Decisão arquitetural **quebra a hierarquia por rank** — agora é estritamente membership.
- Todos os endpoints `@Roles` existentes continuam funcionando (roles com privilégios amplos permanecem com acesso).
- Endpoints que permitiam roles por rank compartilhado (ex.: WAITER, CASHIER, DELIVERY todos rank 30) agora rejeitam roles não-listadas.
- 11 testes RBAC no `order.controller.spec.ts` cobrem o novo comportamento.
- Documentação em `docs/PERMISSION-CONTRACT.md` registra a matriz `Endpoints × Roles` esperada.

### Alternativas Consideradas (e Rejeitadas)

- **Manter hierarquia mas com ranks únicos por role**: rejeitada — cria acoplamento conceitual entre roles e "níveis"; membership estrito é mais simples e elimina bugs de colisão.
- **Whitelist por endpoint** (cada controller declara suas roles em código): rejeitada — replicaria lógica do `RolesGuard` em cada controller; membership estrito centraliza.
- **Ignorar `RolesGuard` e usar só middleware**: rejeitada — quebra o padrão NestJS de guards declarativos via `@Roles`.

---

## DEC-003 — Service-to-service pattern (rotas `/internal/*`)

- **Data:** 2026-06-06
- **Sessão:** `20260606-waiter-order-bug`
- **Status:** Aceita

**Contexto**

O `OrderService.create()` chamava a rota pública `PATCH /stock/:id/adjust` (no `StockController`) propagando o header `x-user-role: <role>` do usuário. O `StockController` tem class-level `@Roles('OWNER', 'MANAGER')`, então o `RolesGuard` membership estrito (DEC-002) rejeitava roles como WAITER/CASHIER/DELIVERY/COMMON com `ForbiddenException("Acesso negado: necessário cargo OWNER ou MANAGER")`. O `OrderService` **já usava** a rota interna `POST /internal/stock/batch` para consulta de estoque (correto, sem `x-user-role`), mas **NÃO** havia equivalente interno para mutação. O sintoma se manifestava quando um WAITER tentava criar pedido: o `OrderController.create` aceitava WAITER (correto), mas a dedução de estoque falhava em uma chamada interna secundária.

**Decisão**

Toda chamada entre microserviços que **muta estado** deve usar uma rota `/internal/*` autenticada por `x-internal-key` (validado via `validateInternalKey` em `apps/stock/src/internal/internal.controller.ts`). Chamadas internas **nunca** devem propagar `x-user-role` nem `Authorization: <jwt>` — usar apenas `x-tenant-id` (contexto) e `x-internal-key` (autenticação de serviço).

**Consequências**

- (+) Isola mutações internas do `RolesGuard`, evitando dependência de roles do usuário em chamadas service-to-service.
- (+) Padrão consistente com `POST /internal/stock/batch` e `GET /internal/stock/:id` (pré-existentes).
- (+) Remove vetor de privilege escalation (CR2) para o caminho `OrderService → StockService`.
- (-) Cria endpoints "duplos" (interno + público) — manter disciplina ao adicionar novos.
- (-) CR2 permanece latente em outros vetores (JwtStrategy confia em `x-user-role`, CORS permite o header). Tratamento em sessão dedicada.

**Referências**

- `almocu-back/apps/stock/src/internal/internal.controller.ts` — `adjustInternal` (PATCH `:id/adjust`).
- `almocu-back/apps/order/src/order/order.service.ts` — call sites 220-237 e 245-262.
- `02-causa-raiz.md §3.1 (CR1)`, `§3.3 (CR3)`.

---

## DEC-004 — Alinhamento front/back (abilities pendentes — manter UI)

- **Data:** 2026-06-06
- **Sessão:** `20260606-waiter-order-bug`
- **Status:** Aceita

**Contexto**

O `PermissionStore` (frontend) concede `orders:cancel`, `orders:close-bill`, `orders:edit-items` para GARCOM e `orders:close-bill` para CAIXA, mas o backend (`@Roles` em `apps/order/src/order/order.controller.ts:144` e `allowedTransitions` em `order.service.ts:388-405`) rejeita essas roles. Resultado: o frontend exibe botões ("Cancelar Pedido", "Fechar Conta", "Retirar Itens") que retornam erro 403 quando clicados.

**Decisão (2026-06-06)**

**Manter** as abilities no `PermissionStore` para GARCOM e CAIXA. Decisão de produto: o usuário quer preservar a UI atual; a correção do backend virá em sessão dedicada. Adicionar comentário `// TODO 2026-06-06: ...` inline em cada ability sinalizando que o backend rejeita (preservar a chave para fácil reativação futura).

**Consequências**

- (+) UI preservada conforme decisão de produto.
- (-) Frontend continua exibindo botões que retornam erro 403 — usuário ciente.
- (-) Trabalho de alinhamento (ajustar `OrderService.updateStatus` e `@Roles` no `order.controller.ts:144`) fica em sessão futura.

**Ações realizadas nesta sessão**

- `stores/PermissionStore.ts` (linhas 85-87 e 101): comentários `TODO 2026-06-06` adicionados ao lado de 4 abilities. Nenhuma ability removida.

**Pendência (sessão futura)**

- Decidir se WAITER pode cancelar/fechar conta de pedido (e em quais status).
- Decidir se CASHIER pode fechar conta.
- Se aprovado: ajustar `OrderService.updateStatus` (`allowedTransitions`) e `order.controller.ts:144` (`@Roles(...)`).
- Reativar as abilities no `PermissionStore`.
- Atualizar esta DEC.
