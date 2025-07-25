# 🤝 Guia de Contribuição

Obrigado por considerar contribuir para o OnSet.IA Company Search! Este documento fornece diretrizes para contribuir com o projeto.

## 📋 Índice

- [Como Contribuir](#-como-contribuir)
- [Reportando Bugs](#-reportando-bugs)
- [Sugerindo Melhorias](#-sugerindo-melhorias)
- [Desenvolvimento](#-desenvolvimento)
- [Padrões de Código](#-padrões-de-código)
- [Processo de Pull Request](#-processo-de-pull-request)
- [Convenções de Commit](#-convenções-de-commit)

## 🚀 Como Contribuir

Existem várias maneiras de contribuir com este projeto:

### 1. 🐛 Reportando Bugs
- Use o template de issue para bugs
- Inclua informações detalhadas sobre o problema
- Adicione screenshots se aplicável

### 2. 💡 Sugerindo Melhorias
- Use o template de issue para feature requests
- Descreva claramente a funcionalidade desejada
- Explique por que seria útil

### 3. 📝 Melhorando Documentação
- Corrija erros de digitação
- Adicione exemplos
- Melhore explicações

### 4. 💻 Contribuindo com Código
- Implemente novas funcionalidades
- Corrija bugs existentes
- Melhore performance
- Adicione testes

## 🐛 Reportando Bugs

Antes de reportar um bug, verifique se ele já não foi reportado nas [issues existentes](https://github.com/car2019sjc/teste-lead-company/issues).

### Template de Bug Report

```markdown
**Descrição do Bug**
Uma descrição clara e concisa do bug.

**Passos para Reproduzir**
1. Vá para '...'
2. Clique em '...'
3. Role para baixo até '...'
4. Veja o erro

**Comportamento Esperado**
Uma descrição clara do que você esperava que acontecesse.

**Screenshots**
Se aplicável, adicione screenshots para ajudar a explicar o problema.

**Ambiente:**
- OS: [ex: Windows 10]
- Browser: [ex: Chrome 91]
- Versão: [ex: 1.0.0]

**Informações Adicionais**
Qualquer outra informação sobre o problema.
```

## 💡 Sugerindo Melhorias

### Template de Feature Request

```markdown
**A sua feature request está relacionada a um problema? Descreva.**
Uma descrição clara do problema. Ex: Eu fico frustrado quando [...]

**Descreva a solução que você gostaria**
Uma descrição clara e concisa do que você quer que aconteça.

**Descreva alternativas que você considerou**
Uma descrição clara de qualquer solução ou feature alternativa que você considerou.

**Informações Adicionais**
Adicione qualquer outro contexto ou screenshots sobre a feature request aqui.
```

## 💻 Desenvolvimento

### Configuração do Ambiente

1. **Fork** o repositório
2. **Clone** seu fork:
   ```bash
   git clone https://github.com/seu-usuario/teste-lead-company.git
   cd teste-lead-company
   ```

3. **Instale** as dependências:
   ```bash
   npm install
   ```

4. **Configure** as variáveis de ambiente:
   ```bash
   cp .env.example .env
   # Edite o .env com suas configurações
   ```

5. **Execute** em modo desenvolvimento:
   ```bash
   npm run dev
   ```

### Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
├── services/           # Serviços de API e utilitários
├── types/              # Definições de tipos TypeScript
├── config/             # Configurações da aplicação
├── hooks/              # Hooks customizados
└── utils/              # Funções utilitárias

netlify/
└── functions/          # Netlify Functions (serverless)

docs/
├── README.md           # Documentação principal
├── TECHNICAL.md        # Documentação técnica
└── CHANGELOG.md        # Histórico de mudanças
```

## 📏 Padrões de Código

### TypeScript

- Use tipagem estrita
- Evite `any`, prefira tipos específicos
- Use interfaces para objetos complexos
- Documente funções públicas com JSDoc

```typescript
/**
 * Busca empresas usando filtros específicos
 * @param filters - Filtros de busca
 * @returns Promise com resultados da busca
 */
async function searchCompanies(filters: SearchFilters): Promise<SearchResponse> {
  // implementação
}
```

### React

- Use componentes funcionais com hooks
- Implemente PropTypes ou TypeScript interfaces
- Use memo para otimização quando necessário
- Mantenha componentes pequenos e focados

```typescript
interface CompanyCardProps {
  company: Company;
  onSelect?: (company: Company) => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onSelect }) => {
  // implementação
};
```

### CSS/Styling

- Use Tailwind CSS para estilização
- Mantenha classes organizadas e legíveis
- Use variáveis CSS para valores reutilizáveis
- Implemente design responsivo

```typescript
<div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
  {/* conteúdo */}
</div>
```

### Nomenclatura

- **Variáveis**: camelCase (`userName`, `apiResponse`)
- **Funções**: camelCase (`handleSubmit`, `fetchData`)
- **Componentes**: PascalCase (`CompanyCard`, `SearchForm`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`, `MAX_RESULTS`)
- **Arquivos**: kebab-case (`company-card.tsx`, `api-service.ts`)

## 🔄 Processo de Pull Request

### Antes de Submeter

1. **Teste** suas mudanças localmente
2. **Execute** o linter: `npm run lint`
3. **Execute** os testes: `npm run test`
4. **Faça build** do projeto: `npm run build`
5. **Atualize** a documentação se necessário

### Submetendo o PR

1. **Crie uma branch** para sua feature:
   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. **Faça commits** seguindo as convenções
3. **Push** para seu fork:
   ```bash
   git push origin feature/nome-da-feature
   ```

4. **Abra um Pull Request** no GitHub

### Template de Pull Request

```markdown
## Descrição
Breve descrição das mudanças implementadas.

## Tipo de Mudança
- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova feature (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação (mudança apenas na documentação)

## Como Testar
Descreva os passos para testar suas mudanças:
1. Vá para '...'
2. Clique em '...'
3. Veja que '...'

## Checklist
- [ ] Meu código segue os padrões do projeto
- [ ] Fiz uma auto-revisão do meu código
- [ ] Comentei partes complexas do código
- [ ] Atualizei a documentação
- [ ] Minhas mudanças não geram novos warnings
- [ ] Adicionei testes que provam que minha correção/feature funciona
- [ ] Testes novos e existentes passam localmente

## Screenshots (se aplicável)
Adicione screenshots para demonstrar as mudanças visuais.
```

## 📝 Convenções de Commit

Use o formato [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[escopo opcional]: <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos de Commit

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Mudanças na documentação
- **style**: Mudanças de formatação (não afetam o código)
- **refactor**: Refatoração de código
- **test**: Adição ou modificação de testes
- **chore**: Mudanças em ferramentas, configurações, etc.

### Exemplos

```bash
feat: adicionar filtro por setor de empresa
fix: corrigir erro na busca de funcionários
docs: atualizar README com novas instruções
style: formatar código com prettier
refactor: reorganizar estrutura de componentes
test: adicionar testes para busca de empresas
chore: atualizar dependências do projeto
```

### Commits com Breaking Changes

```bash
feat!: alterar estrutura da API de busca

BREAKING CHANGE: A função searchCompanies agora retorna
um objeto com estrutura diferente. Veja a documentação
para detalhes da migração.
```

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
npm run test

# Testes em modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

### Escrevendo Testes

- Use Jest para testes unitários
- Use React Testing Library para testes de componentes
- Mantenha cobertura acima de 80%
- Teste casos de sucesso e erro

```typescript
import { render, screen } from '@testing-library/react';
import { CompanyCard } from './CompanyCard';

describe('CompanyCard', () => {
  test('renders company name', () => {
    const company = { id: '1', name: 'Test Company' };
    render(<CompanyCard company={company} />);
    
    expect(screen.getByText('Test Company')).toBeInTheDocument();
  });
});
```

## 📚 Recursos Úteis

### Documentação
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Apollo.io API](https://apolloio.github.io/apollo-api-docs/)

### Ferramentas
- [VS Code](https://code.visualstudio.com/) - Editor recomendado
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Postman](https://www.postman.com/) - Testes de API

## 🎯 Boas Práticas

### Performance
- Use `React.memo` para componentes que re-renderizam frequentemente
- Implemente lazy loading para componentes pesados
- Otimize imagens e assets
- Use debouncing para inputs de busca

### Acessibilidade
- Use elementos semânticos HTML
- Adicione labels apropriados
- Implemente navegação por teclado
- Teste com leitores de tela

### Segurança
- Sanitize inputs do usuário
- Valide dados no frontend e backend
- Use HTTPS em produção
- Não exponha chaves de API no frontend

## 🤔 Dúvidas?

Se você tem dúvidas sobre como contribuir:

1. **Verifique** a documentação existente
2. **Procure** nas issues existentes
3. **Abra uma issue** com sua dúvida
4. **Entre em contato** com os mantenedores

## 🙏 Reconhecimento

Todos os contribuidores serão reconhecidos no README do projeto. Obrigado por ajudar a tornar este projeto melhor!

---

**Código de Conduta**: Este projeto adere ao [Contributor Covenant](https://www.contributor-covenant.org/). Ao participar, você deve seguir este código.

**Licença**: Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).