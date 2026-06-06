# 🚀 Almocu - Sistema de Gestão Modular para Restaurantes
## Documentação Integrada do Ecossistema (Front-end & Back-end)

Este documento foi criado para servir como base de conhecimento definitiva para desenvolvedores e IAs. Ele descreve a arquitetura geral, o fluxo de multi-tenancy, os esquemas de banco de dados, os endpoints da API e a estrutura modular do front-end da plataforma **Almocu**.

> Última atualização: 2026-06-02

---

## 📌 1. Visão Geral da Aplicação

O **Almocu** é uma plataforma SaaS de gestão de restaurantes estruturada em **módulos sob demanda**. O sistema permite que um restaurante matriz ou filial configure e ative módulos específicos (ex: Cardápio, Estoque, Pedidos, Financeiro Avançado) conforme suas necessidades operacionais.

### 🛠️ Tecnologias Utilizadas
*   **Front-end (Este Repositório):** Mobile & Web universal desenvolvido em **React Native + Expo** (Expo Router v3 para roteamento baseado em arquivos), estilizado com **TailwindCSS (via NativeWind)** e utilizando **MobX** para gerenciamento de estado reativo com persistência local via `AsyncStorage` / `localStorage`.
*   **Back-end (`almocu-back/`):** Monorepo **NestJS 11** (runtime **Bun**) escalável, estruturado em microserviços de domínio que utilizam **MongoDB 7 (Mongoose 8)** como banco de dados e **Redis (ioredis)** para caching, controle de concorrência, blacklist de tokens e anti-colisão de códigos TOTP. Pagamentos via **Stripe SDK**.

### 🔁 Principais Fluxos de Negócio
1. **Usuário** se registra/login → recebe JWT.
2. **Owner** cria restaurante → gera código TOTP de convite → convida staff.
3. **Staff** ingressa via código TOTP de 6 dígitos (janela de 30s) → vinculado ao restaurante.
4. **Gerente** cadastra fornecedores e itens de estoque, depois cria produtos (receitas) no cardápio com ingredientes vinculados ao estoque.
5. **Garçom** cria pedidos → sistema deduz ingredientes do estoque automaticamente via API.
6. **Cozinha/Entrega** atualiza status do pedido conforme máquina de estados controlada por role.
7. **Pagamento** opcional via **Stripe Checkout** (sessão avulsa).

---

## 🏗️ 2. Arquitetura e Fluxo de Comunicação (Microserviços)

O back-end utiliza uma arquitetura de microserviços com um **API Gateway centralizado** incorporado no serviço de **Auth**.

```text
               ┌──────────────────────────────────────────────────────────┐
               │              FRONT-END (React Native / Expo)             │
               └────────────────────────────┬─────────────────────────────┘
                                            │ (Porta 3000)
                                            ▼
               ┌──────────────────────────────────────────────────────────┐
               │               API GATEWAY / AUTH SERVICE                 │
               │  - Autenticação e Blacklist (JWT + Redis)                │
               │  - Throttler (rate limit em /auth/login, /auth/register) │
               │  - Resolução Dinâmica de Multi-Tenancy (x-tenant-id)     │
               │  - Reverse Proxy (http-proxy-middleware)                 │
               └────────────┬───────────────┼───────────────┬─────────────┘
                            │               │               │
                 /api/stock │     /api/menu │    /api/order │
                            ▼               ▼               ▼
               ┌────────────┐  ┌────────────┐  ┌────────────┐
               │ STOCK APP  │  │  MENU APP  │  │ ORDER APP  │
               │ (Porta 3100│  │ (Porta 3200│  │ (Porta 3300│
               │  stock +   │  │  products) │  │  orders +  │
               │ suppliers) │  │            │  │  stripe)   │
               └────────────┘  └────────────┘  └────────────┘
```

### 🚦 Reverse Proxy e Roteamento Interno

