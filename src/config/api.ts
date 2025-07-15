// Configuração da API baseada no ambiente
export const API_CONFIG = {
  // Em desenvolvimento, usar proxy local do Vite
  development: {
    baseUrl: '/api/apollo/v1',
    useProxy: true,
  },
  // Em produção, tentar diferentes estratégias
  production: {
    // Estratégia 1: Proxy público (fallback)
    proxyUrl: 'https://api.allorigins.win/raw?url=https://api.apollo.io/v1',
    // Estratégia 2: URL direta (pode falhar por CORS)
    directUrl: 'https://api.apollo.io/v1',
    useProxy: true,
  }
};

// Função para obter a URL base da API
export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return API_CONFIG.development.baseUrl;
  }
  
  // Em produção, usar proxy por padrão
  return API_CONFIG.production.proxyUrl;
}

// Função para verificar se deve usar proxy
export function shouldUseProxy(): boolean {
  return import.meta.env.DEV || API_CONFIG.production.useProxy;
} 