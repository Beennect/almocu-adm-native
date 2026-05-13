# Resumo do Projeto: Almoçu Backend

Este documento serve como uma base de conhecimento sobre o projeto **Almoçu**, um sistema de gestão (ERP) para lanchonetes e restaurantes. Ele resume o contexto de negócio, a arquitetura técnica e a estrutura do código-fonte para facilitar alterações futuras e a compreensão por outras IAs.

---

## 🎯 1. Visão Geral do Negócio

O **Almoçu** é uma solução focada em simplificar e automatizar a operação de estabelecimentos de alimentação (especialmente lanchonetes e pequenos restaurantes).

- **Problema**: Gerenciamento informal que leva a erros de pedidos, desperdício de estoque e atrasos.
- **Solução**: Um sistema integrado que cobre desde o atendimento (PDV) até o controle de insumos (Estoque).
- **Pilar Principal**: Foco na eficiência operacional imediata antes da análise de gestão complexa.

---

## 🛠️ 2. Stack Tecnológica

O backend é construído com uma arquitetura moderna e escalável:

- **Framework**: [NestJS](https://nestjs.com/) (Arquitetura Monorepo).
- **Linguagem**: TypeScript.
- **Banco de Dados**: MongoDB (ODM: Mongoose).
- **Autenticação**: JWT com Passport (suporte a Local Login e Google OAuth2).
- **Cache/Mensageria**: Redis (ioredis).
- **Documentação**: Swagger (OpenAPI).
- **Infraestrutura**: Docker e Docker Compose para orquestração de serviços.

---

## 📂 3. Estrutura do Repositório

O projeto utiliza a estrutura de monorepo do NestJS:

### `apps/` (Aplicações/Microsserviços)
1. **auth**: Gerencia o ciclo de vida do usuário, autenticação (JWT/Google) e o cadastro de restaurantes (multi-tenant).
2. **menu**: Responsável pelo cardápio, categorias e itens oferecidos.
3. **order**: Núcleo do sistema, gerencia a criação, status e histórico de pedidos.
4. **stock**: Controle de estoque e insumos.

### `libs/` (Código Compartilhado)
- **common**: Contém esquemas do MongoDB (Mongoose), guards de segurança, estratégias de autenticação e módulos compartilhados que são reutilizados por todas as apps.

---

## 🚀 4. Fluxo e Funcionalidades Principais

- **Multi-Tenant**: O sistema é preparado para gerenciar múltiplos restaurantes de forma isolada.
- **Controle de Acesso (RBAC)**: Diferenciação de permissões para Gerentes, Cozinheiros, Garçons e Entregadores.
- **Ciclo do Pedido**: Registro no PDV -> Cozinha (Status) -> Entrega/Consumo -> Atualização Automática de Estoque.
- **Sincronização**: Preparado para funcionamento offline e sincronização posterior com a nuvem.

---

## 📝 5. Guia para Desenvolvedores (IA ou Humanos)

Ao realizar alterações:
1. **Schemas**: Verifique se o schema deve estar na `lib/common` (se compartilhado) ou dentro da `app` específica.
2. **DTOs**: Sempre utilize `class-validator` nos DTOs para garantir a integridade dos dados na entrada das controllers.
3. **Novas Funcionalidades**: Siga o padrão de módulos do NestJS (Controller -> Service -> Schema).
4. **Ambiente**: Utilize o `docker-compose.yml` na raiz para subir as dependências (MongoDB, Redis).

---
*Este documento foi gerado automaticamente para servir de guia de contexto.*
