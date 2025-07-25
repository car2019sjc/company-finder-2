// Trocar extensão para .cjs para rodar como CommonJS
// Teste para verificar busca da empresa "REDE D'OR SAO LUIZ SA"
// Execute este arquivo com: node test-search.cjs

require('dotenv').config();

const API_KEY = process.env.VITE_APOLLO_API_KEY;

if (!API_KEY || API_KEY === 'your_apollo_api_key_here') {
  console.error('❌ API Key não encontrada no arquivo .env');
  console.log('Por favor, configure VITE_APOLLO_API_KEY no arquivo .env');
  process.exit(1);
}

console.log('🔑 API Key carregada:', API_KEY.substring(0, 10) + '...');

async function testCompanySearch() {
  console.log('🔍 Testando busca para "REDE D\'OR SAO LUIZ SA"');
  
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

  const testCases = [
    {
      name: 'Busca exata',
      body: {
        page: 1,
        per_page: 25,
        q_organization_name: 'REDE D\'OR SAO LUIZ SA'
      }
    },
    {
      name: 'Busca parcial - REDE D\'OR',
      body: {
        page: 1,
        per_page: 25,
        q_organization_name: 'REDE D\'OR'
      }
    },
    {
      name: 'Busca por localização Brasil',
      body: {
        page: 1,
        per_page: 25,
        organization_locations: ['Brasil']
      }
    },
    {
      name: 'Busca por setor Saúde',
      body: {
        page: 1,
        per_page: 25,
        q_organization_keyword_tags: ['healthcare']
      }
    },
    {
      name: 'Busca combinada - REDE D\'OR + Brasil',
      body: {
        page: 1,
        per_page: 25,
        q_organization_name: 'REDE D\'OR',
        organization_locations: ['Brasil']
      }
    },
    {
      name: 'Busca combinada - REDE D\'OR + Saúde',
      body: {
        page: 1,
        per_page: 25,
        q_organization_name: 'REDE D\'OR',
        q_organization_keyword_tags: ['healthcare']
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📡 Testando: ${testCase.name}`);
    console.log('Body:', JSON.stringify(testCase.body, null, 2));
    
    try {
      const response = await fetch('https://api.apollo.io/v1/mixed_companies/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': API_KEY,
          'Accept': 'application/json'
        },
        body: JSON.stringify(testCase.body)
      });

      if (!response.ok) {
        console.log(`❌ Erro ${response.status}: ${response.statusText}`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Total encontrado: ${data.pagination?.total_entries || 0}`);
      
      if (data.organizations && data.organizations.length > 0) {
        console.log('🏢 Empresas encontradas:');
        data.organizations.forEach((company, index) => {
          console.log(`  ${index + 1}. ${company.name} (${company.organization_locations?.join(', ') || 'N/A'})`);
        });
      } else {
        console.log('❌ Nenhuma empresa encontrada');
      }
    } catch (error) {
      console.log(`❌ Erro na requisição: ${error.message}`);
    }
  }
}

testCompanySearch().catch(console.error); 