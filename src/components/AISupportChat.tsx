import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, Minimize2, RotateCcw, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/use-toast';
import { streamChatResponse, generateMessageId, type Message } from '@/utils/aiChatStream';

interface AISupportChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISupportChat = ({ isOpen, onClose }: AISupportChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateMessageId(),
      role: 'assistant',
      content: "👋 Hi! I'm your MentSol Admin Support AI. I can help you with:\n\n📅 **Session Management**\n• Reschedule or cancel sessions\n• Report session issues\n• Payment & booking queries\n• Technical difficulties\n\n🎓 **Academic Support**\n• JEE/NEET preparation tips\n• Study techniques\n• Career guidance\n\n🚀 **Platform Support**\n• Booking mentors\n• App navigation\n• Finding mentors\n\nFor urgent issues, contact admin:\n📧 mentsol123@gmail.com\n📱 +91 9699938263\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && !isMinimized && scrollAreaRef.current) {
      setTimeout(() => {
        const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }, 100);
    }
  }, [messages, isOpen, isMinimized]);

  useEffect(() => {
    if (isOpen && !isMinimized && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const assistantMessageId = generateMessageId();
    let assistantContent = '';

    setMessages(prev => [
      ...prev,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      },
    ]);

    await streamChatResponse({
      messages: [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content,
      })),
      onToken: (token: string) => {
        assistantContent += token;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMessageId
              ? { ...m, content: assistantContent }
              : m
          )
        );
      },
      onComplete: () => {
        setIsLoading(false);
      },
      onError: (error: string) => {
        setIsLoading(false);
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (question: string) => {
    setInputText(question);
    textareaRef.current?.focus();
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: generateMessageId(),
        role: 'assistant',
        content: "👋 Hi! I'm your MentSol Admin Support AI. I can help you with:\n\n📅 **Session Management**\n• Reschedule or cancel sessions\n• Report session issues\n• Payment & booking queries\n• Technical difficulties\n\n🎓 **Academic Support**\n• JEE/NEET preparation tips\n• Study techniques\n• Career guidance\n\n🚀 **Platform Support**\n• Booking mentors\n• App navigation\n• Finding mentors\n\nFor urgent issues, contact admin:\n📧 mentsol123@gmail.com\n📱 +91 9699938263\n\nHow can I help you today?",
        timestamp: new Date(),
      },
    ]);
    toast({
      title: "Chat cleared",
      description: "Conversation has been reset",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col">
      {/* Chat Window */}
      <div
        className={`bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl transition-all duration-300 ${
          isMinimized ? 'h-14 w-80' : 'h-[600px] w-96'
        } flex flex-col overflow-hidden`}
        style={{
          boxShadow: '0 20px 60px -15px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="h-6 w-6 text-primary" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">MentSol Admin Support</h3>
              <p className="text-xs text-muted-foreground">AI-powered help</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleClearChat}
              title="Clear conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        {!isMinimized && (
          <>
            <ScrollArea className="flex-1 px-4 py-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <span
                        className={`text-xs mt-1 block ${
                          message.role === 'user'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-4 py-3 max-w-[85%]">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick Actions */}
            {messages.length === 1 && !isLoading && (
              <div className="px-4 py-2 border-t border-border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleQuickAction('I need to reschedule my session')}
                  >
                    📅 Reschedule Session
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleQuickAction('Give me JEE preparation tips')}
                  >
                    📚 JEE Tips
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleQuickAction('How do I book a session?')}
                  >
                    📅 Book Session
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleQuickAction('Career guidance after 12th')}
                  >
                    🎯 Career Advice
                  </Button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="px-4 py-3 border-t border-border bg-background">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message... (Enter to send)"
                  className="min-h-[44px] max-h-32 resize-none"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!inputText.trim() || isLoading}
                  size="icon"
                  className="h-[44px] w-[44px] shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Floating Button Badge */}
      <div className="absolute -top-2 -left-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
        AI
      </div>
    </div>
  );
};

export default AISupportChat;
