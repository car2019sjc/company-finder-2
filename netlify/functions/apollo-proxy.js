const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  console.log('🚀 Apollo proxy function called');
  console.log('📋 Path:', event.path);
  console.log('📋 Method:', event.httpMethod);
  console.log('📋 Headers:', event.headers);
  
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
      console.log('❌ API key não encontrada');
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'API key is required' }),
      };
    }

    // Pegar o endpoint do path
    const path = event.path;
    console.log('🔍 Path completo:', path);
    
    // Remover o prefixo da function e adicionar /v1
    let endpoint = path.replace('/.netlify/functions/apollo-proxy', '');
    if (!endpoint.startsWith('/v1')) {
      endpoint = '/v1' + endpoint;
    }
    
    console.log('🔍 Endpoint final:', endpoint);
    
    // Construir a URL da API Apollo
    const apolloUrl = `https://api.apollo.io${endpoint}`;
    console.log('🌐 URL da API Apollo:', apolloUrl);
    
    // Pegar o body da requisição
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
        console.log('📦 Body parseado:', body);
      } catch (error) {
        console.log('❌ Erro ao fazer parse do body:', error);
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

    const data = await response.json();
    console.log('📥 Data da resposta Apollo:', data);

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('❌ Error in Apollo proxy:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message
      }),
    };
  }
}; 