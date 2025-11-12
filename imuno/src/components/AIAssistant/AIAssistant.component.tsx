import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Search, Lightbulb, X, Minimize2, Maximize2, AlertCircle, Loader } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import iconData from '../../data/iconData';
import OpenRouterService from '../../services/GroqService';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onIconSuggestion: (iconId: string) => void;
  onAddText: (text: string) => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: IconSuggestion[];
  error?: boolean;
}

interface IconSuggestion {
  id: string;
  name: string;
  category: string;
  relevance: number;
}

// Utilitário para aplicar negrito com **texto** sem usar dangerouslySetInnerHTML
const applyBoldFormatting = (text: string): (string | JSX.Element)[] => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      const inner = part.slice(2, -2);
      return (
        <strong key={`b-${index}`}>{inner}</strong>
      );
    }
    return part;
  });
};

// Normaliza conteúdo para quebrar listas numeradas inline (" 1. ") em novas linhas
const normalizeInlineNumberedLists = (content: string): string => {
  return content.replace(/\s(\d+\.)\s/g, '\n$1 ');
};

// Renderiza o conteúdo em blocos: parágrafos, listas com "- " e listas numeradas "1. "
const renderMessageContent = (rawContent: string): JSX.Element => {
  const normalized = normalizeInlineNumberedLists(rawContent || '');
  const blocks = normalized.trim().split(/\n\s*\n/);

  const renderParagraph = (paragraph: string, key: number) => (
    <p key={`p-${key}`} className="whitespace-pre-wrap">
      {applyBoldFormatting(paragraph)}
    </p>
  );

  const renderUnorderedList = (lines: string[], key: number) => (
    <ul key={`ul-${key}`} className="list-none pl-5 space-y-1">
      {lines.map((line, idx) => {
        const cleaned = line.replace(/^\-\s*/, '');
        return (
          <li key={`ul-li-${idx}`} className="flex gap-2">
            <span className="text-gray-500">-</span>
            <span>{applyBoldFormatting(cleaned)}</span>
          </li>
        );
      })}
    </ul>
  );

  const renderOrderedList = (lines: string[], key: number) => (
    <ol key={`ol-${key}`} className="list-decimal pl-5 space-y-1">
      {lines.map((line, idx) => (
        <li key={`ol-li-${idx}`}>{applyBoldFormatting(line.replace(/^\d+\.\s*/, ''))}</li>
      ))}
    </ol>
  );

  return (
    <div className="text-sm leading-6 space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split(/\n/).filter(l => l.trim().length > 0);
        if (lines.length > 0 && lines.every(l => /^\-\s+/.test(l))) {
          return renderUnorderedList(lines, i);
        }
        if (lines.length > 0 && lines.every(l => /^\d+\.\s+/.test(l))) {
          return renderOrderedList(lines, i);
        }
        // Se o bloco tem mistura, tenta dividir listas parciais
        const listLike = lines.filter(l => /^\-\s+|^\d+\.\s+/.test(l));
        if (listLike.length >= 2) {
          const listTypeIsOrdered = listLike.every(l => /^\d+\.\s+/.test(l));
          const listBlock = listLike;
          const otherBlock = lines.filter(l => !listBlock.includes(l)).join('\n');
          return (
            <div key={`mixed-${i}`} className="space-y-2">
              {otherBlock ? renderParagraph(otherBlock, i) : null}
              {listTypeIsOrdered ? renderOrderedList(listBlock, i) : renderUnorderedList(listBlock, i)}
            </div>
          );
        }
        return renderParagraph(lines.join('\n'), i);
      })}
    </div>
  );
};