O front-end se comunica **apenas com a porta 3000** (Gateway). Em produção (Docker), todos os microserviços expõem a porta interna 3000 (`stock-app:3000`, `menu-app:3000`, `order-app:3000`); em dev local, cada um usa as portas 3100/3200/3300. O `ProxyMiddleware` (`apps/auth/src/common/middlewares/proxy.middleware.ts`) roteia conforme o prefixo:

| Rota Externa | Reescrita Interna | Serviço Destino |
| :--- | :--- | :--- |
| `POST :3000/auth/*` | (executa local) | Auth App |
| `POST :3000/restaurants/*` | (executa local) | Auth App |
| `ANY :3000/api/stock/suppliers/*` | `/suppliers/*` | Stock App |
| `ANY :3000/api/stock/*` | `/stock/*` | Stock App |
| `ANY :3000/api/menu/*` | `/products/*` | Menu App |
| `ANY :3000/api/order/stripe/*` | `/stripe/*` | Order App |
| `ANY :3000/api/order/*` | `/orders/*` | Order App |

---

## 🏢 3. Multi-Tenancy e Troca Dinâmica de Contexto

O Almocu suporta **Multi-Tenancy por Isolamento Lógico (Shared Database, Shared Process)**. Um único usuário pode pertencer a múltiplos restaurantes ou filiais, possuindo cargos (roles) distintos em cada um.

### ⚙️ Injeção de Contexto (Tenant Ingestion)
1. **Token JWT:** Armazena `sub` (userId), `username`, `globalRoles`, `restaurantId` padrão e `role` associado no último login.
2. **Troca de Contexto sem relogar:** O front-end pode acessar dados de qualquer restaurante ao qual tenha vínculo enviando o `restaurantId` alvo através de (em ordem de prioridade):
    *   **Header:** `x-restaurant-id: <ID_DO_RESTAURANTE>` *(Recomendado e prioritário)*
    *   **Body:** `{ "restaurantId": "<ID_DO_RESTAURANTE>", ... }`
    *   **Query:** `?restaurantId=<ID_DO_RESTAURANTE>`
3. **Validação no Gateway:** O `ProxyMiddleware` verifica o JWT, valida se o usuário possui vínculo ativo (`UserRestaurant`) com o restaurante solicitado, e injeta os cabeçalhos confiáveis downstream:
    *   `x-user-id`: ID do usuário (`sub`)
    *   `x-tenant-id`: ID do restaurante validado
    *   `x-user-role`: Cargo do usuário no restaurante validado
4. **Consumo Downstream:** Os microserviços (menu, stock, order) usam a `JwtStrategy` compartilhada em `libs/common/src/strategies/jwt.strategy.ts`, que lê os headers já validados pelo gateway e popula `req.user` para os controllers.

### 👥 Níveis de Permissões (Roles)
*   `OWNER` — Dono do restaurante (acesso total).
*   `MANAGER` — Gerente.
*   `WAITER` — Garçom.
*   `KITCHEN` — Equipe da cozinha.
*   `CASHIER` — Operador de caixa.
*   `DELIVERY` — Entregador.
*   `COMMON` — Cliente comum / acesso básico.

> Administradores globais (`globalRoles: ['admin']`) ignoram as travas de restaurante e operam como `OWNER` em qualquer contexto.

---

## 🗄️ 4. Class Schemas (Banco de Dados Mongoose)

Os schemas estão distribuídos entre as bibliotecas compartilhadas (`libs/common`) e os respectivos microserviços.

### 👤 Usuário (`UserSchema` — `apps/auth/src/users/user.schema.ts`)
```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, required: true, trim: true, lowercase: true })
  username!: string;

  @Prop({ required: false, select: false }) // Opcional para login via Google OAuth
  password?: string;

  @Prop({ unique: true, required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop({ type: [String], default: ['user'] })
  globalRoles!: string[]; // Ex.: ['admin'] ou ['user']

  @Prop({ default: true })
  isActive!: boolean;
}
```

