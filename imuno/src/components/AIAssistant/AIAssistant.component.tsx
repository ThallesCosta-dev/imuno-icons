import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Search, Lightbulb, X, Minimize2, Maximize2 } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';
import iconData from '../../data/iconData';

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
}

interface IconSuggestion {
  id: string;
  name: string;
  category: string;
  relevance: number;
}

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
    const queryLower = query.toLowerCase();

    Object.keys(iconData).forEach(category => {
      const categoryData = iconData[category];
      
      if (Array.isArray(categoryData)) {
        categoryData.forEach(item => {
          const nameMatch = item.name.toLowerCase().includes(queryLower);
          const categoryMatch = category.toLowerCase().includes(queryLower);
          
          if (nameMatch || categoryMatch) {
            suggestions.push({
              id: item.id,
              name: item.name,
              category: category,
              relevance: nameMatch ? 1 : 0.5
            });
          }
        });
      } else {
        Object.keys(categoryData).forEach(subcategory => {
          const subcategoryData = categoryData[subcategory];
          if (Array.isArray(subcategoryData)) {
            subcategoryData.forEach(item => {
              const nameMatch = item.name.toLowerCase().includes(queryLower);
              const categoryMatch = category.toLowerCase().includes(queryLower) || 
                                  subcategory.toLowerCase().includes(queryLower);
              
              if (nameMatch || categoryMatch) {
                suggestions.push({
                  id: item.id,
                  name: item.name,
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

  const generateAIResponse = (userMessage: string): { content: string; suggestions?: IconSuggestion[] } => {
    const messageLower = userMessage.toLowerCase();
    
    // Detectar tipos de perguntas
    if (messageLower.includes('como') && (messageLower.includes('criar') || messageLower.includes('fazer'))) {
      return {
        content: t('ai.responses.howToCreate'),
      };
    }
    
    if (messageLower.includes('célula') || messageLower.includes('cell')) {
      const suggestions = searchIcons('cell');
      return {
        content: t('ai.responses.cellSuggestion'),
        suggestions
      };
    }
    
    if (messageLower.includes('vírus') || messageLower.includes('virus')) {
      const suggestions = searchIcons('virus');
      return {
        content: t('ai.responses.virusSuggestion'),
        suggestions
      };
    }
    
    if (messageLower.includes('anticorpo') || messageLower.includes('antibody') || messageLower.includes('imuno')) {
      const suggestions = searchIcons('antibody');
      return {
        content: t('ai.responses.antibodySuggestion'),
        suggestions
      };
    }
    
    if (messageLower.includes('anatomia') || messageLower.includes('anatomy') || messageLower.includes('órgão')) {
      const suggestions = searchIcons('anatomy');
      return {
        content: t('ai.responses.anatomySuggestion'),
        suggestions
      };
    }
    
    // Busca geral por ícones
    const suggestions = searchIcons(userMessage);
    if (suggestions.length > 0) {
      return {
        content: t('ai.responses.iconSearch', { count: suggestions.length }),
        suggestions
      };
    }
    
    // Resposta padrão
    return {
      content: t('ai.responses.defaultHelp'),
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simular delay da IA
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions,
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
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
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-600 font-medium">{t('ai.suggestedIcons')}:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={suggestion.id}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-left p-2 bg-white border border-gray-200 rounded text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <div className="font-medium text-gray-800">{suggestion.name}</div>
                            <div className="text-gray-500">{suggestion.category}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 border-t border-gray-100">
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0"
                >
                  <action.icon className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('ai.inputPlaceholder')}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