const AIAssistant: React.FC<AIAssistantProps> = ({
  isOpen,
  onClose,
  onIconSuggestion,
  onAddText,
  isMinimized,
  onToggleMinimize,
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: t('ai.welcomeMessage'),
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openRouterServiceRef = useRef<OpenRouterService | null>(null);

  useEffect(() => {
    const apiKey =
      (import.meta.env as any).VITE_OPENROUTER_API_KEY ||
      (import.meta.env as any).VITE_GROQ_API_KEY ||
      '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';

    openRouterServiceRef.current = new OpenRouterService(apiKey);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const searchIcons = (query: string): IconSuggestion[] => {
    const suggestions: IconSuggestion[] = [];
    const queryLower = String(query || '').toLowerCase();

    Object.keys(iconData || {}).forEach((categoryKey) => {
      const category = String(categoryKey || '');
      const categoryLower = category.toLowerCase();
      const categoryData = (iconData as any)[categoryKey];
      
      if (Array.isArray(categoryData)) {
        categoryData.forEach((item: any) => {
          const itemName = String(item?.name || '').toLowerCase();
          const nameMatch = itemName.includes(queryLower);
          const categoryMatch = categoryLower.includes(queryLower);
          
          if (nameMatch || categoryMatch) {
            suggestions.push({
              id: String(item?.id || ''),
              name: String(item?.name || 'Sem nome'),
              category: category,
              relevance: nameMatch ? 1 : 0.5
            });
          }
        });
      } else if (categoryData && typeof categoryData === 'object') {
        Object.keys(categoryData).forEach((subcategoryKey) => {
          const subcategory = String(subcategoryKey || '');
          const subcategoryLower = subcategory.toLowerCase();
          const subcategoryData = (categoryData as any)[subcategoryKey];
          if (Array.isArray(subcategoryData)) {
            subcategoryData.forEach((item: any) => {
              const itemName = String(item?.name || '').toLowerCase();
              const nameMatch = itemName.includes(queryLower);
              const categoryMatch = categoryLower.includes(queryLower) || subcategoryLower.includes(queryLower);
              
              if (nameMatch || categoryMatch) {
                suggestions.push({
                  id: String(item?.id || ''),
                  name: String(item?.name || 'Sem nome'),
                  category: `${category} > ${subcategory}`,
                  relevance: nameMatch ? 1 : 0.5
                });
              }
            });
          }
        });
      }
    });

    return suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 6);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!openRouterServiceRef.current) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'API key not configured. Please check your environment variables.',
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const messageToSend = inputValue;
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const aiResponse = await openRouterServiceRef.current.sendMessage(messageToSend);
      
      // Search for relevant icons based on the user's message
      const suggestions = searchIcons(messageToSend);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date(),
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        error: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: IconSuggestion) => {
    onIconSuggestion(suggestion.id);
    
    const confirmMessage: Message = {
      id: Date.now().toString(),
      type: 'ai',
      content: t('ai.responses.iconAdded', { name: suggestion.name }),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, confirmMessage]);
  };

  const quickActions = [
    {
      icon: Search,
      label: t('ai.quickActions.findIcons'),
      action: () => setInputValue(t('ai.quickActions.findIconsPrompt'))
    },
    {
      icon: Lightbulb,
      label: t('ai.quickActions.diagramIdeas'),
      action: () => setInputValue(t('ai.quickActions.diagramIdeasPrompt'))
    },
    {
      icon: Sparkles,
      label: t('ai.quickActions.improveDesign'),
      action: () => setInputValue(t('ai.quickActions.improveDesignPrompt'))
    }
  ];

  if (!isOpen) return null;

  return (
    <div className={`fixed bg-white rounded-lg shadow-2xl border border-gray-200 z-50 transition-all duration-300 flex flex-col ${
      isMinimized
        ? 'bottom-4 right-4 w-80 h-16'
        : 'bottom-4 right-4 w-96 max-h-[90vh] max-w-[calc(100vw-24px)] sm:max-w-96 sm:h-[550px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5" />
          <span className="font-medium">{t('ai.assistantTitle')}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleMinimize}
            className="p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Toggle minimize"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Close assistant"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.length === 1 && !isLoading ? (
              <div className="space-y-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={action.action}
                    className="w-full flex items-center gap-3 p-3 text-left bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-purple-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <action.icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.error
                        ? 'bg-red-100 text-red-800 border border-red-300'
                        : message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex gap-2">
                      {message.error && <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                      {renderMessageContent(message.content)}
                    </div>
                    
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium">{t('ai.suggestedIcons')}:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {message.suggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-left p-2 bg-white border border-gray-200 rounded text-xs hover:bg-blue-50 hover:border-blue-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                              <div className="font-medium text-gray-800">{suggestion.name}</div>
                              <div className="text-gray-500 truncate">{suggestion.category}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 rounded-lg p-3 flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <p className="text-sm">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('ai.inputPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistant;
