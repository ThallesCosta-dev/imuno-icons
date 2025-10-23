import React, { useEffect, useRef, useState } from "react";
import Konva from "konva";
import { Stage } from "konva/lib/Stage";
import { Layer } from "konva/lib/Layer";
import SideBar from "./components/SideBar/SideBar.component";
import TopBar from "./components/TopBar/TopBar.component";
import RightControls from "./components/RightControls/RightControls.component";
import AIAssistant from "./components/AIAssistant/AIAssistant.component";
import iconData from "./data/iconData";
import svgCache from "./services/SvgCache";
import { BathIcon } from "lucide-react";
import Notification from './components/Notification/Notification.component';
import { useTranslation } from './hooks/useTranslation';

function App() {
  const { t } = useTranslation();
  const [transformer, setTransformer] = useState<Konva.Transformer | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [brushColor, setBrushColor] = useState('#000000');
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [lastLine, setLastLine] = useState<Konva.Line | null>(null);
  const [currentStrokeGroup, setCurrentStrokeGroup] = useState<Konva.Group | null>(null);
  const [isStrokeInProgress, setIsStrokeInProgress] = useState(false);
  const [cursorState, setCursorState] = useState("selecting");
  const [stage, setStage] = useState<Stage>();
  const [layer, setLayer] = useState<Layer>(new Konva.Layer());
  const [bgLayer, setBgLayer] = useState<Layer>(new Konva.Layer());
  const [selectedShape, setSelectedShape] = useState<string>();
  const [textContent, setTextContent] = useState<string>("");
  const history = useRef<{ action: string, data: any }[]>([]);
  const historyStep = useRef(0);
  const [clipboard, setClipboard] = useState<Konva.Node[]>([]);
  const [opacity, setOpacity] = useState<number>(100);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<Konva.Node | null>(null);
  const [rulerVisible, setRulerVisible] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [canvasColor, setCanvasColor] = useState("#ffffff");
  const [scale, setScale] = useState(1);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState<Konva.Rect | null>(null);
  const [bgRect, setBGRect] = useState<Konva.Rect | null>(null);
  const [notifications, setNotifications] = useState<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }[]>([]);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isAIMinimized, setIsAIMinimized] = useState(false);

  const selectingCursorState = () => {
    setCursorState("selecting");
  };

  const handleToggleAI = () => {
    setIsAIOpen(!isAIOpen);
    setIsAIMinimized(false);
  };

  const handleCloseAI = () => {
    setIsAIOpen(false);
    setIsAIMinimized(false);
  };

  const handleToggleAIMinimize = () => {
    setIsAIMinimized(!isAIMinimized);
  };

  const handleAIIconSuggestion = (iconId: string) => {
    setSelectedShape(iconId);
    showNotification(t('ai.iconSelected'), 'success');
  };

  const handleAIAddText = (text: string) => {
    setTextContent(text);
    addRectWithText();
    showNotification(t('ai.textAdded'), 'success');
  };

  useEffect(() => {
    const konvaStage = new Konva.Stage({
      container: "stage",
      width: window.innerWidth - 300,
      height: window.innerHeight - 64,
      draggable: false, // Implementar depois
      id: "selectable"
    });

    const rect = new Konva.Rect({
      width: 720,
      height: 720,
      fill: "gray",
      name: "background-rect",
      id: "selectable"
    });

    const konvaLayer = new Konva.Layer();
    konvaLayer.add(rect);
    konvaStage.add(konvaLayer);
    konvaStage.add(bgLayer);
    setStage(konvaStage);
    setLayer(konvaLayer);
    setBGRect(rect);

    const centerBgRect = () => {
      const stageWidth = konvaStage.width();
      const stageHeight = konvaStage.height();

      rect.x((stageWidth - rect.width()) / 2);
      rect.y((stageHeight - rect.height()) / 2);

      setBGRect(rect);
      konvaStage.batchDraw();
    };

    centerBgRect();

    const handleResize = () => {
      konvaStage.width(window.innerWidth - 320);
      konvaStage.height(window.innerHeight - 64);
      centerBgRect();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Adiciona Transformer de seleção
  useEffect(() => {
    const tr = new Konva.Transformer();
    setTransformer(tr);
    bgLayer.add(tr);

    const selectionRectangle = new Konva.Rect({
      fill: "rgba(0,0,255,0.2)",
      visible: false,
      listening: false,
    });
    bgLayer.add(selectionRectangle);

    let x1: number, y1: number, x2: number, y2: number;
    let selecting = false;

    if (stage && cursorState === "selecting") {
      // Início da seleção (mouse ou toque)
      const startSelection = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target.attrs.id != "selectable") return;
        e.evt.preventDefault();
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;

        if (metaPressed) { return }

        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          x1 = pointerPos.x - stage.x();
          y1 = pointerPos.y - stage.y();
          x2 = x1;
          y2 = y1;

          selectionRectangle.width(0);
          selectionRectangle.height(0);
          selectionRectangle.visible(true);
          selecting = true;
        }

        stage.on("mousemove touchmove", updateSelection);
        stage.on("mouseup touchend", endSelection);
      };

      // Durante a movimentação do mouse (ou toque)
      const updateSelection = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!selecting) return;
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        if (metaPressed) { return }
        e.evt.preventDefault();

        const pointerPos = stage.getPointerPosition();
        if (pointerPos) {
          x2 = pointerPos.x - stage.x();
          y2 = pointerPos.y - stage.y();
          selectionRectangle.setAttrs({
            x: Math.min(x1, x2),
            y: Math.min(y1, y2),
            width: Math.abs(x2 - x1),
            height: Math.abs(y2 - y1),
          });
        }

      };

      // Quando o mouse ou toque é liberado (fim da seleção)
      const endSelection = (e: Konva.KonvaEventObject<MouseEvent>) => {
        selecting = false;
        if (!selectionRectangle.visible()) return;
        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        if (metaPressed) { return }
        e.evt.preventDefault();

        // Obtenha os shapes que estão dentro do retângulo de seleção
        const shapes = stage.find(".selectable");
        const box = selectionRectangle.getClientRect();
        const selected = shapes.filter((shape) =>
          Konva.Util.haveIntersection(box, shape.getClientRect())
        );

        tr.nodes(selected);
        selectionRectangle.visible(false);
      };

      // Seleção individual com clique
      const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (selectionRectangle.visible()) return;

        if (e.target === stage) {
          tr.nodes([]);
          return;
        }

        if (!e.target.hasName("selectable")) return;

        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = tr.nodes().includes(e.target);

        if (!metaPressed && !isSelected) {
          tr.nodes([e.target]);
        } else if (metaPressed && isSelected) {
          tr.nodes(tr.nodes().filter((node) => node !== e.target));
        } else if (metaPressed && !isSelected) {
          tr.nodes([...tr.nodes(), e.target]);
        }
      };

      // Evento de teclado para exclusão e desmarcação
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Delete" || e.key === "Backspace") {
          addHistory("delete", { nodes: tr.nodes() })
          tr.nodes().forEach((node) => node.remove());
          tr.nodes([]);
          layer.batchDraw();
        }
        if (e.key === "Escape") {
          tr.nodes([]);
        }
      };

      stage.on("mousedown touchstart", startSelection);
      stage.on("click tap", handleClick);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        stage.off("mousedown touchstart", startSelection);
        stage.off("mousemove touchmove", updateSelection);
        stage.off("mouseup touchend", endSelection);
        stage.off("click tap", handleClick);
        document.removeEventListener("keydown", handleKeyDown);

        tr.remove();
        selectionRectangle.remove();
      };
    }
  }, [stage, layer, cursorState]);

  // torna stage arrastável
  useEffect(() => {
    if (stage) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === " ") {
          setCursorState("creating");
          stage.draggable(true);
        }
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === " ") {
          stage.draggable(false);
          selectingCursorState();
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keyup", handleKeyUp);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keyup", handleKeyUp);
      };
    }
  }, [stage, layer, cursorState]);

  // Efeito para controlar a visibilidade da régua
  useEffect(() => {
    if (rulerVisible) {
      addRuler();
    } else {
      stage?.children?.forEach((layer) => {
        if (layer.name() === "ruler-layer") {
          layer.remove();
        }
      });
      stage?.batchDraw();
    }
  }, [rulerVisible, stage?.width(), stage?.height()]);

  const updateCanvasColor = (color: string) => {
    setCanvasColor(color);
    const bgRect = layer.findOne(".background-rect");
    if (bgRect && bgRect instanceof Konva.Rect) {
      bgRect.fill(color);
      layer.batchDraw();
    }
  };

  // Efeito para atualizar a cor do canvas
  useEffect(() => {
    updateCanvasColor(canvasColor);
  }, [canvasColor]);

  // Efeito para atualizar a visibilidade da grade
  useEffect(() => {
    if (gridVisible) {
      addBG();
    }

    if (!gridVisible) {
      stage?.find(".grid-line").forEach((line) => line.hide());
      stage?.batchDraw();
    }
  }, [gridVisible]);

  // Efeito para atualizar o modo de preview
  useEffect(() => {
    transformer?.nodes([]);
    if (previewMode) {
      // Esconde todos os transformers e âncoras
      stage?.find(".transformer").forEach((tr) => tr.hide());
      stage?.find(".anchor").forEach((anchor) => anchor.hide());

      // Esconde as linhas da grade se estiverem visíveis
      if (gridVisible) {
        stage?.find(".grid-line").forEach((line) => line.hide());
      }

      // Esconde a camada de régua se estiver visível
      stage?.children?.forEach((layer) => {
        if (layer.name() === "ruler-layer") {
          layer.hide();
        }
      });

      // Adiciona classe CSS para indicar modo preview
      const container = document.getElementById("stage-container");
      if (container) {
        container.classList.add("preview-mode");
      }
    } else {
      // Mostra todos os transformers e âncoras
      stage?.find(".transformer").forEach((tr) => tr.show());
      stage?.find(".anchor").forEach((anchor) => anchor.show());

      // Mostra as linhas da grade se estiverem visíveis
      if (gridVisible) {
        stage?.find(".grid-line").forEach((line) => line.show());
      }

      // Mostra a camada de régua se estiver visível
      if (rulerVisible) {
        stage?.children?.forEach((layer) => {
          if (layer.name() === "ruler-layer") {
            layer.show();
          }
        });
      }

      // Remove classe CSS do modo preview
      const container = document.getElementById("stage-container");
      if (container) {
        container.classList.remove("preview-mode");
      }
    }

    stage?.batchDraw();
  }, [previewMode, gridVisible, rulerVisible]);

  const addHistory = (action: string, data: any) => {
    history.current = history.current.slice(0, historyStep.current + 1);
    history.current = history.current.concat([{ action, data }])
    historyStep.current += 1

    console.log(history.current, historyStep.current)
  };

  const undo = () => {
    if (historyStep.current === 0) {
      return;
    }
    historyStep.current -= 1;
    const previousAction = history.current[historyStep.current];

    if (previousAction.action === "add") {
      if (previousAction.data instanceof Konva.Group) {
        // Se for um grupo (traço do pincel), remover todo o grupo
        previousAction.data.remove();
      } else {
        previousAction.data.remove();
      }
      layer?.draw();
    }

    if (previousAction.action === "delete") {
      if (Array.isArray(previousAction.data.nodes)) {
        previousAction.data.nodes.forEach((node: Konva.Node) => {
          layer?.add(node);
          layer?.draw();
        });
      }
    }

    if (previousAction.action === "movement") {
      previousAction.data.forEach((node: any) => {
        const coords = node.coords;
        const konvaImage = node.konvaImage;
        konvaImage.x(coords.x);
        konvaImage.y(coords.y);
      });
    }
  };

  const redo = () => {
    if (historyStep.current === history.current.length) {
      return;
    }
    const nextAction = history.current[historyStep.current];
    historyStep.current += 1;

    const shape = nextAction.data;
    if (nextAction.action === "add") {
      layer.add(shape)
      layer.draw();
    }

    if (nextAction.action === "delete") {
      nextAction.data.nodes.forEach(node => node.remove())
    };

    if (nextAction.action === "movement") {
      nextAction.data.forEach(node => {
        const coords = node.coords
        const konvaImage = node.konvaImage
        konvaImage.x(coords.end_x)
        konvaImage.y(coords.end_y)
      })
    };
  };

  // Funções internas que realizam as operações sem mostrar notificações
  const handleCopyInternal = () => {
    const nodes = transformer?.nodes();
    if (nodes && nodes.length > 0) {
      setClipboard(nodes[0].clone());
      return true;
    }
    return false;
  };

  const handleCutInternal = () => {
    const nodes = transformer?.nodes();
    if (nodes && nodes.length > 0 && !isLocked) {
      setClipboard(nodes[0].clone());
      nodes[0].remove();
      layer.draw();
      return true;
    }
    return false;
  };

  const handlePasteInternal = () => {
    if (clipboard && layer) {
      const clone = clipboard[0].clone();
      
      // Deslocar a posição para ficar visível que é um novo item
      clone.x(clone.x() + 20);
      clone.y(clone.y() + 20);
      
      // Adicionar à camada
      layer.add(clone);
      
      // Selecionar o item colado com o transformer
      if (transformer) {
        transformer.nodes([clone]);
        transformer.moveToTop();
      }
      
      // Adicionar ao histórico
      addHistory("add", clone);
      
      // Renderizar
      layer.batchDraw();
      
      return true;
    }
    return false;
  };

  // Funções para a interface do usuário que chamam as funções internas e mostram notificações
  const handleCopy = () => {
    const nodes = transformer?.nodes();
    if (nodes && nodes.length > 0) {
      // Clonar todos os nós selecionados
      const clonedNodes = nodes.map(node => node.clone());
      setClipboard(clonedNodes);
      
      showNotification(
        nodes.length === 1 
          ? t('notifications.itemCopied')
          : t('notifications.itemsCopied', { count: nodes.length }),
        "success"
      );
    } else {
      showNotification(t('notifications.noItemSelected'), "error");
    }
  };

  const handleCut = () => {
    const nodes = transformer?.nodes();
    if (nodes && nodes.length > 0 && !isLocked) {
      // Clonar todos os nós selecionados antes de removê-los
      const clonedNodes = nodes.map(node => node.clone());
      setClipboard(clonedNodes);
      
      // Remover os nós originais
      nodes.forEach(node => node.remove());
      layer.draw();
      
      showNotification(
        nodes.length === 1 
          ? t('notifications.itemCut')
          : t('notifications.itemsCut', { count: nodes.length }),
        "success"
      );
    } else if (isLocked) {
      showNotification(t('notifications.cannotCutLocked'), "error");
    } else {
      showNotification(t('notifications.noItemToCut'), "error");
    }
  };

  const handlePaste = () => {
    if (clipboard.length > 0 && layer) {
      // Clonar todos os itens do clipboard
      const clonedNodes = clipboard.map(node => {
        const clone = node.clone();
        // Deslocar cada item clonado
        clone.x(clone.x() + 20);
        clone.y(clone.y() + 20);
        return clone;
      });
      
      // Adicionar todos os clones à camada
      clonedNodes.forEach(clone => {
        layer.add(clone);
      });
      
      // Selecionar todos os itens colados
      if (transformer) {
        transformer.nodes(clonedNodes);
        transformer.moveToTop();
      }
      
      // Adicionar ao histórico como um grupo de ações
      addHistory("add", clonedNodes);
      
      layer.draw();
      
      showNotification(
        clonedNodes.length === 1 
          ? t('notifications.itemPasted')
          : t('notifications.itemsPasted', { count: clonedNodes.length }),
        "success"
      );
    } else {
      showNotification(t('notifications.nothingToPaste'), "info");
    }
  };

  const handleFlipHorizontal = () => {
    transformer?.nodes().forEach((selectedNode) => {
      if (selectedNode && !isLocked) {
        selectedNode.scaleX(-selectedNode.scaleX());
        layer.draw();
      }
    });
  };

  const handleFlipVertical = () => {
    transformer?.nodes().forEach((selectedNode) => {
      if (selectedNode && !isLocked) {
        selectedNode.scaleY(-selectedNode.scaleY());
        layer.draw();
      }
    });
  };

  const handleBringForward = () => {
    transformer?.nodes().forEach((selectedNode) => {
      if (selectedNode && !isLocked) {
        selectedNode.moveUp();
        layer.draw();
      }
    });
  };

  const handleSendBackward = () => {
    transformer?.nodes().forEach((selectedNode) => {
      if (selectedNode && !isLocked) {
        selectedNode.moveDown();
        layer.draw();
      }
    });
  };

  const handleLock = () => {
    setIsLocked(!isLocked);
    transformer?.nodes().forEach((selectedNode) => {
      if (selectedNode) {
        selectedNode.draggable(!isLocked);
        layer.draw();
      }
    });
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleOpacityChange = (value: number) => {
    setOpacity(value);
    transformer?.nodes().forEach((selectedNode) => {
      if (selectedNode && !isLocked) {
        selectedNode.opacity(value / 100);
        layer.draw();
      }
    });
  };

  const handleCrop = () => {
    transformer?.nodes().forEach((selectedNode) => {
      if (!selectedNode || !stage || isLocked) return;

      if (isCropping) {
        // Finalizar o recorte
        finishCrop();
        return;
      }

      // Iniciar o recorte
      setIsCropping(true);

      // Remover todos os transformers existentes antes de iniciar o recorte
      stage.find("Transformer").forEach((tr) => {
        tr.remove();
      });

      // Obter a posição e tamanho do nó selecionado
      const nodeRect = selectedNode.getClientRect();

      // Criar retângulo de recorte
      const rect = new Konva.Rect({
        x: nodeRect.x,
        y: nodeRect.y,
        width: nodeRect.width,
        height: nodeRect.height,
        stroke: "#0066cc",
        strokeWidth: 2,
        dash: [5, 5],
        fill: "rgba(0, 102, 204, 0.1)",
        draggable: true,
        name: "crop-rect",
      });

      // Adicionar transformador ao retângulo de recorte
      const transformer = new Konva.Transformer({
        nodes: [rect],
        rotateEnabled: false,
        enabledAnchors: [
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ],
        borderStroke: "#0066cc",
        anchorStroke: "#0066cc",
        anchorFill: "#ffffff",
        anchorSize: 8,
        borderStrokeWidth: 1,
        name: "crop-transformer",
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
        },
      });

      layer.add(rect);
      layer.add(transformer);
      layer.draw();

      setCropRect(rect);
    });
  };

  const finishCrop = () => {
    transformer?.nodes().forEach((selectedNode) => {
      if (!selectedNode || !cropRect || !stage) return;

      // Obter a posição e tamanho do retângulo de recorte
      const cropBox = cropRect.getClientRect();

      // Verificar se o n�� selecionado é uma imagem
      if (selectedNode.className === "Image") {
        const image = selectedNode as Konva.Image;
        const imageObj = image.image();

        // Criar um canvas temporário para o recorte
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

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
          const scaleX =
            imageObj.naturalWidth / (image.width() * image.scaleX());
          const scaleY =
            imageObj.naturalHeight / (image.height() * image.scaleY());

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
              container: document.createElement("div"),
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
              pixelRatio: 2,
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
                y: cropBox.y,
              });

              // Atualizar o histórico

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
              cropX,
              cropY,
              cropWidth,
              cropHeight,
              0,
              0,
              cropWidth,
              cropHeight
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
                y: cropBox.y,
              });

              // Atualizar o histórico

              // Recriar o transformer para a imagem recortada
              createNewTransformer(image);
            };
            newImage.src = canvas.toDataURL();
          }
        } catch (error) {
          console.error("Erro ao recortar imagem:", error);
          cleanupCrop();
        }
      } else if (selectedNode.nodeType === "Group") {
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
            y: newY,
          });

          // Encontrar o retângulo dentro do grupo (para caixas de texto)
          const rect = group.findOne("Rect") as Konva.Rect;
          if (rect) {
            // Redimensionar o retângulo
            rect.width(cropBox.width / group.scaleX());
            rect.height(cropBox.height / group.scaleY());
          }

          // Encontrar o texto dentro do grupo
          const text = group.findOne("Text") as Konva.Text;
          if (text) {
            // Redimensionar o texto
            text.width(cropBox.width / group.scaleX());
            text.height(cropBox.height / group.scaleY());
          }

          // Atualizar o histórico

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
    });
  };

  // Função para criar um novo transformer após o recorte
  const createNewTransformer = (node: Konva.Node) => {
    // Garantir que o nó ainda existe na camada
    if (!node || !node.getStage()) return;

    // Criar um novo transformer
    const newTransformer = new Konva.Transformer({
      nodes: [node],
      rotateEnabled: true,
      enabledAnchors: ["top-left", "top-right", "bottom-left", "bottom-right"],
      borderStroke: "#0066cc",
      anchorStroke: "#0066cc",
      anchorFill: "#ffffff",
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
    stage.find(".crop-rect").forEach((node) => {
      node.remove();
    });

    // Remover todos os transformers de recorte
    stage.find(".crop-transformer").forEach((tr) => {
      tr.remove();
    });

    // Remover todos os transformers regulares para evitar duplicatas
    stage.find("Transformer").forEach((tr) => {
      if (tr.name() !== "crop-transformer") {
        tr.remove();
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
      if (e.key === "Escape" && isCropping) {
        cleanupCrop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCropping]);

  const handleZoom = (direction: "in" | "out") => {
    if (!layer) return;
    const newScale = direction === "in" ? scale * 1.2 : scale / 1.2;
    setScale(newScale);
    layer.scale({ x: newScale, y: newScale });
    layer.batchDraw();
  };

  const handleZoomChange = (newScale: number) => {
    if (!layer) return;
    setScale(newScale);
    layer.scale({ x: newScale, y: newScale });
    layer.batchDraw();
  };

  const addRuler = () => {
    if (!stage || !rulerVisible) return;

    // Remove existing ruler layer if any
    stage.children?.forEach((layer) => {
      if (layer.name() === "ruler-layer") {
        layer.remove();
      }
    });

    const rulerLayer = new Konva.Layer({ name: "ruler-layer" });

    // Horizontal ruler
    const hRuler = new Konva.Line({
      points: [0, 20, stage.width(), 20],
      stroke: "#666",
      strokeWidth: 1,
    });

    // Vertical ruler
    const vRuler = new Konva.Line({
      points: [20, 0, 20, stage.height()],
      stroke: "#666",
      strokeWidth: 1,
    });

    // Add ruler markings
    for (let i = 0; i < stage.width(); i += 50) {
      const mark = new Konva.Line({
        points: [i, 15, i, 25],
        stroke: "#666",
        strokeWidth: 1,
      });
      const text = new Konva.Text({
        x: i - 10,
        y: 0,
        text: i.toString(),
        fontSize: 10,
        fill: "#666",
      });
      rulerLayer.add(mark);
      rulerLayer.add(text);
    }

    for (let i = 0; i < stage.height(); i += 50) {
      const mark = new Konva.Line({
        points: [15, i, 25, i],
        stroke: "#666",
        strokeWidth: 1,
      });
      const text = new Konva.Text({
        x: 0,
        y: i - 5,
        text: i.toString(),
        fontSize: 10,
        fill: "#666",
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
      "White Pulp",
      "Red Pulp",
      "Intestinal Villus",
      "Epidermal Ridge",
      "Nephron",
      "Thymus Lobule",
      "Renal Corpuscle",
      "Prostate Glandular Acinus",
      "Liver Lobule",
      "Crypt of Lieberkuhn",
    ];

    // Verifica se o arquivo atual é um dos arquivos grandes
    const isLargeFile = largeFiles.some((name) => svg.includes(name));

    // Mostrar um indicador de carregamento
    if (isLargeFile) {
      // Criar um texto de carregamento temporário
      const loadingText = new Konva.Text({
        x: x,
        y: y,
        text: t('notifications.loadingSvg'),
        fontSize: 14,
        fill: "#333",
        padding: 10,
        backgroundColor: "#f0f0f0",
        cornerRadius: 5,
      });
      layer.add(loadingText);
      layer.draw();

      // Carregar a imagem em um setTimeout para não bloquear a UI
      setTimeout(() => {
        const image = new window.Image();
        image.onload = () => {
          // Remover o texto de carregamento
          loadingText.remove();

          // Criar a imagem Konva
          const konvaImage = new Konva.Image({
            x: x,
            y: y,
            name: "selectable",
            image: image,
            width: 100, // Tamanho inicial maior para SVGs complexos
            height: 100,
            draggable: true,
          });


          layer.add(konvaImage);
          layer.draw();
          addHistory("add", { konvaImage, src: svg });
        };

        image.onerror = () => {
          // Em caso de erro, mostrar uma mensagem
          loadingText.text(t('notifications.errorLoadingSvg'));
          loadingText.fill("red");
          layer.draw();

          // Remover a mensagem após alguns segundos
          setTimeout(() => {
            loadingText.remove();
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
          name: "selectable",
          height: 50,
          draggable: true,
        });

        let coords: { x: number, y: number, end_x: number, end_y: number }

        konvaImage.on("dragstart", () => {
          coords = {
            x: konvaImage.x(),
            y: konvaImage.y(),
            end_x: konvaImage.x(),
            end_y: konvaImage.y()
          }

        }
        )

        konvaImage.on("dragend", () => {
          coords = {
            ...coords,
            end_x: konvaImage.x(),
            end_y: konvaImage.y()
          }
          addHistory("movement", [{ konvaImage, coords }])
        }
        )


        layer.add(konvaImage);
        layer.draw();
        addHistory("add", konvaImage);
      };
      image.src = svg;
    }
  };

  const handleShapeClick = (shapeId: string) => {
    const position = { x: 100, y: 100 };
    // Procurar o item selecionado em todas as categorias
    let selectedItem = null;

    for (const category in iconData) {
      const categoryItems = iconData[category];

      // Verificar se a categoria tem subcategorias
      if (
        categoryItems &&
        typeof categoryItems === "object" &&
        !Array.isArray(categoryItems)
      ) {
        // Procurar em subcategorias
        for (const subcategory in categoryItems) {
          const subcategoryItems = categoryItems[subcategory] as IconItem[];
          const found = subcategoryItems.find((item) => item.id === shapeId);
          if (found) {
            selectedItem = found;
            break;
          }
        }
      } else if (Array.isArray(categoryItems)) {
        // Procurar em categorias sem subcategorias
        const found = categoryItems.find((item) => item.id === shapeId);
        if (found) {
          selectedItem = found;
          break;
        }
      }

      if (selectedItem) break;
    }

    if (selectedItem) {
      addSvg(position.x, position.y, selectedItem.url);
    }
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
          if (
            categoryItems &&
            typeof categoryItems === "object" &&
            !Array.isArray(categoryItems)
          ) {
            // Procurar em subcategorias
            for (const subcategory in categoryItems) {
              const subcategoryItems = categoryItems[subcategory] as IconItem[];
              const found = subcategoryItems.find(
                (item) => item.id === selectedShape
              );
              if (found) {
                selectedItem = found;
                break;
              }
            }
          } else if (Array.isArray(categoryItems)) {
            // Procurar em categorias sem subcategorias
            const found = categoryItems.find(
              (item) => item.id === selectedShape
            );
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
    if (!layer || !stage) return;
    if (gridVisible) {
      // Criar linhas verticais
      for (let i = 0; i < stage.width(); i += 20) {
        const line = new Konva.Line({
          points: [i, 0, i, stage.height()],
          stroke: "#f0f0f0",
          strokeWidth: 1,
          name: "grid-line",
        });
        layer.add(line);
      }

      // Criar linhas horizontais
      for (let i = 0; i < stage.height(); i += 20) {
        const line = new Konva.Line({
          points: [0, i, stage.width(), i],
          stroke: "#f0f0f0",
          strokeWidth: 1,
          name: "grid-line",
        });
        layer.add(line);
      }
    }

    layer.batchDraw();
    layer.batchDraw();
  };

  const handleSaveClick = () => {
    setPreviewMode(true);
    layer?.scale({ x: 1, y: 1 });
    setScale(1);
    setTimeout(() => {
      const dataURL = layer?.toDataURL({
        pixelRatio: 3,
        x: bgRect.x() + stage.x(),
        y: bgRect.y() + stage.y(),
        width: bgRect.width(),
        height: bgRect.height(),
      });

      if (dataURL) {
        downloadURI(dataURL, "Your-Project-ImunoIcons.png");
      }
    }, 1);
  };

  const addArrow = () => {
    if (stage) {
      // Coordenadas iniciais do ponto de origem da seta
      // Referência para o objeto de seta que será manipulado
      let arrow: Konva.Arrow | null = null;

      // Função para remover os event listeners quando a operação for concluída
      // Cria a seta imediatamente para feedback visual instantâneo
      arrow = new Konva.Arrow({
        points: [100, 100, 200, 100], // Inicialmente, origem e destino são iguais
        pointerLength: 10,
        pointerWidth: 10,
        fill: "#2D3748",
        stroke: "#2D3748",
        strokeWidth: 2,
        draggable: true,
        name: "selectable",
        hitStrokeWidth: 10, // Aumenta a área de clique para melhorar a UX
      });

      // Adiciona a seta à camada e atualiza a visualização
      layer.add(arrow);
      layer.batchDraw();

      //  // Atualiza a seta em tempo real enquanto o usuário move o mouse
      //  stage.on("mousemove", (e) => {
      //    // Só atualiza se uma seta estiver sendo criada
      //    if (arrow) {
      //      const endX = e.evt.offsetX;
      //      const endY = e.evt.offsetY;

      //      // Atualiza os pontos da seta para refletir a posição atual do cursor
      //      arrow.points([startX, startY, endX, endY]);
      //      layer.batchDraw();
      //    }
      //  });

      //    // Finaliza a criação da seta quando o usuário solta o mouse
      //    stage.on("mouseup", (e) => {
      //      if (arrow) {
      //        const endX = e.evt.offsetX;
      //        const endY = e.evt.offsetY;

      //        // Define os pontos finais da seta
      //        arrow.points([startX, startY, endX, endY]);

      //        // Registra a ação no histórico para permitir desfazer/refazer
      //        addHistory("add", arrow);

      //        // Remove os event listeners para evitar vazamentos de memória
      //        cleanupEventListeners();
      //      }
      //    });
    }
  };

  const addRectWithText = () => {
    setCursorState("addingText");
    console.log(cursorState);
  };

  useEffect(() => {
    if (stage) {
      let x: number, y: number;
      let textGroup: Konva.Group | null = null;

      const handleMouseDown = (e) => {
        // Ignorar se o clique não foi no palco
        if (cursorState != "addingText") {
          return;
        }
        x = stage.getPointerPosition().x - stage.x();
        y = stage.getPointerPosition().y - stage.y();

        console.log(x, y);

        // Criar o grupo imediatamente para feedback visual
        textGroup = new Konva.Group({
          x: x,
          y: y,
          name: "selectable",
          draggable: true,
          opacity: 0.8, // Inicialmente semi-transparente para indicar que está sendo criado
        });

        // Criar o retângulo de fundo
        const rect = new Konva.Rect({
          width: 200,
          height: 100,
          fill: "#EBF8FF",
          stroke: "#4299E1",
          strokeWidth: 1,
          cornerRadius: 4,
          shadowColor: "rgba(0,0,0,0.1)",
          shadowBlur: 5,
          shadowOffset: { x: 0, y: 2 },
          shadowOpacity: 0.5,
        });

        // Criar o texto com placeholder
        const text = new Konva.Text({
          text: textContent || t('notifications.doubleClickToEdit'),
          fontSize: 14,
          fontFamily: "Inter, sans-serif",
          fill: "#2D3748",
          width: 200,
          padding: 10,
          align: "center",
          verticalAlign: "middle",
          height: 100,
        });

        // Adicionar elementos ao grupo
        textGroup.add(rect);
        textGroup.add(text);

        // Adicionar o grupo à camada
        layer.add(textGroup);
        layer.batchDraw();
      };

      const handleMouseMove = (e) => {
        if (!textGroup) return;

        // Calcular as novas dimensões com base na posição do mouse
        const width = Math.max(100, (stage.getPointerPosition().x - x) - stage.x());
        const height = Math.max(50, (stage.getPointerPosition().y - y) - stage.y());

        // Atualizar o retângulo
        const rect = textGroup.findOne("Rect") as Konva.Rect;
        rect.width(width);
        rect.height(height);

        // Atualizar o texto
        const text = textGroup.findOne("Text") as Konva.Text;
        text.width(width);
        text.height(height);

        layer.batchDraw();
      };

      const handleMouseUp = () => {
        if (!textGroup) return;

        // Finalizar a criação
        textGroup.opacity(1);

        // Configurar o evento de edição de texto
        const text = textGroup.findOne("Text") as Konva.Text;
        const rect = textGroup.findOne("Rect") as Konva.Rect;

        text.on("dblclick", () => {
          // Criar um editor de texto mais amigável
          createTextEditor(text, rect, textGroup!);
        });

        // Limpar os event listeners
        selectingCursorState();
      };

      stage.on("mousedown", handleMouseDown);
      // Permitir redimensionar durante a criação
      stage.on("mousemove", handleMouseMove);
      stage.on("mouseup", handleMouseUp);

      return () => {
        stage.off("mousedown", handleMouseDown);
        stage.off("mousemove", handleMouseMove);
        stage.off("mouseup", handleMouseUp);
      };
    }
  }, [cursorState, stage, layer]);

  // Função para criar um editor de texto mais amigável
  const createTextEditor = (
    textNode: Konva.Text,
    rectNode: Konva.Rect,
    group: Konva.Group
  ) => {
    // Obter a posição absoluta do grupo (não apenas do texto)
    const groupPos = group.getAbsolutePosition();
    const stageContainer = stage?.container();

    if (!stageContainer) return;

    // Calcular a escala atual do palco
    const stageScale = stage!.scaleX();

    // Criar o elemento de textarea
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);

    // Calcular a posição correta considerando a rotação e escala do grupo
    const rotation = group.rotation();

    // Configurar o estilo do textarea para corresponder ao retângulo (não ao texto)
    const areaPosition = {
      x: groupPos.x + stage!.container().offsetLeft,
      y: groupPos.y + stage!.container().offsetTop,
    };

    // Obter as dimensões reais do retângulo
    const width = rectNode.width() * group.scaleX() * stageScale;
    const height = rectNode.height() * group.scaleY() * stageScale;

    // Aplicar estilos ao textarea
    textarea.value = textNode.text();
    textarea.style.position = "absolute";
    textarea.style.top = `${areaPosition.y}px`;
    textarea.style.left = `${areaPosition.x}px`;
    textarea.style.width = `${width}px`;
    textarea.style.height = `${height}px`;
    textarea.style.fontSize = `${textNode.fontSize() * group.scaleY() * stageScale
      }px`;
    textarea.style.border = "1px solid #4299E1";
    textarea.style.padding = `${textNode.padding() * stageScale}px`;
    textarea.style.margin = "0px";
    textarea.style.overflow = "auto";
    textarea.style.background = "#EBF8FF";
    textarea.style.outline = "none";
    textarea.style.resize = "none";
    textarea.style.lineHeight = textNode.lineHeight()
      ? textNode.lineHeight().toString()
      : "1.2";
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.transformOrigin = "left top";
    textarea.style.textAlign = textNode.align();
    textarea.style.color = textNode.fill();
    textarea.style.borderRadius = "4px";
    textarea.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
    textarea.style.zIndex = "1000";

    // Aplicar rotação se necessário
    if (rotation !== 0) {
      textarea.style.transform = `rotate(${rotation}deg)`;
      textarea.style.transformOrigin = "left top";
    }

    // Adicionar classe para estilização adicional
    textarea.className = "konva-text-editor";

    // Focar o textarea
    textarea.focus();

    // Selecionar todo o texto
    textarea.select();

    // Função para aplicar o texto e remover o editor
    const applyTextAndRemove = () => {
      // Verificar se o textarea ainda existe no DOM
      if (!document.body.contains(textarea)) return;

      // Aplicar o texto ao nó
      textNode.text(textarea.value || t('notifications.doubleClickToEdit'));

      // Remover o textarea
      document.body.removeChild(textarea);

      // Atualizar a camada
      layer.draw();

      // Adicionar ao histórico

      // Remover os event listeners
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("keydown", handleEscKey);
      textarea.removeEventListener("keydown", handleEnterKey);
    };

    // Função para lidar com cliques fora do textarea
    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        applyTextAndRemove();
      }
    };

    // Função para lidar com a tecla Enter
    const handleEnterKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        applyTextAndRemove();
      }
    };

    // Função para lidar com a tecla Escape
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        applyTextAndRemove();
      }
    };

    // Adicionar event listeners
    // Usar setTimeout para evitar que o clique atual acione o evento
    setTimeout(() => {
      window.addEventListener("click", handleOutsideClick);
    }, 0);

    window.addEventListener("keydown", handleEscKey);
    textarea.addEventListener("keydown", handleEnterKey);

    // Adicionar evento de blur
    textarea.addEventListener("blur", () => {
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
        "/files/anatomy/HumanLungs0001.svg",
      ];

      try {
        await svgCache.preloadImages(commonSvgs);
      } catch (err) {
        console.warn("Erro ao pré-carregar SVGs:", err);
      }
    };

    preloadCommonSvgs();
  }, []);

  useEffect(() => {
    // Manipulador para eventos de paste do navegador
    const handleSystemPaste = (e: ClipboardEvent) => {
      if (!stage) return;
      
      // Verificar se há imagens na área de transferência
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          // Bloquear a ação padrão do navegador
          e.preventDefault();
          
          // Obter o arquivo de imagem
          const blob = items[i].getAsFile();
          if (!blob) continue;
          
          // Criar URL para o blob
          const url = URL.createObjectURL(blob);
          
          // Carregar a imagem
          const img = new window.Image();
          img.onload = () => {
            // Obter a posição do stage para colocar a imagem no centro
            const stagePos = stage.getPointerPosition() || { x: stage.width() / 2, y: stage.height() / 2 };
            
            // Criar imagem Konva
            const konvaImage = new Konva.Image({
              x: stagePos.x - img.width / 4,  // Dividir por 4 para dimensionar para 50%
              y: stagePos.y - img.height / 4,
              image: img,
              width: img.width / 2,
              height: img.height / 2,
              name: "selectable",
              draggable: true,
            });
            
            // Adicionar à camada
            layer.add(konvaImage);
            
            // Selecionar a imagem recém-adicionada
            if (transformer) {
              transformer.nodes([konvaImage]);
            }
            
            // Adicionar ao histórico
            addHistory("add", konvaImage);
            
            layer.draw();
            
            // Limpar o URL do objeto
            URL.revokeObjectURL(url);
          };
          
          img.src = url;
        }
      }
    };
    
    // Adicionar evento de paste
    document.addEventListener('paste', handleSystemPaste);
    
    return () => {
      // Remover evento ao desmontar
      document.removeEventListener('paste', handleSystemPaste);
    };
  }, [stage, layer, transformer]);

  // Função para adicionar notificação
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
  };

  // Função para remover notificação
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Função para adicionar imagem ao canvas
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const url = event.target?.result as string;

      if (!stage || !layer) {
        showNotification(t('notifications.errorLoadingImage'), 'error');
        return;
      }

      const img = new window.Image();

      img.onload = () => {
        // Adicionar imagem ao canvas
        const konvaImage = new Konva.Image({
          image: img,
          x: 100,
          y: 100,
          width: Math.min(200, img.naturalWidth),
          height: Math.min(200, img.naturalHeight),
          draggable: true,
          name: 'selectable',
        });

        layer.add(konvaImage);

        // Selecionar a imagem recém-adicionada
        if (transformer) {
          transformer.nodes([konvaImage]);
          transformer.moveToTop();
        }

        // Adicionar ao histórico
        addHistory('add', konvaImage);

        layer.batchDraw();

        showNotification(t('notifications.imageUploaded'), 'success');
      };

      img.onerror = () => {
        showNotification(t('notifications.errorLoadingImage'), 'error');
      };

      img.src = url;
    };

    reader.onerror = () => {
      showNotification(t('notifications.errorLoadingImage'), 'error');
    };

    reader.readAsDataURL(file);
  };

  // Adicione estas refs após a definição das funções
  const handleCopyRef = useRef(handleCopy);
  const handleCutRef = useRef(handleCut);
  const handlePasteRef = useRef(handlePaste);

  // Atualize as funções quando elas mudarem
  useEffect(() => {
    handleCopyRef.current = handleCopy;
    handleCutRef.current = handleCut;
    handlePasteRef.current = handlePaste;
  }, [handleCopy, handleCut, handlePaste]);

  // Use as refs no useEffect dos atalhos
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Ignorar eventos em campos de texto
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      
      // Verificar atalhos do clipboard
      if (e.ctrlKey) {
        if (e.key === 'c') {
          e.preventDefault();
          handleCopyRef.current();
        } else if (e.key === 'x') {
          e.preventDefault();
          handleCutRef.current();
        } else if (e.key === 'v') {
          e.preventDefault();
          handlePasteRef.current();
        }
      }
    };
    
    // Adicionar listener
    window.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, []);  // Sem dependências

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
  };

  const handleBrushColorChange = (color: string) => {
    setBrushColor(color);
  };

  const toggleBrushMode = () => {
    setIsBrushMode(!isBrushMode);
    setCursorState(isBrushMode ? "selecting" : "drawing");
    
    // Atualizar o cursor do stage
    if (stage) {
      const container = stage.container();
      if (container) {
        if (cursorState === "drawing") {
          container.style.cursor = "default";
        } else {
          // Ajustar o ponto de referência um pouco mais para a esquerda (x: 10, y: 2)
          container.style.cursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 19l7-7 3 3-7 7-3-3z\"/><path d=\"M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\"/><path d=\"M2 2l7.586 7.586\"/><circle cx=\"11\" cy=\"11\" r=\"2\"/></svg>') 10 2, auto";
        }
      }
    }
  };

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (cursorState !== "drawing") return;
    
    setIsDrawing(true);
    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const newLine = new Konva.Line({
      stroke: brushColor,
      strokeWidth: brushSize,
      globalCompositeOperation: isBrushMode ? 'source-over' : 'multiply',
      lineCap: 'round',
      lineJoin: 'round',
      points: [pos.x, pos.y],
      name: "selectable",
    });

    layer?.add(newLine);
    setLastLine(newLine);
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !lastLine) return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const newPoints = lastLine.points().concat([pos.x, pos.y]);
    lastLine.points(newPoints);
    layer?.batchDraw();
  };

  const handleMouseUp = () => {
    if (!isDrawing || !lastLine) return;
    
    setIsDrawing(false);
    addHistory("add", lastLine);
    setLastLine(null);
  };

  useEffect(() => {
    if (!stage) return;

    stage.on('mousedown', handleMouseDown);
    stage.on('mousemove', handleMouseMove);
    stage.on('mouseup', handleMouseUp);

    return () => {
      stage.off('mousedown', handleMouseDown);
      stage.off('mousemove', handleMouseMove);
      stage.off('mouseup', handleMouseUp);
    };
  }, [stage, isDrawing, lastLine, brushColor, brushSize, isBrushMode]);

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
          onBrushSizeChange={handleBrushSizeChange}
          onBrushColorChange={handleBrushColorChange}
          onToggleBrushMode={toggleBrushMode}
          opacity={opacity}
          onOpacityChange={handleOpacityChange}
          isLocked={isLocked}
          isFavorite={isFavorite}
          cursorState={cursorState}
          onToggleAI={handleToggleAI}
          isAIOpen={isAIOpen}
          onImageUpload={handleImageUpload}
        />
        <div
          className={`flex-1 bg-gray-100 ${previewMode ? "preview-mode" : ""}`}
          id="stage-container"
        >
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
      
      {/* Notificações */}
      {notifications.map((notification, index) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
          index={index}
        />
      ))}

      {/* AI Assistant */}
      <AIAssistant
        isOpen={isAIOpen}
        onClose={handleCloseAI}
        onIconSuggestion={handleAIIconSuggestion}
        onAddText={handleAIAddText}
        isMinimized={isAIMinimized}
        onToggleMinimize={handleToggleAIMinimize}
      />
    </div>
  );
}

export default App;
