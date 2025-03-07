import React, { useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import SideBar from './components/SideBar/SideBar.component';
import TopBar from './components/TopBar/TopBar.component';
import RightControls from './components/RightControls/RightControls.component';

const shapes = [
  { id: "virus", url: "/files/virus.svg" },
  { id: "anticorpo", url: "/files/icion_anticorpo.svg" },
  { id: "cell-t", url: "/files/cell-t.svg" },
  { id: "antigen", url: "/files/antigen.svg" },
  { id: "dend-cell", url: "/files/dend-cell.svg" },
  { id: "mch-2", url: "/files/mch-2.svg" },
  { id: "t-receptor", url: "/files/t-receptor.svg" },
];

function App() {
  const [stage, setStage] = useState<Stage>();
  const [layer, setLayer] = useState<Layer>(new Konva.Layer());
  const [bgLayer, setBgLayer] = useState<Layer>(new Konva.Layer());
  const [selectedShape, setSelectedShape] = useState<string>();
  const [textContent, setTextContent] = useState<string>("");
  const [history, setHistory] = useState<any[]>([]);
  const [historyPointer, setHistoryPointer] = useState<number>(-1);
  const [clipboard, setClipboard] = useState<any>(null);
  const [opacity, setOpacity] = useState<number>(100);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<Konva.Node | null>(null);
  const [rulerVisible, setRulerVisible] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [canvasColor, setCanvasColor] = useState('#ffffff');
  const [scale, setScale] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<Konva.Rect | null>(null);

  useEffect(() => {
    const konvaStage = new Konva.Stage({
      container: "stage",
      width: window.innerWidth - 320,
      height: window.innerHeight - 64,
    });
    const konvaLayer = new Konva.Layer();
    const konvaBgLayer = new Konva.Layer();
    konvaStage.add(konvaBgLayer);
    konvaStage.add(konvaLayer);
    setStage(konvaStage);
    setLayer(konvaLayer);
    setBgLayer(konvaBgLayer);

    // Garantir que o grid seja desenhado após a inicialização dos layers
    setTimeout(() => {
      addBG();
    }, 0);

    const handleResize = () => {
      konvaStage.width(window.innerWidth - 320);
      konvaStage.height(window.innerHeight - 64);
      addBG();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Efeito para controlar a visibilidade da régua
  useEffect(() => {
    if (rulerVisible) {
      addRuler();
    } else {
      stage?.children?.forEach(layer => {
        if (layer.name() === 'ruler-layer') {
          layer.destroy();
        }
      });
      stage?.batchDraw();
    }
  }, [rulerVisible, stage?.width(), stage?.height()]);

  const updateCanvasColor = (color: string) => {
    setCanvasColor(color);
    const bgRect = bgLayer.findOne('.background-rect');
    if (bgRect && bgRect instanceof Konva.Rect) {
      bgRect.fill(color);
      bgLayer.batchDraw();
    }
  };

  // Efeito para atualizar a cor do canvas
  useEffect(() => {
    updateCanvasColor(canvasColor);
  }, [canvasColor]);

  // Efeito para atualizar a visibilidade da grade
  useEffect(() => {
    addBG();
  }, [gridVisible]);

  // Efeito para atualizar o modo de preview
  useEffect(() => {
    if (previewMode) {
      // Esconde todos os transformers e âncoras
      stage?.find('.transformer').forEach(tr => tr.hide());
      stage?.find('.anchor').forEach(anchor => anchor.hide());
      
      // Esconde as linhas da grade se estiverem visíveis
      if (gridVisible) {
        stage?.find('.grid-line').forEach(line => line.hide());
      }
      
      // Esconde a camada de régua se estiver visível
      stage?.children?.forEach(layer => {
        if (layer.name() === 'ruler-layer') {
          layer.hide();
        }
      });
      
      // Adiciona classe CSS para indicar modo preview
      const container = document.getElementById('stage-container');
      if (container) {
        container.classList.add('preview-mode');
      }
    } else {
      // Mostra todos os transformers e âncoras
      stage?.find('.transformer').forEach(tr => tr.show());
      stage?.find('.anchor').forEach(anchor => anchor.show());
      
      // Mostra as linhas da grade se estiverem visíveis
      if (gridVisible) {
        stage?.find('.grid-line').forEach(line => line.show());
      }
      
      // Mostra a camada de régua se estiver visível
      if (rulerVisible) {
        stage?.children?.forEach(layer => {
          if (layer.name() === 'ruler-layer') {
            layer.show();
          }
        });
      }
      
      // Remove classe CSS do modo preview
      const container = document.getElementById('stage-container');
      if (container) {
        container.classList.remove('preview-mode');
      }
    }
    stage?.batchDraw();
  }, [previewMode, gridVisible, rulerVisible]);

  const addHistory = (action: string, data: any) => {
    const newHistory = history.slice(0, historyPointer + 1);
    newHistory.push({ action, data });
    setHistory(newHistory);
    setHistoryPointer(newHistory.length - 1);
  };

  const undo = () => {
    if (historyPointer >= 0) {
      const previousAction = history[historyPointer];
      if (previousAction.action === "add") {
        previousAction.data.destroy();
        layer.draw();
      }
      setHistoryPointer(historyPointer - 1);
    }
  };

  const redo = () => {
    if (historyPointer < history.length - 1) {
      const nextAction = history[historyPointer + 1];
      if (nextAction.action === "add") {
        const shape = nextAction.data;
        layer.add(shape);
        layer.draw();
      }
      setHistoryPointer(historyPointer + 1);
    }
  };

  const handleCut = () => {
    if (selectedNode && !isLocked) {
      setClipboard(selectedNode.clone());
      selectedNode.destroy();
      layer.draw();
      addHistory("cut", selectedNode);
    }
  };

  const handleCopy = () => {
    if (selectedNode) {
      setClipboard(selectedNode.clone());
    }
  };

  const handlePaste = () => {
    if (clipboard) {
      const clone = clipboard.clone();
      clone.x(clone.x() + 20);
      clone.y(clone.y() + 20);
      addTransformer(clone);
      layer.add(clone);
      layer.draw();
      addHistory("add", clone);
    }
  };

  const handleFlipHorizontal = () => {
    if (selectedNode && !isLocked) {
      selectedNode.scaleX(-selectedNode.scaleX());
      layer.draw();
      addHistory("transform", selectedNode);
    }
  };

  const handleFlipVertical = () => {
    if (selectedNode && !isLocked) {
      selectedNode.scaleY(-selectedNode.scaleY());
      layer.draw();
      addHistory("transform", selectedNode);
    }
  };

  const handleBringForward = () => {
    if (selectedNode && !isLocked) {
      selectedNode.moveUp();
      layer.draw();
      addHistory("arrange", selectedNode);
    }
  };

  const handleSendBackward = () => {
    if (selectedNode && !isLocked) {
      selectedNode.moveDown();
      layer.draw();
      addHistory("arrange", selectedNode);
    }
  };

  const handleLock = () => {
    setIsLocked(!isLocked);
    if (selectedNode) {
      selectedNode.draggable(!isLocked);
      layer.draw();
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    if (selectedNode && !isLocked) {
      selectedNode.opacity(value / 100);
      layer.draw();
      addHistory("opacity", selectedNode);
    }
  };

  const handleCrop = () => {
    if (!selectedNode || !stage || isLocked) return;
    
    if (isCropping) {
      // Finalizar o recorte
      finishCrop();
      return;
    }
    
    // Iniciar o recorte
    setIsCropping(true);
    
    // Desativar transformers durante o recorte
    stage.find('Transformer').forEach(tr => tr.hide());
    
    // Obter a posição e tamanho do nó selecionado
    const nodeRect = selectedNode.getClientRect();
    
    // Criar retângulo de recorte
    const rect = new Konva.Rect({
      x: nodeRect.x,
      y: nodeRect.y,
      width: nodeRect.width,
      height: nodeRect.height,
      stroke: '#0066cc',
      strokeWidth: 2,
      dash: [5, 5],
      fill: 'rgba(0, 102, 204, 0.1)',
      draggable: true,
      name: 'crop-rect'
    });
    
    // Adicionar transformador ao retângulo de recorte
    const transformer = new Konva.Transformer({
      nodes: [rect],
      rotateEnabled: false,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      borderStroke: '#0066cc',
      anchorStroke: '#0066cc',
      anchorFill: '#ffffff',
      anchorSize: 8,
      borderStrokeWidth: 1,
      boundBoxFunc: (oldBox, newBox) => {
        // Limitar o retângulo de recorte à área do nó selecionado
        if (
          newBox.x < nodeRect.x ||
          newBox.y < nodeRect.y ||
          newBox.x + newBox.width > nodeRect.x + nodeRect.width ||
          newBox.y + newBox.height > nodeRect.y + nodeRect.height
        ) {
          return oldBox;
        }
        return newBox;
      }
    });
    
    layer.add(rect);
    layer.add(transformer);
    layer.draw();
    
    setCropRect(rect);
  };

  const finishCrop = () => {
    if (!selectedNode || !cropRect || !stage) return;
    
    // Obter a posição e tamanho do retângulo de recorte
    const cropBox = cropRect.getClientRect();
    
    // Verificar se o nó selecionado é uma imagem
    if (selectedNode.className === 'Image') {
      const image = selectedNode as Konva.Image;
      const imageObj = image.image();
      
      // Criar um canvas temporário para o recorte
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx || !imageObj) return;
      
      // Verificar se o objeto de imagem é um HTMLImageElement
      if (!(imageObj instanceof HTMLImageElement)) {
        cleanupCrop();
        return;
      }
      
      // Calcular a proporção entre o tamanho da imagem original e o tamanho exibido
      const scaleX = imageObj.naturalWidth / image.width();
      const scaleY = imageObj.naturalHeight / image.height();
      
      // Calcular as coordenadas de recorte na imagem original
      const cropX = (cropBox.x - image.x()) * scaleX;
      const cropY = (cropBox.y - image.y()) * scaleY;
      const cropWidth = cropBox.width * scaleX;
      const cropHeight = cropBox.height * scaleY;
      
      // Definir o tamanho do canvas
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      // Desenhar a parte recortada da imagem no canvas
      ctx.drawImage(
        imageObj,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );
      
      // Criar uma nova imagem a partir do canvas
      const newImage = new window.Image();
      newImage.onload = () => {
        // Atualizar a imagem existente
        image.image(newImage);
        image.width(cropBox.width);
        image.height(cropBox.height);
        image.position({
          x: cropBox.x,
          y: cropBox.y
        });
        
        // Limpar o retângulo de recorte
        cleanupCrop();
        
        // Atualizar o histórico
        addHistory("crop", image);
      };
      newImage.src = canvas.toDataURL();
    } else {
      // Para outros tipos de nós, podemos implementar outras estratégias de recorte
      // Por enquanto, apenas limpamos o recorte
      cleanupCrop();
    }
  };

  const cleanupCrop = () => {
    // Remover o retângulo de recorte e o transformador
    stage?.find('.crop-rect').forEach(node => node.destroy());
    stage?.find('Transformer').forEach(tr => tr.show());
    layer.draw();
    
    // Resetar o estado
    setIsCropping(false);
    setCropRect(null);
  };

  // Cancelar o recorte ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCropping) {
        cleanupCrop();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCropping]);

  const handleZoom = (direction: 'in' | 'out') => {
    if (!stage) return;
    const newScale = direction === 'in' ? scale * 1.2 : scale / 1.2;
    setScale(newScale);
    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
  };

  const handleZoomChange = (newScale: number) => {
    if (!stage) return;
    setScale(newScale);
    stage.scale({ x: newScale, y: newScale });
    stage.batchDraw();
  };

  const addRuler = () => {
    if (!stage || !rulerVisible) return;

    // Remove existing ruler layer if any
    stage.children?.forEach(layer => {
      if (layer.name() === 'ruler-layer') {
        layer.destroy();
      }
    });

    const rulerLayer = new Konva.Layer({ name: 'ruler-layer' });
    
    // Horizontal ruler
    const hRuler = new Konva.Line({
      points: [0, 20, stage.width(), 20],
      stroke: '#666',
      strokeWidth: 1,
    });

    // Vertical ruler
    const vRuler = new Konva.Line({
      points: [20, 0, 20, stage.height()],
      stroke: '#666',
      strokeWidth: 1,
    });

    // Add ruler markings
    for (let i = 0; i < stage.width(); i += 50) {
      const mark = new Konva.Line({
        points: [i, 15, i, 25],
        stroke: '#666',
        strokeWidth: 1,
      });
      const text = new Konva.Text({
        x: i - 10,
        y: 0,
        text: i.toString(),
        fontSize: 10,
        fill: '#666',
      });
      rulerLayer.add(mark);
      rulerLayer.add(text);
    }

    for (let i = 0; i < stage.height(); i += 50) {
      const mark = new Konva.Line({
        points: [15, i, 25, i],
        stroke: '#666',
        strokeWidth: 1,
      });
      const text = new Konva.Text({
        x: 0,
        y: i - 5,
        text: i.toString(),
        fontSize: 10,
        fill: '#666',
      });
      rulerLayer.add(mark);
      rulerLayer.add(text);
    }

    rulerLayer.add(hRuler);
    rulerLayer.add(vRuler);
    stage.add(rulerLayer);
  };

  const addSvg = (x: number, y: number, svg: string) => {
    const image = new window.Image();
    image.onload = () => {
      const konvaImage = new Konva.Image({
        x: x,
        y: y,
        image: image,
        width: 50,
        height: 50,
        draggable: true,
      });
      addTransformer(konvaImage);
      layer.add(konvaImage);
      layer.draw();
      addHistory("add", konvaImage);
    };
    image.src = svg;
  };

  const addTransformer = (node: Konva.Node) => {
    const transformer = new Konva.Transformer({
      rotateEnabled: true,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      borderStroke: '#0066cc',
      anchorStroke: '#0066cc',
      anchorFill: '#ffffff',
      anchorSize: 8,
      borderStrokeWidth: 1,
    });
    
    layer.add(transformer);
    
    node.on("click", () => {
      setSelectedNode(node);
      transformer.nodes([node]);
      layer.batchDraw();
    });
    
    stage?.on("click", (e) => {
      if (e.target === stage) {
        setSelectedNode(null);
        transformer.detach();
        layer.draw();
      }
    });
    
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setSelectedNode(null);
        transformer.detach();
        layer.draw();
      } else if (e.key === "Delete" && !isLocked) {
        const nodes = transformer.nodes();
        nodes.forEach(n => {
          if (node === n) {
            node.destroy();
            transformer.destroy();
            setSelectedNode(null);
            addHistory("remove", node);
          }
        });
        layer.draw();
      }
    });
  };

  const handleShapeClick = (shapeId: string) => {
    setSelectedShape(shapeId);
  };

  const handleStageClick = () => {
    if (selectedShape) {
      const position = stage?.getPointerPosition();
      const selectedSvg = shapes.find((shape) => shape.id === selectedShape);
      if (selectedSvg && position) {
        addSvg(position.x, position.y, selectedSvg.url);
        setSelectedShape("");
      }
    }
  };

  const downloadURI = (uri: string, name: string) => {
    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addBG = () => {
    if (!bgLayer || !stage) return;

    bgLayer.destroyChildren();
    const rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: stage.width(),
      height: stage.height(),
      fill: canvasColor,
      name: 'background-rect'
    });
    
    if (gridVisible) {
      // Criar linhas verticais
      for (let i = 0; i < stage.width(); i += 20) {
        const line = new Konva.Line({
          points: [i, 0, i, stage.height()],
          stroke: '#f0f0f0',
          strokeWidth: 1,
          name: 'grid-line'
        });
        bgLayer.add(line);
      }
      
      // Criar linhas horizontais
      for (let i = 0; i < stage.height(); i += 20) {
        const line = new Konva.Line({
          points: [0, i, stage.width(), i],
          stroke: '#f0f0f0',
          strokeWidth: 1,
          name: 'grid-line'
        });
        bgLayer.add(line);
      }
    }
    
    bgLayer.add(rect);
    rect.moveToBottom();
    bgLayer.batchDraw();
  };

  const handleSaveClick = () => {
    const dataURL = stage?.toDataURL({ pixelRatio: 3 });
    if (dataURL) {
      downloadURI(dataURL, "Your-Project-ImunoIcons.png");
    }
  };

  const addArrow = () => {
    if (stage) {
      // Coordenadas iniciais do ponto de origem da seta
      let startX: number, startY: number;
      // Referência para o objeto de seta que será manipulado
      let arrow: Konva.Arrow | null = null;
      
      // Função para remover os event listeners quando a operação for concluída
      const cleanupEventListeners = () => {
        stage.off("mousedown");
        stage.off("mousemove");
        stage.off("mouseup");
      };

      // Inicia o processo de criação da seta quando o usuário pressiona o mouse
      stage.on("mousedown", (e) => {
        // Captura as coordenadas iniciais
        startX = e.evt.offsetX;
        startY = e.evt.offsetY;
        
        // Cria a seta imediatamente para feedback visual instantâneo
        arrow = new Konva.Arrow({
          points: [startX, startY, startX, startY], // Inicialmente, origem e destino são iguais
          pointerLength: 10,
          pointerWidth: 10,
          fill: '#2D3748',
          stroke: '#2D3748',
          strokeWidth: 2,
          draggable: true,
          hitStrokeWidth: 10, // Aumenta a área de clique para melhorar a UX
        });
        
        // Adiciona a seta à camada e atualiza a visualização
        layer.add(arrow);
        layer.batchDraw();
      });

      // Atualiza a seta em tempo real enquanto o usuário move o mouse
      stage.on("mousemove", (e) => {
        // Só atualiza se uma seta estiver sendo criada
        if (arrow) {
          const endX = e.evt.offsetX;
          const endY = e.evt.offsetY;
          
          // Atualiza os pontos da seta para refletir a posição atual do cursor
          arrow.points([startX, startY, endX, endY]);
          layer.batchDraw();
        }
      });

      // Finaliza a criação da seta quando o usuário solta o mouse
      stage.on("mouseup", (e) => {
        if (arrow) {
          const endX = e.evt.offsetX;
          const endY = e.evt.offsetY;
          
          // Define os pontos finais da seta
          arrow.points([startX, startY, endX, endY]);
          
          // Adiciona controles de transformação à seta
          addTransformer(arrow);
          // Registra a ação no histórico para permitir desfazer/refazer
          addHistory("add", arrow);
          
          // Remove os event listeners para evitar vazamentos de memória
          cleanupEventListeners();
        }
      });
    }
  };

  const addRectWithText = () => {
    if (stage) {
      let x: number, y: number;
      const remove = () => {
        stage.off("mousedown");
        stage.off("mouseup");
      };

      stage.on("mousedown", (e) => {
        x = e.evt.offsetX;
        y = e.evt.offsetY;
      });

      stage.on("mouseup", () => {
        const group = new Konva.Group({
          x: x,
          y: y,
          draggable: true,
        });

        const rect = new Konva.Rect({
          width: 200,
          height: 100,
          fill: '#EBF8FF',
          stroke: '#4299E1',
          strokeWidth: 1,
          cornerRadius: 4,
        });

        const text = new Konva.Text({
          text: textContent || 'Double click to edit',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fill: '#2D3748',
          width: 200,
          padding: 10,
          align: 'center',
        });

        text.on('dblclick', () => {
          const textNode = text;
          const textPosition = textNode.getAbsolutePosition();
          
          const input = document.createElement('textarea');
          document.body.appendChild(input);
          
          input.value = textNode.text();
          input.style.position = 'absolute';
          input.style.top = `${textPosition.y}px`;
          input.style.left = `${textPosition.x}px`;
          input.style.width = `${textNode.width()}px`;
          input.style.height = `${textNode.height()}px`;
          input.style.fontSize = `${textNode.fontSize()}px`;
          input.style.border = 'none';
          input.style.padding = '0px';
          input.style.margin = '0px';
          input.style.overflow = 'hidden';
          input.style.background = 'none';
          input.style.outline = 'none';
          input.style.resize = 'none';
          input.style.lineHeight = textNode.lineHeight().toString();
          input.style.fontFamily = textNode.fontFamily();
          input.style.transformOrigin = 'left top';
          input.style.textAlign = textNode.align();
          input.style.color = textNode.fill();
          
          input.focus();
          
          input.addEventListener('blur', () => {
            textNode.text(input.value);
            document.body.removeChild(input);
            layer.draw();
          });
        });

        group.add(rect);
        group.add(text);
        addTransformer(group);
        layer.add(group);
        layer.draw();
        addHistory("add", group);
        remove();
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <SideBar onItemClick={handleShapeClick} />
      <div className="flex-1 flex flex-col">
        <TopBar
          onSaveClick={handleSaveClick}
          onAddArrow={addArrow}
          onAddText={addRectWithText}
          onUndo={undo}
          onRedo={redo}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onFlipHorizontal={handleFlipHorizontal}
          onFlipVertical={handleFlipVertical}
          onLock={handleLock}
          onFavorite={handleFavorite}
          onBringForward={handleBringForward}
          onSendBackward={handleSendBackward}
          onCrop={handleCrop}
          opacity={opacity}
          onOpacityChange={handleOpacityChange}
          isLocked={isLocked}
          isFavorite={isFavorite}
        />
        <div className={`flex-1 bg-gray-100 ${previewMode ? 'preview-mode' : ''}`} id="stage-container">
          <div
            id="stage"
            className="w-full h-full"
            onClick={handleStageClick}
          ></div>
        </div>
      </div>
      <RightControls
        rulerVisible={rulerVisible}
        gridVisible={gridVisible}
        previewMode={previewMode}
        canvasColor={canvasColor}
        scale={scale}
        onRulerToggle={setRulerVisible}
        onGridToggle={setGridVisible}
        onPreviewToggle={() => setPreviewMode(!previewMode)}
        onCanvasColorChange={updateCanvasColor}
        onZoom={handleZoom}
        onZoomChange={handleZoomChange}
      />
    </div>
  );
}

export default App;