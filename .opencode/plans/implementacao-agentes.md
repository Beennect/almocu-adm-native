# Plano de Implementação dos Agentes OpenCode

## Base Legal

- **AGENTS.md** (raiz) — Fonte única de verdade para responsabilidades, fluxos e permissões.
- **opencode skill** (`customize-opencode`) — Formato e regras do opencode.
- **opencode.json schema** — https://opencode.ai/config.json

## Arquitetura Final

```
.opencode/
  agent/
    builder.md                # Primary — Orquestrador de implementação
    problem-solver.md         # Primary — Orquestrador de correção
    discussion.md             # Primary — Consultor estratégico
    architect.md              # Workflow — Produtor de documento arquitetural
    task-planner.md           # Workflow — Produtor de plano de tarefas
    problem-identifier.md     # Workflow — Produtor de relatório de sintomas
    root-cause-analyzer.md    # Workflow — Produtor de relatório de causa raiz
    solution-designer.md      # Workflow — Produtor de plano de implementação
    implementation-manager.md # Workflow — Produtor de roteiro de execução
    coder.md                  # Executor — Implementa mobile (RN/Expo)
    coder-backend.md          # Executor — Implementa backend (NestJS/Bun)
    code-reviewer.md          # Executor — Revisão de código (read-only)
    security-reviewer.md      # Executor — Revisão de segurança (read-only)
    tester.md                 # Executor — Testes e builds (read-only)
    documenter.md             # Executor — Atualiza docs oficiais (allow)
  opencode.json               # Config raiz do OpenCode
  plans/
    implementacao-agentes.md  # Este documento
```

## Tabela de Permissões (Papel × Permissão)

| Agente | Modo | Edit artifacts | Edit código | Edit docs | bash | task |
|---|---|---|---|---|---|---|
| `builder` | primary | allow | deny | deny | deny | **allow** |
| `problem-solver` | primary | allow | deny | deny | deny | **allow** |
| `discussion` | primary | allow | deny | deny | deny | **allow** |
| `architect` | subagent | allow | deny | deny | deny | n/a |
| `task-planner` | subagent | allow | deny | deny | deny | n/a |
| `problem-identifier` | subagent | allow | deny | deny | deny | n/a |
| `root-cause-analyzer` | subagent | allow | deny | deny | deny | n/a |
| `solution-designer` | subagent | allow | deny | deny | deny | n/a |
| `implementation-manager` | subagent | allow | deny | deny | deny | n/a |
| `coder` | subagent | deny | `**/*: allow` (artifacts deny) | deny | ask | n/a |
| `coder-backend` | subagent | deny | `**/*: allow` (artifacts deny) | deny | ask | n/a |
| `code-reviewer` | subagent | deny | deny | deny | ask | n/a |
| `security-reviewer` | subagent | deny | deny | deny | ask | n/a |
| `tester` | subagent | deny | deny | deny | ask | n/a |
| `documenter` | subagent | deny | deny | `AGENTS.md/CHANGELOG.md/DECISIONS.md: allow` | deny | n/a |

## Regra Arquitetural Fundamental

> **Subagents não chamam outros subagents.** No opencode, apenas primary agents têm acesso à ferramenta `task`. Por isso:
>
> - **Workflow agents** (subagents planners) recebem input, escrevem artefato, retornam resumo. **Não chamam ninguém.**
> - **Executors** (subagents doers) fazem o trabalho e retornam resultado em texto. **Não gravam artefato.**
> - **Primary agents** despacham cada subagent em ordem, leem o resultado, atualizam o `status.md` e o frontmatter `status:`, e prosseguem.

## Estrutura de uma Sessão (Artefatos)

Para cada demanda, o primary cria:

```
.opencode/artifacts/<sessao>/
  status.md                       ← dashboard mantido pelo primary
  01-arquitetura.md               ← architect (fluxo de implementação)
  02-tarefas.md                   ← task-planner
  03-solucao.md                   ← solution-designer
  04-roteiro-execucao.md          ← implementation-manager
  final-report.md                 ← primary (consolidado)
```

Para o fluxo de correção (ProblemSolver), 01 e 02 são respectivamente:
- `01-sintomas.md` (problem-identifier)
- `02-causa-raiz.md` (root-cause-analyzer)

E 03 e 04 são idênticos.

**Executors NÃO gravam artefato.** Seus resultados ficam no contexto da conversa. O primary sintetiza no `status.md` e no `final-report.md`.

## Rastreamento de Status

Cada artefato de planning tem um frontmatter YAML:

```yaml
---
status: generated
generated_by: <agent-name>
generated_at: <ISO 8601>
session: <sessao>
artifact_id: <NN-nome>
---
```

**Valores de status** (campo `status:`):
- `generated` — planner gerou (inicial)
- `validated` — primary leu e validou
- `awaiting_approval` — apresentado ao usuário
- `approved` — usuário aprovou
- `rejected` — usuário pediu ajustes
- `in_execution` — roteiro sendo executado
- `completed` — execução finalizada com sucesso
- `failed` — execução falhou

**Quem atualiza:** apenas o **primary agent**, usando a ferramenta `edit` para mudar a linha `status:` do frontmatter. Workflow agents definem `generated` na escrita inicial. Executors não atualizam nada.

**Dashboard:** o primary também mantém `.opencode/artifacts/<sessao>/status.md` com tabelas de artefatos e etapas de execução, atualizado a cada transição de fase.

## Fluxo de Implementação

```
Usuário → Builder
        → Architect → 01-arquitetura.md
        → Task Planner → 02-tarefas.md
        → Solution Designer → 03-solucao.md
        → [Aprovação Humana]
        → Implementation Manager → 04-roteiro-execucao.md
        → Coder (resultado em texto)
        → Code Reviewer (resultado em texto)
        → Security Reviewer (resultado em texto)
        → Tester (resultado em texto)
        → Documenter (proposta em texto → aplica após aprovação)
        → final-report.md
        → Entrega
```

## Fluxo de Correção

```
Usuário → ProblemSolver
        → Problem Identifier → 01-sintomas.md
        → Root Cause Analyzer → 02-causa-raiz.md
        → Solution Designer → 03-solucao.md
        → [Aprovação Humana]
        → Implementation Manager → 04-roteiro-execucao.md
        → Coder (resultado em texto)
        → Code Reviewer, Security Reviewer, Tester (resultados em texto)
        → Documenter
        → final-report.md (com seção "Validação da Correção")
        → Entrega
```

## Estrutura de Cada Arquivo de Agente

Todo arquivo segue:

```markdown
---
description: <frase única sobre o propósito>
mode: primary | subagent
permission:
  edit: <objeto com paths>
  bash: deny | ask
  task: allow  (apenas para primary)
---

# <Nome do Agente>

## Objetivo
<propósito>

## Papel na Arquitetura
<primary / workflow planner / executor doer>

## Responsabilidades
- <lista>

## Permissões
<tabela ou lista>

## Restrições
- <regras de isolamento>

## Input Recebido
(o que vem no prompt)

## Saída Esperada
(template do artefato OU template da resposta em texto)

## Fluxo de Atuação
1. ...

## Fonte de Verdade
AGENTS.md (raiz)
```

## Ciclo de Revisão

```
Implementação (Coder)
      ↓
Code Review → Security Review → Testes
      ↓
Aprovado?
   ↓   ↓
  SIM  NÃO → Correção (Coder) → Nova Revisão (max 3x)
   ↓
Documentação
      ↓
Entrega
```

Após 3 iterações sem aprovação, o primary escala para o usuário.
