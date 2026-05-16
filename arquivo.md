# 🚀 Almocu - Sistema de Gestão Modular para Restaurantes
## Documentação Integrada do Ecossistema (Front-end & Back-end)

Este documento foi criado para servir como base de conhecimento definitiva para desenvolvedores e IAs. Ele descreve a arquitetura geral, o fluxo de multi-tenancy, os esquemas de banco de dados, os endpoints da API e a estrutura modular do front-end da plataforma **Almocu**.

---

## 📌 1. Visão Geral da Aplicação

O **Almocu** é uma plataforma SaaS de gestão de restaurantes estruturada em **módulos sob demanda**. O sistema permite que um restaurante matriz ou filial configure e ative módulos específicos (ex: Cardápio, Estoque, Pedidos, Financeiro Avançado) conforme suas necessidades operacionais.

### 🛠️ Tecnologias Utilizadas
*   **Front-end (Este Repositório):** Mobile & Web universal desenvolvido em **React Native + Expo** (Expo Router v3 para roteamento baseado em arquivos), estilizado com **TailwindCSS (via NativeWind)** e utilizando **MobX** para gerenciamento de estado reativo offline com persistência local via `AsyncStorage` / `localStorage`.
*   **Back-end (`almocu-back-main`):** Monorepo **NestJS** escalável, estruturado em microserviços de domínio que utilizam **MongoDB (Mongoose)** como banco de dados principal e **Redis** para caching, controle de concorrência e blacklist de tokens.

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
               │  - Resolução Dinâmica de Multi-Tenancy (x-tenant-id)     │
               │  - Reverse Proxy (http-proxy-middleware)                 │
               └────────────┬───────────────┼───────────────┬─────────────┘
                            │               │               │
                 /api/stock │     /api/menu │    /api/order │
                            ▼               ▼               ▼
               ┌────────────┐  ┌────────────┐  ┌────────────┐
               │ STOCK APP  │  │  MENU APP  │  │ ORDER APP  │
               │ (Porta 3100│  │ (Porta 3200│  │ (Porta 3300│
               └────────────┘  └────────────┘  └────────────┘
```

### 🚦 Reverse Proxy e Portas de Serviço
Para facilitar o desenvolvimento, o front-end se comunica apenas com a porta **3000** (Gateway). O Gateway roteia a chamada baseado no prefixo da rota:
*   `POST :3000/auth/*` ou `POST :3000/restaurants/*` ➡️ Executado diretamente pelo **Auth App**.
*   `ANY :3000/api/stock/*` ➡️ Redirecionado para o **Stock App** (Porta `3100`) como `/stock/*`.
*   `ANY :3000/api/menu/*` ➡️ Redirecionado para o **Menu App** (Porta `3200`) como `/products/*`.
*   `ANY :3000/api/order/*` ➡️ Redirecionado para o **Order App** (Porta `3300`) como `/orders/*`.

---

## 🏢 3. Multi-Tenancy e Troca Dinâmica de Contexto

O Almocu suporta **Multi-Tenancy por Isolamento Lógico (Shared Database, Shared Process)**. Um único usuário pode pertencer a múltiplos restaurantes ou filiais, possuindo cargos (roles) distintos em cada um.

### ⚙️ Como funciona a Injeção de Contexto (Tenant Ingestion)
1.  **Token JWT:** Armazena o ID do restaurante padrão (`restaurantId`) e o cargo (`role`) associado no último login.
2.  **Troca de Contexto sem Relogar:** O front-end pode especificar um restaurante alvo enviando o `restaurantId` através de:
    *   **Header:** `x-restaurant-id: <ID_DO_RESTAURANTE>` (Prioridade máxima)
    *   **Body:** `{ "restaurantId": "<ID_DO_RESTAURANTE>", ... }`
    *   **Query:** `?restaurantId=<ID_DO_RESTAURANTE>`
3.  **Validação no Gateway:** O `ProxyMiddleware` do Gateway intercepta a requisição, valida se o usuário possui vínculo ativo com o restaurante solicitado no banco e injeta os cabeçalhos de contexto Downstream:
    *   `x-user-id`: ID do usuário autenticado (`sub`)
    *   `x-tenant-id`: ID do restaurante validado
    *   `x-user-role`: Cargo do usuário no restaurante validado
4.  **Consumo Downstream:** Os microserviços de menu, stock e order utilizam uma estratégia comum (`JwtStrategy` compartilhada em `libs/common`) que lê preferencialmente esses cabeçalhos validados para injetar o contexto no objeto `req.user` dos controllers.

### 👥 Níveis de Permissões (Roles)
*   `OWNER`: Dono do restaurante (acesso total).
*   `MANAGER`: Gerente.
*   `WAITER`: Garçom.
*   `KITCHEN`: Equipe da Cozinha.
*   `CASHIER`: Operador de Caixa.
*   *Nota: Administradores globais (`globalRoles: ['admin']`) ignoram as travas de restaurante e possuem acesso total (`OWNER`) a qualquer contexto.*

---

## 🗄️ 4. Class Schemas (Banco de Dados Mongoose)

Os schemas estão distribuídos entre a biblioteca compartilhada (`libs/common`) e os respectivos microserviços.

### 👤 Usuário (`UserSchema` - `apps/auth`)
Representa a conta global do usuário do sistema.
```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ unique: true, required: true, trim: true, lowercase: true })
  username!: string;

  @Prop({ required: false, select: false }) // Opcional para logins via OAuth/Google
  password?: string;

  @Prop({ unique: true, required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ unique: true, sparse: true })
  googleId?: string;

  @Prop({ type: [String], default: ['user'] })
  globalRoles!: string[]; // Ex: ['admin'] ou ['user']

  @Prop({ default: true })
  isActive!: boolean;
}
```

### 🤝 Vínculo Usuário-Restaurante (`UserRestaurantSchema` - `apps/auth`)
Resolve a relação *N:N* (Muitos para Muitos) entre Usuários e Restaurantes com controle de acesso baseado em cargo.
```typescript
export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  KITCHEN = 'KITCHEN',
  CASHIER = 'CASHIER',
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
// Índice de Unicidade: Garante vínculo único de um usuário por restaurante
UserRestaurantSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });
```

### 🏢 Restaurante / Filial (`RestaurantSchema` - `apps/auth`)
Representa a matriz (master) ou filiais do negócio.
```typescript
@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  cnpj: string;

  @Prop({ unique: true, required: true })
  inviteCode: string; // Código alfanumérico para novos funcionários ingressarem

  @Prop({ enum: ['BASIC', 'PROFESSIONAL', 'NETWORK', 'PREMIUM'], default: 'BASIC' })
  plan: string;

  @Prop({ default: 1 })
  maxBranches: number;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', default: null })
  parentId: Types.ObjectId; // Se null, é o restaurante principal (Matriz). Caso contrário, aponta para o pai.

  @Prop({ default: 'active', enum: ['active', 'pending', 'suspended'] })
  status: string;
}
```

### 🍔 Produto do Cardápio (`ProductSchema` - `libs/common`)
Schema de produtos de cardápio compartilhado e utilizado pelo microserviço de **Menu**.
```typescript
@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  brand!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: false })
  description!: string;

  @Prop({ required: true })
  stockProductId!: string; // ID correspondente ao item no microserviço de estoque

  @Prop({ required: true, index: true })
  restaurantId!: string; // Relacionamento lógico multi-tenant

  @Prop({ required: true })
  userId!: string; // Usuário que cadastrou
}
// Índice composto de unicidade: impede produtos duplicados com mesmo nome/marca na mesma filial
ProductSchema.index({ name: 1, brand: 1, restaurantId: 1 }, { unique: true });
```

### 📦 Item de Estoque/Insumo (`StockSchema` - `apps/stock`)
Gerencia o inventário físico de insumos ou produtos armazenados na coleção `'products'` para compatibilidade de legado.
```typescript
@Schema({ timestamps: true, collection: 'products' })
export class Stock {
  @Prop({ required: true })
  name!: string;

  @Prop({ default: '' })
  brand!: string;

  @Prop({ required: true })
  unit!: string; // Ex: 'kg', 'unidade', 'litro'

  @Prop({ default: 0 })
  minQuantity!: number; // Limite mínimo para disparar alerta de estoque baixo

  @Prop({ required: true, min: 0 })
  quantity!: number; // Quantidade atual física

  @Prop({ required: true, type: String })
  restaurantId!: string;

  @Prop({ required: true, type: String })
  userId!: string;
}
// Evita itens de estoque duplicados com mesmo nome e marca no mesmo restaurante
StockSchema.index({ name: 1, brand: 1, restaurantId: 1 }, { unique: true });
```

### 🛍️ Pedido (`OrderSchema` - `apps/order`)
Gerencia o fluxo de pedidos de mesa, balcão ou delivery do restaurante.
```typescript
@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;
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
    enum: ['pendente', 'em_preparo', 'pronto', 'entregue', 'cancelado'],
    default: 'pendente',
  })
  status: string;

  @Prop({ maxlength: 50 })
  origin: string; // Ex: 'mesa_3', 'balcao', 'whatsapp'

  @Prop({ maxlength: 500 })
  observations: string; // Observações gerais de preparo do pedido
}
```

---

## 🚦 5. Catálogo Completo de Endpoints da API

Todos os endpoints que exigem autenticação requerem o envio do token JWT no cabeçalho `Authorization: Bearer <TOKEN>`.

### 🔑 Módulo de Autenticação (`/auth`)
*   `POST /auth/register`: Cadastro de novo usuário.
    *   *Body:* `{ username, password, email, name }`
*   `POST /auth/login`: Autenticação e geração de JWT.
    *   *Body:* `{ username, password, restaurantId? }`
*   `POST /auth/logout`: Invalidação imediata de token (adicionado ao Redis).
*   `GET /auth/me`: Retorna os dados do perfil ativo, lista de roles globais e tenant ativo.
*   `GET /auth/google`: Inicia o redirecionamento para Google OAuth (suporta query `?redirect_uri=` para deep links em aplicativos móveis).
*   `GET /auth/google/callback`: Retorno de autenticação do Google que injeta o token de acesso como parâmetro na URL de redirecionamento ou retorna JSON.

### 🏢 Módulo de Restaurantes (`/restaurants`)
*   `POST /restaurants`: Criação de um restaurante master (Matriz).
    *   *Body:* `{ name, cnpj, maxBranches? }`
*   `POST /restaurants/branch`: Criação de uma filial vinculada a um master.
    *   *Body:* `{ name, parentId }`
*   `POST /restaurants/join`: Ingressa em um restaurante enviando código de convite do staff.
    *   *Body:* `{ inviteCode }`
*   `GET /restaurants/my`: Lista todos os restaurantes aos quais o usuário autenticado pertence.
*   `GET /restaurants/:id/staff`: Lista os funcionários do restaurante ativo (Requer permissão `OWNER` ou `MANAGER`).
*   `PATCH /restaurants/:id/staff/:userId`: Altera a função de um membro do staff.
    *   *Body:* `{ role: UserRole }` (Requer permissão `OWNER` ou `MANAGER`).
*   `DELETE /restaurants/:id/staff/:userId`: Desvincula/remove funcionário da equipe (Requer permissão `OWNER` ou `MANAGER`).

### 🍔 Módulo de Cardápio / Produtos (`/api/menu` ➡️ `/products` downstream)
*   `POST /api/menu`: Cria um novo produto no cardápio.
    *   *Body:* `{ name, brand, price, description?, stockProductId }`
*   `GET /api/menu`: Lista produtos cadastrados (Suporta paginação via query: `?page=1&limit=10`).
*   `GET /api/menu/:id`: Detalha informações de um produto específico.
*   `PATCH /api/menu/:id`: Atualiza campos específicos do produto.
    *   *Body:* `UpdateProductDto` (parcial do schema do produto).
*   `DELETE /api/menu/:id`: Remove produto do cardápio.
*   `POST /api/menu/batch`: Busca múltiplos produtos a partir de um array de IDs passados no corpo.
    *   *Body:* `{ ids: string[] }`

### 📦 Módulo de Estoque / Insumos (`/api/stock` ➡️ `/stock` downstream)
*   `POST /api/stock`: Cadastra novo item ou insumo no estoque físico.
    *   *Body:* `{ name, brand?, unit, minQuantity, quantity }`
*   `GET /api/stock`: Lista os insumos do estoque (Suporta paginação via query: `?page=1&limit=10`).
*   `GET /api/stock/:id`: Busca detalhes de um insumo específico.
*   `PATCH /api/stock/:id`: Atualiza as propriedades gerais de um insumo.
*   `PATCH /api/stock/:id/adjust`: Altera o estoque de forma incremental (entrada ou saída física).
    *   *Body:* `{ delta: number }` (ex: `delta: -5` reduz 5 unidades, `delta: 10` soma 10 unidades).
*   `DELETE /api/stock/:id`: Remove o insumo do sistema de estoque.

### 🛍️ Módulo de Pedidos (`/api/order` ➡️ `/orders` downstream)
*   `POST /api/order`: Cria um novo pedido no restaurante.
    *   *Body:* `{ items: [{ productId, name, quantity, price }], totalValue, origin, observations? }`
*   `GET /api/order`: Lista todos os pedidos pendentes e ativos do restaurante.
*   `GET /api/order/user`: Lista todos os pedidos realizados/associados ao usuário atual.
*   `GET /api/order/:id`: Detalha as informações de um pedido.
*   `PATCH /api/order/:id/status`: Avança ou atualiza o status de preparo de um pedido.
    *   *Body:* `{ status: 'pendente' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado' }`
*   `DELETE /api/order/:id`: Cancela ou deleta permanentemente um pedido.

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
├── login/                    # Tela de autenticação por e-mail/senha
├── register/                 # Tela de criação de conta
└── forgot-password/          # Tela de recuperação de credenciais
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

### 💾 Mocking e Funcionamento Standalone
O front-end possui um mecanismo resiliente de **Mocking nativo** controlado pelo `DataStore.ts` e `AuthStore.ts` usando MobX.
*   **Modo Isolado / Offline:** Caso não haja backend ativo, o aplicativo funciona perfeitamente de maneira standalone. Ele lê e grava dados em estruturas de Seed no `localStorage` ou `AsyncStorage`.
*   **Adaptação de Produção:** Para integração real, os arquivos vazios em `/services` (ex: `api-menu-service.ts`, `api-stock-service.ts`) podem ser instanciados consumindo a instância global `api` definida em `api-service.ts` que aponta para o Gateway (Porta `3000`).

---

## 💡 Resumo para Novas Consultas de IA
> [!NOTE]
> *   Sempre trate o back-end como um monorepo multi-tenant escalável baseado em microserviços.
> *   Lembre-se de que a validação de acesso ao restaurante selecionado (`x-restaurant-id`) ocorre estritamente no Gateway/Auth App via `ProxyMiddleware`, que depois injeta `x-tenant-id` para as outras rotas.
> *   O front-end utiliza uma estrutura de roteamento baseada em pastas agrupadas sob a convenção do Expo Router `(auth)/`.
