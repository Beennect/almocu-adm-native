# Login com Google — Integração Frontend

Documentação da integração do login social com Google OAuth na tela de login
e cadastro do app Almocu ADM (Expo + React Native).

Data: 2026-06-01
Escopo: apenas frontend. Backend já possuía o endpoint `/auth/google` e
`/auth/google/callback` implementados.

---

## 1. Visão Geral

A tela de login (`app/login/index.tsx`) e a de cadastro já possuíam botões
visuais para "Entrar com o Google" e "Entrar com o Facebook", porém sem
`onPress` — eram inertes. Esta task adiciona o fluxo real para o Google
e desabilita o Facebook com mensagem "em breve" (o backend ainda não
implementa OAuth do Facebook).

Plataformas suportadas nesta primeira fase:
- Web (Expo Web, mesma aba com redirect).
- Mobile (iOS/Android) via `expo-web-browser` + deep link custom scheme.

O backend (`almocu-back/`) emite um JWT idêntico ao do login local e
devolve no deep link `?token=...` para o client hidratar a sessão.

---

## 2. Arquivos Criados

### `services/api-oauth-service.ts`
Wrapper do fluxo OAuth. Exporta:

- `getGoogleRedirectUri()` — retorna a URI de callback conforme a plataforma:
  - Web: `${window.location.origin}/oauth-callback`
  - Native: `almocu://oauth-callback` (via `Linking.createURL`)
- `buildGoogleAuthUrl(redirectUri)` — monta a URL do endpoint
  `${API_URL}/auth/google?redirect_uri=...`.
- `extractTokenFromCallbackUrl(url)` — extrai `?token=` de uma URL.
- `startGoogleLogin(): Promise<{ token: string | null; cancelled: boolean }>`:
  - Web: faz `window.location.href = authUrl` (fire and forget; a aba
    navega para o Google, depois para `/oauth-callback?token=...`).
  - Native: usa `WebBrowser.openAuthSessionAsync(authUrl, redirectScheme)`,
    aguarda o deep link, extrai o token e devolve via Promise.
  - Cancela → `{ token: null, cancelled: true }`.

### `app/oauth-callback.tsx`
Rota pública (fora de `(auth)/`) que:
1. Lê `?token=` (e `?error=`) via `useLocalSearchParams`.
2. Se já existe sessão autenticada (caso do deep link mobile que chega
   depois do `handleGoogleLogin` ter processado o token), redireciona
   direto para `/(auth)/dashboard`.
3. Se recebeu token, chama `authStore.loginWithToken(token)` e navega
   para o dashboard.
4. Se não há token ou `/auth/me` falha, redireciona para `/login` com
   toast de erro.
5. No web, reaplica a partição de multi-session lendo
   `window.sessionStorage.getItem('active_session')` antes de persistir
   o token (replica o padrão já existente em `app/_layout.tsx`).

---

## 3. Arquivos Modificados

### `services/api-service.ts`
- Adicionado `export` em `const API_URL` para que o `api-oauth-service.ts`
  reuse a mesma base do axios, evitando hardcode duplicado.
- Comportamento do `axios.create` permanece idêntico.

### `stores/AuthStore.ts`
Refatoração cirúrgica com extração de helper compartilhado e novo método
para tokens OAuth. Nenhuma mudança no comportamento externo do login local.

- **Novo método privado `_applyLoginResponse(accessToken, backendUser)`**:
  contém exatamente o trabalho de pós-resposta do login original
  (mapear `restaurants[]` → `restaurantRoles`, montar `this.user`,
  persistir em AsyncStorage, chamar `dataStore.init()`).
- **`login(email, password)`** agora chama o helper após a chamada
  `POST /auth/login`. O tracking do usuário no array local
  (`this.users`, usado pelo "esqueci a senha") permanece no `login()`
  porque é específico de senhas locais.
- **Novo método público `loginWithToken(token)`**:
  1. Persiste o token em AsyncStorage para que o interceptor do axios
     envie o `Authorization` na próxima requisição.
  2. Decodifica o payload do JWT (base64) para extrair `sub`, `username`
     e `globalRoles` (decode sem verificar assinatura; validação real
     é feita pelo backend em qualquer chamada autenticada).
  3. Chama `GET /auth/me` para obter `restaurantId` e `activeRole`
     ativos.
  4. Constrói um objeto no shape esperado pelo helper
     `_applyLoginResponse` e chama.
  5. Em caso de erro (token inválido, /auth/me falha), limpa o token
     do storage e propaga o erro.

