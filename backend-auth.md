Listed directory src
Listed directory auth
Viewed auth.controller.ts:1-122
Viewed auth.service.ts:1-215
Viewed jwt.strategy.ts:1-61

Aqui está uma explicação detalhada de como funciona o fluxo de Autenticação no Almoçu Backend, baseado no código do microserviço `apps/auth`:

### 1. Register (Registro)
O registro é o processo de criação de uma nova conta de usuário.
- **Endpoint**: `POST /auth/register`
- **Fluxo**:
  1. O `AuthController` recebe o `RegisterDto` (nome, email, username e senha).
  2. O sistema verifica se o **username** ou **email** já estão em uso.
  3. A senha é criptografada utilizando a biblioteca **bcrypt** com 10 rounds de salt.
  4. O usuário é salvo no MongoDB com a role global padrão `['user']`.
  5. A senha nunca é retornada na resposta (removida automaticamente pelo schema).

### 2. Login (Autenticação)
O login utiliza o Passport.js com a estratégia `local` e gera um token JWT.
- **Endpoint**: `POST /auth/login`
- **Fluxo**:
  1. **Validação**: O `LocalStrategy` intercepta a requisição e chama o `validateUser` no `AuthService`. Ele busca o usuário no banco e compara a senha enviada com o hash salvo (via bcrypt).
  2. **Contexto de Restaurante**: Como o sistema é multi-tenant (suporta vários restaurantes):
     - O sistema busca a quais restaurantes o usuário está vinculado.
     - Se o usuário tiver apenas um restaurante, ele é selecionado automaticamente como ativo no token.
     - Se tiver vários, o usuário pode passar um `restaurantId` na requisição ou o sistema retornará que uma seleção é necessária.
  3. **Geração do JWT**: Se as credenciais estiverem corretas, o servidor gera um **Access Token (JWT)** contendo um *payload* com:
     - ID do usuário (`sub`)
     - Username
     - Roles globais
     - ID do restaurante ativo e a Role específica nele.
  4. **Resposta**: O servidor retorna o token e os dados do perfil do usuário.

### 3. Logout (Invalidação)
Diferente de sistemas que apenas apagam o token no frontend, este sistema implementa uma camada de segurança extra no backend.
- **Endpoint**: `POST /auth/logout`
- **Fluxo**:
  1. O usuário envia o token JWT no header `Authorization`.
  2. O `AuthService` decodifica o token para descobrir quanto tempo falta para ele expirar.
  3. O token é adicionado a uma **Blacklist no Redis**.
  4. **Verificação (JwtStrategy)**: Em todas as requisições protegidas, o `JwtStrategy` verifica no Redis se aquele token específico está na blacklist. Se estiver, a requisição é rejeitada com `401 Unauthorized`, mesmo que o token ainda seja matematicamente "válido" pela data de expiração.

### Resumo Tecnológico:
- **NestJS + Passport**: Gerenciamento de estratégias.
- **JWT (JSON Web Token)**: Token de acesso sem estado (stateless).
- **Bcrypt**: Criptografia de senhas.
- **Redis**: Armazenamento da blacklist para logouts imediatos.
- **MongoDB (Mongoose)**: Persistência dos dados de usuários e vínculos.

---
**Dica de Uso:** Para acessar rotas que exigem contexto de restaurante, você pode passar o header `x-restaurant-id` nas requisições, e o sistema validará automaticamente se você tem permissão de acesso àquele estabelecimento.