### 🤝 Vínculo Usuário-Restaurante (`UserRestaurantSchema` — `apps/auth/src/users/user-restaurant.schema.ts`)
```typescript
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  CASHIER = 'CASHIER',
  DELIVERY = 'DELIVERY',
  COMMON = 'COMMON',
}

@Schema({ timestamps: true })
export class UserRestaurant {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurantId!: Types.ObjectId;

  @Prop({ required: true, enum: UserRole, default: UserRole.WAITER })
  role!: UserRole;

  @Prop({ default: 'active', enum: ['active', 'pending', 'inactive'] })
  status!: string;
}
UserRestaurantSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });
```

### 🏢 Restaurante / Filial (`RestaurantSchema` — `apps/auth/src/restaurants/restaurant.schema.ts`)
> A partir desta versão o convite de staff usa **TOTP** (RFC 6238). O campo `inviteCode` estático foi substituído por `totpSecret`, e o código de 6 dígitos é gerado dinamicamente (janela de 30s, tolerância de 1 janela anterior).
```typescript
@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  cnpj: string;

  @Prop({ unique: true, required: true, select: false })
  totpSecret: string; // Chave secreta TOTP (HMAC-SHA1, 6 dígitos, 30s)

  @Prop({ enum: ['BASIC', 'PROFESSIONAL', 'NETWORK', 'PREMIUM'], default: 'BASIC' })
  plan: string;

  @Prop({ default: 1 })
  maxBranches: number;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', default: null })
  parentId: Types.ObjectId; // null = matriz; preenchido = filial

  @Prop({ default: 'active', enum: ['active', 'pending', 'suspended'] })
  status: string;
}
```

### 🍔 Produto do Cardápio (`ProductSchema` — `apps/menu/src/product/product.schema.ts`)
> Cada produto agora possui um array de **ingredientes** referenciando itens do estoque, permitindo descontar quantidades de múltiplos insumos ao registrar um pedido. O backend serve as imagens uploaded em `/uploads/products/*` (estático).
```typescript
@Schema({ _id: false })
class Ingredient {
  @Prop({ type: Types.ObjectId, required: true })
  stockProductId!: Types.ObjectId; // Item de estoque consumido

  @Prop({ required: true, min: 0 })
  quantity!: number; // Quantidade do insumo por unidade produzida
}

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, example: 'Hamburgueres', description: 'Categoria do produto' })
  category!: string;

  @Prop({ required: true })
  price!: number;

  @Prop()
  description?: string;

  @Prop({ required: false, description: 'Caminho relativo servido em /uploads/products/*' })
  imageUrl?: string;

  @Prop({ type: [IngredientSchema], required: true })
  ingredients!: Ingredient[];

  @Prop({ required: true, index: true })
  restaurantId!: string;
}
ProductSchema.index({ name: 1, category: 1, restaurantId: 1 }, { unique: true });
```

### 📦 Item de Estoque (`StockSchema` — `apps/stock/src/stock/stock.schema.ts`)
> A coleção foi renomeada para `stock_items` (anteriormente compartilhava `products`). O campo virtual `lowStock` indica se o item está abaixo do mínimo.
```typescript
@Schema({
  timestamps: true,
  collection: 'stock_items',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Stock {
  @Prop({ required: true })
  unit!: string; // 'kg', 'un', 'l', etc.

  @Prop({ default: 0 })
  minQuantity!: number;

  @Prop({ required: true, index: true })
  name!: string;

  @Prop({ default: '' })
  brand!: string;

  @Prop({ required: true, min: 0 })
  quantity!: number;

  // Virtual: quantity <= minQuantity
  lowStock?: boolean;

  @Prop({ required: true, type: String })
  restaurantId!: string;

  @Prop({ required: true, type: String })
  userId!: string;

  @Prop({ type: String })
  supplierId?: string; // Fornecedor preferencial
}
StockSchema.virtual('lowStock').get(function () {
  return this.quantity <= this.minQuantity;
});
StockSchema.index({ name: 1, brand: 1, restaurantId: 1 }, { unique: true });
```

