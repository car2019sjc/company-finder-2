// Configuração da API baseada no ambiente
export const API_CONFIG = {
  // Em desenvolvimento, usar proxy local do Vite
  development: {
    baseUrl: '/api/apollo',
    useProxy: true,
  },
  // Em produção, tentar Netlify Functions primeiro, depois API direta
  production: {
    baseUrl: window.location.hostname.includes('netlify') ? '/api/apollo' : 'https://api.apollo.io/v1',
    useProxy: window.location.hostname.includes('netlify'),
  }
};

// Função para obter a URL base da API
export function getApiBaseUrl(): string {
  const isProduction = import.meta.env.PROD;
  const config = isProduction ? API_CONFIG.production : API_CONFIG.development;
  
  console.log('🌐 Ambiente:', isProduction ? 'production' : 'development');
  console.log('🔗 Base URL:', config.baseUrl);
  console.log('🔄 Use Proxy:', config.useProxy);
  
  return config.baseUrl;
}

// Função para verificar se deve usar proxy
export function shouldUseProxy(): boolean {
  const isProduction = import.meta.env.PROD;
  const config = isProduction ? API_CONFIG.production : API_CONFIG.development;
  return config.useProxy;
} 