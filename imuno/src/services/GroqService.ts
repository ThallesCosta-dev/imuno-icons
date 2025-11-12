interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

class OpenRouterService {
  private apiKey: string;
  private apiUrl = '/api/chat';
  private conversationHistory: AIMessage[] = [];

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    
    // Initialize system message for context
    this.conversationHistory.push({
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant for BioFlow, a platform for creating medical diagrams focused on immunology, cell biology, and related scientific topics. I can help you understand concepts about cells, viruses, antibodies, anatomical structures, and how to use this application to create diagrams. What would you like to know?'
    });
  }

  async sendMessage(userMessage: string): Promise<string> {
    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    const systemPrompt = `You are an intelligent assistant for BioFlow, a specialized medical diagram creation platform. Your expertise includes:

1. **Application Help**: Guide users on how to use BioFlow features like uploading images, adding icons from categories (Immunology, Anatomy, Cells and Organelles, Viruses, Proteins, Equipment), creating diagrams, and exporting their work.

2. **Immunology & Biology**: Provide accurate, helpful information about:
   - Immune system components and functions
   - Cell types (immune cells, stem cells, and other biological cells)
   - Viruses and viral structures
   - Antibodies and immunological concepts
   - Organ systems and anatomical structures
   - Proteins and their roles
   - Laboratory equipment used in immunology research

3. **Diagram Creation**: Offer suggestions for creating effective medical diagrams, such as:
   - Appropriate icon selection for different concepts
   - Layout and composition tips
   - Labeling strategies
   - Best practices for scientific visualization

Always be accurate, educational, and context-aware. Focus on helping users create better diagrams and understand the biological concepts they're visualizing. If asked about topics unrelated to the application or scientific/medical education, politely redirect the conversation back to topics relevant to immunology, cell biology, or using BioFlow.`;

    try {
      // Validate API key
      if (!this.apiKey) {
        throw new Error('OpenRouter API key is not configured');
      }

      const requestBody = {
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...this.conversationHistory
        ],
        max_tokens: 1024,
        temperature: 0.7,
        apiKey: this.apiKey,
      };

      console.log('Sending message to OpenRouter via backend');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        // Read body only once to avoid "body stream already read" errors
        const rawBody = await response.text();
        let errorMessage = response.statusText;
        try {
          const parsed = rawBody ? JSON.parse(rawBody) : null;
          errorMessage = parsed?.error?.message || parsed?.message || response.statusText;
        } catch {
          errorMessage = rawBody || response.statusText;
        }
        throw new Error(`API error (${response.status}): ${errorMessage}`);
      }

      const data: AIResponse = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from API');
      }

      let assistantMessage = data.choices[0].message.content;
      
      // Remove special tokens that might appear in the response
      assistantMessage = assistantMessage.replace(/<｜begin▁of▁sentence｜>/g, '').trim();

      // Add assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage
      });

      // Keep conversation history manageable (last 20 messages)
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

      return assistantMessage;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error calling OpenRouter:', errorMsg);
      console.error('Full error:', error);
      
      // Remove the failed user message from history on error
      if (this.conversationHistory.length > 0) {
        this.conversationHistory.pop();
      }
      
      throw new Error(`Failed to get response from AI: ${errorMsg}`);
    }
  }

  clearHistory(): void {
    this.conversationHistory = [
      {
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant for BioFlow, a platform for creating medical diagrams focused on immunology, cell biology, and related scientific topics. I can help you understand concepts about cells, viruses, antibodies, anatomical structures, and how to use this application to create diagrams. What would you like to know?'
      }
    ];
  }
}

export default OpenRouterService;
