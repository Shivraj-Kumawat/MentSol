import { safeFetch } from '@/AppStabilityHelpers';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface StreamChatParams {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  onToken: (token: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

export const streamChatResponse = async ({
  messages,
  onToken,
  onComplete,
  onError,
}: StreamChatParams) => {
  const CHAT_URL = `https://rutxafzivumqnyxqtdsa.supabase.co/functions/v1/ai-support-chat`;

  // Get the user's access token for authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    onError('Please sign in to use AI support chat');
    return;
  }

  try {
    // Note: For streaming responses, we need to use fetch directly since safeFetch
    // reads the entire response body. We keep the error handling pattern from safeFetch.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s for streaming
    
    let response: Response;
    try {
      response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (fetchError) {
      clearTimeout(timeout);
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          onError('Request timeout. Please try again.');
          return;
        }
        onError(`Connection error: ${fetchError.message}`);
        return;
      }
      onError('Connection error. Please check your network.');
      return;
    }

    if (!response.ok) {
      if (response.status === 429) {
        onError('Rate limit exceeded. Please try again in a moment.');
        return;
      }
      if (response.status === 402) {
        onError('Service temporarily unavailable. Please add credits to continue.');
        return;
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      onError(errorData.error || 'Failed to get AI response');
      return;
    }

    if (!response.body) {
      onError('No response body received');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        let line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) {
          line = line.slice(0, -1);
        }

        if (line.startsWith(':') || line.trim() === '') {
          continue;
        }

        if (!line.startsWith('data: ')) {
          continue;
        }

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          onComplete();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            onToken(content);
          }
        } catch (e) {
          // Incomplete JSON, put it back in buffer
          buffer = line + '\n' + buffer;
          break;
        }
      }
    }

    // Final flush
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (let raw of lines) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            onToken(content);
          }
        } catch {
          // Ignore partial leftovers
        }
      }
    }

    onComplete();
  } catch (error) {
    console.error('Stream error:', error);
    onError(error instanceof Error ? error.message : 'Connection error');
  }
};

export const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
