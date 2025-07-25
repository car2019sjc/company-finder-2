exports.handler = async (event, context) => {
  console.log('🧪 Test API function called');
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Netlify Functions está funcionando!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        hasApiKey: !!process.env.VITE_APOLLO_API_KEY,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro interno',
        message: error.message,
      }),
    };
  }
};