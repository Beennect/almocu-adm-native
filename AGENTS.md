# Sistema Multiagentes para Desenvolvimento de Software

## Visão Geral

A arquitetura opencode é dividida em duas camadas de agentes:

1. **Primary agents** → Orquestradores. Interagem com o usuário e despacham subagents.
2. **Subagents** → Produtores de artefato (planners) ou executores (doers).

### Regra fundamental do opencode

**Subagents não podem chamar outros subagents.** A ferramenta `task` (que despacha) só está disponível para primary agents. Por isso, toda a coordenação está concentrada nos primary agents.

### Por que só 2 camadas (e não 3)

A proposta original tinha SuperAgentes → Workflow → Execução. No opencode, isso colapsa:

- Os antigos "SuperAgentes" viram **primary agents** (únicos que despacham).
- Os antigos "Workflow" e "Execução" são ambos **subagents**, mas com papéis distintos:
  - **Workflow agents (planners)**: produzem artefatos Markdown. **Não chamam ninguém.**
  - **Executors (doers)**: fazem o trabalho e retornam resultado em texto. **Não gravam artefato.**

---

# Primary Agents (Orquestradores)

Os 3 primary agents recebem solicitações do usuário, possuem visão global do projeto e coordenam todos os subagents.

## Builder

Orquestrador do **fluxo de implementação** de novas funcionalidades e melhorias.

### Fluxo de Orquestração

1. **Compreensão** — entender a demanda, pedir clarificações.
2. **Planejamento** — criar `.opencode/artifacts/<sessao>/` e `status.md`; despachar architect → task-planner → solution-designer.
3. **Aprovação Humana** — apresentar o plano e aguardar aprovação explícita do usuário.
4. **Geração do Roteiro** — despachar implementation-manager.
5. **Execução** — seguir o roteiro despachando coder → code-reviewer → security-reviewer → tester → documenter.
6. **Consolidação** — gerar `final-report.md`.

Ver `.opencode/agent/builder.md` para detalhes completos, incluindo o protocolo de status tracking.

---

## ProblemSolver

Orquestrador do **fluxo de correção** de problemas.

### Fluxo de Orquestração

1. **Compreensão** — receber descrição do problema.
2. **Identificação e Análise** — despachar problem-identifier → root-cause-analyzer.
3. **Solução e Aprovação** — despachar solution-designer; apresentar e aguardar aprovação.
4. **Geração do Roteiro** — despachar implementation-manager.
5. **Execução** — idem ao Builder.
6. **Consolidação** — gerar `final-report.md` com seção extra "Validação da Correção".

Ver `.opencode/agent/problem-solver.md` para detalhes.

---

## Discussion

Orquestrador de **discussões estratégicas** (sem fluxo fixo).

### Comportamento

- Atua como consultor técnico.
- Pode despachar **apenas**: `architect`, `code-reviewer`, `security-reviewer` para validar hipóteses concretas.
- **NÃO** despacha: coder, tester, documenter, task-planner, solution-designer, implementation-manager.
- **NÃO** cria `status.md` — análises sob demanda são efêmeras.
- Se a discussão virar demanda de implementação, recomenda o `builder`.
- Se virar relato de bug, recomenda o `problem-solver`.

Ver `.opencode/agent/discussion.md` para detalhes.

---

# Subagents: Workflow Agents (Planners)

Workflow agents são **produtores de artefato**. Recebem input + path, escrevem um Markdown estruturado em `.opencode/artifacts/<sessao>/<NN-nome>.md` com frontmatter de status, e retornam um resumo curto.

**Não chamam outros subagents.** Toda a coordenação é dos primary agents.

## Tabela de Workflow Agents

| Agente | Artefato | Conteúdo |
|---|---|---|
| `architect` | `01-arquitetura.md` | Módulos afetados, impacto, padrões, riscos, diretrizes |
| `task-planner` | `02-tarefas.md` | Lista de tarefas com dependências e complexidade |
| `problem-identifier` | `01-sintomas.md` | Sintomas, áreas afetadas, evidências, perguntas em aberto |
| `root-cause-analyzer` | `02-causa-raiz.md` | Hipóteses, validações, causa raiz confirmada |
| `solution-designer` | `03-solucao.md` | Decisões, alternativas descartadas, plano, validações |
| `implementation-manager` | `04-roteiro-execucao.md` | Sequência numerada de execução + regras de iteração |