### 🚚 Fornecedor (`SupplierSchema` — `apps/stock/src/supplier/supplier.schema.ts`)
Cadastro de fornecedores associados a um restaurante. Pode ser referenciado por itens de estoque via `supplierId`.
```typescript
@Schema({ _id: false })
class Address {
  @Prop({ required: true }) street: string;
  @Prop({ required: true }) number: string;
  @Prop() neighborhood?: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true, maxlength: 2 }) state: string;
  @Prop() zipCode?: string;
  @Prop() complement?: string;
}

@Schema({ timestamps: true, collection: 'suppliers' })
export class Supplier {
  @Prop({ required: true, index: true })
  name!: string;

  @Prop() contactName?: string;
  @Prop() phone?: string;
  @Prop() email?: string;
  @Prop() cnpj?: string;
  @Prop({ type: AddressSchema }) address?: Address;
  @Prop() notes?: string;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ required: true, type: String })
  restaurantId!: string;

  @Prop({ required: true, type: String })
  userId!: string;
}
SupplierSchema.index({ name: 1, restaurantId: 1 }, { unique: true });
SupplierSchema.index({ cnpj: 1, restaurantId: 1 }, { unique: true, sparse: true });
```

### 🛍️ Pedido (`OrderSchema` — `apps/order/src/order/order.schema.ts`)
> O schema agora inclui endereço de entrega, status do pagamento e referência à sessão do Stripe. O fluxo de status ganhou a etapa `saiu_para_entrega`.
```typescript
@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, required: true })
  productId: Types.ObjectId;
  @Prop({ required: true }) name: string;
  @Prop({ required: true, min: 1 }) quantity: number;
  @Prop({ required: true, min: 0 }) price: number;
}

@Schema({ _id: false })
export class DeliveryAddress {
  @Prop({ required: true }) street: string;
  @Prop({ required: true }) number: string;
  @Prop() neighborhood?: string;
  @Prop({ required: true }) city: string;
  @Prop({ required: true, maxlength: 2 }) state: string;
  @Prop() zipCode?: string;
  @Prop() complement?: string;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  restaurantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  totalValue: number;

  @Prop({
    required: true,
    enum: ['pendente', 'em_preparo', 'pronto', 'saiu_para_entrega', 'entregue', 'cancelado'],
    default: 'pendente',
  })
  status: string;

  @Prop({ type: DeliveryAddressSchema })
  deliveryAddress?: DeliveryAddress;

  @Prop({ maxlength: 50 })
  origin: string;

  @Prop({ maxlength: 500 })
  observations: string;

  @Prop({
    enum: ['pending', 'paid', 'unpaid', 'canceled', 'refunded'],
    default: 'pending',
  })
  paymentStatus: string;

  @Prop()
  stripeSessionId: string;
}
OrderSchema.index({ restaurantId: 1, createdAt: -1 });
OrderSchema.index({ userId: 1, createdAt: -1 });
```

### 🔁 Máquina de Estados do Pedido (Transições por Role)

```text
pendente → em_preparo → pronto → saiu_para_entrega → entregue
                                                ↘ cancelado (a partir de qualquer estado)
```

| Role | Transições permitidas |
| :--- | :--- |
| `KITCHEN` | `pendente → em_preparo`, `em_preparo → pronto` |
| `DELIVERY` | `pronto → saiu_para_entrega`, `saiu_para_entrega → entregue` |
| `OWNER` / `MANAGER` | Qualquer transição, inclusive `cancelado` |

---

## 🚦 5. Catálogo Completo de Endpoints da API

Todos os endpoints autenticados requerem `Authorization: Bearer <TOKEN>`. Rotas de microserviços (`/api/*`) também exigem `x-restaurant-id` no header para definir o contexto multi-tenant.

