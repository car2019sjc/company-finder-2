import React, { useState, useMemo } from 'react';
import { Search, MapPin, Users, Settings, Building } from 'lucide-react';
import type { SearchFilters } from '../types/apollo';
import { IndustrySelector } from './IndustrySelector';

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading: boolean;
  hasResults?: boolean;
  onNewSearch?: () => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  isLoading,
  hasResults = false,
  onNewSearch,
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    companyName: '',
    location: 'Brasil',
    employeeRange: 'all',
    businessArea: '',
    page: 1,
    perPage: 25,
  });

  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  const employeeRanges = [
    { value: 'all', label: 'All sizes' },
    { value: '201,500', label: '201-500 employees' },
    { value: '501,1000', label: '501-1,000 employees' },
    { value: '1001,5000', label: '1,001-5,000 employees' },
    { value: '5001,10000', label: '5,001-10,000 employees' },
    { value: '10001,50000', label: '10,001+ employees' },
  ];

  const locationSuggestions = [
    'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador',
    'Fortaleza', 'Curitiba', 'Recife', 'Porto Alegre', 'Goiânia'
  ];

  const businessAreaSuggestions = [
    'Agronegócio', 'Tecnologia', 'Saúde', 'Finanças', 'Automotivo', 
    'Logística', 'Hotelaria', 'Manufatura', 'Energia', 'Mineração', 
    'Petróleo e Gás', 'Varejo', 'Construção',
    'Consultoria', 'Educação', 'Telecomunicações', 'Marketing',
    'Jurídico', 'Turismo', 'Imobiliário', 'Alimentação', 'E-commerce',
    'Farmacêutico', 'Têxtil', 'Metalurgia', 'Química', 'Papel e Celulose'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔍 SearchForm - Setores selecionados:', selectedIndustries);
    console.log('🔍 SearchForm - Filtros atuais:', filters);
    
    if (!filters.companyName.trim() && 
        !filters.location.trim() && 
        filters.employeeRange === 'all' &&
        selectedIndustries.length === 0) {
      alert('Por favor, adicione pelo menos um critério de busca. Para melhores resultados, recomendamos usar LOCALIZAÇÃO e/ou ÁREA DE NEGÓCIO.');
      return;
    }
    
    if (selectedIndustries.length > 0 && !filters.location.trim()) {
      const confirmSearch = confirm(
        `Você está buscando por setores específicos sem especificar localização. ` +
        'Isso pode retornar muitos resultados irrelevantes. ' +
        'Deseja adicionar uma localização específica para melhores resultados?'
      );
      if (confirmSearch) {
        return;
      }
    }
    
    // Converter setores selecionados para string separada por vírgula
    const searchFilters = {
      ...filters,
      businessArea: selectedIndustries.join(','),
      page: 1
    };
    
    console.log('🚀 SearchForm - Iniciando busca com filtros finais:', searchFilters);
    console.log('🏭 SearchForm - Business Area enviada:', searchFilters.businessArea);
    onSearch(searchFilters);
  };

  const handleInputChange = (field: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleLocationSuggestion = (location: string) => {
    setFilters(prev => ({ ...prev, location }));
  };

  const handleBusinessAreaSuggestion = (area: string) => {
    setFilters(prev => ({ ...prev, businessArea: area }));
  };

  const handleNewSearch = () => {
    setFilters({
      companyName: '',
      location: 'Brasil',
      employeeRange: 'all',
      businessArea: '',
      page: 1,
      perPage: 25,
    });
    setSelectedIndustries([]);
    if (onNewSearch) {
      onNewSearch();
    }
  };

  // Memoize components to prevent unnecessary re-renders
  const searchFormContent = useMemo(() => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={filters.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              placeholder="e.g., Apollo, Microsoft, Google"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (Recomendado) 🎯
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={filters.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="ex: São Paulo, Rio de Janeiro, Brasil"
              className="w-full pl-10 pr-4 py-2 border-2 border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
            />
          </div>
          {filters.location.length === 0 && (
            <div className="mt-2">
              <p className="text-xs text-blue-600 mb-1 font-medium">🇧🇷 Cidades populares no Brasil:</p>
              <div className="flex flex-wrap gap-1">
                {locationSuggestions.map(city => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleLocationSuggestion(city)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors border border-blue-300"
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <IndustrySelector
            selectedIndustries={selectedIndustries}
            onIndustryChange={setSelectedIndustries}
            placeholder="Selecione setores de interesse..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Size
        </label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={filters.employeeRange}
            onChange={(e) => handleInputChange('employeeRange', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            {employeeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-md hover:from-orange-600 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium shadow-lg"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
        ) : (
          <Search className="w-4 h-4 mr-2" />
        )}
        {isLoading ? 'Buscando Empresas...' : '🔍 Buscar Empresas'}
      </button>
    </form>
  ), [filters, isLoading, handleSubmit, handleInputChange, handleLocationSuggestion, handleBusinessAreaSuggestion]);

  const resultsContent = useMemo(() => (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-blue-800">🔍 Filtros Aplicados</h3>
          <div className="text-xs text-blue-700 mt-1 space-y-1">
            {filters.companyName && <p>• Empresa: <span className="font-medium">{filters.companyName}</span></p>}
            {filters.location && <p>• 📍 Localização: <span className="font-medium">{filters.location}</span></p>}
            {selectedIndustries.length > 0 && <p>• 🏭 Setores: <span className="font-medium">{selectedIndustries.length} selecionado(s)</span></p>}
            {filters.employeeRange !== 'all' && (
              <p>• 👥 Funcionários: <span className="font-medium">
                {employeeRanges.find(r => r.value === filters.employeeRange)?.label}
              </span></p>
            )}
          </div>
        </div>
        <button
          onClick={handleNewSearch}
          className="flex items-center px-3 py-1.5 text-xs bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-md hover:from-blue-700 hover:to-green-700 transition-all font-medium shadow-sm"
        >
          <Search className="w-3 h-3 mr-1" />
          Refinar Busca
        </button>
      </div>
    </div>
  ), [filters, employeeRanges, handleNewSearch]);

  const headerButtons = useMemo(() => (
    <div className="flex items-center space-x-2">
      {hasResults && onNewSearch && (
        <button
          onClick={handleNewSearch}
          className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          <Search className="w-4 h-4 mr-2" />
          Nova Pesquisa
        </button>
      )}
    </div>
  ), [hasResults, onNewSearch, handleNewSearch]);

  // Prevent rendering during loading to avoid DOM conflicts
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Search Companies</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mr-3"></div>
          <span className="text-gray-600">Buscando empresas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {hasResults ? 'Search Results' : 'Search Companies'}
        </h2>
        {headerButtons}
      </div>

      {!hasResults ? searchFormContent : resultsContent}
    </div>
  );
};