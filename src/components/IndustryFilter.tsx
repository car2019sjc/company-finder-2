import React from 'react';
import { Filter, Building2, TrendingUp } from 'lucide-react';
import type { Company } from '../types/apollo';

interface IndustryFilterProps {
  companies: Company[];
  selectedIndustries: string[];
  onIndustryChange: (industries: string[]) => void;
  sortBy: 'name' | 'industry' | 'employees' | 'revenue';
  onSortChange: (sortBy: 'name' | 'industry' | 'employees' | 'revenue') => void;
}

export const IndustryFilter: React.FC<IndustryFilterProps> = ({
  companies,
  selectedIndustries,
  onIndustryChange,
  sortBy,
  onSortChange
}) => {
  // Extrair todas as indústrias únicas das empresas
  const industries = React.useMemo(() => {
    const industryMap = new Map<string, number>();
    
    // Mapear indústrias em inglês para português para melhor exibição
    const industryTranslation: { [key: string]: string } = {
      'Agriculture': 'Agronegócio',
      'Agribusiness': 'Agronegócio',
      'Farming': 'Agronegócio',
      'Information Technology': 'Tecnologia',
      'Computer Software': 'Tecnologia',
      'Software Development': 'Tecnologia',
      'Healthcare': 'Saúde',
      'Medical': 'Saúde',
      'Hospital': 'Saúde',
      'Financial Services': 'Finanças',
      'Banking': 'Finanças',
      'Insurance': 'Finanças',
      'Manufacturing': 'Manufatura',
      'Industrial Manufacturing': 'Manufatura',
      'Construction': 'Construção',
      'Real Estate': 'Imobiliário',
      'Education': 'Educação',
      'Retail': 'Varejo',
      'E-commerce': 'E-commerce',
      'Telecommunications': 'Telecomunicações',
      'Energy': 'Energia',
      'Oil & Gas': 'Petróleo e Gás',
      'Mining': 'Mineração',
      'Logistics': 'Logística',
      'Transportation': 'Logística',
      'Food & Beverages': 'Alimentação',
      'Automotive': 'Automotivo',
      'Pharmaceuticals': 'Farmacêutico',
      'Textiles': 'Têxtil',
      'Chemicals': 'Química',
      'Paper & Pulp': 'Papel e Celulose',
      'Management Consulting': 'Consultoria',
      'Professional Services': 'Consultoria',
      'Hospitality': 'Hotelaria',
      'Hotels': 'Hotelaria',
      'Travel': 'Turismo'
    };
    
    companies.forEach(company => {
      if (company.industry) {
        let industry = company.industry.trim();
        
        // Traduzir para português se possível, senão manter original
        const translatedIndustry = industryTranslation[industry] || industry;
        
        industryMap.set(translatedIndustry, (industryMap.get(translatedIndustry) || 0) + 1);
      }
    });
    
    return Array.from(industryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [companies]);

  const handleIndustryToggle = (industry: string) => {
    // Mapear indústrias em inglês para português para filtro
    const industryTranslation: { [key: string]: string } = {
      'Agriculture': 'Agronegócio',
      'Agribusiness': 'Agronegócio',
      'Farming': 'Agronegócio',
      'Information Technology': 'Tecnologia',
      'Computer Software': 'Tecnologia',
      'Software Development': 'Tecnologia',
      'Healthcare': 'Saúde',
      'Medical': 'Saúde',
      'Hospital': 'Saúde',
      'Financial Services': 'Finanças',
      'Banking': 'Finanças',
      'Insurance': 'Finanças',
      'Manufacturing': 'Manufatura',
      'Industrial Manufacturing': 'Manufatura',
      'Construction': 'Construção',
      'Real Estate': 'Imobiliário',
      'Education': 'Educação',
      'Retail': 'Varejo',
      'E-commerce': 'E-commerce',
      'Telecommunications': 'Telecomunicações',
      'Energy': 'Energia',
      'Oil & Gas': 'Petróleo e Gás',
      'Mining': 'Mineração',
      'Logistics': 'Logística',
      'Transportation': 'Logística',
      'Food & Beverages': 'Alimentação',
      'Automotive': 'Automotivo',
      'Pharmaceuticals': 'Farmacêutico',
      'Textiles': 'Têxtil',
      'Chemicals': 'Química',
      'Paper & Pulp': 'Papel e Celulose',
      'Management Consulting': 'Consultoria',
      'Professional Services': 'Consultoria',
      'Hospitality': 'Hotelaria',
      'Hotels': 'Hotelaria',
      'Travel': 'Turismo'
    };
    
    // Aplicar filtro de indústria com mapeamento reverso
    if (selectedIndustries.includes(industry)) {
      onIndustryChange(selectedIndustries.filter(i => i !== industry));
    } else {
      onIndustryChange([...selectedIndustries, industry]);
    }
  };

  const clearAllFilters = () => {
    onIndustryChange([]);
  };

  const selectAllIndustries = () => {
    onIndustryChange(industries.map(i => i.name));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">Filtros e Classificação</span>
          </div>
          {selectedIndustries.length > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {selectedIndustries.length} filtro{selectedIndustries.length !== 1 ? 's' : ''} ativo{selectedIndustries.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="name">Ordenar por Nome</option>
            <option value="industry">Ordenar por Setor</option>
            <option value="employees">Ordenar por Funcionários</option>
          </select>
        </div>
      </div>

      {industries.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Building2 className="w-4 h-4 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">
                Setores de Negócio
              </h4>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">
                {industries.length}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={selectAllIndustries}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Selecionar Todos
              </button>
              {selectedIndustries.length > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                >
                  Limpar ({selectedIndustries.length})
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {industries.map(({ name, count }) => (
              <label
                key={name}
                className={`flex items-center p-2.5 rounded-md cursor-pointer transition-all duration-200 ${
                  selectedIndustries.includes(name)
                    ? 'bg-blue-100 border border-blue-300 shadow-sm'
                    : 'bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIndustries.includes(name)}
                  onChange={() => handleIndustryToggle(name)}
                  className="mr-2.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium truncate block ${
                    selectedIndustries.includes(name) ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {name}
                  </span>
                  <span className={`text-xs truncate block ${
                    selectedIndustries.includes(name) ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {count} empresa{count !== 1 ? 's' : ''}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {selectedIndustries.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">
                    Filtros Ativos
                  </span>
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedIndustries.length}
                  </span>
                </div>
                <div className="flex items-center text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {companies.filter(c => {
                    // Mapear indústrias em inglês para português para filtro
                    const industryTranslation: { [key: string]: string } = {
                      'Agriculture': 'Agronegócio',
                      'Agribusiness': 'Agronegócio',
                      'Farming': 'Agronegócio',
                      'Information Technology': 'Tecnologia',
                      'Computer Software': 'Tecnologia',
                      'Software Development': 'Tecnologia',
                      'Healthcare': 'Saúde',
                      'Medical': 'Saúde',
                      'Hospital': 'Saúde',
                      'Financial Services': 'Finanças',
                      'Banking': 'Finanças',
                      'Insurance': 'Finanças',
                      'Manufacturing': 'Manufatura',
                      'Industrial Manufacturing': 'Manufatura',
                      'Construction': 'Construção',
                      'Real Estate': 'Imobiliário',
                      'Education': 'Educação',
                      'Retail': 'Varejo',
                      'E-commerce': 'E-commerce',
                      'Telecommunications': 'Telecomunicações',
                      'Energy': 'Energia',
                      'Oil & Gas': 'Petróleo e Gás',
                      'Mining': 'Mineração',
                      'Logistics': 'Logística',
                      'Transportation': 'Logística',
                      'Food & Beverages': 'Alimentação',
                      'Automotive': 'Automotivo',
                      'Pharmaceuticals': 'Farmacêutico',
                      'Textiles': 'Têxtil',
                      'Chemicals': 'Química',
                      'Paper & Pulp': 'Papel e Celulose',
                      'Management Consulting': 'Consultoria',
                      'Professional Services': 'Consultoria',
                      'Hospitality': 'Hotelaria',
                      'Hotels': 'Hotelaria',
                      'Travel': 'Turismo'
                    };
                    
                    return c.industry && (
                      selectedIndustries.includes(c.industry) ||
                      selectedIndustries.includes(industryTranslation[c.industry] || '')
                    );
                  }).length} empresas
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedIndustries.map(industry => (
                  <span
                    key={industry}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    {industry}
                    <button
                      onClick={() => handleIndustryToggle(industry)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};