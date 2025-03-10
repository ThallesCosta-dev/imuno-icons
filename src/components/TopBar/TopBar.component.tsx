import React from 'react';
import { 
  ArrowRight, Type, Save, Undo2, Redo2, 
  Scissors, Copy, FlipHorizontal, FlipVertical, 
  Lock, Star, Layers, Crop, 
  ChevronUp, ChevronDown
} from 'lucide-react';

type TopBarProps = {
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
  opacity: number;
  onOpacityChange: (value: number) => void;
  isLocked: boolean;
  isFavorite: boolean;
};

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
  opacity,
  onOpacityChange,
  isLocked,
  isFavorite,
}) => {
  return (
    <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between shadow-sm">
      <div className="flex space-x-2">
        {/* Basic Tools */}
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onAddArrow}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Arrow
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onAddText}
        >
          <Type className="h-4 w-4 mr-2" />
          Text
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2" />

        {/* Edit Tools */}
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onCut}
        >
          <Scissors className="h-4 w-4 mr-2" />
          Cut
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onCopy}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2" />

        {/* Arrange Tools */}
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onBringForward}
        >
          <ChevronUp className="h-4 w-4 mr-2" />
          Bring Forward
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onSendBackward}
        >
          <ChevronDown className="h-4 w-4 mr-2" />
          Send Backward
        </button>

        <div className="h-6 w-px bg-gray-200 mx-2" />

        {/* Transform Tools */}
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onFlipHorizontal}
        >
          <FlipHorizontal className="h-4 w-4 mr-2" />
          Flip H
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onFlipVertical}
        >
          <FlipVertical className="h-4 w-4 mr-2" />
          Flip V
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
          Lock
        </button>
        <button
          className={`inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium ${
            isFavorite ? 'bg-yellow-100 text-yellow-700' : 'bg-white text-gray-700'
          } hover:bg-gray-50`}
          onClick={onFavorite}
        >
          <Star className="h-4 w-4 mr-2" />
          Favorite
        </button>
        <button
          className="inline-flex items-center px-3 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          onClick={onCrop}
        >
          <Crop className="h-4 w-4 mr-2" />
          Crop
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
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex space-x-2">
          <button
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onUndo}
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onRedo}
          >
            <Redo2 className="h-5 w-5" />
          </button>
        </div>
        <button
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onSaveClick}
        >
          <Save className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>
    </div>
  );
};

export default TopBar;