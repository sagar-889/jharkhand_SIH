import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Globe, Mic, MicOff, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendChatMessage, startChatSession } from '../services/chatService';

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initializeChat = async () => {
      if (isOpen && messages.length === 0) {
        try {
          const response = await startChatSession(selectedLanguage);
          setSessionId(response.data.sessionId);
          setMessages([{
            id: 1,
            text: getFallbackWelcomeMessage(),
            sender: 'bot',
            timestamp: new Date(),
            provider: response.data.welcomeMessage.provider
          }]);
        } catch (error) {
          console.error('Error initializing chat:', error);
          setError('Failed to start chat session. Please try again.');
        }
      }
    };

    initializeChat();
  }, [isOpen, selectedLanguage]);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' }
  ];

  const getFallbackWelcomeMessage = () => {
    const welcomeMessages = {
      'en': "Hello! I'm your Jharkhand tourism assistant. Connecting to the service...",
      'hi': "नमस्ते! मैं आपका झारखंड पर्यटन सहायक हूं। सेवा से जुड़ रहा हूं...",
      'bn': "হ্যালো! আমি আপনার ঝাড়খণ্ড পর্যটন সহায়ক। সেবার সাথে সংযোগ করছি...",
      'or': "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଝାଡ଼ଖଣ୍ଡ ପର୍ଯ୍ୟଟନ ସହାୟକ। ସେବା ସହ ସଂଯୋଗ ହେଉଛି...",
      'ur': "ہیلو! میں آپ کا جھارکھنڈ سیاحت کا معاون ہوں۔ سروس سے منسلک ہو رہا ہوں..."
    };
    return welcomeMessages[selectedLanguage] || welcomeMessages['en'];
  };

  // Welcome messages are now handled by the backend
  const getWelcomeMessage = () => {
    // Fallback welcome message in case of connection issues
    const welcomeMessages = {
      'en': "Hello! I'm your Jharkhand tourism assistant. Connecting to the service...",
      'hi': "नमस्ते! मैं आपका झारखंड पर्यटन सहायक हूं। सेवा से जुड़ रहा हूं...",
      'bn': "হ্যালো! আমি আপনার ঝাড়খণ্ড পর্যটন সহায়ক। সেবার সাথে সংযোগ করছি...",
      'or': "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଝାଡ଼ଖଣ୍ଡ ପର୍ଯ୍ୟଟନ ସହାୟକ। ସେବା ସହ ସଂଯୋଗ ହେଉଛି...",
      'ur': "ہیلو! میں آپ کا جھارکھنڈ سیاحت کا معاون ہوں۔ سروس سے منسلک ہو رہا ہوں..."
    };
    return welcomeMessages[selectedLanguage] || welcomeMessages['en'];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await sendChatMessage(currentInput, sessionId, selectedLanguage);
      
      const botMessage = {
        id: messages.length + 2,
        text: response.data.message,
        sender: 'bot',
        timestamp: new Date(),
        provider: response.data.provider,
        confidence: response.data.confidence,
        suggestions: response.data.suggestions || [],
        quickReplies: response.data.quickReplies || []
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm sorry, I couldn't process your message. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleLanguageChange = async (langCode) => {
    setSelectedLanguage(langCode);
    try {
      const response = await startChatSession(langCode);
      setSessionId(response.data.sessionId);
      const welcomeMessage = {
        id: messages.length + 1,
        text: response.data.welcomeMessage.message,
        sender: 'bot',
        timestamp: new Date(),
        provider: response.data.welcomeMessage.provider
      };
      setMessages([welcomeMessage]); // Start fresh with new language
    } catch (error) {
      console.error('Error changing language:', error);
      setError('Failed to change language. Please try again.');
    }
  };

  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
      };

      recognition.start();
    } else {
      alert('Voice input not supported in this browser');
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const MessageProvider = ({ provider }) => {
    if (!provider) return null;
    return (
      <div className="text-xs text-gray-500 mt-1">
        Answered by: {provider}
      </div>
    );
  };

  const ErrorMessage = ({ message }) => {
    if (!message) return null;
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
        {message}
      </div>
    );
  };

  return (
    <>
      {/* Chat Widget Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.3 }}
            className="fixed bottom-24 right-6 z-40 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                  <Bot className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Jharkhand AI Guide</h3>
                  <p className="text-xs opacity-90">ChatGPT-like assistant 🤖</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="text-xs bg-white/20 text-white rounded px-2 py-1 border border-white/30"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code} className="text-gray-800">
                      {lang.nativeName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start space-x-2 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' ? 'bg-blue-600' : 'bg-white border-2 border-blue-200'
                    }`}>
                      {message.sender === 'user' ? (
                        <span className="text-white text-xs font-bold">U</span>
                      ) : (
                        <Bot className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p className={`text-xs mt-2 opacity-70 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 bg-white border-2 border-blue-200 rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-200">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <button
                  onClick={startVoiceInput}
                  className={`p-2 rounded-full transition-colors ${
                    isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Voice input"
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={selectedLanguage === 'hi' ? 'अपना संदेश टाइप करें...' : 'Type your message...'}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Ask me about Jharkhand destinations, culture, food, transport, weather, or trip planning!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
