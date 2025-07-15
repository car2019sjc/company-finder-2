const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Permitir CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Responder a requisições OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Pegar a API key do header
    const apiKey = event.headers['x-api-key'];
    if (!apiKey) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'API key is required' }),
      };
    }

    // Pegar o endpoint da query string ou do path
    let endpoint = '';
    
    // Primeiro tentar query string
    if (event.queryStringParameters && event.queryStringParameters.endpoint) {
      endpoint = event.queryStringParameters.endpoint;
    } else {
      // Fallback: pegar do path
      const path = event.path.replace('/.netlify/functions/apollo-proxy', '');
      endpoint = path || '';
    }
    
    console.log('🔍 Endpoint extraído:', endpoint);
    console.log('🔍 Path completo:', event.path);
    console.log('🔍 Query params:', event.queryStringParameters);
    
    // Construir a URL da API Apollo
    const apolloUrl = `https://api.apollo.io/v1${endpoint}`;
    console.log('🌐 URL da API Apollo:', apolloUrl);
    console.log('🔑 API Key presente:', !!apiKey);
    console.log('📋 Method:', event.httpMethod);
    console.log('📦 Body:', event.body);
    
    // Pegar o body da requisição
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
        console.log('📦 Body parseado:', body);
      } catch (error) {
        console.log('❌ Erro ao fazer parse do body:', error);
        console.log('📦 Body original:', event.body);
      }
    }

    // Fazer a requisição para a API Apollo
    console.log('📡 Fazendo requisição para Apollo API...');
    const response = await fetch(apolloUrl, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'Accept': 'application/json',
      },
      body: event.httpMethod !== 'GET' ? JSON.stringify(body) : undefined,
    });

    console.log('📥 Status da resposta Apollo:', response.status);
    console.log('📥 Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📥 Data da resposta Apollo:', data);

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Error in Apollo proxy:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}; 