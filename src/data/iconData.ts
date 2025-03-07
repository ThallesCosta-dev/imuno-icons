// Arquivo para armazenar todos os dados de ícones organizados por categoria

import immunologyIcons from './immunologyIcons';
import anatomyIcons from './anatomyIcons';
import virusIcons from './virusIcons';

export interface IconItem {
  id: string;
  url: string;
}

export interface IconCategories {
  [category: string]: IconItem[] | { [subcategory: string]: IconItem[] };
}

const iconData: IconCategories = {
  immunology: immunologyIcons,
  anatomy: anatomyIcons,
  virus: virusIcons
};

export default iconData; 