### 🔑 Módulo de Autenticação (`/auth`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/auth/register` | Cadastro de novo usuário. Body: `{ username, password, email, name }`. *(Throttle: 3 req/60s)* |
| `POST` | `/auth/login` | Autenticação local e emissão de JWT. Body: `{ username, password }`. *(Throttle: 5 req/60s)* |
| `POST` | `/auth/logout` | Invalida o token atual (adiciona à blacklist no Redis). |
| `GET`  | `/auth/me` | Retorna dados do perfil ativo (`id, username, globalRoles, restaurantId, activeRole`). |
| `PATCH`| `/auth/password` | Altera a senha do usuário autenticado. Body: `{ currentPassword, newPassword }` (min. 6 chars). |
| `GET`  | `/auth/google` | Inicia o redirecionamento para Google OAuth (aceita `?redirect_uri=` para deep link mobile). |
| `GET`  | `/auth/google/callback` | Callback Google; injeta `token` como query string no `redirect_uri` ou retorna JSON. |

### 🏢 Módulo de Restaurantes (`/restaurants`)
| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/restaurants` | Cria um restaurante master (matriz). Body: `{ name, cnpj, maxBranches? }`. |
| `POST` | `/restaurants/branch` | Cria uma filial vinculada a um master. Body: `{ name, parentId }`. |
| `POST` | `/restaurants/join` | Ingressa em um restaurante via código TOTP. Body: `{ inviteCode }` (6 dígitos). |
| `GET`  | `/restaurants/:id/invite-code` | Retorna o código TOTP atual + segundos restantes. *(Requer OWNER/MANAGER)* |
| `GET`  | `/restaurants/my` | Lista os restaurantes do usuário autenticado. |
| `GET`  | `/restaurants/:id/staff` | Lista funcionários do restaurante (paginado). *(Requer OWNER/MANAGER)* |
| `PATCH`| `/restaurants/:id/staff/:userId` | Altera a função de um membro. Body: `{ role: UserRole }`. *(Requer OWNER/MANAGER)* |
| `DELETE`| `/restaurants/:id/staff/:userId` | Desvincula funcionário. *(Requer OWNER/MANAGER)* |

### 🍔 Módulo de Cardápio (`/api/menu` ➡️ `/products`)
| Método | Rota | Roles permitidos | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/menu` | OWNER, MANAGER | Cria um novo produto. Body: `{ name, category, price, description?, ingredients: [{ stockProductId, quantity }] }`. |
| `GET`  | `/api/menu` | WAITER, KITCHEN, DELIVERY, OWNER, MANAGER | Lista produtos paginados (`?page=1&limit=10`). |
| `GET`  | `/api/menu/:id` | WAITER, KITCHEN, DELIVERY, OWNER, MANAGER | Detalha um produto. |
| `PATCH`| `/api/menu/:id` | OWNER, MANAGER | Atualiza um produto. Body: `UpdateProductDto` (campos opcionais: `name`, `category`, `price`, `description`, `ingredients`). |
| `DELETE`| `/api/menu/:id` | OWNER, MANAGER | Remove um produto. |
| `POST` | `/api/menu/:id/upload` | OWNER, MANAGER | Faz upload da imagem do produto (`multipart/form-data`, campo `image`, máx. 5MB; jpeg/png/gif/webp). Atualiza `imageUrl` para `/uploads/products/{filename}`. |
| `POST` | `/api/menu/batch` | WAITER, KITCHEN, DELIVERY, OWNER, MANAGER | Busca múltiplos produtos por IDs. Body: `{ ids: string[] }`. |

