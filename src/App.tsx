import React, { useState } from 'react';
import { Mail, Download, Users, Loader, CheckCircle, XCircle, AlertCircle, X, Search } from 'lucide-react';
import type { Person, EmailSearchResponse } from './types/apollo';
import { captureEmailsFromPersons } from './services/emailCapture';
import { SearchForm } from './components/SearchForm';
import { CompanyCard } from './components/CompanyCard';
import { IndustryFilter } from './components/IndustryFilter';
import { Pagination } from './components/Pagination';
import { ErrorMessage } from './components/ErrorMessage';

import { PeopleSearchModal } from './components/PeopleSearchModal';
import { PeopleLeadsModal } from './components/PeopleLeadsModal';
import { BatchEmailCapture } from './components/BatchEmailCapture';
import { LeadsTable } from './components/LeadsTable';
import { apolloApiService } from './services/apolloApi';
import { useLocalStorage } from './hooks/useLocalStorage';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { SearchFilters, Company, PeopleSearchFilters, Person as PersonType } from './types/apollo';

function App() {
  // State management
  // Carregar API key das variáveis de ambiente do Vite
  const apiKey = import.meta.env.VITE_APOLLO_API_KEY || '';
  const [companies, setCompanies] = useState<Company[]>([]);
  const [people, setPeople] = useState<PersonType[]>([]);
  const [savedPeople, setSavedPeople] = useState<PersonType[]>([]);
  const [savedCompanies, setSavedCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPeopleLoading, setIsPeopleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'industry' | 'employees' | 'revenue'>('name');
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null);
  
  // Modal states
  const [isPeopleSearchModalOpen, setIsPeopleSearchModalOpen] = useState(false);
  const [isPeopleLeadsModalOpen, setIsPeopleLeadsModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Estado para notificações globais
  const [globalNotification, setGlobalNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Função para mostrar notificação global
  const showGlobalNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setGlobalNotification({ type, message });
    
    // Auto-hide after 6 seconds
    setTimeout(() => {
      setGlobalNotification(null);
    }, 6000);
  };

  // Set API key when component mounts
  React.useEffect(() => {
    // A API key agora é carregada automaticamente das variáveis de ambiente
    // no construtor do apolloApiService
    console.log('🔍 App.tsx - API Key carregada:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      apiKeyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined'
    });
  }, [apiKey]);

  // Update exportPageTo when totalPages changes
  React.useEffect(() => {
    if (totalPages > 0) {
      setExportPageTo(totalPages);
    }
  }, [totalPages]);

  const handleSearch = async (filters: SearchFilters) => {
    // Prevent multiple simultaneous searches
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentFilters(filters);

    try {
      const response = await apolloApiService.searchCompanies(filters);
      
      // Use setTimeout to ensure state updates are batched properly
      setTimeout(() => {
        setCompanies(response.organizations || []);
        setCurrentPage(response.pagination.page);
        setTotalPages(response.pagination.total_pages);
        setTotalResults(response.pagination.total_entries);
        
        // Reset filters when new search is performed
        setSelectedIndustries([]);
        setSortBy('name');
        setIsLoading(false);
      }, 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      setCompanies([]);
      setTotalPages(0);
      setTotalResults(0);
      setIsLoading(false);
    }
  };

  const handlePageChange = async (page: number) => {
    if (!currentFilters) return;
    
    const newFilters = { ...currentFilters, page };
    await handleSearch(newFilters);
  };



  const handlePeopleSearch = async (filters: PeopleSearchFilters) => {
    setIsPeopleLoading(true);
    setError(null);

    try {
      const response = await apolloApiService.searchPeople(filters);
      
      const foundPeople = response.contacts || response.people || [];
      setPeople(foundPeople);
      
      if (foundPeople.length > 0) {
        setIsPeopleSearchModalOpen(false);
        setIsPeopleLeadsModalOpen(true);
      } else {
        setError('No people found with the specified criteria. Try adjusting your search filters.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while searching for people';
      setError(errorMessage);
      setPeople([]);
    } finally {
      setIsPeopleLoading(false);
    }
  };

  const handleQuickPeopleSearch = async (company: Company, filters: PeopleSearchFilters) => {
    setIsPeopleLoading(true);
    setError(null);
    setSelectedCompany(company);

    try {
      const response = await apolloApiService.searchPeople(filters);
      
      const foundPeople = response.contacts || response.people || [];
      setPeople(foundPeople);
      
      if (foundPeople.length > 0) {
        setIsPeopleLeadsModalOpen(true);
      } else {
        setError(`No people found at ${company.name}. The company might not have detailed employee information available.`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred while searching for people';
      setError(errorMessage);
      setPeople([]);
    } finally {
      setIsPeopleLoading(false);
    }
  };

  const handleEmailSearch = async (personId: string, organizationId?: string) => {
    // CRITICAL: Log para debug do estado do modal
    console.log(`🔍 App.tsx - handleEmailSearch iniciado - Modal aberto: ${isPeopleLeadsModalOpen}, selectedCompany: ${selectedCompany?.name}`);
    
    // CRITICAL: Validação inicial para evitar crashes
    if (!personId || personId.trim() === '') {
      console.error('❌ ID da pessoa é inválido');
      return {
        person: { id: 'invalid', name: 'Invalid ID', title: 'N/A' } as any,
        emails: [],
        phone_numbers: [],
        success: false,
        message: '❌ ID da pessoa é inválido'
      };
    }

    if (!apiKey) {
      console.error('❌ API key é obrigatória para busca de email');
      return {
        person: { id: personId, name: 'Unknown', title: 'Unknown' } as any,
        emails: [],
        phone_numbers: [],
        success: false,
        message: '❌ API key é obrigatória para buscar emails'
      };
    }

    console.log(`🔍 App.tsx - handleEmailSearch iniciado para ID: ${personId}`);
    console.log(`🏢 Organization ID: ${organizationId}`);

    try {
      // CRITICAL: Validar se o serviço está disponível
      if (!apolloApiService) {
        throw new Error('Apollo API Service não está disponível');
      }
      
      // Add timeout and error handling to prevent app crash
      const response = await Promise.race([
        apolloApiService.searchPersonEmails({
          personId,
          organizationId
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Busca de email demorou mais de 45 segundos')), 45000)
        )
      ]);
      
      console.log('✅ App.tsx - Resposta da busca de email:', response);
      
      // CRITICAL: Verificar se o modal ainda está aberto após a busca
      console.log(`🔍 App.tsx - Após busca - Modal ainda aberto: ${isPeopleLeadsModalOpen}, selectedCompany: ${selectedCompany?.name}`);
      
      // Show success notification if emails found
      if (response.success && response.emails && response.emails.length > 0) {
        const emailList = response.emails.map(e => e.email).join(', ');
        showGlobalNotification('success', `✅ ${response.emails.length} email(s) encontrado(s): ${emailList.substring(0, 80)}${emailList.length > 80 ? '...' : ''}`);
      } else if (response.success && response.phone_numbers && response.phone_numbers.length > 0) {
        showGlobalNotification('success', `📞 ${response.phone_numbers.length} telefone(s) encontrado(s)`);
      } else if (!response.success) {
        showGlobalNotification('info', `❌ Nenhum email encontrado. ${response.message?.substring(0, 100) || ''}`);
      }
      
      return response;
    } catch (err) {
      console.error('❌ App.tsx - Erro na busca de email:', err);
      
      // CRITICAL: Log detalhado do erro para debugging
      if (err instanceof Error) {
        console.error('❌ Detalhes do erro:', {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
      }
      
      // Return safe response instead of throwing to prevent app crash
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na busca de email';
      
      // CRITICAL: Proteção contra notificação que pode falhar
      try {
        showGlobalNotification('error', `❌ Erro na busca: ${errorMessage.substring(0, 100)}${errorMessage.length > 100 ? '...' : ''}`);
      } catch (notificationError) {
        console.error('❌ Erro ao mostrar notificação:', notificationError);
      }
      
      return {
        person: { id: personId, name: 'Erro na busca', title: 'N/A' } as any,
        emails: [],
        phone_numbers: [],
        success: false,
        message: `❌ ${errorMessage}\n\n💡 Sugestões:\n• Verifique sua conexão com a internet\n• Confirme se seu plano Apollo.io permite busca de emails\n• Tente novamente em alguns segundos`
      };
    }
  };

  const openPeopleSearchModal = (company: Company) => {
    setSelectedCompany(company);
    setIsPeopleSearchModalOpen(true);
  };

  const handleNewSearch = () => {
    setCompanies([]);
    setPeople([]);
    setCurrentFilters(null);
    setError(null);
    setCurrentPage(1);
    setTotalPages(0);
    setTotalResults(0);
    setSelectedIndustries([]);
    setSortBy('name');
  };

  const handleExportLeads = () => {
    const allLeads = [...savedPeople, ...savedCompanies];
    if (allLeads.length === 0) {
      alert('No leads to export');
      return;
    }

    const csvContent = [
      '\uFEFF' + ['Type', 'Name', 'Title', 'Company', 'Email', 'Phone', 'Location', 'LinkedIn'].join(','),
      ...savedPeople.map(person => {
        const location = [person.city, person.state, person.country].filter(Boolean).join(', ') || 'N/A';
        return [
          '"Person"',
          `"${person.name || 'N/A'}"`,
          `"${person.title || 'N/A'}"`,
          `"${person.organization?.name || person.account?.name || 'N/A'}"`,
          `"${person.email || 'N/A'}"`,
          `"${person.phone_numbers?.[0]?.raw_number || 'N/A'}"`,
          `"${location}"`,
          `"${person.linkedin_url || 'N/A'}"`
        ].join(',');
      }),
      ...savedCompanies.map(company => [
        '"Company"',
        `"${company.name || 'N/A'}"`,
        '"Company"',
        `"${company.industry || 'N/A'}"`,
        '"N/A"',
        `"${company.primary_phone?.number || 'N/A'}"`,
        `"${company.headquarters_address || 'N/A'}"`,
        `"${company.linkedin_url || 'N/A'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAllLeads = () => {
    if (confirm('Are you sure you want to clear all saved leads?')) {
      setSavedPeople([]);
      setSavedCompanies([]);
    }
  };

  // Filter and sort companies
  const filteredAndSortedCompanies = React.useMemo(() => {
    let filtered = companies;

    // Apply website URL filter - only show companies with website
    filtered = filtered.filter(company => {
      return company.website_url && company.website_url.trim() !== '';
    });

    // Apply industry filter
    if (selectedIndustries.length > 0) {
      filtered = filtered.filter(company => {
        if (!company.industry) return false;
        
        const industryTranslation: { [key: string]: string } = {
          'Agriculture': 'Agronegócio',
          'Information Technology': 'Tecnologia',
          'Healthcare': 'Saúde',
          'Financial Services': 'Finanças',
          'Manufacturing': 'Manufatura',
          'Construction': 'Construção',
          'Real Estate': 'Imobiliário',
          'Education': 'Educação',
          'Retail': 'Varejo',
          'Telecommunications': 'Telecomunicações',
        };
        
        const translatedIndustry = industryTranslation[company.industry] || company.industry;
        return selectedIndustries.includes(company.industry) || selectedIndustries.includes(translatedIndustry);
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'industry':
          return (a.industry || '').localeCompare(b.industry || '');
        case 'employees':
          return (b.num_employees || 0) - (a.num_employees || 0);
        case 'revenue':
          return (b.annual_revenue || 0) - (a.annual_revenue || 0);
        default:
          return 0;
      }
    });

    return sorted;
  }, [companies, selectedIndustries, sortBy]);

  // Adicionar função para exportar empresas filtradas para CSV
  const handleExportCompanies = () => {
    if (filteredAndSortedCompanies.length === 0) {
      alert('Nenhuma empresa para exportar.');
      return;
    }
    const csvHeader = ['Nome', 'Setor', 'Localização', 'Funcionários', 'Site'];
    const csvRows = filteredAndSortedCompanies.map(company => [
      company.name,
      company.industry || '',
      company.headquarters_address || '',
      company.num_employees || '',
      company.website_url || ''
    ]);
    const csvContent = [csvHeader, ...csvRows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `empresas_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Adicionar estados para modal de exportação
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPageFrom, setExportPageFrom] = useState(1);
  const [exportPageTo, setExportPageTo] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Função para buscar empresas de várias páginas
  const fetchCompaniesPages = async (from: number, to: number) => {
    let allCompanies: Company[] = [];
    for (let page = from; page <= to; page++) {
      const response = await apolloApiService.searchCompanies({ ...currentFilters!, page, perPage: 25 });
      if (response.organizations) {
        allCompanies = allCompanies.concat(response.organizations);
      }
    }
    return allCompanies;
  };

  // Substituir a função handleExportCompaniesPaged para buscar detalhes em lote
  const handleExportCompaniesPaged = async () => {
    setIsExporting(true);
    try {
      console.log('🚀 Iniciando exportação de empresas...');
      console.log('📊 Intervalo de páginas:', exportPageFrom, 'a', exportPageTo);
      
      // Validação do intervalo de páginas
      const pageRange = exportPageTo - exportPageFrom + 1;
      if (pageRange > 20) {
        alert('Por favor, exporte no máximo 20 páginas por vez para evitar travamentos.');
        setIsExporting(false);
        return;
      }
      
      // Buscar empresas de todas as páginas do intervalo usando os filtros atuais
      if (!currentFilters) {
        alert('Nenhum filtro de busca encontrado. Faça uma busca primeiro.');
        setIsExporting(false);
        return;
      }
      
      let allCompanies: Company[] = [];
      console.log('🔍 Buscando empresas de', exportPageTo - exportPageFrom + 1, 'páginas...');
      
      for (let page = exportPageFrom; page <= exportPageTo; page++) {
        console.log(`📄 Buscando página ${page}...`);
        try {
          // Adicionar timeout para evitar travamento
          const response = await Promise.race([
            apolloApiService.searchCompanies({ ...currentFilters, page, perPage: 25 }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error(`Timeout: Página ${page} demorou mais de 30 segundos`)), 30000)
            )
          ]);
          if (response.organizations) {
            allCompanies = allCompanies.concat(response.organizations);
            console.log(`✅ Página ${page}: ${response.organizations.length} empresas encontradas`);
          }
          
          // Adicionar delay entre requisições para evitar sobrecarregar a API
          if (page < exportPageTo) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
          }
        } catch (pageError) {
          console.error(`❌ Erro na página ${page}:`, pageError);
          // Continuar com as outras páginas mesmo se uma falhar
        }
      }
      
      console.log(`📊 Total de empresas coletadas: ${allCompanies.length}`);
      
      // Log detalhado dos campos relevantes antes do filtro/exportação
      console.log('👀 Empresas retornadas (detalhe):', allCompanies.map(c => ({
        name: c.name,
        num_employees: c.num_employees,
        num_employees_range: c.num_employees_range,
        industry: c.industry,
        organization_city: c.organization_city,
        organization_state: c.organization_state,
        organization_country: c.organization_country,
        city: (c as any).city,
        state: (c as any).state,
        country: (c as any).country,
        headquarters_address: c.headquarters_address,
        phone: c.phone,
        website_url: c.website_url,
      })));

      // Função utilitária para normalizar range textual para números
      function parseRange(str: string) {
        if (!str) return null;
        // Remove texto e espaços
        str = str.toLowerCase().replace(/funcionários|employees|\s|\./g, '');
        // Ex: '5mil-10mil' => '5mil-10mil'
        const match = str.match(/(\d+)(mil)?-(\d+)(mil)?/);
        if (match) {
          let min = parseInt(match[1], 10);
          let max = parseInt(match[3], 10);
          if (match[2]) min *= 1000;
          if (match[4]) max *= 1000;
          return { min, max };
        }
        // Ex: '3000+' ou '3mil+' => min=3000, max=Infinity
        const plus = str.match(/(\d+)(mil)?\+/);
        if (plus) {
          let min = parseInt(plus[1], 10);
          if (plus[2]) min *= 1000;
          return { min, max: Infinity };
        }
        // Ex: '5001,10000' => min=5001, max=10000
        const comma = str.match(/(\d+),(\d+)/);
        if (comma) {
          return { min: parseInt(comma[1], 10), max: parseInt(comma[2], 10) };
        }
        return null;
      }

      let filteredCompanies = allCompanies;
      const range = currentFilters.employeeRange;
      console.log('🔍 Aplicando filtro de funcionários:', range);
      if (range && range !== 'all') {
        const filtroRange = parseRange(range);
        filteredCompanies = allCompanies.filter(c => {
          // Tenta pelo campo numérico
          const n = c.num_employees || 0;
          let matchNumeric = false;
          if (filtroRange) {
            matchNumeric = n >= filtroRange.min && n <= filtroRange.max;
          }
          // Tenta pelo campo textual
          let matchText = false;
          if (c.num_employees_range) {
            const empresaRange = parseRange(c.num_employees_range);
            if (empresaRange && filtroRange) {
              // Verifica se os ranges se sobrepõem
              matchText = empresaRange.min <= filtroRange.max && empresaRange.max >= filtroRange.min;
            }
          }
          return matchNumeric || matchText;
        });
        console.log(`✅ Filtro ${range}: ${filteredCompanies.length} empresas após filtro`);
      }
      
      if (filteredCompanies.length === 0) {
        alert(`Nenhuma empresa para exportar após aplicar filtros.\nTotal retornado da API: ${allCompanies.length}\nTotal após filtro: 0`);
        setIsExportModalOpen(false);
        setIsExporting(false);
        return;
      }
      
      console.log('📝 Gerando CSV...');
      // Gerar CSV com todas as informações relevantes vindas da busca
      const csvHeader = [
        'Nome',
        'Site',
        'FTEs (Faixa)',
        'Setor',
        'Ano de Fundação',
        'Telefone',
        'Cidade',
        'Estado',
        'País',
        'LinkedIn',
        'ID', // Agora a última coluna
      ];
      const csvRows = filteredCompanies.map(company => [
        company.name || 'N/A',
        company.website_url || 'N/A',
        currentFilters.employeeRange || 'N/A',
        company.industry || 'N/A',
        company.founded_year || 'N/A',
        company.phone || company.primary_phone?.number || 'N/A',
        company.organization_city || (company as any).city || 'N/A',
        company.organization_state || (company as any).state || 'N/A',
        'Brasil',
        company.linkedin_url || 'N/A',
        company.id || 'N/A', // Agora a última coluna
      ]);
      const csvContent = '\uFEFF' + [csvHeader, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `empresas_export_${exportPageFrom}_a_${exportPageTo}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Exportação concluída com sucesso!');
      setIsExportModalOpen(false);
    } catch (e) {
      console.error('❌ Erro na exportação:', e);
      let msg = 'Erro ao exportar empresas.';
      if (e instanceof Error) msg += ' ' + e.message;
      else if (typeof e === 'string') msg += ' ' + e;
      alert(msg);
    }
    setIsExporting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white py-4 mb-6 rounded-xl shadow-lg border border-slate-800/50">
          {/* Background Pattern - Reduzido */}
          <div className="absolute inset-0 opacity-3">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/10 to-slate-900/5"></div>
          </div>

          <div className="relative max-w-4xl mx-auto text-center px-4">
            {/* Logo OnSet compacto */}
            <div className="flex items-center justify-center mb-2">
              <h1 className="text-2xl font-bold mr-4">
                <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">On</span>
                <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">Set</span>
              </h1>
              <div className="h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent w-16 mr-2"></div>
              <p className="text-orange-400 text-xs font-medium tracking-wide">
                Conectando Inteligência e Tecnologia
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-orange-400 to-transparent w-16 ml-2"></div>
            </div>

            {/* Título Principal compacto */}
            <div className="mb-3">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Company Search
              </h2>
              <p className="text-blue-100 text-sm leading-relaxed max-w-2xl mx-auto">
                Plataforma inteligente para pesquisa e qualificação de leads B2B
              </p>
            </div>

            {/* Features compactas */}
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
              <div className="flex items-center bg-green-500/20 border border-green-500/30 px-3 py-1 rounded-full">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-white font-medium">Busca Inteligente</span>
              </div>

              <div className="flex items-center bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span className="text-white font-medium">Exportação</span>
              </div>



              <div className="flex items-center bg-orange-500/20 border border-orange-500/30 px-3 py-1 rounded-full">
                <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                  </svg>
                </div>
                <span className="text-white font-medium">Leads B2B</span>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <ErrorMessage 
            message={error} 
            onClose={() => setError(null)} 
          />
        )}

        {/* Global Notification */}
        {globalNotification && (
          <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border ${
            globalNotification.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
            globalNotification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium pr-4">{globalNotification.message}</span>
              <button
                onClick={() => setGlobalNotification(null)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <ErrorBoundary>
          <SearchForm
            onSearch={handleSearch}
            isLoading={isLoading}
            hasResults={companies.length > 0}
            onNewSearch={handleNewSearch}
          />
        </ErrorBoundary>

        {companies.length > 0 && (
          <>
            {/* Header Section with Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Search Results
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {totalResults.toLocaleString()} companies found • Showing {filteredAndSortedCompanies.length} of {companies.length} companies
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleNewSearch}
                      className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium shadow-sm"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Nova Pesquisa
                    </button>
                    <button
                      onClick={() => setIsExportModalOpen(true)}
                      className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium shadow-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar (CSV)
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Filters Section */}
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Filtros Aplicados</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        Apenas empresas com site
                      </span>
                      {currentFilters?.location && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          {currentFilters.location}
                        </span>
                      )}
                      {currentFilters?.businessArea && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                          </svg>
                          {currentFilters.businessArea.split(',').length} setor(es)
                        </span>
                      )}
                      {currentFilters?.employeeRange && currentFilters.employeeRange !== 'all' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                          </svg>
                          {(() => {
                            const employeeRanges = [
                              { value: '201,500', label: '201-500 funcionários' },
                              { value: '501,1000', label: '501-1,000 funcionários' },
                              { value: '1001,5000', label: '1,001-5,000 funcionários' },
                              { value: '5001,10000', label: '5,001-10,000 funcionários' },
                              { value: '10001,50000', label: '10,001+ funcionários' },
                            ];
                            return employeeRanges.find(r => r.value === currentFilters.employeeRange)?.label || currentFilters.employeeRange;
                          })()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filters and Sorting */}
              <div className="px-6 py-4">
                <IndustryFilter
                  companies={companies}
                  selectedIndustries={selectedIndustries}
                  onIndustryChange={setSelectedIndustries}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            </div>

            {/* Results Grid */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedCompanies.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    onSearchPeople={openPeopleSearchModal}
                    onQuickPeopleSearch={handleQuickPeopleSearch}
                  />
                ))}
              </div>

              {filteredAndSortedCompanies.length === 0 && companies.length > 0 && (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
                  <p className="text-gray-500 mb-4">
                    Nenhuma empresa corresponde aos filtros selecionados.
                  </p>
                  <button
                    onClick={() => setSelectedIndustries([])}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </>
        )}

        {/* Saved Leads Table */}
        {(savedPeople.length > 0 || savedCompanies.length > 0) && (
          <div className="mt-8">
            <LeadsTable
              people={savedPeople}
              companies={savedCompanies}
              title="Saved Leads"
              onExportData={handleExportLeads}
              onClearAll={handleClearAllLeads}
            />
          </div>
        )}

        {/* Modals */}

        {selectedCompany && (
          <ErrorBoundary>
            <PeopleSearchModal
              isOpen={isPeopleSearchModalOpen}
              onClose={() => setIsPeopleSearchModalOpen(false)}
              onSearch={handlePeopleSearch}
              company={selectedCompany}
              isLoading={isPeopleLoading}
            />
          </ErrorBoundary>
        )}

        {selectedCompany && (
          <ErrorBoundary>
            <PeopleLeadsModal
              isOpen={isPeopleLeadsModalOpen}
              onClose={() => {
                console.log('🔒 PeopleLeadsModal - Fechando modal manualmente');
                setIsPeopleLeadsModalOpen(false);
              }}
              people={people}
              company={selectedCompany}
              onEmailSearch={handleEmailSearch}
            />
          </ErrorBoundary>
        )}

        {/* Modal de exportação paginada */}
        {isExportModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Exportar Empresas (CSV)</h3>
              
              {isExporting ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Exportando empresas...</p>
                  <p className="text-xs text-gray-500 mt-1">Isso pode demorar alguns minutos</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Página inicial (de):</label>
                    <input type="number" min={1} max={totalPages} value={exportPageFrom} onChange={e => setExportPageFrom(Number(e.target.value))} className="w-full border rounded px-2 py-1" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Página final (até):</label>
                    <input type="number" min={exportPageFrom} max={totalPages} value={exportPageTo} onChange={e => setExportPageTo(Number(e.target.value))} className="w-full border rounded px-2 py-1" />
                  </div>
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Dica:</strong> Para melhor performance, exporte no máximo 10 páginas por vez.
                    </p>
                  </div>
                </>
              )}
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setIsExportModalOpen(false)} 
                  disabled={isExporting}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  {isExporting ? 'Aguarde...' : 'Cancelar'}
                </button>
                {!isExporting && (
                  <button 
                    onClick={handleExportCompaniesPaged} 
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                  >
                    Exportar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rodapé */}
        <footer className="mt-16 py-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 OnSet Tecnologia. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;