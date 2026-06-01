# 🐛 Bug: Cardápio não carrega itens existentes (enquanto Estoque funciona)

## Sumário

- [Sintoma](#sintoma)
- [Diagnóstico](#diagnóstico)
- [Causa Raiz](#causa-raiz)
- [Fluxo Completo do Erro](#fluxo-completo-do-erro)
- [Por que o Estoque Funciona?](#por-que-o-estoque-funciona)
- [Correções Recomendadas](#correções-recomendadas)
- [Arquivos Relevantes](#arquivos-relevantes)

---

## Sintoma

A tela de **Cardápio** no front-end exibe lista vazia mesmo quando há produtos cadastrados no banco. A tela de **Estoque** carrega os itens corretamente.

### Evidência

Log do container `almocu-back-menu-app-1`:

```
SyntaxError: JSON Parse error: Unexpected identifier "object"
    at <parse>
```

---

## Diagnóstico

### Diferença crítica entre Menu e Estoque

| Módulo | Possui cache Redis? | Funciona? |
|--------|---------------------|-----------|
| **Estoque** (`StockService`) | ❌ Não | ✅ Sim |
| **Cardápio** (`ProductService`) | ✅ Sim | ❌ Não |

O estoque não usa cache — faz a query no MongoDB diretamente e retorna. O cardápio tem uma camada de Redis entre a request e o MongoDB. O erro está **exclusivamente** nessa camada de cache.

---

## Causa Raiz

**O SDK `@upstash/redis` faz auto-deserialização de JSON no método `get()`, o que conflita com o padrão manual de `JSON.stringify` / `JSON.parse` usado no `ProductService.findAll()`.**

### Explicação técnica

`@upstash/redis` é um cliente HTTP para o Upstash Redis REST API. Quando você armazena um valor com `set(key, value)` e depois recupera com `get(key)`, o SDK automaticamente:

1. **No `set`**: Se o valor for uma string, armazena como string no Redis.
2. **No `get`**: Se a string armazenada parece ser JSON válido, o SDK faz `JSON.parse()` automaticamente e retorna o objeto JavaScript resultante — **independentemente do tipo genérico passado** (`get<string>` ou `get`).

Isso significa que `upstashRedis.get<string>(key)` retorna um objeto JavaScript, não uma string. O TypeScript não detecta porque o tipo é `string | null` na declaração, mas em runtime é `object | null`.

---

## Fluxo Completo do Erro

### Primeira request (cache miss — funciona)

```
GET /api/menu?page=1&limit=100
  →
  ProductService.findAll()
    →
    redisService.get(cacheKey)
      → upstashRedis.get<string>(cacheKey)
      → null  (cache miss)
    →
    MongoDB query → [items] + total
    →
    result = new Page(items, total, pageable)
    →
    redisService.set(cacheKey, JSON.stringify(result), 3600)
      → Upstash armazena a string JSON no Redis
      → Valor salvo em Redis: '{"items":[...],"total":5,"page":1,"limit":100,"pages":1}'
    →
    Retorna Page<Product> ✅
```

### Segunda request (cache hit — ERRO)

```
GET /api/menu?page=1&limit=100
  →
  ProductService.findAll()
    →
    redisService.get(cacheKey)
      → upstashRedis.get<string>(cacheKey)
      → VALOR ARMAZENADO: '{"items":[...],"total":5,"page":1,"limit":100,"pages":1}'
      → UPSTASH AUTO-PARSE: JSON.parse('{"items":[...],"total":5,...}')
      → RETORNA: { items: [...], total: 5, page: 1, limit: 100, pages: 1 }  ← OBJETO, NÃO STRING
      → Tipo TypeScript: string | null   |   Runtime: object
    →
    cached = { items: [...], total: 5, ... }   ← truthy
    →
    if (cached) → true
    →
    JSON.parse(cached)
      → JS chama cached.toString() → "[object Object]"
      → JSON.parse("[object Object]")
      → SyntaxError: JSON Parse error: Unexpected identifier "object"
      → ❌ ERRO NÃO TRATADO (sem try-catch)
    →
    Propaga para o NestJS ExceptionFilter → HTTP 500
```

### Front-end recebe o 500

```
DataStore.init()
  → apiMenuService.getMenu(1, 100)
  → HTTP 500
  → catch block (DataStore.ts:320):
      console.warn("Failed to fetch menu from API, loading from cache.")
  → AsyncStorage.getItem(`menu_${cacheKey}`) → null (primeira execução)
  → this.menuItems = []   ← tela aparece vazia
```

---

## Por que o Estoque Funciona?

`StockService.findAll()` em `stock.service.ts` não tem cache:

```typescript
async findAll(restaurantId: string, pageable: Pageable): Promise<Page<Stock>> {
  const [items, total] = await Promise.all([
    this.stockModel.find({ restaurantId }).skip(pageable.skip)
      .limit(pageable.limit).lean().exec(),
    this.stockModel.countDocuments({ restaurantId }).exec(),
  ]);
  return new Page(items as unknown as Stock[], total, pageable);
}
```

Sem Redis → sem cache corrompido → funciona sempre.

---

## Correções Recomendadas

A correção deve ser feita no repositório **`almocu-back`** (neste front-end o código do backend é somente leitura).

### Opção A (Recomendada) — Desabilitar auto-deserialização no Upstash

**Arquivo:** `libs/common/src/redis/redis.service.ts`

```typescript
this.redisClient = new Redis({
  url: configService.get<string>('UPSTASH_REDIS_REST_URL') || 'http://localhost:6379',
  token: configService.get<string>('UPSTASH_REDIS_REST_TOKEN') || '',
  automaticDeserialization: false,  // ← Impede Upstash de fazer JSON.parse automático
});
```

Com `automaticDeserialization: false`, `get<string>(key)` sempre retorna uma string crua, e o `JSON.parse` manual em `ProductService.findAll()` funciona conforme esperado.

### Opção B — Tratar objeto vs string no ProductService

**Arquivo:** `apps/menu/src/product/product.service.ts`

```typescript
if (cached) {
  if (typeof cached === 'object') {
    return cached as Page<Product>;  // já veio parseado pelo Upstash
  }
  return JSON.parse(cached) as Page<Product>;
}
```

### Opção C — Adicionar try-catch ao redor do JSON.parse

**Arquivo:** `apps/menu/src/product/product.service.ts`

```typescript
if (cached) {
  try {
    return JSON.parse(cached) as Page<Product>;
  } catch {
    // Cache corrompido, ignora e busca do MongoDB
  }
}
```

### Após aplicar a correção

1. **Limpar o cache corrompido** — reiniciar o container do Menu App ou limpar o Redis manualmente
2. **Testar** — acessar a tela de Cardápio e verificar se os itens aparecem

---

## Arquivos Relevantes

| Arquivo | Linhas | Função |
|---------|--------|--------|
| `almocu-back/apps/menu/src/product/product.service.ts` | 109-139 | `findAll()` — contém `JSON.parse(cached)` sem try-catch na linha 118 |
| `almocu-back/libs/common/src/redis/redis.service.ts` | 30-37 | `get()` — wrapper try-catch que não detecta objeto vs string |
| `almocu-back/libs/common/src/redis/redis.service.ts` | 11-17 | Construtor do Upstash Redis — falta `automaticDeserialization: false` |
| `almocu-back/apps/stock/src/stock/stock.service.ts` | 45-57 | `findAll()` do estoque — sem cache (prova que o problema é o Redis) |
| `almocu-adm-main/stores/DataStore.ts` | 270-331 | Código do front-end que consome a API e cai no catch |