### 📦 Módulo de Estoque (`/api/stock` ➡️ `/stock`)
Todos os endpoints exigem role `OWNER` ou `MANAGER`.

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/stock` | Cadastra novo item. Body: `{ name, brand?, unit, quantity, minQuantity?, supplierId? }`. |
| `GET`  | `/api/stock` | Lista itens paginados (`?page=1&limit=10`). |
| `GET`  | `/api/stock/:id` | Detalha um item. |
| `PATCH`| `/api/stock/:id` | Atualiza propriedades gerais do item. |
| `PATCH`| `/api/stock/:id/adjust` | Ajusta quantidade incrementalmente. Body: `{ delta: number }` (ex.: `-5` ou `+10`). |
| `DELETE`| `/api/stock/:id` | Remove um item. |

### 🚚 Módulo de Fornecedores (`/api/stock/suppliers` ➡️ `/suppliers`)
Todos os endpoints exigem role `OWNER` ou `MANAGER`.

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/stock/suppliers` | Cria um fornecedor. Body: `{ name, contactName?, phone?, email?, cnpj?, address?, notes?, isActive? }`. |
| `GET`  | `/api/stock/suppliers` | Lista fornecedores paginados. |
| `GET`  | `/api/stock/suppliers/:id` | Detalha um fornecedor. |
| `PATCH`| `/api/stock/suppliers/:id` | Atualiza um fornecedor. |
| `DELETE`| `/api/stock/suppliers/:id` | Remove um fornecedor. |

### 🛍️ Módulo de Pedidos (`/api/order` ➡️ `/orders`)
| Método | Rota | Roles permitidos | Descrição |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/order` | WAITER, OWNER, MANAGER | Cria pedido (e abate insumos do estoque). Body: `{ items: [{ productId, quantity }], deliveryAddress?, origin?, observations? }`. |
| `GET`  | `/api/order` | KITCHEN, DELIVERY, OWNER, MANAGER | Lista pedidos do restaurante (paginado). |
| `GET`  | `/api/order/user` | WAITER, KITCHEN, DELIVERY, OWNER, MANAGER | Lista pedidos do usuário autenticado (paginado). |
| `GET`  | `/api/order/:id` | WAITER, KITCHEN, DELIVERY, OWNER, MANAGER | Detalha um pedido. |
| `PATCH`| `/api/order/:id/status` | KITCHEN, DELIVERY, OWNER, MANAGER | Atualiza status (respeita máquina de estados por role). Body: `{ status }`. |
| `DELETE`| `/api/order/:id` | OWNER, MANAGER | Deleta um pedido. |

> ⚠️ **KITCHEN não pode criar pedido** — apenas visualizar e atualizar status. Regra de negócio D1 (ver `DECISIONS.md` DEC-001).

### 💳 Módulo de Pagamentos (`/api/order/stripe` ➡️ `/stripe`)
Endpoints autenticados via JWT (sem restrição por role explícita; controle via fluxo da aplicação).

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET`  | `/api/order/stripe/test` | Testa a conexão com o Stripe. |
| `POST` | `/api/order/stripe/checkout` | Cria sessão de Checkout. Body: `{ items: [{ name, amount, quantity }] }` (`amount` em centavos). Retorna `{ success, url, sessionId }`. |
| `GET`  | `/api/order/stripe/verify/:sessionId` | Verifica status do pagamento de uma sessão. Retorna `{ success, paymentStatus, customerEmail }`. |

---

## 📱 6. Arquitetura Modular do Front-end (React Native)

O aplicativo móvel e web universal é totalmente modular. O fluxo de navegação do usuário se ajusta dinamicamente às permissões do token e às subscrições ativas do restaurante.

### 📂 Estrutura de Pastas do App (Expo Router)
```text
app/
├── (auth)/                   # 🔐 Rotas Protegidas (Exigem Login)
│   ├── _layout.tsx           # Configuração de tabs, drawer ou painel web
│   ├── dashboard/            # Módulo de métricas de faturamento e vendas
│   ├── cardapio/             # Módulo de cadastro e listagem de produtos
│   ├── pedidos/              # Módulo de cozinha / painel de pedidos ativos
│   ├── ingredientes/         # Módulo de estoque e suprimentos
│   ├── modulos/              # Módulo de loja e gerenciamento de abas
│   └── config/               # Configuração do perfil e restaurante
├── autoatendimento.tsx       # Tela de autoatendimento (cliente final)
├── login/                    # Tela de autenticação por usuário/senha
├── register/                 # Tela de criação de conta
├── forgot-password/          # Tela de recuperação de credenciais
└── +middleware.ts            # Guard global de rotas (proteção por sessão)
```

