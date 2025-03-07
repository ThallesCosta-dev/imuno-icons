import React, { useRef } from 'react';
import { Ruler, ZoomIn, ZoomOut, Grid, Eye, PaintBucket } from 'lucide-react';

interface RightControlsProps {
  rulerVisible: boolean;
  gridVisible: boolean;
  previewMode: boolean;
  canvasColor: string;
  scale: number;
  onRulerToggle: (value: boolean) => void;
  onGridToggle: (value: boolean) => void;
  onPreviewToggle: () => void;
  onCanvasColorChange: (value: string) => void;
  onZoom: (direction: 'in' | 'out') => void;
  onZoomChange: (scale: number) => void;
}

const RightControls: React.FC<RightControlsProps> = ({
  rulerVisible,
  gridVisible,
  previewMode,
  canvasColor,
  scale,
  onRulerToggle,
  onGridToggle,
  onPreviewToggle,
  onCanvasColorChange,
  onZoom,
  onZoomChange,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    const percentage = 1 - (y / height);
    
    // Limitar o zoom entre 0.1 (10%) e 2 (200%)
    const newScale = Math.max(0.1, Math.min(2, percentage * 2));
    onZoomChange(newScale);
  };

  const handleSliderDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return; // Só processa se o botão esquerdo estiver pressionado
    handleSliderClick(e);
  };

  return (
    <div className="w-12 bg-white border-l border-gray-200 flex items-center justify-center h-full">
      <div className="flex flex-col items-center space-y-6">
        {/* Zoom Controls */}
        <div className="flex flex-col items-center space-y-1">
          <button
            className="p-2 hover:bg-gray-100 rounded-md"
            onClick={() => onZoom('in')}
            title="Aumentar Zoom"
          >
            <ZoomIn className="h-4 w-4 text-gray-600" />
          </button>
          
          <div 
            ref={sliderRef}
            className="flex items-center justify-center w-full h-24 relative cursor-pointer"
            onClick={handleSliderClick}
            onMouseMove={handleSliderDrag}
          >
            <div className="h-full w-0.5 bg-gray-200"></div>
            <div 
              className="absolute w-3 h-3 rounded-full bg-blue-500 cursor-pointer"
              style={{ bottom: `${Math.min(100, Math.max(0, (scale / 2) * 100))}%` }}
              title={`${Math.round(scale * 100)}%`}
            />
          </div>

          <button
            className="p-2 hover:bg-gray-100 rounded-md"
            onClick={() => onZoom('out')}
            title="Diminuir Zoom"
          >
            <ZoomOut className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        <div className="w-8 h-px bg-gray-200" />

        {/* View Controls */}
        <div className="flex flex-col items-center space-y-4">
          <button
            className={`p-2 rounded-md ${
              gridVisible ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
            onClick={() => onGridToggle(!gridVisible)}
            title="Mostrar/Ocultar Grade"
          >
            <Grid className="h-4 w-4" />
          </button>

          <button
            className={`p-2 rounded-md ${
              previewMode ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
            onClick={onPreviewToggle}
            title="Modo Preview"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            className={`p-2 rounded-md ${
              rulerVisible ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-600'
            }`}
            onClick={() => onRulerToggle(!rulerVisible)}
            title="Mostrar/Ocultar Régua"
          >
            <Ruler className="h-4 w-4" />
          </button>

          <button
            className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
            onClick={() => document.getElementById('canvas-color-picker')?.click()}
            title="Cor do Canvas"
          >
            <PaintBucket className="h-4 w-4" />
          </button>
          <input
            id="canvas-color-picker"
            type="color"
            value={canvasColor}
            onChange={(e) => onCanvasColorChange(e.target.value)}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default RightControls;
