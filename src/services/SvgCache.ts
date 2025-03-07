// Serviço para cache de SVGs

class SvgCache {
  private cache: Map<string, HTMLImageElement> = new Map();
  private loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  
  // Carregar uma imagem com timeout
  private loadImageWithTimeout(src: string, timeout: number): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading image: ${src}`));
      }, timeout);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(img);
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Error loading image: ${src}`));
      };
      
      img.src = src;
    });
  }
  
  // Obter uma imagem do cache ou carregá-la
  async getImage(src: string, isLargeFile: boolean = false): Promise<HTMLImageElement> {
    // Verificar se a imagem já está no cache
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }
    
    // Verificar se a imagem já está sendo carregada
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }
    
    // Carregar a imagem com timeout apropriado
    const timeout = isLargeFile ? 10000 : 3000;
    const loadingPromise = this.loadImageWithTimeout(src, timeout)
      .then(img => {
        // Adicionar ao cache quando carregada
        this.cache.set(src, img);
        this.loadingPromises.delete(src);
        return img;
      })
      .catch(err => {
        // Remover da lista de promessas em caso de erro
        this.loadingPromises.delete(src);
        throw err;
      });
    
    // Armazenar a promessa para evitar carregamentos duplicados
    this.loadingPromises.set(src, loadingPromise);
    
    return loadingPromise;
  }
  
  // Limpar o cache
  clearCache() {
    this.cache.clear();
  }
  
  // Pré-carregar um conjunto de imagens
  async preloadImages(sources: string[]): Promise<void> {
    const nonCachedSources = sources.filter(src => !this.cache.has(src));
    
    // Carregar em lotes para não sobrecarregar o navegador
    const batchSize = 5;
    for (let i = 0; i < nonCachedSources.length; i += batchSize) {
      const batch = nonCachedSources.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(src => {
          const isLargeFile = src.includes('White Pulp') || 
                             src.includes('Red Pulp') || 
                             src.includes('Intestinal Villus') ||
                             src.includes('Epidermal Ridge') ||
                             src.includes('Nephron') ||
                             src.includes('Thymus Lobule') ||
                             src.includes('Renal Corpuscle') ||
                             src.includes('Prostate Glandular Acinus') ||
                             src.includes('Liver Lobule') ||
                             src.includes('Crypt of Lieberkuhn');
          
          return this.getImage(src, isLargeFile);
        })
      );
    }
  }
}

// Exportar uma instância única
export const svgCache = new SvgCache();
export default svgCache; 