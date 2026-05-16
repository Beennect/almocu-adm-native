# Documentação da API: Almoçu Backend

Este documento detalha os módulos, estruturas de dados e endpoints do sistema Almoçu.

---

## 🔐 1. Módulo: Auth (Autenticação)
Responsável pelo registro, login e segurança do sistema.

### Estrutura de Dados (User)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | `String` | Identificador único (UUID/ObjectId) |
| `username` | `String` | Nome de usuário único |
| `email` | `String` | E-mail único |
| `password` | `String` | Senha (armazenada como hash Bcrypt) |
| `globalRoles` | `String[]` | Papéis globais (ex: `['user']`, `['admin']`) |
| `isActive` | `Boolean` | Status da conta |

### Endpoints
#### `POST /auth/register`
*   **Descrição**: Registra um novo usuário.
*   **Input (JSON)**:
    ```json
    { "username": "joao", "email": "joao@email.com", "password": "123", "name": "João Silva" }
    ```
*   **Output (JSON)**: Objeto do usuário criado (sem a senha).

#### `POST /auth/login`
*   **Descrição**: Autentica o usuário e retorna um token JWT.
*   **Input (JSON)**:
    ```json
    { "username": "joao", "password": "123", "restaurantId": "ID_OPCIONAL" }
    ```
*   **Output (JSON)**:
    ```json
    { "access_token": "eyJ...", "user": { "id": "...", "username": "joao", "restaurants": [] } }
    ```

#### `POST /auth/logout`
*   **Descrição**: Invalida o token atual (adiciona à blacklist).
*   **Input**: Token JWT no header `Authorization`.
*   **Output**: `{ "message": "Logout realizado com sucesso" }`

---

## 🍕 2. Módulo: Menu (Cardápio)
Gestão dos itens vendidos no estabelecimento.

### Estrutura de Dados (Product)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `name` | `String` | Nome do prato/bebida |
| `price` | `Number` | Preço de venda |
| `stockProductId` | `String` | ID do item correspondente no Estoque |
| `restaurantId` | `String` | ID do restaurante dono do item |

### Endpoints
#### `POST /products`
*   **Input (JSON)**:
    ```json
    { "name": "Burger Especial", "brand": "Artesanal", "price": 35.0, "stockProductId": "ID_NO_ESTOQUE" }
    ```
#### `GET /products`
*   **Query Params**: `page`, `limit`
*   **Output**: Lista paginada de produtos do restaurante ativo.

---

## 📦 3. Módulo: Stock (Estoque)
Controle físico de insumos e produtos.

### Estrutura de Dados (StockItem)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `name` | `String` | Nome do insumo (ex: Farinha) |
| `quantity` | `Number` | Quantidade atual |
| `unit` | `String` | Unidade (kg, un, lt) |
| `minQuantity` | `Number` | Limite para alerta de estoque baixo |

### Endpoints
#### `PATCH /stock/:id/adjust`
*   **Descrição**: Aumenta ou diminui a quantidade em estoque.
*   **Input (JSON)**:
    ```json
    { "delta": -5 } // Subtrai 5 unidades
    ```
*   **Output**: Objeto do item atualizado.

---

## 📝 4. Módulo: Order (Pedidos)
Gestão do fluxo de vendas.

### Estrutura de Dados (Order)
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `items` | `Array` | Lista de `{ productId, quantity }` |
| `totalValue` | `Number` | Soma dos preços dos itens |
| `status` | `Enum` | `pendente`, `em_preparo`, `pronto`, `entregue`, `cancelado` |

### Endpoints
#### `POST /orders`
*   **Input (JSON)**:
    ```json
    { 
      "items": [{ "productId": "...", "quantity": 2 }],
      "origin": "Balcão",
      "observations": "Sem picles"
    }
    ```
#### `PATCH /orders/:id/status`
*   **Input (JSON)**:
    ```json
    { "status": "em_preparo" }
    ```
