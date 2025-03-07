import React, { useEffect, useState } from 'react';
import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';
import SideBar from './components/SideBar/SideBar.component';
import TopBar from './components/TopBar/TopBar.component';
import RightControls from './components/RightControls/RightControls.component';
import iconData from './data/iconData';
import svgCache from './services/SvgCache';

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
    
    // Remover todos os transformers existentes antes de iniciar o recorte
    stage.find('Transformer').forEach(tr => {
      tr.destroy();
    });
    
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
      name: 'crop-transformer',
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
      
      if (!ctx || !imageObj) {
        cleanupCrop();
        return;
      }
      
      // Verificar se o objeto de imagem é um HTMLImageElement
      if (!(imageObj instanceof HTMLImageElement)) {
        cleanupCrop();
        return;
      }
      
      try {
        // Calcular a proporção entre o tamanho da imagem original e o tamanho exibido
        const scaleX = imageObj.naturalWidth / (image.width() * image.scaleX());
        const scaleY = imageObj.naturalHeight / (image.height() * image.scaleY());
        
        // Calcular as coordenadas de recorte na imagem original
        // Ajustar para considerar a posição e escala da imagem
        const imgPos = image.getAbsolutePosition();
        const imgRotation = image.rotation();
        
        // Se a imagem estiver rotacionada, precisamos de uma abordagem diferente
        if (imgRotation !== 0) {
          // Para imagens rotacionadas, é mais complexo
          // Vamos simplificar e apenas recortar a área visível
          
          // Definir o tamanho do canvas para o tamanho do recorte
          canvas.width = cropBox.width;
          canvas.height = cropBox.height;
          
          // Criar um novo stage temporário para renderizar apenas a parte recortada
          const tempStage = new Konva.Stage({
            container: document.createElement('div'),
            width: cropBox.width,
            height: cropBox.height,
          });
          
          const tempLayer = new Konva.Layer();
          tempStage.add(tempLayer);
          
          // Clonar a imagem e ajustar sua posição relativa ao recorte
          const clonedImage = image.clone();
          clonedImage.position({
            x: image.x() - cropBox.x,
            y: image.y() - cropBox.y,
          });
          
          tempLayer.add(clonedImage);
          tempLayer.draw();
          
          // Converter o stage temporário para uma URL de dados
          const dataURL = tempStage.toDataURL({
            x: 0,
            y: 0,
            width: cropBox.width,
            height: cropBox.height,
            pixelRatio: 2
          });
          
          // Primeiro, limpar completamente o recorte e todas as seleções
          cleanupCrop();
          
          // Criar uma nova imagem a partir da URL de dados
          const newImage = new window.Image();
          newImage.onload = () => {
            // Atualizar a imagem existente
            image.image(newImage);
            image.width(cropBox.width / image.scaleX());
            image.height(cropBox.height / image.scaleY());
            image.position({
              x: cropBox.x,
              y: cropBox.y
            });
            
            // Atualizar o histórico
            addHistory("crop", image);
            
            // Recriar o transformer para a imagem recortada
            createNewTransformer(image);
          };
          newImage.src = dataURL;
        } else {
          // Para imagens não rotacionadas, podemos usar o método original
          // Calcular as coordenadas de recorte na imagem original
          const cropX = (cropBox.x - imgPos.x) * scaleX;
          const cropY = (cropBox.y - imgPos.y) * scaleY;
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
          
          // Primeiro, limpar completamente o recorte e todas as seleções
          cleanupCrop();
          
          // Criar uma nova imagem a partir do canvas
          const newImage = new window.Image();
          newImage.onload = () => {
            // Atualizar a imagem existente
            image.image(newImage);
            image.width(cropBox.width / image.scaleX());
            image.height(cropBox.height / image.scaleY());
            image.position({
              x: cropBox.x,
              y: cropBox.y
            });
            
            // Atualizar o histórico
            addHistory("crop", image);
            
            // Recriar o transformer para a imagem recortada
            createNewTransformer(image);
          };
          newImage.src = canvas.toDataURL();
        }
      } catch (error) {
        console.error("Erro ao recortar imagem:", error);
        cleanupCrop();
      }
    } else if (selectedNode.nodeType === 'Group') {
      try {
        const group = selectedNode as Konva.Group;
        
        // Obter a posição absoluta do grupo
        const groupPos = group.getAbsolutePosition();
        
        // Calcular a nova posição do grupo após o recorte
        const newX = cropBox.x;
        const newY = cropBox.y;
        
        // Limpar o recorte e todas as seleções
        cleanupCrop();
        
        // Mover o grupo para a nova posição
        group.position({
          x: newX,
          y: newY
        });
        
        // Encontrar o retângulo dentro do grupo (para caixas de texto)
        const rect = group.findOne('Rect') as Konva.Rect;
        if (rect) {
          // Redimensionar o retângulo
          rect.width(cropBox.width / group.scaleX());
          rect.height(cropBox.height / group.scaleY());
        }
        
        // Encontrar o texto dentro do grupo
        const text = group.findOne('Text') as Konva.Text;
        if (text) {
          // Redimensionar o texto
          text.width(cropBox.width / group.scaleX());
          text.height(cropBox.height / group.scaleY());
        }
        
        // Atualizar o histórico
        addHistory("crop", group);
        
        // Atualizar a camada
        layer.draw();
        
        // Recriar o transformer para o grupo recortado
        createNewTransformer(group);
      } catch (error) {
        console.error("Erro ao recortar grupo:", error);
        cleanupCrop();
      }
    } else {
      // Para outros tipos de nós, implementar conforme necessário
      cleanupCrop();
    }
  };

  // Função para criar um novo transformer após o recorte
  const createNewTransformer = (node: Konva.Node) => {
    // Garantir que o nó ainda existe na camada
    if (!node || !node.getStage()) return;
    
    // Criar um novo transformer
    const newTransformer = new Konva.Transformer({
      nodes: [node],
      rotateEnabled: true,
      enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      borderStroke: '#0066cc',
      anchorStroke: '#0066cc',
      anchorFill: '#ffffff',
      anchorSize: 8,
      borderStrokeWidth: 1,
    });
    
    // Adicionar o transformer à camada
    layer.add(newTransformer);
    
    // Atualizar o nó selecionado
    setSelectedNode(node);
    
    // Atualizar a camada
    layer.draw();
  };

  const cleanupCrop = () => {
    if (!stage) return;
    
    // Remover todos os retângulos de recorte
    stage.find('.crop-rect').forEach(node => {
      node.destroy();
    });
    
    // Remover todos os transformers de recorte
    stage.find('.crop-transformer').forEach(tr => {
      tr.destroy();
    });
    
    // Remover todos os transformers regulares para evitar duplicatas
    stage.find('Transformer').forEach(tr => {
      if (tr.name() !== 'crop-transformer') {
        tr.destroy();
      }
    });
    
    // Atualizar a camada
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
    
    // Verifica se o arquivo atual é um dos arquivos grandes
    const isLargeFile = largeFiles.some(name => svg.includes(name));
    
    // Mostrar um indicador de carregamento
    if (isLargeFile) {
      // Criar um texto de carregamento temporário
      const loadingText = new Konva.Text({
        x: x,
        y: y,
        text: 'Carregando SVG...',
        fontSize: 14,
        fill: '#333',
        padding: 10,
        backgroundColor: '#f0f0f0',
        cornerRadius: 5
      });
      layer.add(loadingText);
      layer.draw();
      
      // Carregar a imagem em um setTimeout para não bloquear a UI
      setTimeout(() => {
        const image = new window.Image();
        image.onload = () => {
          // Remover o texto de carregamento
          loadingText.destroy();
          
          // Criar a imagem Konva
          const konvaImage = new Konva.Image({
            x: x,
            y: y,
            image: image,
            width: 100, // Tamanho inicial maior para SVGs complexos
            height: 100,
            draggable: true,
          });
          
          addTransformer(konvaImage);
          layer.add(konvaImage);
          layer.draw();
          addHistory("add", konvaImage);
        };
        
        image.onerror = () => {
          // Em caso de erro, mostrar uma mensagem
          loadingText.text('Erro ao carregar SVG');
          loadingText.fill('red');
          layer.draw();
          
          // Remover a mensagem após alguns segundos
          setTimeout(() => {
            loadingText.destroy();
            layer.draw();
          }, 3000);
        };
        
        image.src = svg;
      }, 100);
    } else {
      // Carregamento normal para arquivos pequenos
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
    }
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
      if (position) {
        // Procurar o item selecionado em todas as categorias
        let selectedItem = null;
        
        for (const category in iconData) {
          const categoryItems = iconData[category];
          
          // Verificar se a categoria tem subcategorias
          if (categoryItems && typeof categoryItems === 'object' && !Array.isArray(categoryItems)) {
            // Procurar em subcategorias
            for (const subcategory in categoryItems) {
              const subcategoryItems = categoryItems[subcategory] as IconItem[];
              const found = subcategoryItems.find(item => item.id === selectedShape);
              if (found) {
                selectedItem = found;
                break;
              }
            }
          } else if (Array.isArray(categoryItems)) {
            // Procurar em categorias sem subcategorias
            const found = categoryItems.find(item => item.id === selectedShape);
            if (found) {
              selectedItem = found;
              break;
            }
          }
          
          if (selectedItem) break;
        }
        
        if (selectedItem) {
          addSvg(position.x, position.y, selectedItem.url);
          setSelectedShape("");
        }
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
      let textGroup: Konva.Group | null = null;
      
      const remove = () => {
        stage.off("mousedown");
        stage.off("mousemove");
        stage.off("mouseup");
      };

      stage.on("mousedown", (e) => {
        // Ignorar se o clique não foi no palco
        if (e.target !== stage) return;
        
        x = e.evt.offsetX;
        y = e.evt.offsetY;
        
        // Criar o grupo imediatamente para feedback visual
        textGroup = new Konva.Group({
          x: x,
          y: y,
          draggable: true,
          opacity: 0.8, // Inicialmente semi-transparente para indicar que está sendo criado
        });

        // Criar o retângulo de fundo
        const rect = new Konva.Rect({
          width: 200,
          height: 100,
          fill: '#EBF8FF',
          stroke: '#4299E1',
          strokeWidth: 1,
          cornerRadius: 4,
          shadowColor: 'rgba(0,0,0,0.1)',
          shadowBlur: 5,
          shadowOffset: { x: 0, y: 2 },
          shadowOpacity: 0.5,
        });

        // Criar o texto com placeholder
        const text = new Konva.Text({
          text: textContent || 'Clique duplo para editar',
          fontSize: 14,
          fontFamily: 'Inter, sans-serif',
          fill: '#2D3748',
          width: 200,
          padding: 10,
          align: 'center',
          verticalAlign: 'middle',
          height: 100,
        });

        // Adicionar elementos ao grupo
        textGroup.add(rect);
        textGroup.add(text);
        
        // Adicionar o grupo à camada
        layer.add(textGroup);
        layer.batchDraw();
      });

      // Permitir redimensionar durante a criação
      stage.on("mousemove", (e) => {
        if (!textGroup) return;
        
        // Calcular as novas dimensões com base na posição do mouse
        const width = Math.max(100, e.evt.offsetX - x);
        const height = Math.max(50, e.evt.offsetY - y);
        
        // Atualizar o retângulo
        const rect = textGroup.findOne('Rect') as Konva.Rect;
        rect.width(width);
        rect.height(height);
        
        // Atualizar o texto
        const text = textGroup.findOne('Text') as Konva.Text;
        text.width(width);
        text.height(height);
        
        layer.batchDraw();
      });

      stage.on("mouseup", () => {
        if (!textGroup) return;
        
        // Finalizar a criação
        textGroup.opacity(1);
        
        // Configurar o evento de edição de texto
        const text = textGroup.findOne('Text') as Konva.Text;
        const rect = textGroup.findOne('Rect') as Konva.Rect;
        
        text.on('dblclick', () => {
          // Criar um editor de texto mais amigável
          createTextEditor(text, rect, textGroup!);
        });
        
        // Adicionar transformador
        addTransformer(textGroup);
        
        // Adicionar ao histórico
        addHistory("add", textGroup);
        
        // Limpar os event listeners
        remove();
      });
    }
  };

  // Função para criar um editor de texto mais amigável
  const createTextEditor = (textNode: Konva.Text, rectNode: Konva.Rect, group: Konva.Group) => {
    // Obter a posição absoluta do grupo (não apenas do texto)
    const groupPos = group.getAbsolutePosition();
    const stageContainer = stage?.container();
    
    if (!stageContainer) return;
    
    // Calcular a escala atual do palco
    const stageScale = stage!.scaleX();
    
    // Criar o elemento de textarea
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    
    // Calcular a posição correta considerando a rotação e escala do grupo
    const rotation = group.rotation();
    
    // Configurar o estilo do textarea para corresponder ao retângulo (não ao texto)
    const areaPosition = {
      x: groupPos.x + stage!.container().offsetLeft,
      y: groupPos.y + stage!.container().offsetTop
    };
    
    // Obter as dimensões reais do retângulo
    const width = rectNode.width() * group.scaleX() * stageScale;
    const height = rectNode.height() * group.scaleY() * stageScale;
    
    // Aplicar estilos ao textarea
    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${width}px`;
    textarea.style.height = `${height}px`;
    textarea.style.fontSize = `${textNode.fontSize() * group.scaleY() * stageScale}px`;
    textarea.style.border = '1px solid #4299E1';
    textarea.style.padding = `${textNode.padding() * stageScale}px`;
    textarea.style.margin = '0px';
    textarea.style.overflow = 'auto';
    textarea.style.background = '#EBF8FF';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textNode.lineHeight() ? textNode.lineHeight().toString() : '1.2';
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();
    textarea.style.borderRadius = '4px';
    textarea.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
    textarea.style.zIndex = '1000';
    
    // Aplicar rotação se necessário
    if (rotation !== 0) {
      textarea.style.transform = `rotate(${rotation}deg)`;
      textarea.style.transformOrigin = 'left top';
    }
    
    // Adicionar classe para estilização adicional
    textarea.className = 'konva-text-editor';
    
    // Focar o textarea
    textarea.focus();
    
    // Selecionar todo o texto
    textarea.select();
    
    // Função para aplicar o texto e remover o editor
    const applyTextAndRemove = () => {
      // Verificar se o textarea ainda existe no DOM
      if (!document.body.contains(textarea)) return;
      
      // Aplicar o texto ao nó
      textNode.text(textarea.value || 'Clique duplo para editar');
      
      // Remover o textarea
      document.body.removeChild(textarea);
      
      // Atualizar a camada
      layer.draw();
      
      // Adicionar ao histórico
      addHistory("edit", group);
      
      // Remover os event listeners
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('keydown', handleEscKey);
      textarea.removeEventListener('keydown', handleEnterKey);
    };
    
    // Função para lidar com cliques fora do textarea
    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        applyTextAndRemove();
      }
    };
    
    // Função para lidar com a tecla Enter
    const handleEnterKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        applyTextAndRemove();
      }
    };
    
    // Função para lidar com a tecla Escape
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        applyTextAndRemove();
      }
    };
    
    // Adicionar event listeners
    // Usar setTimeout para evitar que o clique atual acione o evento
    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 0);
    
    window.addEventListener('keydown', handleEscKey);
    textarea.addEventListener('keydown', handleEnterKey);
    
    // Adicionar evento de blur
    textarea.addEventListener('blur', () => {
      // Pequeno atraso para permitir que outros handlers sejam executados primeiro
      setTimeout(applyTextAndRemove, 100);
    });
  };

  useEffect(() => {
    // Pré-carregar algumas SVGs
    const preloadCommonSvgs = async () => {
      // Lista de SVGs ue serão pré-carregados
      const commonSvgs = [
        "/files/icion_anticorpo.svg",
        "/files/cell-t.svg",
        "/files/antigen.svg",
        "/files/virus/VirusParticleIcon0001.svg",
        "/files/anatomy/HumanHeart0001.svg",
        "/files/anatomy/HumanLungs0001.svg"
      ];
      
      try {
        await svgCache.preloadImages(commonSvgs);
      } catch (err) {
        console.warn("Erro ao pré-carregar SVGs:", err);
      }
    };
    
    preloadCommonSvgs();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <SideBar onItemClick={handleShapeClick} items={iconData} />
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