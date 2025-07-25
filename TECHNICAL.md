# 📋 Documentação Técnica - OnSet.IA Company Search

## 🏗️ Arquitetura do Sistema

### Visão Geral

A aplicação utiliza uma arquitetura moderna baseada em React com TypeScript, implementando um sistema robusto de proxy para comunicação com a API do Apollo.io.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Proxy Layer    │    │   Apollo.io     │
│   (React/TS)    │◄──►│  (Netlify Func)  │◄──►│     API         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Componentes Principais

#### 1. Frontend (React + TypeScript)
- **App.tsx**: Componente principal com gerenciamento de estado
- **SearchForm.tsx**: Interface de busca com validações
- **CompanyCard.tsx**: Exibição de dados das empresas
- **PeopleSearchModal.tsx**: Modal para busca de funcionários

#### 2. Camada de Serviços
- **apolloApi.ts**: Cliente principal da API Apollo.io
- **emailCapture.ts**: Serviço especializado em captura de emails
- **api.ts**: Configurações dinâmicas de ambiente

#### 3. Proxy Layer (Netlify Functions)
- **apollo-proxy.js**: Proxy principal para API Apollo.io
- **test-api.js**: Função de teste e health check

## 🔧 Configuração de Ambiente

### Desenvolvimento Local

```bash
# Variáveis de ambiente necessárias
VITE_APOLLO_API_KEY=sua_chave_apollo_aqui
NODE_ENV=development

# Proxy Vite (automático)
/api/apollo/* → https://api.apollo.io/v1/*
```

### Produção (Netlify)

```bash
# Variáveis de ambiente no Netlify
VITE_APOLLO_API_KEY=sua_chave_apollo_aqui
NODE_ENV=production

# Netlify Functions
/api/apollo/* → /.netlify/functions/apollo-proxy
```

## 🚀 Sistema de Deploy

### GitHub Actions Workflow

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - run: npm ci
    - run: npm run build
    - uses: actions/deploy-pages@v4
```

### Netlify Configuration

```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/api/apollo/*"
  to = "/.netlify/functions/apollo-proxy/:splat"
  status = 200
```

## 🔌 Integração com Apollo.io API

### Endpoints Utilizados

#### 1. Busca de Empresas
```typescript
// Endpoint principal
POST /v1/mixed_companies/search

// Fallback
POST /v1/organizations/search

// Payload exemplo
{
  "page": 1,
  "per_page": 25,
  "organization_locations": ["São Paulo"],
  "q_organization_keyword_tags": ["technology"],
  "organization_num_employees_ranges": ["201,500"]
}
```

#### 2. Busca de Pessoas
```typescript
// Endpoint principal
POST /v1/mixed_people/search

// Fallbacks
POST /v1/contacts/search
POST /v1/people/search

// Payload exemplo
{
  "organization_ids": ["company_id"],
  "page": 1,
  "per_page": 100,
  "reveal_personal_emails": true
}
```

#### 3. Busca de Emails
```typescript
// Estratégia 1: Match com parâmetros
POST /v1/people/match?reveal_personal_emails=false

// Estratégia 2: Match simples
POST /v1/people/match

// Estratégia 3: Get direto
GET /v1/people/{person_id}
```

### Sistema de Fallback

```typescript
class ApolloApiService {
  async searchCompanies(filters) {
    try {
      // Tentativa 1: mixed_companies/search
      return await this.makeRequest('/mixed_companies/search', {...});
    } catch (error) {
      try {
        // Tentativa 2: organizations/search
        return await this.makeRequest('/organizations/search', {...});
      } catch (fallbackError) {
        // Tentativa 3: busca simplificada
        return await this.makeRequest('/organizations/search', {simplified});
      }
    }
  }
}
```

## 🛡️ Tratamento de Erros

### Hierarquia de Erros

```typescript
class ApolloApiError extends Error {
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Mapeamento de status HTTP
const errorMessages = {
  401: 'Invalid API key',
  403: 'Access denied',
  404: 'API endpoint not found',
  422: 'Invalid search parameters',
  429: 'Rate limit exceeded'
};
```

### Estratégias de Recuperação

1. **Retry Logic**: Tentativas múltiplas com backoff
2. **Fallback Endpoints**: Endpoints alternativos
3. **Graceful Degradation**: Funcionalidade reduzida em caso de falha
4. **User Feedback**: Notificações claras de erro

## 📊 Otimizações de Performance

### 1. Memoização de Componentes

```typescript
const filteredAndSortedCompanies = React.useMemo(() => {
  // Filtros aplicados apenas quando necessário
  return companies.filter(/* filtros */).sort(/* ordenação */);
}, [companies, selectedIndustries, sortBy]);
```

### 2. Lazy Loading

```typescript
// Componentes carregados sob demanda
const PeopleSearchModal = React.lazy(() => import('./PeopleSearchModal'));
```

### 3. Debouncing

```typescript
// Evitar requisições excessivas
const debouncedSearch = useDebounce(searchTerm, 300);
```

### 4. Cache Local

```typescript
// Cache de resultados no localStorage
const [cachedResults, setCachedResults] = useLocalStorage('search-cache', {});
```

## 🔒 Segurança

### 1. Sanitização de Dados

```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .trim()
    .substring(0, 100); // Limita tamanho
}
```

### 2. Validação de API Key

```typescript
if (!apiKey || apiKey === 'your_apollo_api_key_here') {
  throw new Error('Invalid API key');
}
```

### 3. Headers de Segurança

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
```

