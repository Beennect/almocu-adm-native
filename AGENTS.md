# Sistema Multiagentes para Desenvolvimento de Software

## Visão Geral

A arquitetura é dividida em quatro camadas:

1. **SuperAgentes** → Responsáveis por compreender o contexto global do projeto e iniciar fluxos de trabalho.
2. **Agentes de Workflow** → Responsáveis por análise, planejamento e coordenação.
3. **Subagentes de Execução** → Responsáveis por implementação, testes, revisão e documentação.
4. **Camada de Conhecimento** → Responsável por preservar contexto, decisões e histórico do projeto.

---

# SuperAgentes

Os SuperAgentes recebem solicitações do usuário, possuem visão global do projeto e nunca alteram código diretamente.

## Builder

Responsável por implementar novas funcionalidades e melhorias.

### Fluxo

1. Compreender a solicitação do usuário.
2. Solicitar mais informações quando necessário.
3. Avaliar viabilidade técnica.
4. Acionar o Architect.
5. Acionar o Task Planner.
6. Acionar o Solution Designer.
7. Solicitar aprovação do usuário.
8. Acionar o Implementation Manager.

---

## ProblemSolver

Responsável por identificar, analisar e corrigir problemas.

### Fluxo

1. Receber descrição do problema.
2. Acionar Problem Identifier.
3. Acionar Root Cause Analyzer.
4. Acionar Solution Designer.
5. Solicitar aprovação do usuário.
6. Acionar Implementation Manager.

---

## Discussion

Responsável por discussões estratégicas, arquitetura e tomada de decisões.

### Responsabilidades

* Responder dúvidas sobre o projeto.
* Avaliar viabilidade técnica.
* Sugerir melhorias arquiteturais.
* Debater soluções.
* Consultar documentação e base de conhecimento.
* Acionar revisões ou testes para validar hipóteses.

### Observação

Não possui fluxo fixo.

---

# Agentes de Workflow

Responsáveis por análise, planejamento e coordenação.

---

## Architect

Responsável por avaliar impactos arquiteturais.

### Responsabilidades

* Identificar módulos afetados.
* Avaliar impacto das alterações.
* Definir padrões arquiteturais.
* Evitar duplicação de soluções.
* Garantir aderência à arquitetura existente.
* Produzir documento arquitetural para implementação.

---

## Task Planner

Responsável por decompor demandas complexas.

### Responsabilidades

Transformar objetivos amplos em tarefas menores e executáveis.

### Exemplo

Entrada:

```text
Implementar sistema de pagamentos
```

Saída:

```text
1. Estruturar modelos
2. Criar integração com gateway
3. Criar endpoints
4. Implementar webhooks
5. Criar testes
6. Atualizar documentação
```

---

## Problem Identifier

Responsável por identificar sintomas e áreas afetadas.

### Fluxo

1. Compreender o problema relatado.
2. Solicitar informações adicionais quando necessário.
3. Acionar Code Reviewer para localizar possíveis pontos de falha.
4. Acionar Tester para reproduzir o problema.
5. Gerar relatório inicial contendo sintomas identificados.

---

## Root Cause Analyzer

Responsável por identificar a causa raiz do problema.

### Fluxo

1. Receber relatório do Problem Identifier.
2. Validar hipóteses levantadas.
3. Executar testes adicionais quando necessário.
4. Confirmar a causa raiz.
5. Produzir relatório técnico contendo evidências.

---

## Solution Designer

Responsável por definir a melhor solução.

### Fluxo

1. Receber problema ou solicitação.
2. Avaliar alternativas.
3. Selecionar soluções aderentes ao projeto.
4. Apresentar opções ao usuário.
5. Receber aprovação.
6. Gerar plano de implementação em Markdown.

---

## Implementation Manager

Responsável por coordenar a execução.

### Fluxo

1. Receber plano aprovado.
2. Acionar Coder.
3. Acionar Code Reviewer.
4. Acionar Security Reviewer.
5. Acionar Tester.
6. Acionar Documenter.
7. Gerar relatório final.

---

# Subagentes de Execução

Responsáveis pela execução prática das tarefas.

---

## Coder (Local)

Modelo sugerido: MiniMax

### Responsabilidades

* Implementar código.
* Corrigir bugs.
* Refatorar código.
* Seguir plano de implementação.
* Produzir relatório técnico das alterações realizadas.

### Saída

Arquivo:

```text
implementation-report.md
```

Contendo:

* Arquivos alterados.
* Alterações realizadas.
* Motivo das alterações.

---

## Code Reviewer (Global)

Modelo sugerido: MiniMax

### Responsabilidades

* Revisão de sintaxe.
* Revisão lógica.
* Identificação de duplicação.
* Aplicação de boas práticas.
* Avaliação de manutenibilidade.
* Verificação de aderência arquitetural.

