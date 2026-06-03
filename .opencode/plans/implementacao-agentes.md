# Plano de Implementação dos Agentes OpenCode

## Base Legal

- **AGENTS.md** — Fonte única de verdade para responsabilidades, fluxos e permissões.
- **prompt.md** — Requisitos de configuração e restrições.
- **Skill customize-opencode** — Formato e regras do OpenCode.

## Estrutura Final

```
.opencode/
  agent/
    builder.md                    # SuperAgente - Primary
    problem-solver.md             # SuperAgente - Primary
    discussion.md                 # SuperAgente - Primary
    architect.md                  # Workflow - Subagent
    task-planner.md               # Workflow - Subagent
    problem-identifier.md         # Workflow - Subagent
    root-cause-analyzer.md        # Workflow - Subagent
    solution-designer.md          # Workflow - Subagent
    implementation-manager.md     # Workflow - Subagent
    code-reviewer.md              # Execução Global - Subagent
    security-reviewer.md          # Execução Global - Subagent
    documenter.md                 # Execução Global - Subagent
  opencode.json                   # Config raiz do OpenCode
  plans/
    implementacao-agentes.md      # Este documento
```

## Mapeamento de Permissões (prompt.md → OpenCode)

| prompt.md | OpenCode | Agentes |
|-----------|----------|---------|
| `can_modify_code: false` | `permission: { edit: deny }` | Todos |
| `can_execute_commands: false` | `permission: { bash: deny }` | SuperAgentes, Workflow, Documenter |
| `can_execute_commands: true` | `permission: { bash: ask }` | Code Reviewer, Security Reviewer |
| `can_update_docs: true` | Instrução no prompt + restrição a arquivos de documentação | Documenter |

Nenhum agente possui `can_modify_code: true` — isso é exclusivo do **Coder** (agente local futuro).

## Modos dos Agentes

| Modo | Agentes | Descrição |
|------|---------|-----------|
| `primary` | Builder, ProblemSolver, Discussion | SuperAgentes — o usuário interage diretamente |
| `subagent` | Todos os demais | Chamados por outros agentes no fluxo |

## Ordem de Implementação

### Batch 1 — SuperAgentes (entrada do usuário)

1. **Builder** — Orquestra implementação de funcionalidades
2. **ProblemSolver** — Orquestra correção de problemas
3. **Discussion** — Discussões estratégicas e tomada de decisão

### Batch 2 — Agentes de Workflow (análise e planejamento)

4. **Architect** — Avalia impactos arquiteturais
5. **Task Planner** — Decompõe demandas complexas
6. **Problem Identifier** — Identifica sintomas de problemas
7. **Root Cause Analyzer** — Identifica causa raiz
8. **Solution Designer** — Define a melhor solução
9. **Implementation Manager** — Coordena execução

### Batch 3 — Agentes de Execução Global (revisão e documentação)

10. **Code Reviewer** — Revisão de código
11. **Security Reviewer** — Revisão de segurança
12. **Documenter** — Atualização de documentação

---

## Estrutura de Cada Agente

Todo arquivo de agente segue o formato:

```markdown
---
description: <frase única sobre o propósito>
mode: primary | subagent
permission:
  edit: deny
  bash: deny | ask
---

# <Nome do Agente>

## Objetivo
<propósito principal>

## Responsabilidades
- <lista de responsabilidades>

## Permissões
- can_modify_code: false
- can_execute_commands: false|true
- can_update_docs: false|true

## Restrições
- <regras de isolamento>
- <proibições>

## Fluxo de Atuação
1. <passo 1>
2. <passo 2>
...

## Critérios de Delegação
- <quando e para quem delegar>
```

---

## Fluxos de Comunicação Entre Agentes

### Fluxo de Implementação
```
Usuário → Builder → Architect → Task Planner → Solution Designer
  → Aprovação do Usuário → Implementation Manager
    → Coder (futuro) → Code Reviewer → Security Reviewer
    → Tester (futuro) → Documenter → Entrega
```

### Fluxo de Correção
```
Usuário → ProblemSolver → Problem Identifier → Root Cause Analyzer
  → Solution Designer → Aprovação do Usuário → Implementation Manager
    → Coder (futuro) → Code Reviewer → Security Reviewer
    → Tester (futuro) → Documenter → Entrega
```

---

## Regras de Isolamento

- Agentes de planejamento **não** alteram código
- Agentes de arquitetura **não** implementam soluções
- Agentes de revisão **não** corrigem problemas
- Agentes de documentação **não** alteram código-fonte
- Agentes de coordenação **não** executam tarefas operacionais
- Nenhum agente planeja + implementa + valida simultaneamente