## 📈 Monitoramento e Logs

### 1. Logs Estruturados

```typescript
console.log('🚀 Iniciando busca com filtros:', {
  companyName: filters.companyName,
  location: filters.location,
  timestamp: new Date().toISOString()
});
```

### 2. Métricas de Performance

```typescript
const startTime = performance.now();
// ... operação
const endTime = performance.now();
console.log(`⏱️ Operação levou ${endTime - startTime}ms`);
```

### 3. Error Tracking

```typescript
try {
  // operação
} catch (error) {
  console.error('❌ Erro detalhado:', {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent
  });
}
```

## 🧪 Testes

### Estrutura de Testes

```
tests/
├── unit/
│   ├── components/
│   ├── services/
│   └── utils/
├── integration/
│   ├── api/
│   └── flows/
└── e2e/
    ├── search.spec.ts
    └── export.spec.ts
```

### Testes de API

```typescript
describe('Apollo API Service', () => {
  test('should search companies successfully', async () => {
    const mockResponse = { organizations: [...] };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await apolloApiService.searchCompanies(filters);
    expect(result.organizations).toHaveLength(25);
  });
});
```

## 🚀 Roadmap Técnico

### Próximas Implementações

1. **Cache Redis**: Cache distribuído para resultados
2. **WebSockets**: Atualizações em tempo real
3. **GraphQL**: Migração para GraphQL Apollo
4. **PWA**: Progressive Web App capabilities
5. **Analytics**: Tracking de uso e performance
6. **A/B Testing**: Testes de interface e funcionalidades

### Melhorias de Performance

1. **Code Splitting**: Divisão de bundles por rota
2. **Service Workers**: Cache offline
3. **CDN**: Distribuição de assets
4. **Image Optimization**: Otimização de imagens
5. **Bundle Analysis**: Análise de tamanho de bundles

## 📚 Recursos Adicionais

### Documentação Externa
- [Apollo.io API Docs](https://apolloio.github.io/apollo-api-docs/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Netlify Functions](https://docs.netlify.com/functions/overview/)

### Ferramentas de Desenvolvimento
- **VS Code Extensions**: ES7+ React/Redux/React-Native snippets
- **Chrome DevTools**: React Developer Tools
- **Postman**: Testes de API
- **Lighthouse**: Auditoria de performance

---

**Documentação mantida pela equipe de desenvolvimento**
*Última atualização: Janeiro 2025*