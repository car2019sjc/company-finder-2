import React, { useState, useEffect } from 'react';
import { X, Download, Mail, Phone, MapPin, Building2, User, ExternalLink, Search, Filter, CheckCircle, Users, Loader, AlertCircle, XCircle } from 'lucide-react';
import type { Person, Company } from '../types/apollo';
import { captureEmailsFromPersons } from '../services/emailCapture';
import { apolloApiService } from '../services/apolloApi';

interface PeopleLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  company: Company;
  onEmailSearch?: (personId: string, organizationId?: string) => Promise<any>;
}

interface TablePerson extends Person {
  id: string;
  name: string;
  title: string; // Corrigido para sempre string
  email?: string;
  phone?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  organization?: {
    id: string;
    name: string;
    industry?: string;
  };
  account?: {
    id: string;
    name: string;
    industry?: string;
  };
}

export const PeopleLeadsModal: React.FC<PeopleLeadsModalProps> = ({
  isOpen,
  onClose,
  people,
  company,
  onEmailSearch
}) => {
  // CRITICAL: Log para debug do estado do modal
  console.log(`🔍 PeopleLeadsModal - Renderizando com isOpen: ${isOpen}, people: ${people?.length || 0}`);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [selectedIndustries, setSelectedIndustries] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'name' | 'title' | 'location'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'with-email' | 'without-email'>('all');
  const [emailSearchLoading, setEmailSearchLoading] = useState<string | null>(null);
  const [emailSearchResults, setEmailSearchResults] = useState<{[key: string]: any}>({});
  const [updatedPeople, setUpdatedPeople] = useState<{[key: string]: TablePerson}>({});
  
  // Estados para captura em lote
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    currentPerson: string;
  } | null>(null);
  const [batchCompleted, setBatchCompleted] = useState(false);
  const [batchResults, setBatchResults] = useState<Array<{ person: TablePerson; result: any }>>([]);

  // Estado para notificações internas
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Estado para notificação flutuante específica do email
  const [emailNotification, setEmailNotification] = useState<{
    personId: string;
    email: string;
    position: { top: number; left: number };
  } | null>(null);

  // CRITICAL: Estado para controlar se o modal está sendo processado
  const [isProcessing, setIsProcessing] = useState(false);
  
  // CRITICAL: Estado para controlar se deve renderizar a tabela
  const [shouldRenderTable, setShouldRenderTable] = useState(true);

  // Função para mostrar notificação interna
  const showNotification = React.useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    
    // Auto-hide after 6 seconds
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  }, []);

  // Processar dados das pessoas para exibição
  const processedPeople: TablePerson[] = React.useMemo(() => {
    // CRITICAL: Proteção contra arrays vazios
    if (!people || people.length === 0) {
      return [];
    }

    // CRITICAL: Se está processando, não recalcular para evitar re-renderizações
    if (isProcessing) {
      console.log('🔄 PeopleLeadsModal - Processando, evitando recálculo de processedPeople');
      return people.map(person => {
        const personId = person.id || `${person.name}-${Math.random()}`;
        const updatedPerson = updatedPeople[personId];
        return updatedPerson || {
          ...person,
          id: personId,
          name: person.name || 'Nome não disponível',
          title: person.title || person.headline || '',
          email: person.email,
          phone: person.phone_numbers?.[0]?.raw_number,
          linkedin_url: person.linkedin_url,
          city: person.city,
          state: person.state,
          country: person.country,
          organization: person.organization || person.account
        };
      });
    }

    return people.map(person => {
      const personId = person.id || `${person.name}-${Math.random()}`;
      
      // Se temos uma versão atualizada desta pessoa, usar ela
      const updatedPerson = updatedPeople[personId];
      if (updatedPerson) {
        // Log removido para evitar problemas de performance
        return updatedPerson;
      }
      
      // Caso contrário, usar dados originais
      return {
        ...person,
        id: personId,
        name: person.name || 'Nome não disponível',
        title: person.title || person.headline || '', // Garantir string
        email: person.email,
        phone: person.phone_numbers?.[0]?.raw_number,
        linkedin_url: person.linkedin_url,
        city: person.city,
        state: person.state,
        country: person.country,
        organization: person.organization || person.account
      };
    });
  }, [people, updatedPeople, isProcessing]); // Add isProcessing as dependency

  // Filtrar e ordenar pessoas
  const filteredAndSortedPeople = React.useMemo(() => {
    // Proteção contra arrays vazios
    if (!processedPeople || processedPeople.length === 0) {
      return [];
    }

    // CRITICAL: Se está processando, usar cache para evitar recálculos
    if (isProcessing) {
      console.log('🔄 PeopleLeadsModal - Processando, usando cache para filteredAndSortedPeople');
      return processedPeople;
    }

    let filtered = processedPeople.filter(person => {
      const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (person.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (person.organization?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Melhorar filtro de email para considerar emails válidos
      const hasValidEmail = person.email && 
                           person.email.includes('@') && 
                           !person.email.includes('email_not_unlocked') &&
                           !person.email.includes('domain.com');
      
      const matchesFilter = filterBy === 'all' ||
                          (filterBy === 'with-email' && hasValidEmail) ||
                          (filterBy === 'without-email' && !hasValidEmail);

      const matchesIndustry = selectedIndustries.size === 0 ||
                            selectedIndustries.has(person.organization?.industry || 'Não especificado');

      return matchesSearch && matchesFilter && matchesIndustry;
    });

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'location':
          const locationA = [a.city, a.state, a.country].filter(Boolean).join(', ');
          const locationB = [b.city, b.state, b.country].filter(Boolean).join(', ');
          return locationA.localeCompare(locationB);
        default:
          return 0;
      }
    });

    return sorted;
  }, [processedPeople, searchTerm, filterBy, selectedIndustries, sortBy, isProcessing]); // Add isProcessing as dependency

  const handleEmailSearch = React.useCallback(async (person: TablePerson) => {
    if (!onEmailSearch) {
      showNotification('error', 'Funcionalidade de busca de email não está disponível');
      return;
    }

    console.log(`🔍 PeopleLeadsModal - handleEmailSearch para: ${person.name} (ID: ${person.id})`);
    console.log(`🏢 Organization ID: ${person.organization?.id || person.account?.id || company.id}`);

    // CRITICAL: Marcar como processando e pausar renderização da tabela
    setIsProcessing(true);
    setShouldRenderTable(false);
    setEmailSearchLoading(person.id);

    // Scroll para a linha da pessoa para manter visível durante a busca
    const personRow = document.getElementById(`person-row-${person.id}`);
    if (personRow) {
      personRow.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
    
    try {
      // Add timeout to prevent hanging
      const result = await Promise.race([
        onEmailSearch(
          person.id, 
          person.organization?.id || person.account?.id || company.id
        ),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout: Busca de email demorou mais de 30 segundos')), 30000)
        )
      ]);
      
      console.log('✅ PeopleLeadsModal - Resultado da busca de email:', result);
      
      // CRITICAL: Atualizar a pessoa na tabela com os emails encontrados
      if (result.success && result.emails && result.emails.length > 0) {
        const primaryEmail = result.emails[0].email;
        
        console.log(`🔄 Atualizando email na tabela para ${person.name}: ${primaryEmail}`);
        
        const updatedPersonData: TablePerson = {
          ...person,
          email: primaryEmail, // Atualizar o email principal
          // Manter outros dados de contato se existirem
          phone: person.phone || (result.phone_numbers && result.phone_numbers.length > 0 ? result.phone_numbers[0].raw_number : undefined)
        };
        
        // Atualizar o estado das pessoas atualizadas de forma mais segura
        setUpdatedPeople(prev => ({
          ...prev,
          [person.id]: updatedPersonData
        }));
        
        // Atualizar resultados de busca de email
        setEmailSearchResults(prev => ({
          ...prev,
          [person.id]: { ...result, emailUpdated: true }
        }));
        
        // Show success notification
        const emailList = result.emails.map((e: any) => e.email).join(', ');
        showNotification('success', `✅ Email atualizado! ${person.name}: ${emailList.substring(0, 60)}${emailList.length > 60 ? '...' : ''}`);
        
        // Scroll para manter o resultado visível após a atualização
        setTimeout(() => {
          const personRow = document.getElementById(`person-row-${person.id}`);
          if (personRow) {
            personRow.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'nearest'
            });
            
            // Adicionar destaque temporário
            personRow.classList.add('ring-2', 'ring-green-400', 'bg-green-100');
            setTimeout(() => {
              personRow.classList.remove('ring-2', 'ring-green-400', 'bg-green-100');
            }, 3000);

            // Mostrar notificação flutuante próxima ao email
            const emailCell = personRow.querySelector('[data-email-cell]') as HTMLElement;
            if (emailCell) {
              const rect = emailCell.getBoundingClientRect();
              setEmailNotification({
                personId: person.id,
                email: primaryEmail,
                position: {
                  top: rect.top + window.scrollY - 10,
                  left: rect.right + 10
                }
              });

              // Auto-hide email notification
              setTimeout(() => {
                setEmailNotification(null);
              }, 4000);
            }
          }
        }, 200);
      } else if (result.success && result.phone_numbers && result.phone_numbers.length > 0) {
        showNotification('success', `📞 ${result.phone_numbers.length} telefone(s) encontrado(s) para ${person.name}`);
      } else {
        showNotification('info', `❌ Nenhum email encontrado para ${person.name}. ${result.message?.substring(0, 80) || ''}`);
      }
    } catch (error) {
      console.error('❌ PeopleLeadsModal - Erro ao buscar email:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showNotification('error', `❌ Erro na busca para ${person.name}: ${errorMessage.substring(0, 80)}${errorMessage.length > 80 ? '...' : ''}`);
    } finally {
      setEmailSearchLoading(null);
      // CRITICAL: Desmarcar como processando e reativar renderização da tabela
      setIsProcessing(false);
      // Pequeno delay para garantir que as atualizações de estado sejam processadas
      setTimeout(() => {
        setShouldRenderTable(true);
      }, 100);
    }
  }, [onEmailSearch, showNotification, company.id]);

  const handleBatchEmailCapture = async () => {
    const selectedPersonsData = filteredAndSortedPeople.filter(p => selectedPeople.has(p.id));
    
    if (selectedPersonsData.length === 0) {
      showNotification('error', 'Selecione pelo menos uma pessoa para captura em lote');
      return;
    }

    console.log(`🚀 Iniciando captura em lote para ${selectedPersonsData.length} pessoas selecionadas`);

    setIsBatchProcessing(true);
    setBatchCompleted(false);
    setBatchResults([]);
    setBatchProgress({
      current: 0,
      total: selectedPersonsData.length,
      currentPerson: ''
    });

    try {
      // Usar a API key do componente pai (assumindo que está disponível globalmente)
      const apiKey = localStorage.getItem('apollo-api-key');
      if (!apiKey) {
        throw new Error('API Key não encontrada. Configure sua API Key primeiro.');
      }

      const results = await captureEmailsFromPersons(
        selectedPersonsData,
        JSON.parse(apiKey),
        (current, total, person, result) => {
          console.log(`📊 Progresso: ${current}/${total} - ${person.name}`);
          setBatchProgress({
            current,
            total,
            currentPerson: person.name
          });
          
          // Atualizar pessoas com emails encontrados
          if (result.success && result.emails && result.emails.length > 0) {
            const primaryEmail = result.emails[0].email;
            const updatedPersonData: TablePerson = {
              ...person,
              email: primaryEmail
            };
            
            // Atualizar pessoas com emails encontrados
            setUpdatedPeople(prev => ({
              ...prev,
              [person.id]: updatedPersonData
            }));
          }
        }
      );

      setBatchResults(results);
      setBatchCompleted(true);
      
      const successCount = results.filter(r => r.result.success && r.result.emails.length > 0).length;
      showNotification('success', `✅ Captura finalizada! ${successCount} emails encontrados de ${results.length} pessoas processadas`);
      
    } catch (error) {
      console.error('❌ Erro na captura em lote:', error);
      setBatchCompleted(true);
      setBatchResults([]);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      showNotification('error', `❌ Erro na captura em lote: ${errorMessage}`);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedPeople.size === filteredAndSortedPeople.length) {
      setSelectedPeople(new Set());
    } else {
      setSelectedPeople(new Set(filteredAndSortedPeople.map(p => p.id)));
    }
  };

  const handlePersonSelect = (personId: string) => {
    const newSelected = new Set(selectedPeople);
    if (newSelected.has(personId)) {
      newSelected.delete(personId);
    } else {
      newSelected.add(personId);
    }
    setSelectedPeople(newSelected);
  };

  const exportToCSV = () => {
    const selectedPersonsData = filteredAndSortedPeople.filter(p => selectedPeople.has(p.id));
    
    if (selectedPersonsData.length === 0) {
      showNotification('error', 'Selecione pelo menos uma pessoa para exportar');
      return;
    }

    try {
      const csvContent = [
        // Header com BOM para UTF-8
        '\uFEFF' + ['Nome', 'Cargo', 'Email', 'Telefone', 'Empresa', 'Localização', 'LinkedIn'].join(';'),
        ...selectedPersonsData.map(person => {
          const location = [person.city, person.state, person.country].filter(Boolean).join(', ') || 'N/A';
          // Usar email atualizado se disponível, senão usar original
          const emailToExport = (person.email && person.email.includes('@') && !person.email.includes('email_not_unlocked') && !person.email.includes('domain.com')) 
            ? person.email 
            : 'Email não disponível';
          return [
            `"${person.name}"`,
            `"${person.title || 'N/A'}"`,
            `"${emailToExport}"`,
            `"${person.phone || 'N/A'}"`,
            `"${person.organization?.name || 'N/A'}"`,
            `"${location}"`,
            `"${person.linkedin_url || 'N/A'}"`
          ].join(';');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `leads_${company.name}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      const emailsFound = selectedPersonsData.filter(p => p.email && p.email.includes('@') && !p.email.includes('email_not_unlocked')).length;
      showNotification('success', `✅ ${selectedPersonsData.length} leads exportados (${emailsFound} com emails válidos)!`);
    } catch (error) {
      console.error('❌ Erro ao exportar CSV:', error);
      showNotification('error', '❌ Erro ao exportar dados. Tente novamente.');
    }
  };

  // Obter indústrias únicas para filtro
  const uniqueIndustries = React.useMemo(() => {
    const industries = new Set<string>();
    processedPeople.forEach(person => {
      const industry = person.organization?.industry || 'Não especificado';
      industries.add(industry);
    });
    return Array.from(industries).sort();
  }, [processedPeople]);

  const handleIndustryFilter = (industry: string) => {
    const newSelected = new Set(selectedIndustries);
    if (newSelected.has(industry)) {
      newSelected.delete(industry);
    } else {
      newSelected.add(industry);
    }
    setSelectedIndustries(newSelected);
  };

  // Adicionar estado para loading de telefone
  const [phoneSearchLoading, setPhoneSearchLoading] = useState<string | null>(null);

  // Função para buscar telefone
  const handlePhoneSearch = async (person: TablePerson) => {
    setPhoneSearchLoading(person.id);
    setNotification(null);
    try {
      const apiKey = localStorage.getItem('apollo-api-key');
      if (!apiKey) {
        showNotification('error', 'API Key não encontrada. Configure sua API Key primeiro.');
        setPhoneSearchLoading(null);
        return;
      }
      apolloApiService.setApiKey(JSON.parse(apiKey));
      // Forçar reveal_phone_number: true
      const result = await apolloApiService.searchPersonEmails({ personId: person.id, organizationId: person.organization?.id || person.account?.id });
      console.log('🔍 Resposta completa da API Apollo (busca telefone):', result);
      if (result.success && result.phone_numbers && result.phone_numbers.length > 0) {
        const foundPhone = result.phone_numbers[0].raw_number;
        setUpdatedPeople(prev => ({
          ...prev,
          [person.id]: { ...person, phone: foundPhone }
        }));
        showNotification('success', `Telefone encontrado para ${person.name}: ${foundPhone}`);
      } else {
        showNotification('info', `Nenhum telefone encontrado para ${person.name}. (API não retornou telefone)`);
      }
    } catch (error: any) {
      showNotification('error', `Erro ao buscar telefone: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setPhoneSearchLoading(null);
    }
  };

  useEffect(() => {
    // CRITICAL: Só resetar os filtros quando o modal abrir, não quando people mudar
    if (isOpen && !isProcessing) {
      console.log(`🔄 PeopleLeadsModal - Resetando filtros para modal aberto`);
      setSearchTerm('');
      setSelectedIndustries(new Set());
      setSortBy('name');
      setFilterBy('all');
      setSelectedPeople(new Set());
    }
  }, [isOpen, isProcessing]); // Add isProcessing as dependency to avoid resets during processing

  // CRITICAL: Proteção adicional para evitar renderização quando modal está fechado
  if (!isOpen) {
    console.log(`🚫 PeopleLeadsModal - Modal fechado, não renderizando`);
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Building2 className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Pessoas em {company.name}
              </h2>
              <p className="text-sm text-gray-600">
                {filteredAndSortedPeople.length} de {processedPeople.length} pessoas
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Removido botão Exportar */}
            {/* Removido botão Captura em Lote */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Notification display */}
        {notification && (
          <div className={`mx-6 mt-4 p-4 rounded-lg border ${
            notification.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
            notification.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
            'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Bar para Captura em Lote */}
        {isBatchProcessing && batchProgress && (
          <div className="mx-6 mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-700">
                Processando: {batchProgress.currentPerson}
              </span>
              <span className="text-sm text-purple-600">
                {batchProgress.current}/{batchProgress.total}
              </span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-purple-600 mt-2">
              Capturando emails... Aguarde enquanto processamos cada pessoa.
            </p>
          </div>
        )}

        {/* Resultados da Captura em Lote */}
        {batchCompleted && batchResults.length > 0 && (
          <div className="mx-6 mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-blue-600" />
              Resultados da Captura em Lote
            </h4>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-800">
                  {batchResults.filter(r => r.result.success && r.result.emails.length > 0).length}
                </div>
                <div className="text-xs text-green-600">Emails Encontrados</div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-red-800">
                  {batchResults.filter(r => !r.result.success || r.result.emails.length === 0).length}
                </div>
                <div className="text-xs text-red-600">Não Encontrados</div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-bold text-blue-800">{batchResults.length}</div>
                <div className="text-xs text-blue-600">Total Processado</div>
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  setBatchCompleted(false);
                  setBatchResults([]);
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Fechar Resultados
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nome, cargo ou empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'title' | 'location')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Ordenar por Nome</option>
              <option value="title">Ordenar por Cargo</option>
              <option value="location">Ordenar por Localização</option>
            </select>

            {/* Filter by Email */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as 'all' | 'with-email' | 'without-email')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              <option value="with-email">Com Email</option>
              <option value="without-email">Sem Email</option>
            </select>

            {/* Industry Filter */}
            <div className="relative">
              <select
                value=""
                onChange={(e) => e.target.value && handleIndustryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Filtrar por Indústria</option>
                {uniqueIndustries.map(industry => (
                  <option key={industry} value={industry}>
                    {industry} {selectedIndustries.has(industry) ? '✓' : ''}
                  </option>
                ))}
              </select>
              {selectedIndustries.size > 0 && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {selectedIndustries.size}
                </div>
              )}
            </div>
          </div>

          {/* Active Filters */}
          {selectedIndustries.size > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from(selectedIndustries).map(industry => (
                <span
                  key={industry}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  {industry}
                  <button
                    onClick={() => handleIndustryFilter(industry)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => setSelectedIndustries(new Set())}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPeople.size === filteredAndSortedPeople.length && filteredAndSortedPeople.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pessoa
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shouldRenderTable && filteredAndSortedPeople.map((person) => (
                <tr 
                  key={person.id} 
                  id={`person-row-${person.id}`}
                  className={`hover:bg-gray-50 transition-colors duration-300 ${
                    emailSearchLoading === person.id ? 'bg-blue-50 ring-2 ring-blue-200' : 
                    emailSearchResults[person.id]?.emailUpdated ? 'bg-green-50' : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedPeople.has(person.id)}
                      onChange={() => handlePersonSelect(person.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  
                  {/* Pessoa */}
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {person.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {person.organization?.name}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cargo */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">
                      {person.title || 'Não especificado'}
                    </div>
                    {person.organization?.industry && (
                      <div className="text-sm text-gray-500">
                        {person.organization.industry}
                      </div>
                    )}
                  </td>

                  {/* Contato */}
                  <td className="px-4 py-4" data-email-cell>
                    <div className="space-y-1">
                      {(() => {
                        // Check if this person has been updated with a new email
                        const hasValidEmail = person.email && 
                                            person.email.includes('@') && 
                                            !person.email.includes('email_not_unlocked') && 
                                            !person.email.includes('domain.com');
                        
                        const wasEmailFound = emailSearchResults[person.id]?.success && 
                                            emailSearchResults[person.id]?.emails?.length > 0;
                        
                        // Log removido para evitar problemas de performance
                        
                        if (hasValidEmail) {
                          return (
                            <div className={`flex items-center text-sm ${
                              wasEmailFound ? 'animate-pulse' : ''
                            }`}>
                              <Mail className={`w-4 h-4 mr-2 ${
                                wasEmailFound ? 'text-green-600' : 'text-green-500'
                              }`} />
                              <span className={`font-medium ${
                                wasEmailFound ? 'text-green-800 bg-green-100 px-2 py-1 rounded' : 'text-green-700'
                              }`}>
                                {person.email}
                              </span>
                              {wasEmailFound && (
                                <span className="ml-2 text-xs text-green-600 font-semibold">
                                  ✨ Novo!
                                </span>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center text-sm">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="text-gray-500">
                                {person.email && person.email.includes('email_not_unlocked') ? 
                                  'Email bloqueado' : 
                                  'Email não disponível'
                                }
                              </span>
                            </div>
                          );
                        }
                      })()}
                      
                      {person.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-900">{person.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Localização */}
                  <td className="px-4 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                      <span>
                        {[person.city, person.state, person.country].filter(Boolean).join(', ') || 'Não especificado'}
                      </span>
                    </div>
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const hasValidEmail = person.email && 
                                            person.email.includes('@') && 
                                            !person.email.includes('email_not_unlocked') && 
                                            !person.email.includes('domain.com');
                        const wasEmailFound = emailSearchResults[person.id]?.success && 
                                            emailSearchResults[person.id]?.emails?.length > 0;
                        
                        // Log removido para evitar problemas de performance
                        
                        if (!hasValidEmail) {
                          return (
                            <button
                              onClick={() => handleEmailSearch(person)}
                              disabled={emailSearchLoading === person.id}
                              className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              title="Buscar emails para esta pessoa"
                            >
                              {emailSearchLoading === person.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border border-purple-600 border-t-transparent mr-1"></div>
                              ) : (
                                <Mail className="w-3 h-3 mr-1" />
                              )}
                              {emailSearchLoading === person.id ? 'Buscando...' : 'Buscar'}
                            </button>
                          );
                        }
                        if (hasValidEmail && wasEmailFound) {
                          return (
                            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded flex items-center border border-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Email Encontrado
                            </span>
                          );
                        }
                        if (hasValidEmail) {
                          return (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded flex items-center">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Email OK
                            </span>
                          );
                        }
                        return null;
                      })()}
                      {person.linkedin_url && (
                        <button
                          onClick={() => window.open(person.linkedin_url, '_blank')}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver perfil no LinkedIn"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!shouldRenderTable && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                      <span className="text-gray-600">Processando busca de email...</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {filteredAndSortedPeople.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma pessoa encontrada
              </h3>
              <p className="text-gray-500">
                Tente ajustar os filtros ou termos de busca.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedPeople.size} de {filteredAndSortedPeople.length} pessoas selecionadas
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedPeople(new Set())}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Limpar seleção
              </button>
              <button
                onClick={exportToCSV}
                disabled={selectedPeople.size === 0}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Selecionados
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notificação flutuante para email encontrado */}
      {emailNotification && (
        <div
          className="fixed z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce"
          style={{
            top: `${emailNotification.position.top}px`,
            left: `${emailNotification.position.left}px`,
            transform: 'translateY(-50%)'
          }}
        >
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium">
              Email encontrado: {emailNotification.email}
            </span>
          </div>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2">
            <div className="w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-green-600"></div>
          </div>
        </div>
      )}
    </div>
  );
};