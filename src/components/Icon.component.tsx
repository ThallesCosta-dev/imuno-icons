import React, { useState, useEffect } from 'react';
import svgCache from '../services/SvgCache';

interface IconProps {
  src: string;
  size?: 'thumbnail' | 'full';
}

const Icon: React.FC<IconProps> = ({ src, size = 'thumbnail' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  
  // Lista de arquivos grandes que precisam de tratamento especial
  const largeFiles = [
    'White Pulp',
    'Red Pulp',
    'Intestinal Villus',
    'Epidermal Ridge',
    'Nephron',
    'Thymus Lobule',
    'Renal Corpuscle',
    'Prostate Glandular Acinus',
    'Liver Lobule',
    'Crypt of Lieberkuhn'
  ];
  
  // Verificar se o arquivo atual é um dos arquivos grandes
  const isLargeFile = largeFiles.some(name => src.includes(name));
  
  useEffect(() => {
    // Resetar estado quando a fonte muda
    setIsLoaded(false);
    setError(false);
    setImgElement(null);
    
    // Carregar a imagem com tratamento de erro
    const loadImage = async () => {
      try {
        // Usar o cache para carregar a imagem
        const img = await svgCache.getImage(src, isLargeFile);
        setImgElement(img);
        setIsLoaded(true);
      } catch (err) {
        console.warn(`Failed to load SVG: ${src}`, err);
        setError(true);
      }
    };
    
    loadImage();
  }, [src, isLargeFile, size]);
  
  // Renderizar um placeholder enquanto carrega
  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 animate-pulse rounded-md">
        <div className="w-6 h-6 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Renderizar um indicador de erro
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-100 rounded-md">
        <div className="text-xs text-center text-red-600">Erro</div>
      </div>
    );
  }
  
  // Renderizar a imagem carregada
  if (imgElement) {
    // Para miniaturas de arquivos grandes, aplicamos otimizações adicionais
    if (isLargeFile && size === 'thumbnail') {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <img 
            src={src} 
            alt="" 
            className="max-w-full max-h-full object-contain"
            style={{ 
              maxWidth: '100%', 
              maxHeight: '100%',
              width: 'auto',
              height: 'auto'
            }} 
          />
          {/* Indicador de arquivo grande */}
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-tl-md">
            HD
          </div>
        </div>
      );
    }
    
    // Renderização normal para outros arquivos
    return (
      <img 
        src={src} 
        alt="" 
        className="max-w-full max-h-full object-contain" 
      />
    );
  }
  
  // Fallback caso algo dê errado
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-md">
      <div className="text-xs text-center text-gray-600">
        {src.split('/').pop()?.split('.')[0]}
      </div>
    </div>
  );
};

export default Icon;