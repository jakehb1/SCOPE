'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatMessage } from '@/lib/ai-chat';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ElevatedCard from '@/components/shared/ElevatedCard';

export default function MarketChat() {
  const searchParams = useSearchParams();
  const marketQuestion = searchParams.get('market');
  const marketId = searchParams.get('marketId');
  const yesPrice = searchParams.get('yesPrice');
  const volume = searchParams.get('volume');
  
  // Initialize with market context if provided
  const getInitialMessages = (): ChatMessage[] => {
    if (marketQuestion) {
      return [
        {
          role: 'assistant',
          content: "Hi! I'm your prediction market trading advisor. I can help you analyze markets, identify value bets, manage risk, and make informed betting decisions. What would you like help with?",
          timestamp: new Date().toISOString(),
        },
        {
          role: 'user',
          content: `Tell me about this market: ${marketQuestion}${yesPrice ? ` (Current YES price: ${yesPrice}%)` : ''}${volume ? ` (Volume: $${parseFloat(volume).toLocaleString()})` : ''}`,
          timestamp: new Date().toISOString(),
        },
      ];
    }
    return [
      {
        role: 'assistant',
        content: "Hi! I'm your prediction market trading advisor. I can help you analyze markets, identify value bets, manage risk, and make informed betting decisions. What would you like help with?",
        timestamp: new Date().toISOString(),
      },
    ];
  };

  const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessages());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBudget, setUserBudget] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('opus');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-send initial message if market is provided
  const hasAutoSent = useRef(false);
  useEffect(() => {
    if (marketQuestion && messages.length === 2 && !loading && !hasAutoSent.current) {
      hasAutoSent.current = true;
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        handleAutoSend();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [marketQuestion, messages.length, loading]); // Only run when these change
  
  const handleAutoSend = async () => {
    if (messages.length !== 2 || loading) return; // Only auto-send if we have the initial user message
    
    const userMessage = messages[1];
    setLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages,
          includeMarkets: true,
          marketLimit: 50,
          userBudget: userBudget ? parseFloat(userBudget) : undefined,
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: [...messages, userMessage],
          includeMarkets: true,
          marketLimit: 50,
          userBudget: userBudget ? parseFloat(userBudget) : undefined,
        }),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="section-container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-primary-black mb-2">Trading Advisor Chat</h1>
        <p className="text-primary-black opacity-90">Get AI-powered betting advice for prediction markets</p>
      </div>

      {/* Model Selector and Budget Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Model Selector */}
        <ElevatedCard>
          <label htmlFor="model" className="block text-sm font-medium text-primary-black mb-2">
            Model
          </label>
          <select
            id="model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-black focus:border-transparent text-primary-black bg-white shadow-sm"
          >
            <option value="opus">Opus</option>
            <option value="deepseek">DeepSeek</option>
          </select>
        </ElevatedCard>

        {/* Budget Input */}
        <ElevatedCard>
          <label htmlFor="budget" className="block text-sm font-medium text-primary-black mb-2">
            Your Budget (optional - helps with position sizing advice)
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              id="budget"
              value={userBudget}
              onChange={(e) => setUserBudget(e.target.value)}
              min="0"
              step="0.01"
              placeholder="e.g., 500"
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-black focus:border-transparent text-primary-black shadow-sm"
            />
            {userBudget && (
              <button
                onClick={() => setUserBudget('')}
                className="px-4 py-2 bg-gray-100 text-primary-black rounded-xl hover:bg-gray-200 transition-all border border-gray-200"
              >
                Clear
              </button>
            )}
          </div>
        </ElevatedCard>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden" style={{ height: '600px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-black text-primary-offwhite shadow-sm'
                    : 'bg-gray-100 text-primary-black border border-gray-200'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                {message.timestamp && (
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-primary-offwhite opacity-70' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl p-4 flex items-center gap-2 border border-gray-200">
                <LoadingSpinner size="sm" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about markets, betting strategies, risk management..."
              rows={2}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-black focus:border-transparent text-primary-black resize-none bg-white shadow-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-primary-black text-primary-offwhite px-6 py-2 rounded-xl font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px] shadow-sm hover:shadow-md"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                </>
              ) : (
                'Send'
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <p className="text-primary-black text-sm mb-3">Quick questions:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "I have $500 to spend, what should I bet on?",
            "What are the best value bets right now?",
            "Help me understand risk management",
            "Which markets have the best liquidity?",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setInput(suggestion);
                inputRef.current?.focus();
              }}
              className="px-4 py-2 bg-white bg-opacity-20 text-primary-black rounded-full text-sm hover:bg-opacity-30 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