**Permissões:** `edit: { ".opencode/artifacts/**": "allow" }`, `bash: deny`.

---

# Subagents: Executors (Doers)

Executors são agentes que **fazem o trabalho** e **retornam resultado em texto na resposta**. Eles NÃO gravam artefato.

**Não chamam outros subagents.** Quem os chama é o primary agent (builder/problem-solver).

## Tabela de Executors

| Agente | Papel | Resultado retornado | Permissões |
|---|---|---|---|
| `coder` | Implementa código mobile (React Native/Expo) | Relatório de implementação em texto | `edit: **/*: allow` (artifacts deny), `bash: ask` |
| `coder-backend` | Implementa código backend (NestJS/Bun) em `almocu-back/` | Relatório em texto | `edit: **/*: allow` (artifacts deny), `bash: ask` |
| `code-reviewer` | Revisa código (read-only) | Análise de code review em texto | `edit: deny`, `bash: ask` |
| `security-reviewer` | Revisa segurança (read-only) | Análise de vulnerabilidades em texto | `edit: deny`, `bash: ask` |
| `tester` | Executa testes e builds (read-only) | Resultados de testes em texto | `edit: deny`, `bash: ask` |
| `documenter` | Atualiza docs oficiais | Proposta de atualização em texto; após aprovação, aplica | `edit: AGENTS.md/CHANGELOG.md/DECISIONS.md: allow`, `bash: deny` |

**Nenhum executor grava artefato em `.opencode/artifacts/**`.** O primary agrega os resultados no `status.md` e no `final-report.md`.

---

# Rastreamento de Status

O **primary agent** é o único responsável por manter o status dos artefatos e da execução.

## Mecanismos

1. **Frontmatter YAML** em cada artefato de planning:
   ```yaml
   ---
   status: generated
   generated_by: <agent-name>
   generated_at: <ISO 8601>
   session: <sessao>
   artifact_id: <NN-nome>
   ---
   ```
   O planner define `status: generated` na escrita inicial. O primary atualiza o campo `status:` à medida que o fluxo avança.

2. **Dashboard `status.md`** em `.opencode/artifacts/<sessao>/status.md`. Criado pelo primary na Fase 1, atualizado a cada transição. Visão agregada com tabelas de artefatos e etapas de execução.

## Valores de status

**Artefatos de planning** (campo `status:` no frontmatter):
- `generated` — planner gerou, primary ainda não validou
- `validated` — primary leu e validou
- `awaiting_approval` — apresentado ao usuário, aguardando OK
- `approved` — usuário aprovou
- `rejected` — usuário pediu ajustes
- `in_execution` — roteiro aprovado, execução em andamento
- `completed` — execução finalizada com sucesso
- `failed` — execução falhou, escalonado para humano

**Etapas de execução** (coluna no `status.md`):
- `pending`, `running`, `passed`, `failed`, `iterating`

## Quem atualiza

- **Workflow agents**: definem `status: generated` na escrita inicial. Não atualizam mais.
- **Primary agents**: atualizam o frontmatter de cada artefato via `edit` (mudando apenas a linha `status:`), e mantêm o `status.md` atualizado.
- **Executors**: não atualizam nada (não gravam artefato).

---

# Fluxo Geral de Implementação

```text
Usuário
   ↓
Builder (primary) — cria .opencode/artifacts/<sessao>/
   ↓
Architect (workflow) → 01-arquitetura.md
   ↓
Task Planner (workflow) → 02-tarefas.md
   ↓
Solution Designer (workflow) → 03-solucao.md
   ↓
Aprovação Humana
   ↓
Implementation Manager (workflow) → 04-roteiro-execucao.md
   ↓
Coder (executor) — resultado em texto
   ↓
Code Reviewer (executor) — resultado em texto
   ↓
Security Reviewer (executor) — resultado em texto
   ↓
Tester (executor) — resultado em texto
   ↓
Documenter (executor) — proposta em texto + aplica após aprovação
   ↓
Builder (primary) — gera final-report.md
   ↓
Entrega Final
```

