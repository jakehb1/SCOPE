'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/lib/ai-chat';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function MarketChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your prediction market trading advisor. I can help you analyze markets, identify value bets, manage risk, and make informed betting decisions. What would you like help with?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userBudget, setUserBudget] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Trading Advisor Chat</h1>
        <p className="text-white opacity-90">Get AI-powered betting advice for prediction markets</p>
      </div>

      {/* Budget Input */}
      <div className="bg-white rounded-lg p-4 mb-6">
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
            className="flex-1 px-4 py-2 border-2 border-primary-black rounded-lg focus:outline-none focus:border-primary-red text-primary-black"
          />
          {userBudget && (
            <button
              onClick={() => setUserBudget('')}
              className="px-4 py-2 bg-gray-200 text-primary-black rounded-lg hover:bg-gray-300 transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-lg border-2 border-primary-black flex flex-col" style={{ height: '600px' }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-red text-white'
                    : 'bg-gray-100 text-primary-black'
                }`}
              >
                <div className="whitespace-pre-wrap break-words">{message.content}</div>
                {message.timestamp && (
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-white opacity-70' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-4 flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-primary-black p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about markets, betting strategies, risk management..."
              rows={2}
              className="flex-1 px-4 py-2 border-2 border-primary-black rounded-lg focus:outline-none focus:border-primary-red text-primary-black resize-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-primary-red text-white px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
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
        <p className="text-white text-sm mb-3">Quick questions:</p>
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
              className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-full text-sm hover:bg-opacity-30 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

