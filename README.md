# Lead Company Finder

Uma aplicação React para buscar empresas e seus funcionários usando a API do Apollo.io.

## Funcionalidades

- ✅ Busca de empresas por nome, localização, setor e tamanho
- ✅ Filtro automático para mostrar apenas empresas com URL de site
- ✅ Busca de funcionários por empresa
- ✅ Exportação de dados em CSV
- ✅ Interface responsiva e intuitiva

## Deploy

### GitHub Pages (Automático)

O deploy é feito automaticamente via GitHub Actions quando você faz push para a branch `main`.

### Configuração necessária:

#### Para Netlify (Recomendado):
1. **Variáveis de Ambiente no Netlify**:
   - Acesse: Site Settings > Environment Variables
   - Adicione: `VITE_APOLLO_API_KEY` = sua_chave_apollo_aqui
   - Adicione: `NODE_ENV` = production

#### Para GitHub Pages:
1. **Secrets do GitHub**: Configure as seguintes variáveis no repositório:
   - `VITE_APOLLO_API_KEY`: Sua chave da API do Apollo.io

2. **GitHub Pages**: 
   - Vá em Settings > Pages
   - Source: Deploy from a branch
   - Branch: gh-pages / (root)

### Deploy manual local:

```bash
# Instalar dependências
npm install

# Build para produção
npm run build

# Preview local do build
npm run preview
```

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_APOLLO_API_KEY=sua_chave_apollo_aqui
```

## Tecnologias

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Apollo.io API
- Lucide React (ícones)

## Estrutura do Projeto

```
src/
├── components/          # Componentes React
├── services/           # Serviços de API
├── types/              # Tipos TypeScript
├── config/             # Configurações
└── hooks/              # Hooks customizados
```

## Filtros Implementados

- **Filtro de Site**: Mostra apenas empresas que possuem URL de site
- **Filtro por Setor**: Filtra empresas por área de negócio
- **Filtro por Localização**: Busca por cidade/estado/país
- **Filtro por Tamanho**: Filtra por número de funcionários

## API

A aplicação utiliza a API do Apollo.io para:
- Buscar empresas
- Buscar funcionários
- Obter informações de contato

## Licença

MIT