### `app.json`
- Adicionado `"scheme": "almocu"`. Expo gera automaticamente
  `CFBundleURLTypes` (iOS) e o intent-filter (Android) para
  suportar o deep link `almocu://oauth-callback`.

### `app/_layout.tsx`
- Adicionado `<Stack.Screen name="oauth-callback" />` no `<Stack>` raiz
  para que o Expo Router reconheça a rota.

### `components/auth/LoginForm.tsx`
- Adicionado import de `startGoogleLogin` e do helper `withLoading`.
- Novo handler `handleGoogleLogin()`:
  - Chama `startGoogleLogin()`.
  - Se cancelado → toast "Login cancelado".
  - Se retornou token (mobile) → chama `authStore.loginWithToken(token)`
    e navega para o dashboard.
  - Se retornou null sem cancelar (web) → não faz nada, pois o redirect
    já está em curso; o `oauth-callback.tsx` processa.
- Novo handler `handleFacebookLogin()` → toast "Login com Facebook em breve".
- Botões Google e Facebook agora têm `onPress`.

### `components/auth/SignUpForm.tsx`
- Mesmas mudanças do `LoginForm.tsx`: handlers Google e Facebook,
  imports adicionais.

---

## 4. Fluxo Implementado

### Mobile (iOS/Android)
```
[LoginForm] tap "Entrar com o Google"
    |
    v
oauthService.startGoogleLogin()
    |
    v
WebBrowser.openAuthSessionAsync(
  'http://localhost:3000/auth/google?redirect_uri=almocu%3A%2F%2Foauth-callback',
  'almocu://'
)
    |
    v
[Google login em system browser]
    |
    v
backend /auth/google/callback
    |
    v
302 Redirect -> almocu://oauth-callback?token=<JWT>
    |
    v
openAuthSessionAsync resolve { type: 'success', url: 'almocu://oauth-callback?token=...' }
    |
    v
handleGoogleLogin extrai token do result.url
    |
    v
authStore.loginWithToken(token)
    |
    v
router.replace('/(auth)/dashboard')
```

Em paralelo, o sistema operacional também navega para a rota
`/oauth-callback` dentro do app (porque o scheme está registrado). Como
o app já está autenticado nesse ponto, a rota apenas redireciona para
o dashboard.

### Web
```
[LoginForm] tap "Entrar com o Google"
    |
    v
window.location.href = 'http://localhost:3000/auth/google?redirect_uri=<origin>/oauth-callback'
    |
    v
[Google login na mesma aba]
    |
    v
backend /auth/google/callback
    |
    v
302 Redirect -> <origin>/oauth-callback?token=<JWT>
    |
    v
Browser carrega /oauth-callback?token=...
    |
    v
oauth-callback.tsx chama authStore.loginWithToken(token)
    |
    v
router.replace('/(auth)/dashboard')
```

---

## 5. Configuração Necessária (Backend)

O backend precisa de três variáveis no `almocu-back/.env`:

