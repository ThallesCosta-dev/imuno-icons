import React, { useState } from "react";
import SearchBar from "../SearchBar.component";
import "./SideBar.component.css";
import Icon from "../Icon.component";

// Define a estrutura para os itens
export interface IconItem {
  id: string;
  url: string;
}

// Interface para categorias e subcategorias
export interface IconCategories {
  [category: string]: IconItem[] | { [subcategory: string]: IconItem[] };
}

interface SideBarProps {
  onItemClick: (objId: string) => void;
  items: IconCategories;
}

const SideBar: React.FC<SideBarProps> = ({ onItemClick, items }) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({
    immunology: true,
    anatomy: false,
    virus: false
  });
  
  const [expandedSubcategories, setExpandedSubcategories] = useState<{[key: string]: boolean}>({});

  // Handle input change
  const handleSearch = (searchTerm: string): void => {
    setSearchTerm(searchTerm);
    
    // Se há um termo de busca, expanda todas as categorias
    if (searchTerm) {
      const allExpanded = Object.keys(items).reduce((acc, category) => {
        acc[category] = true;
        return acc;
      }, {} as {[key: string]: boolean});
      
      setExpandedCategories(allExpanded);
      
      // Também expande todas as subcategorias
      const allSubcategoriesExpanded: {[key: string]: boolean} = {};
      Object.keys(items).forEach(category => {
        const categoryItems = items[category];
        if (categoryItems && typeof categoryItems === 'object' && !Array.isArray(categoryItems)) {
          Object.keys(categoryItems).forEach(subcategory => {
            allSubcategoriesExpanded[`${category}-${subcategory}`] = true;
          });
        }
      });
      
      setExpandedSubcategories(allSubcategoriesExpanded);
    }
  };

  // Toggle category expansion
  const toggleCategory = (category: string): void => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };
  
  // Toggle subcategory expansion
  const toggleSubcategory = (category: string, subcategory: string): void => {
    const key = `${category}-${subcategory}`;
    setExpandedSubcategories({
      ...expandedSubcategories,
      [key]: !expandedSubcategories[key]
    });
  };

  // Tradução dos nomes das categorias
  const categoryNames: {[key: string]: string} = {
    immunology: "Imunologia",
    anatomy: "Anatomia",
    virus: "Vírus"
  };
  
  // Tradução dos nomes das subcategorias
  const subcategoryNames: {[key: string]: string} = {
    organSystem: "Sistema de Órgãos",
    skeletalSystem: "Sistema Esquelético",
    reproductiveSystem: "Sistema Reprodutivo",
    circulatorySystem: "Sistema Circulatório",
    lymphaticSystem: "Sistema Linfático",
    cellularStructures: "Estruturas Celulares"
  };

  // Filtrar itens com base no termo de busca
  const getFilteredItems = () => {
    const result: {[category: string]: any} = {};
    
    Object.keys(items).forEach(category => {
      const categoryItems = items[category];
      
      // Verificar se a categoria tem subcategorias
      if (categoryItems && typeof categoryItems === 'object' && !Array.isArray(categoryItems)) {
        // Categoria com subcategorias
        const filteredSubcategories: {[subcategory: string]: IconItem[]} = {};
        
        Object.keys(categoryItems).forEach(subcategory => {
          const subcategoryItems = categoryItems[subcategory] as IconItem[];
          const filteredItems = subcategoryItems.filter(item => 
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          if (filteredItems.length > 0) {
            filteredSubcategories[subcategory] = filteredItems;
          }
        });
        
        if (Object.keys(filteredSubcategories).length > 0) {
          result[category] = filteredSubcategories;
        }
      } else if (Array.isArray(categoryItems)) {
        // Categoria sem subcategorias
        const filteredCategoryItems = categoryItems.filter(item => 
          item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (filteredCategoryItems.length > 0) {
          result[category] = filteredCategoryItems;
        }
      }
    });
    
    return result;
  };

  const filteredItems = getFilteredItems();

  // Função para renderizar itens de uma categoria ou subcategoria
  const renderItems = (items: IconItem[]) => {
    return (
      <ul className="grid grid-cols-2 gap-2">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex flex-col items-center cursor-pointer hover:bg-blue-50 p-2 rounded-md"
            onClick={() => onItemClick(item.id)}
          >
            <div className="w-12 h-12 flex items-center justify-center">
              <Icon src={item.url} size="thumbnail" />
            </div>
            <span className="text-gray-700 text-xs text-center mt-1 truncate w-full">
              {item.id}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-blue-100 w-64 h-screen flex flex-col p-0 shadow-lg">
      {/* Search Bar */}
      <div className="mb-4 p-4">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Items Display */}
      <div className="flex-grow overflow-y-auto scrollbar-custom p-4 pt-0">
        {Object.keys(filteredItems).length > 0 ? (
          <div className="space-y-4">
            {Object.keys(filteredItems).map(category => (
              <div key={category} className="mb-4">
                <div 
                  className="flex items-center justify-between cursor-pointer bg-blue-200 p-2 rounded-md mb-2"
                  onClick={() => toggleCategory(category)}
                >
                  <h3 className="font-bold text-gray-700">
                    {categoryNames[category] || category}
                  </h3>
                  <span>{expandedCategories[category] ? '▼' : '►'}</span>
                </div>
                
                {expandedCategories[category] && (
                  <div className="pl-2">
                    {Array.isArray(filteredItems[category]) ? (
                      // Renderizar itens para categorias sem subcategorias
                      renderItems(filteredItems[category] as IconItem[])
                    ) : (
                      // Renderizar subcategorias
                      Object.keys(filteredItems[category]).map(subcategory => (
                        <div key={subcategory} className="mb-3">
                          <div 
                            className="flex items-center justify-between cursor-pointer bg-blue-100 p-1 rounded-md mb-2"
                            onClick={() => toggleSubcategory(category, subcategory)}
                          >
                            <h4 className="font-medium text-gray-700 text-sm">
                              {subcategoryNames[subcategory] || subcategory}
                              <span className="ml-2 text-xs text-gray-500">
                                ({(filteredItems[category] as any)[subcategory].length})
                              </span>
                            </h4>
                            <span>{expandedSubcategories[`${category}-${subcategory}`] ? '▼' : '►'}</span>
                          </div>
                          
                          {expandedSubcategories[`${category}-${subcategory}`] && (
                            renderItems((filteredItems[category] as any)[subcategory])
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhum item encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default SideBar;