---

# Fluxo Geral de Correção de Problemas

```text
Usuário
   ↓
ProblemSolver (primary) — cria .opencode/artifacts/<sessao>/
   ↓
Problem Identifier (workflow) → 01-sintomas.md
   ↓
Root Cause Analyzer (workflow) → 02-causa-raiz.md
   ↓
Solution Designer (workflow) → 03-solucao.md
   ↓
Aprovação Humana
   ↓
Implementation Manager (workflow) → 04-roteiro-execucao.md
   ↓
Coder (executor) — resultado em texto
   ↓
Code Reviewer, Security Reviewer, Tester (executors) — resultados em texto
   ↓
Documenter (executor)
   ↓
ProblemSolver (primary) — gera final-report.md
   ↓
Entrega Final + Validação da Correção
```

---

# Ciclo de Revisão

```text
Implementação (Coder)
      ↓
Code Review
      ↓
Security Review
      ↓
Testes
      ↓
Aprovado?
   ↓   ↓
  SIM  NÃO → Correção (Coder) → Nova Revisão
   ↓
Documentação
   ↓
Entrega
```

**`max_review_iterations = 3`**. Após atingir o limite, o primary escala para intervenção humana.

---

# Camada de Conhecimento

Responsável por preservar contexto do projeto.

## AGENTS.md

Este documento. Documenta:
- Arquitetura de agentes.
- Fluxos de trabalho.
- Padrões adotados.
- Regras operacionais.

## CHANGELOG.md

Histórico de alterações. Mantido pelo `documenter`.

## DECISIONS.md

Decisões arquiteturais (formato ADR). Mantido pelo `documenter`.

## Project Knowledge Base

Base permanente de conhecimento consultada pelos agentes. Conteúdo:
- Arquitetura do sistema.
- Regras de negócio.
- Convenções do projeto.
- Decisões históricas.
- Padrões adotados.
- Lições aprendidas.

**Consumidores:** Builder, ProblemSolver, Discussion, Architect, Solution Designer.

---

# Regras Operacionais

## 1. Responsabilidade Única

Cada agente deve atuar apenas dentro de sua responsabilidade definida. Se existir um agente especializado para uma tarefa, ela deve ser delegada.

## 2. Proibição de Implementação (exceto Coder/Coder Backend)

Somente `coder` e `coder-backend` alteram código. Todos os demais agentes analisam, planejam, revisam ou documentam.

## 3. Proibição de Autoaprovação

- O agente que planeja (workflow) não implementa.
- O agente que implementa (coder) não revisa.
- O agente que revisa (code-reviewer, security-reviewer) não corrige.

## 4. Delegação Obrigatória

- Primary agents despacham subagents via `task`.
- Subagents NÃO despacham outros subagents.

## 5. Respeito ao Escopo

Os agentes executam apenas o que foi solicitado. Não devem adicionar funcionalidades, refatorações ou alterações não previstas no plano aprovado.

## 6. Aprovação Humana

Exigem aprovação explícita do usuário:
- Mudanças arquiteturais
- Alterações de banco de dados
- Alterações de APIs públicas
- Remoção de funcionalidades
- Mudança de stack
- Mudanças em docs oficiais (AGENTS.md, CHANGELOG.md, DECISIONS.md — `documenter` aplica após aprovação do usuário)

## 7. Hierarquia de Autoridade

AGENTS.md (raiz) possui prioridade máxima. Em caso de conflito:
1. AGENTS.md (raiz)
2. Workflow atual
3. Instrução recebida
4. Autonomia do agente

## 8. Regra de Ouro

Nenhum agente pode simultaneamente planejar + implementar + validar. Toda alteração passa por agentes distintos.

## 9. Regra do opencode: Subagent não chama subagent

A ferramenta `task` está disponível apenas para primary agents. Workflow agents e executors retornam resultado ao orquestrador, que despacha o próximo passo.

## 10. Rastreamento de Status é responsabilidade do Primary

Apenas o primary agent atualiza o campo `status:` no frontmatter dos artefatos e mantém o `status.md`. Workflow agents definem `generated` na escrita inicial. Executors não gravam artefato.
