// Configuração da API baseada no ambiente
export const API_CONFIG = {
  // Em desenvolvimento, usar proxy local do Vite
  development: {
    baseUrl: '/api/apollo',
    useProxy: true,
  },
  // Em produção, usar Netlify Functions
  production: {
    baseUrl: '/api/apollo',
    useProxy: true,
  }
};

// Função para obter a URL base da API
export function getApiBaseUrl(): string {
  // Usar sempre o proxy (Vite em dev, Netlify Functions em prod)
  return API_CONFIG.development.baseUrl;
}

// Função para verificar se deve usar proxy
export function shouldUseProxy(): boolean {
  return true; // Sempre usar proxy
} 