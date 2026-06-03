Crie os agentes descritos no arquivo AGENTS.md do projeto.

Leia primeiro o AGENTS.md e utilize-o como fonte única de verdade para responsabilidades, fluxos e permissões.

# Objetivo

Gerar a estrutura completa dos agentes globais de orquestração, análise, revisão, arquitetura e documentação definidos no AGENTS.md.

NÃO criar agentes locais.

Os agentes locais serão implementados posteriormente manualmente.

Portanto NÃO criar:

* Coder
* Tester

Apenas manter referências a eles nos fluxos existentes.

---

# Regras Obrigatórias

A arquitetura definida no AGENTS.md deve ser seguida rigorosamente.

Cada agente deve possuir:

* Nome
* Objetivo
* Responsabilidades
* Permissões
* Restrições
* Fluxo de atuação
* Critérios de delegação

Nenhum agente pode assumir responsabilidades de outro agente.

---

# Agentes a Criar

## SuperAgentes

* Builder
* ProblemSolver
* Discussion

## Workflow Agents

* Architect
* Task Planner
* Problem Identifier
* Root Cause Analyzer
* Solution Designer
* Implementation Manager

## Global Execution Agents

* Code Reviewer
* Security Reviewer
* Documenter

---

# Restrições de Permissão

Adicionar explicitamente nas configurações dos agentes:

```yaml
can_modify_code: false
can_execute_commands: false
can_update_docs: false
```

Ajustar apenas quando permitido pelo AGENTS.md.

Exemplos:

Code Reviewer:

```yaml
can_modify_code: false
can_execute_commands: true
can_update_docs: false
```

Security Reviewer:

```yaml
can_modify_code: false
can_execute_commands: true
can_update_docs: false
```

Documenter:

```yaml
can_modify_code: false
can_execute_commands: false
can_update_docs: true
```

Builder:

```yaml
can_modify_code: false
can_execute_commands: false
can_update_docs: false
```

IMPORTANTE:

Nenhum agente gerado pode possuir:

```yaml
can_modify_code: true
```

Essa permissão será exclusiva dos futuros agentes locais Coder, que serão criados manualmente depois.

---

# Regra de Delegação Obrigatória

Sempre que uma tarefa pertencer a outro agente, o agente atual deve delegar. 

Exemplos:

Builder:

* Não implementa código.
* Não altera arquivos.
* Deve delegar para o fluxo apropriado.

Implementation Manager:

* Não implementa código.
* Apenas coordena execução.

Code Reviewer:

* Não corrige problemas.
* Apenas identifica e reporta.

Security Reviewer:

* Não corrige vulnerabilidades.
* Apenas identifica e reporta.

Documenter:

* Não altera código-fonte.
* Apenas documentação.

---

# Regra de Isolamento

Agentes de planejamento não podem alterar código.

Agentes de arquitetura não podem implementar soluções.

Agentes de revisão não podem corrigir problemas.

Agentes de documentação não podem alterar código-fonte.

Agentes de coordenação não podem executar tarefas operacionais.

---

# Regra de Ouro

Nenhum agente pode desempenhar simultaneamente os papéis de:

* Planejar
* Implementar
* Validar

Toda alteração deve obrigatoriamente passar por agentes distintos.

Exemplo correto:

Solution Designer
→ Coder (futuro agente local)
→ Reviewer
→ Tester (futuro agente local)

Exemplo incorreto:

Solution Designer
→ Implementar
→ Revisar

---

# Estrutura Esperada

Gerar:

1. Configuração individual de cada agente.
2. Prompt completo de cada agente.
3. Permissões de cada agente.
4. Regras de delegação.
5. Regras de isolamento.
6. Fluxos de comunicação.
7. Estrutura compatível com OpenCode.

Utilizar o AGENTS.md como referência principal e não reinventar responsabilidades já documentadas.

Se houver conflito entre este prompt e o AGENTS.md, o AGENTS.md possui prioridade.