### 🧩 Catálogo de Módulos da Loja
Os módulos são gerenciados reativamente no `DataStore.ts`. Cada restaurante pode adquirir módulos que adicionam páginas ao menu de navegação lateral ou barra inferior.

| Módulo ID | Nome no App | Tipo | Preço Mensal | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| `dashboard` | **Dashboard** | Básico (Padrão) | `Grátis` | Visão geral de vendas, faturamento e desempenho comercial. |
| `cardapio` | **Cardápio** | Básico (Padrão) | `Grátis` | Cadastro e gestão completa do menu de refeições e bebidas. |
| `pedidos` | **Pedidos Ativos** | Básico (Padrão) | `Grátis` | Acompanhamento de pedidos em tempo real com alertas sonoros. |
| `ingredientes`| **Estoque de Insumos**| Básico (Padrão) | `Grátis` | Controle inteligente de insumos com alerta de baixo nível. |
| `financeiro` | **Financeiro Avançado**| Premium | `R$ 19,90` | Fluxo de caixa avançado, demonstrativo de DRE automático. |
| `fidelidade` | **Fidelidade & Cupons**| Premium | `R$ 12,90` | Criação de cashbacks acumulativos e cupons inteligentes. |
| `mesas` | **Mesas & Reservas** | Premium | `R$ 14,90` | Mapa interativo de mesas, comandas e QR code na mesa. |
| `delivery` | **Delivery Próprio** | Premium | `R$ 24,90` | Cardápio público próprio para vendas via link / WhatsApp. |

### 🌐 Camada de Serviços (HTTP)
A integração com o back-end vive em `/services` e segue um padrão consistente baseado na instância global `api` (axios) definida em `api-service.ts`, apontando para o Gateway na porta 3000.

| Arquivo | Domínio |
| :--- | :--- |
| `services/api-service.ts` | Instância base do axios + interceptors (JWT, `x-restaurant-id`, refresh). |
| `services/api-menu-service.ts` | CRUD do cardápio (`/api/menu`). |
| `services/api-stock-service.ts` | CRUD de estoque e fornecedores (`/api/stock` + `/api/stock/suppliers`). |
| `services/api-order-service.ts` | Pedidos e integração Stripe (`/api/order`, `/api/order/stripe`). |
| `services/api-staff-service.ts` | Restaurantes, staff e convites TOTP (`/restaurants/*`). |
| `services/cart-service.ts` | Estado do carrinho local antes de enviar como pedido. |

### 🗂️ Stores (MobX)
| Store | Responsabilidade |
| :--- | :--- |
| `stores/AuthStore.ts` | Estado de autenticação, token JWT, restaurante ativo e cargo. |
| `stores/DataStore.ts` | Catálogo de módulos, cardápio, pedidos e estoque em memória reativa. |
| `stores/ThemeStore.ts` | Tema visual (claro/escuro) e preferências de UI. |

---

## 💡 Resumo para Novas Consultas de IA
> [!NOTE]
> *   Sempre trate o back-end como um monorepo NestJS multi-tenant escalável baseado em microserviços (`auth`, `menu`, `stock`, `order`) com `libs/common` compartilhada.
> *   A validação de acesso ao restaurante selecionado (`x-restaurant-id`) ocorre **exclusivamente** no Gateway/Auth via `ProxyMiddleware`, que injeta `x-tenant-id`, `x-user-id` e `x-user-role` para os microserviços downstream.
> *   Convites de staff usam **TOTP** (6 dígitos, janela de 30s) — não há mais `inviteCode` estático.
> *   Produtos do cardápio contêm um array de **ingredientes** vinculados ao estoque; pedidos abatem automaticamente esses insumos.
> *   Pagamentos passam pelo módulo **Stripe Checkout** (`/api/order/stripe/*`).
> *   O front-end usa Expo Router com pastas agrupadas sob `(auth)/` para rotas protegidas e consome o Gateway através dos serviços em `/services`.
