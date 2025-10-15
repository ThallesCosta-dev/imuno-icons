import React from 'react';
import {
  ArrowRight, Type, Save, Undo2, Redo2,
  Scissors, Copy, Clipboard, FlipHorizontal, FlipVertical,
  Lock, Star, Layers, Crop,
  ChevronUp, ChevronDown, PenTool, Bot
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher.component';

interface TopBarProps {
  onSaveClick: () => void;
  onAddArrow: () => void;
  onAddText: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onFlipHorizontal: () => void;
  onFlipVertical: () => void;
  onLock: () => void;
  onFavorite: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onCrop: () => void;
  onBrushSizeChange: (size: number) => void;
  onBrushColorChange: (color: string) => void;
  onToggleBrushMode: () => void;
  opacity: number;
  onOpacityChange: (value: number) => void;
  isLocked: boolean;
  isFavorite: boolean;
  cursorState: string;
  onToggleAI: () => void;
  isAIOpen: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  onSaveClick,
  onAddArrow,
  onAddText,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onFlipHorizontal,
  onFlipVertical,
  onLock,
  onFavorite,
  onBringForward,
  onSendBackward,
  onCrop,
  onBrushSizeChange,
  onBrushColorChange,
  onToggleBrushMode,
  opacity,
  onOpacityChange,
  isLocked,
  isFavorite,
  cursorState,
  onToggleAI,
  isAIOpen,
}) => {
  const { t } = useTranslation();
  return (
    <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm">
      <div className="flex space-x-2">
        {/* Basic Tools */}
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onAddArrow}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          {t('common.arrow')}
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onAddText}
        >
          <Type className="h-4 w-4 mr-2" />
          {t('common.text')}
        </button>

        <button
          className={`inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium ${
            isAIOpen ? 'bg-blue-100 text-blue-700 border-blue-300' : 'text-gray-700 bg-white'
          } hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors`}
          onClick={onToggleAI}
        >
          <Bot className="h-4 w-4 mr-2" />
          {t('ai.askAI')}
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2" />

        {/* Edit Tools */}
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onCut}
        >
          <Scissors className="h-4 w-4 mr-2" />
          {t('common.cut')}
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onCopy}
        >
          <Copy className="h-4 w-4 mr-2" />
          {t('common.copy')}
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onPaste}
        >
          <Clipboard className="h-4 w-4 mr-2" />
          {t('common.paste')}
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2" />

        {/* Arrange Tools */}
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onBringForward}
        >
          <ChevronUp className="h-4 w-4 mr-2" />
          {t('common.bringForward')}
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onSendBackward}
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          {t('common.sendBackward')}
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2" />

        {/* Transform Tools */}
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onFlipHorizontal}
        >
          <FlipHorizontal className="h-4 w-4 mr-2" />
          {t('common.flipHorizontal')}
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onFlipVertical}
        >
          <FlipVertical className="h-4 w-4 mr-2" />
          {t('common.flipVertical')}
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2" />

        {/* Special Tools */}
        <button
          className={`inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium ${
            isLocked ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'
          } hover:bg-gray-50`}
          onClick={onLock}
        >
          <Lock className="h-4 w-4 mr-2" />
          {isLocked ? t('common.unlock') : t('common.lock')}
        </button>
        <button
          className={`inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium ${
            isFavorite ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-700'
          } hover:bg-gray-50`}
          onClick={onFavorite}
        >
          <Star className="h-4 w-4 mr-2" />
          {t('common.favorite')}
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onCrop}
        >
          <Crop className="h-4 w-4 mr-2" />
          {t('common.crop')}
        </button>

        {/* Opacity Slider */}
        <div className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-md bg-white">
          <Layers className="h-4 w-4 text-gray-500" />
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-gray-600">{opacity}%</span>
        </div>

        {/* Brush Tools */}
        <div className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-md bg-white">
          <button
            className={`p-2 rounded-md transition-colors duration-200 ${
              cursorState === "drawing" 
                ? 'bg-blue-100 text-blue-700' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            onClick={onToggleBrushMode}
            title={t('common.brush')}
          >
            <PenTool className="h-4 w-4" />
          </button>
          <input
            type="range"
            min="1"
            max="50"
            defaultValue="5"
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="w-24"
          />
          <input
            type="color"
            defaultValue="#000000"
            onChange={(e) => onBrushColorChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <LanguageSwitcher />
        <div className="flex space-x-2">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onUndo}
            title={t('common.undo')}
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onRedo}
            title={t('common.redo')}
          >
            <Redo2 className="h-5 w-5" />
          </button>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onSaveClick}
        >
          <Save className="h-4 w-4 mr-2" />
          {t('common.export')}
        </button>
      </div>
    </div>
  );
};

export default TopBar;