---

## Security Reviewer (Global)

### Responsabilidades

Analisar riscos relacionados a:

* SQL Injection
* XSS
* SSRF
* Secrets expostas
* Controle de permissões
* Autenticação
* Autorização
* Dependências vulneráveis
* Rate Limiting

---

## Tester (Local)

Modelo sugerido: DeepSeek

### Responsabilidades

* Executar testes automatizados.
* Executar builds.
* Validar correções.
* Validar novas funcionalidades.
* Reproduzir bugs reportados.

---

## Documenter (Global)

Modelo sugerido: DeepSeek

### Responsabilidades

Atualizar documentação do projeto com base nas alterações realizadas.

### Documentos atualizados

#### AGENTS.md

Contém:

* Estrutura do projeto.
* Fluxos de desenvolvimento.
* Padrões adotados.

#### CHANGELOG.md

Contém:

* Histórico de alterações.

#### DECISIONS.md

Contém:

* Decisões arquiteturais.
* Justificativas.
* Alternativas consideradas.

---

# Ciclo de Revisão

Toda implementação deve passar pelo seguinte fluxo:

```text
Implementação
      ↓
Code Review
      ↓
Security Review
      ↓
Testes
      ↓
Aprovado?
      ↓
   NÃO
      ↓
Correção
      ↓
Nova Revisão
      ↓
Aprovado
```

### Configuração sugerida

```text
max_review_iterations = 3
```

Após atingir o limite, solicitar intervenção humana.

---

# Camada de Conhecimento

Responsável por preservar contexto do projeto.

---

## AGENTS.md

Documenta:

* Arquitetura de agentes.
* Fluxos de trabalho.
* Padrões operacionais.

---

## CHANGELOG.md

Documenta:

* Alterações realizadas.
* Correções.
* Novas funcionalidades.

---

## DECISIONS.md

Documenta:

* Decisões técnicas.
* Motivações.
* Alternativas descartadas.

---

## Project Knowledge Base

Base permanente de conhecimento utilizada pelos SuperAgentes.

### Conteúdo

* Arquitetura do sistema.
* Regras de negócio.
* Convenções do projeto.
* Decisões históricas.
* Padrões adotados.
* Lições aprendidas.

### Consumidores

* Builder
* ProblemSolver
* Discussion
* Architect
* Solution Designer

---

# Fluxo Geral de Implementação

```text
Usuário
   ↓
Builder
   ↓
Architect
   ↓
Task Planner
   ↓
Solution Designer
   ↓
Aprovação do Usuário
   ↓
Implementation Manager
   ↓
Coder
   ↓
Code Reviewer
   ↓
Security Reviewer
   ↓
Tester
   ↓
Documenter
   ↓
Entrega Final
```

---

# Fluxo Geral de Correção de Problemas

```text
Usuário
   ↓
ProblemSolver
   ↓
Problem Identifier
   ↓
Root Cause Analyzer
   ↓
Solution Designer
   ↓
Aprovação do Usuário
   ↓
Implementation Manager
   ↓
Coder
   ↓
Code Reviewer
   ↓
Security Reviewer
   ↓
Tester
   ↓
Documenter
   ↓
Entrega Final
```

# Regras Operacionais

## 1. Responsabilidade Única

Cada agente deve atuar apenas dentro de sua responsabilidade definida.

Se existir um agente especializado para uma tarefa, ela deve ser delegada.

---

## 2. Proibição de Implementação

Somente agentes com:

```yaml
can_modify_code: true
```

podem alterar arquivos de código.

Todos os demais agentes devem apenas analisar, planejar, revisar ou documentar.

---

## 3. Proibição de Autoaprovação

O agente que planeja não implementa.

O agente que implementa não revisa.

O agente que revisa não corrige.

---

## 4. Delegação Obrigatória

Ao receber uma tarefa fora de sua responsabilidade, o agente deve delegá-la ao agente apropriado.

Não é permitido assumir funções de outro agente.

---

## 5. Respeito ao Escopo

Os agentes devem executar apenas o que foi solicitado.

Não devem adicionar funcionalidades, refatorações ou alterações não previstas no plano aprovado.

---

## 6. Aprovação Humana

Exigem aprovação explícita do usuário:

* Mudanças arquiteturais
* Alterações de banco de dados
* Alterações de APIs públicas
* Remoção de funcionalidades
* Mudança de stack

---

## 7. Hierarquia de Autoridade

AGENTS.md possui prioridade máxima.

Em caso de conflito:

1. AGENTS.md
2. Workflow atual
3. Instrução recebida
4. Autonomia do agente

---

## 8. Regra de Ouro

Nenhum agente pode simultaneamente:

* Planejar
* Implementar
* Validar

Toda alteração deve passar por agentes distintos.