```env
GOOGLE_CLIENT_ID=<id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

Obtidas em https://console.cloud.google.com/apis/credentials
criando um OAuth 2.0 Client ID tipo "Web application" e adicionando
exatamente a callback URL acima em "Authorized redirect URIs".

**Importante**: reiniciar o backend após editar o `.env`. Hot-reload
não recarrega env vars.

---

## 6. Como Testar Manualmente

1. `expo start` (mobile) ou `expo start --web` (web).
2. Tela de login → "Entrar com o Google".
3. Completar login no Google.
4. App deve cair em `/(auth)/dashboard` com `auth_token` salvo.

Casos de borda a testar:
- Cancelar o popup do Google → toast "Login cancelado".
- Token inválido / /auth/me 401 → toast "Sessão inválida ou expirada"
  + redirect para `/login`.
- Botão Facebook → toast "Login com Facebook em breve".
- Login local (email/senha) continua funcionando normalmente.

---

## 7. Limitações Conhecidas

### 7.1. `/auth/me` incompleto no backend
O endpoint `GET /auth/me` retorna apenas `id`, `username`,
`globalRoles`, `restaurantId` e `activeRole`. Não retorna `name`,
`email` (cru) nem `restaurants[]` (lista completa de vínculos).

**Impacto**: usuários novos vindos do Google veem o próprio email
(do JWT, campo `username`) como nome nas telas (Navbar, UserHeader,
Dashboard, etc.). O `restaurants[]` começa vazio, e o objeto
`restaurantRoles` é inferido a partir de um único item ativo
(quando há `restaurantId` no `/auth/me`).

**Mitigação recomendada**: adicionar um endpoint
`GET /auth/profile` (ou `GET /auth/me/full`) no backend que retorne o
documento User completo + `restaurants[]` populado. Aí o
`loginWithToken()` deixa de depender de decodificar JWT no client.

### 7.2. Fallback silencioso no `google.strategy.ts`
O backend usa `configService.get('GOOGLE_CLIENT_ID') || 'placeholder'`.
Se a env var estiver vazia, o backend monta o client com
`client_id=placeholder` e só descobre o problema quando o Google
retorna 401 — em vez de falhar rápido no boot.

### 7.3. Decodificação JWT no client
O `loginWithToken()` faz `atob()` do payload do JWT para extrair
`sub`/`username`/`globalRoles`. É decode sem verificação de
assinatura — seguro para uso informativo apenas. Se o token for
adulterado, o backend rejeita em qualquer chamada autenticada.

### 7.4. Multi-session web durante OAuth
O fluxo de OAuth redireciona para `/oauth-callback?token=...` sem o
parâmetro `?session=` que o `app/_layout.tsx` usa para particionar
o `localStorage`. O `oauth-callback.tsx` tenta reaplicar a partição
lendo `window.sessionStorage.getItem('active_session')`, mas isso
só funciona se a aba já tinha sessionStorage daquele domínio. Não
foi feito teste exaustivo de múltiplas sessões abertas em paralelo.

---

## 8. Melhorias Futuras

### Curto prazo (próximas sprints)
1. **`GET /auth/me/full` no backend** — elimina a limitação 7.1 e
   permite popular `name`, `email` e `restaurants[]` corretamente
   no login Google. Mudança de ~10 linhas no backend +
   simplificação do `loginWithToken()` no client.

2. **Fail-fast no `google.strategy.ts`** — substituir os fallbacks
   `'placeholder'` por `configService.getOrThrow('GOOGLE_CLIENT_ID')`
   e idem para o secret. O backend não sobe sem credenciais Google
   configuradas, evitando o 401 críptico em runtime.

3. **Remover o tracking de senhas locais em `this.users`** — o array
   `authStore.users` armazena `{email, password, name}` em texto
   plano no AsyncStorage apenas para simular o fluxo de
   "esqueci a senha". É uma simulação que vaza segurança e nunca
   bate com o backend. Substituir por chamada real
   `POST /auth/forgot-password` quando o backend expor.

### Médio prazo
4. **Login com Facebook** — requer:
   - Backend: criar `FacebookStrategy` em `apps/auth/src/auth/`
     análogo ao Google, com `passport-facebook`.
   - `.env`: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`,
     `FACEBOOK_CALLBACK_URL`.
   - Frontend: novo botão habilitado com handler chamando
     `startFacebookLogin()` (mesma estrutura).

5. **`expo-auth-session`** — considerar a migração para essa lib
   no futuro. Ela oferece PKCE, `useAuthRequest`, helper
   `makeRedirectUri` etc. Útil quando o backend evoluir para
   fluxos com state/PKCE. Hoje não é necessário porque o backend
   já usa apenas JWT no query string.

6. **Refresh token** — o backend emite apenas `access_token` de
   vida curta. Implementar refresh silencioso no `api-service.ts`
   para evitar logout ao token expirar.

### Longo prazo
7. **Login com Apple** — obrigatório para apps iOS publicados na
   App Store. Backend precisa de AppleStrategy + Apple Developer
   setup.

8. **Magic link / login sem senha** — e-mail com link de acesso
   único, requer SMTP configurado no backend.

9. **MFA** (autenticação de dois fatores) — campo `twoFactorEnabled`
   no User schema, endpoint `POST /auth/2fa/verify`.

10. **Testes automatizados** — suíte Jest/Detox cobrindo:
    - Login local (mockando `/auth/login`).
    - Login Google web (mockando `window.location.href`).
    - Login Google mobile (mockando `WebBrowser.openAuthSessionAsync`).
    - Cancelamento do popup.
    - Token inválido no callback.
