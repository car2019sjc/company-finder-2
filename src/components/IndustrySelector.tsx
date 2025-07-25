import React, { useState } from 'react';
import { Building, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface IndustrySelectorProps {
  selectedIndustries: string[];
  onIndustryChange: (industries: string[]) => void;
  placeholder?: string;
}

// Setores baseados na ferramenta Apollo.io
const apolloIndustries = [
  // Tecnologia e Software
  { id: 'computer-software', label: 'Computer Software', category: 'Tecnologia' },
  { id: 'information-technology', label: 'Information Technology & Services', category: 'Tecnologia' },
  { id: 'internet', label: 'Internet', category: 'Tecnologia' },
  { id: 'telecommunications', label: 'Telecommunications', category: 'Tecnologia' },
  { id: 'computer-hardware', label: 'Computer Hardware', category: 'Tecnologia' },
  { id: 'semiconductors', label: 'Semiconductors', category: 'Tecnologia' },
  
  // Saúde e Medicina
  { id: 'healthcare', label: 'Healthcare', category: 'Saúde' },
  { id: 'pharmaceuticals', label: 'Pharmaceuticals', category: 'Saúde' },
  { id: 'medical-devices', label: 'Medical Devices', category: 'Saúde' },
  { id: 'biotechnology', label: 'Biotechnology', category: 'Saúde' },
  { id: 'hospital-health-care', label: 'Hospital & Health Care', category: 'Saúde' },
  { id: 'medical-practice', label: 'Medical Practice', category: 'Saúde' },
  
  // Finanças e Serviços Financeiros
  { id: 'financial-services', label: 'Financial Services', category: 'Finanças' },
  { id: 'banking', label: 'Banking', category: 'Finanças' },
  { id: 'insurance', label: 'Insurance', category: 'Finanças' },
  { id: 'investment-management', label: 'Investment Management', category: 'Finanças' },
  { id: 'capital-markets', label: 'Capital Markets', category: 'Finanças' },
  { id: 'venture-capital', label: 'Venture Capital & Private Equity', category: 'Finanças' },
  
  // Manufatura e Indústria
  { id: 'manufacturing', label: 'Manufacturing', category: 'Indústria' },
  { id: 'automotive', label: 'Automotive', category: 'Indústria' },
  { id: 'machinery', label: 'Machinery', category: 'Indústria' },
  { id: 'industrial-automation', label: 'Industrial Automation', category: 'Indústria' },
  { id: 'chemicals', label: 'Chemicals', category: 'Indústria' },
  { id: 'plastics', label: 'Plastics', category: 'Indústria' },
  
  // Energia e Recursos Naturais
  { id: 'oil-energy', label: 'Oil & Energy', category: 'Energia' },
  { id: 'utilities', label: 'Utilities', category: 'Energia' },
  { id: 'renewables-environment', label: 'Renewables & Environment', category: 'Energia' },
  { id: 'mining-metals', label: 'Mining & Metals', category: 'Energia' },
  
  // Varejo e Consumo
  { id: 'retail', label: 'Retail', category: 'Varejo' },
  { id: 'consumer-goods', label: 'Consumer Goods', category: 'Varejo' },
  { id: 'food-beverages', label: 'Food & Beverages', category: 'Varejo' },
  { id: 'apparel-fashion', label: 'Apparel & Fashion', category: 'Varejo' },
  { id: 'luxury-goods', label: 'Luxury Goods & Jewelry', category: 'Varejo' },
  
  // Construção e Imobiliário
  { id: 'construction', label: 'Construction', category: 'Construção' },
  { id: 'real-estate', label: 'Real Estate', category: 'Construção' },
  { id: 'architecture-planning', label: 'Architecture & Planning', category: 'Construção' },
  { id: 'civil-engineering', label: 'Civil Engineering', category: 'Construção' },
  { id: 'building-materials', label: 'Building Materials', category: 'Construção' },
  
  // Educação e Treinamento
  { id: 'education-management', label: 'Education Management', category: 'Educação' },
  { id: 'higher-education', label: 'Higher Education', category: 'Educação' },
  { id: 'primary-secondary-education', label: 'Primary/Secondary Education', category: 'Educação' },
  { id: 'e-learning', label: 'E-Learning', category: 'Educação' },
  
  // Serviços Profissionais
  { id: 'management-consulting', label: 'Management Consulting', category: 'Consultoria' },
  { id: 'legal-services', label: 'Legal Services', category: 'Consultoria' },
  { id: 'accounting', label: 'Accounting', category: 'Consultoria' },
  { id: 'human-resources', label: 'Human Resources', category: 'Consultoria' },
  
  // Mídia e Comunicação
  { id: 'marketing-advertising', label: 'Marketing & Advertising', category: 'Mídia' },
  { id: 'public-relations', label: 'Public Relations & Communications', category: 'Mídia' },
  { id: 'media-production', label: 'Media Production', category: 'Mídia' },
  { id: 'publishing', label: 'Publishing', category: 'Mídia' },
  
  // Transporte e Logística
  { id: 'logistics-supply-chain', label: 'Logistics & Supply Chain', category: 'Logística' },
  { id: 'transportation', label: 'Transportation/Trucking/Railroad', category: 'Logística' },
  { id: 'airlines-aviation', label: 'Airlines/Aviation', category: 'Logística' },
  { id: 'maritime', label: 'Maritime', category: 'Logística' },
  
  // Agricultura e Alimentação
  { id: 'farming', label: 'Farming', category: 'Agronegócio' },
  { id: 'food-production', label: 'Food Production', category: 'Agronegócio' },
  { id: 'ranching', label: 'Ranching', category: 'Agronegócio' },
  { id: 'fishery', label: 'Fishery', category: 'Agronegócio' },
  
  // Hospitalidade e Turismo
  { id: 'hospitality', label: 'Hospitality', category: 'Turismo' },
  { id: 'leisure-travel-tourism', label: 'Leisure, Travel & Tourism', category: 'Turismo' },
  { id: 'restaurants', label: 'Restaurants', category: 'Turismo' },
  
  // Outros Setores
  { id: 'entertainment', label: 'Entertainment', category: 'Entretenimento' },
  { id: 'sports', label: 'Sports', category: 'Entretenimento' },
  { id: 'museums-institutions', label: 'Museums & Institutions', category: 'Cultura' },
  { id: 'textiles', label: 'Textiles', category: 'Têxtil' },
  { id: 'paper-forest-products', label: 'Paper & Forest Products', category: 'Papel' },
];

// Agrupar por categoria
const industriesByCategory = apolloIndustries.reduce((acc, industry) => {
  if (!acc[industry.category]) {
    acc[industry.category] = [];
  }
  acc[industry.category].push(industry);
  return acc;
}, {} as Record<string, typeof apolloIndustries>);

export const IndustrySelector: React.FC<IndustrySelectorProps> = ({
  selectedIndustries,
  onIndustryChange,
  placeholder = "Selecione setores..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleIndustryToggle = (industryId: string) => {
    const newSelection = selectedIndustries.includes(industryId)
      ? selectedIndustries.filter(id => id !== industryId)
      : [...selectedIndustries, industryId];
    
    onIndustryChange(newSelection);
  };

  const handleClearAll = () => {
    onIndustryChange([]);
  };

  const handleSelectCategory = (category: string) => {
    const categoryIndustries = industriesByCategory[category].map(ind => ind.id);
    const allSelected = categoryIndustries.every(id => selectedIndustries.includes(id));
    
    if (allSelected) {
      // Desmarcar toda a categoria
      onIndustryChange(selectedIndustries.filter(id => !categoryIndustries.includes(id)));
    } else {
      // Marcar toda a categoria
      const newSelection = [...new Set([...selectedIndustries, ...categoryIndustries])];
      onIndustryChange(newSelection);
    }
  };

  const filteredIndustries = apolloIndustries.filter(industry =>
    industry.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    industry.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedLabels = () => {
    return selectedIndustries
      .map(id => apolloIndustries.find(ind => ind.id === id)?.label)
      .filter(Boolean)
      .slice(0, 3);
  };

  const selectedLabels = getSelectedLabels();
  const displayText = selectedLabels.length > 0 
    ? `${selectedLabels.join(', ')}${selectedIndustries.length > 3 ? ` +${selectedIndustries.length - 3} mais` : ''}`
    : placeholder;

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Business Area / Industry (Recomendado) 🎯
      </label>
      
      {/* Campo de seleção */}
      <div className="relative">
        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full pl-10 pr-10 py-2 border-2 border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-green-50 text-left"
        >
          <span className={selectedIndustries.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
            {displayText}
          </span>
        </button>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Contador de selecionados */}
      {selectedIndustries.length > 0 && (
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-green-600 font-medium">
            {selectedIndustries.length} setor(es) selecionado(s)
          </span>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-red-600 hover:text-red-800 font-medium"
          >
            Limpar tudo
          </button>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Campo de busca */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Buscar setores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Lista de setores */}
          <div className="max-h-80 overflow-y-auto">
            {searchTerm ? (
              // Resultados da busca
              <div className="p-2">
                {filteredIndustries.length > 0 ? (
                  filteredIndustries.map(industry => (
                    <label
                      key={industry.id}
                      className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndustries.includes(industry.id)}
                        onChange={() => handleIndustryToggle(industry.id)}
                        className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{industry.label}</div>
                        <div className="text-xs text-gray-500">{industry.category}</div>
                      </div>
                      {selectedIndustries.includes(industry.id) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </label>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum setor encontrado para "{searchTerm}"
                  </div>
                )}
              </div>
            ) : (
              // Setores agrupados por categoria
              Object.entries(industriesByCategory).map(([category, industries]) => (
                <div key={category} className="border-b border-gray-100 last:border-b-0">
                  {/* Header da categoria */}
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory(category)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <span className="text-sm font-semibold text-gray-700">{category}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {industries.filter(ind => selectedIndustries.includes(ind.id)).length}/{industries.length}
                        </span>
                        <div className="w-4 h-4 border border-gray-400 rounded flex items-center justify-center">
                          {industries.every(ind => selectedIndustries.includes(ind.id)) && (
                            <Check className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Setores da categoria */}
                  <div className="p-2">
                    {industries.map(industry => (
                      <label
                        key={industry.id}
                        className="flex items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIndustries.includes(industry.id)}
                          onChange={() => handleIndustryToggle(industry.id)}
                          className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                        <span className="flex-1 text-sm text-gray-900">{industry.label}</span>
                        {selectedIndustries.includes(industry.id) && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay para fechar o dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};