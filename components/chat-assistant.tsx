"use client"

import React, { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { 
  Send, Sparkles, Settings, X, RefreshCw, Copy, Check, 
  Database, Globe, Shield, Settings2, Sliders, ChevronRight, 
  ExternalLink, FileText, CheckSquare, Bookmark, Code, HelpCircle,
  Eye, Zap, AlertCircle
} from "lucide-react"

interface ChatAssistantProps {
  userId: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
  timestamp: number
  source?: "database" | "llm_web" | "llm"
  databaseMatches?: {
    formulas: any[]
    notes: any[]
    urls: any[]
    shortcuts: any[]
    todos: any[]
  }
  webResults?: { title: string; href: string; snippet: string }[]
  steps?: string[]
}

export function ChatAssistant({ userId }: ChatAssistantProps) {
  // Drawer open state
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Settings state
  const [selectedModel, setSelectedModel] = useState<"gemini" | "openai">("gemini")
  const [customGeminiKey, setCustomGeminiKey] = useState("")
  const [customOpenaiKey, setCustomOpenaiKey] = useState("")
  const [glowSpeed, setGlowSpeed] = useState<"static" | "slow" | "medium" | "fast" | "pulse">("medium")
  const [enableDbSearch, setEnableDbSearch] = useState(true)
  const [enableWebSearch, setEnableWebSearch] = useState(true)

  const handleButtonClick = () => {
    setIsOpen(!isOpen)
  }

  // Chat conversation state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hello! I am your **DevBoard AI Assistant**. Ask me anything. I will search your database first, and use Gemini + Web Search if I can't find it locally!",
      source: "llm",
      timestamp: Date.now()
    }
  ])
  const [inputVal, setInputVal] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentSteps, setCurrentSteps] = useState<string[]>([])
  
  // Clipboard copy state
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatFeedRef = useRef<HTMLDivElement>(null)
  const innerContainerRef = useRef<HTMLDivElement>(null)

  // Load settings and filtered chat history from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem("db_chat_model")
      if (savedModel === "openai" || savedModel === "gemini") setSelectedModel(savedModel)
      
      const savedGemini = localStorage.getItem("db_chat_gemini_key")
      if (savedGemini) setCustomGeminiKey(savedGemini)
      
      const savedOpenai = localStorage.getItem("db_chat_openai_key")
      if (savedOpenai) setCustomOpenaiKey(savedOpenai)
      
      const savedSpeed = localStorage.getItem("db_chat_glow_speed")
      if (["static", "slow", "medium", "fast", "pulse"].includes(savedSpeed || "")) {
        setGlowSpeed(savedSpeed as any)
      }
      
      const savedDb = localStorage.getItem("db_chat_enable_db")
      if (savedDb !== null) setEnableDbSearch(savedDb === "true")
        
      const savedWeb = localStorage.getItem("db_chat_enable_web")
      if (savedWeb !== null) setEnableWebSearch(savedWeb === "true")

      // Load chat history
      const savedHistory = localStorage.getItem(`db_chat_history_${userId}`)
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory) as Message[]
          const oneHourAgo = Date.now() - 3600000 // 1 hour in ms
          const activeMessages = parsed.filter(msg => {
            if (msg.id === "welcome") return true
            return msg.timestamp > oneHourAgo
          })
          if (activeMessages.length > 0) {
            setMessages(activeMessages)
          }
        } catch (e) {
          console.error("Error parsing chat history:", e)
        }
      }
    }
  }, [userId])

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (typeof window !== "undefined" && messages.length > 0) {
      localStorage.setItem(`db_chat_history_${userId}`, JSON.stringify(messages))
    }
  }, [messages, userId])

  // Clear messages older than 1 hour in real-time (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const oneHourAgo = Date.now() - 3600000
      setMessages(prev => {
        const filtered = prev.filter(msg => {
          if (msg.id === "welcome") return true
          return msg.timestamp > oneHourAgo
        })
        if (filtered.length !== prev.length) {
          return filtered
        }
        return prev
      })
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTo({
        top: chatFeedRef.current.scrollHeight,
        behavior: "smooth"
      })
    }
    // Safeguard: Reset inner container's scroll state to prevent browser-induced scroll shifts
    if (innerContainerRef.current) {
      innerContainerRef.current.scrollTop = 0
    }
  }, [messages, isLoading, currentSteps])

  // Save settings helpers
  const saveSetting = (key: string, val: string) => {
    localStorage.setItem(key, val)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Pre-configured quick suggestions
  const suggestions = [
    { label: "My Formulas", query: "Show me my formulas" },
    { label: "Pending Todos", query: "What are my pending todos?" },
    { label: "How to use VLOOKUP?", query: "How to use VLOOKUP in Excel?" }
  ]

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return
    
    const userMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      text: textToSend,
      timestamp: Date.now()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInputVal("")
    setIsLoading(true)
    setCurrentSteps(["Initializing search path..."])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          customGeminiKey: customGeminiKey || undefined,
          customOpenaiKey: customOpenaiKey || undefined,
          selectedModel,
          enableDbSearch,
          enableWebSearch
        })
      })

      const data = await response.json()
      
      // Update steps logs in real time
      if (data.steps) {
        setCurrentSteps(data.steps)
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch response")
      }

      const assistantMsg: Message = {
        id: Math.random().toString(),
        role: "assistant",
        text: data.message,
        source: data.source,
        databaseMatches: data.databaseMatches,
        webResults: data.webResults,
        steps: data.steps,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch (err: any) {
      console.error(err)
      setMessages(prev => [...prev, {
        id: Math.random().toString(),
        role: "assistant",
        text: `⚠️ **Error:** ${err.message || "Something went wrong. Please check your credentials or internet connection."}`,
        timestamp: Date.now()
      }])
    } finally {
      setIsLoading(false)
      setCurrentSteps([])
    }
  }

  // Custom Markdown Formatter
  const renderFormattedText = (text: string) => {
    const lines = text.split("\n")
    return lines.map((line, i) => {
      // 1. Check for bold formatting **text**
      let formattedLine: React.ReactNode = line
      const boldRegex = /\*\*(.*?)\*\*/g
      if (boldRegex.test(line)) {
        const parts = line.split(boldRegex)
        formattedLine = parts.map((part, index) => {
          if (index % 2 === 1) return <strong key={index} className="font-semibold text-white">{part}</strong>
          return part
        })
      }

      // 2. Check for inline code `code`
      const inlineCodeRegex = /`(.*?)`/g
      if (inlineCodeRegex.test(line)) {
        // Handle line formatting with nested code elements
        // Simplified rendering for text mixed with code
      }

      // 3. Bullet list items
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={i} className="ml-4 list-disc pl-1 text-slate-300">
            {formattedLine}
          </li>
        )
      }

      // 4. Numbered list items
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <li key={i} className="ml-4 list-decimal pl-1 text-slate-300">
            {formattedLine}
          </li>
        )
      }

      // 5. Code block indicators (ignore rendering empty code lines)
      if (line.trim().startsWith("```")) {
        return null
      }

      return (
        <p key={i} className="min-h-[1.2em] leading-relaxed text-slate-300 mb-1">
          {formattedLine}
        </p>
      )
    })
  }

  // Get animation class based on speed
  const getGlowAnimationClass = () => {
    switch (glowSpeed) {
      case "static": return ""
      case "slow": return "glow-rotate-slow"
      case "fast": return "glow-rotate-fast"
      case "pulse": return "glow-pulse-only"
      case "medium":
      default:
        return "glow-rotate-medium"
    }
  }

  return (
    <>
      {/* Robot Action Button (Icon inside Sidebar) */}
      <button 
        onClick={handleButtonClick}
        className="relative p-0 cursor-pointer rounded-2xl w-16 h-16 hover:scale-105 active:scale-95 select-none robot-idle"
        title="Open AI Chat Assistant"
        style={{
          border: "none",
          background: "transparent"
        }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            {/* Metallic pink-blue-silver head gradient */}
            <linearGradient id="robot-head-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5d0fe" />
              <stop offset="30%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>

            {/* Side ears gradient */}
            <linearGradient id="ear-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#8644ff" />
            </linearGradient>

            {/* Visor gradient */}
            <linearGradient id="visor-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1e1e2f" />
              <stop offset="100%" stopColor="#0a0a14" />
            </linearGradient>

            {/* Eye glow radial gradient */}
            <radialGradient id="eye-glow-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ff5efc" />
              <stop offset="85%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* Collar gradient */}
            <linearGradient id="collar-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            {/* Neon glow filter for eyes */}
            <filter id="eye-glow-filter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.5" result="blur1" />
              <feGaussianBlur stdDeviation="3.5" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* COLLAR / NECK */}
          <path d="M 28,78 C 28,78 35,90 50,90 C 65,90 72,78 72,78 C 72,78 62,84 50,84 C 38,84 28,78 28,78 Z" fill="url(#collar-grad)" opacity="0.9" />
          <path d="M 33,83 Q 50,75 67,83 Q 74,90 50,92 Q 26,90 33,83 Z" fill="url(#visor-grad)" />

          {/* SIDE EARS */}
          {/* Left Ear */}
          <rect x="10" y="32" width="10" height="24" rx="5" fill="url(#ear-grad)" transform="rotate(-5, 15, 44)" />
          <rect x="13" y="36" width="4" height="16" rx="2" fill="#ff5efc" opacity="0.6" filter="url(#eye-glow-filter)" />
          {/* Right Ear */}
          <rect x="80" y="32" width="10" height="24" rx="5" fill="url(#ear-grad)" transform="rotate(5, 85, 44)" />
          <rect x="83" y="36" width="4" height="16" rx="2" fill="#ff5efc" opacity="0.6" filter="url(#eye-glow-filter)" />

          {/* MAIN HEAD */}
          <circle cx="50" cy="44" r="36" fill="url(#robot-head-grad)" stroke="#ffffff" strokeWidth="1" />
          
          {/* Head Top Highlight */}
          <path d="M 40,11 C 45,9 55,9 60,11 C 58,18 42,18 40,11 Z" fill="#c084fc" opacity="0.5" />

          {/* VISOR SCREEN (rounded pill shape) */}
          <rect x="22" y="28" width="56" height="30" rx="10" fill="url(#visor-grad)" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />

          {/* EYES */}
          {/* Left Eye */}
          <g className="robot-eye-group" style={{ transformOrigin: "38px 43px" }}>
            {/* Outer Glow */}
            <circle cx="38" cy="43" r="8" fill="url(#eye-glow-grad)" filter="url(#eye-glow-filter)" className="robot-eye-glow" />
            {/* Center Pupil */}
            <circle cx="38" cy="43" r="4" fill="#0a0a14" />
            {/* Concentric Dash Ring */}
            <circle cx="38" cy="43" r="6.5" stroke="#ff84ff" strokeWidth="0.8" fill="none" strokeDasharray="3, 2" className="robot-eye-scan" style={{ transformOrigin: "38px 43px" }} />
          </g>

          {/* Right Eye */}
          <g className="robot-eye-group" style={{ transformOrigin: "62px 43px" }}>
            {/* Outer Glow */}
            <circle cx="62" cy="43" r="8" fill="url(#eye-glow-grad)" filter="url(#eye-glow-filter)" className="robot-eye-glow" />
            {/* Center Pupil */}
            <circle cx="62" cy="43" r="4" fill="#0a0a14" />
            {/* Concentric Dash Ring */}
            <circle cx="62" cy="43" r="6.5" stroke="#ff84ff" strokeWidth="0.8" fill="none" strokeDasharray="3, 2" className="robot-eye-scan" style={{ transformOrigin: "62px 43px" }} />
          </g>

          {/* MOUTH / DETAIL */}
          <rect x="42" y="65" width="16" height="2" rx="1" fill="#1e1e2f" opacity="0.8" />
        </svg>
      </button>

      {/* Chat Assistant Panel (Drawer) */}
      {mounted && typeof document !== "undefined"
        ? createPortal(
            <div 
              className={`fixed z-50 w-auto max-w-[calc(100vw-2rem)] h-[400px] max-h-[calc(100vh-120px)] md:h-[480px] md:max-h-[calc(100vh-80px)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 bottom-20 left-4 right-4 md:bottom-6 md:left-[296px] md:right-auto md:top-auto md:w-96 bg-slate-950/30 backdrop-blur-2xl ${
                isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8 pointer-events-none"
              }`}
            >
              {/* Animated Glowing 3D Border Light */}
              <div 
                className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,#4285f4,#34a853,#fbbc05,#ea4335,#4285f4)] animate-[spin_5s_linear_infinite] z-0 pointer-events-none"
                style={{ willChange: "transform" }}
              />
              
              {/* Inner Content Container */}
              <div 
                ref={innerContainerRef}
                className="absolute z-10 flex flex-col rounded-[15px] overflow-hidden"
                style={{
                  top: "1.5px",
                  bottom: "1.5px",
                  left: "1.5px",
                  right: "1.5px",
                  backgroundColor: "#020617"
                }}
              >
        {/* Header */}
        <header className="px-4 py-3 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <span className="flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-1.5">
                DevBoard Assistant
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              </h2>
              <p className="text-[10px] text-slate-400 font-mono">
                Model: {selectedModel === "gemini" ? "Gemini 2.5 Flash" : "GPT-4o-Mini"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer ${showSettings ? 'text-cyan-400 bg-white/5' : ''}`}
              title="Assistant Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Main Chat Feed */}
          <div 
            ref={chatFeedRef}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 chat-feed-scrollbar"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {/* Message Bubble */}
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm break-words ${
                  msg.role === "user" 
                    ? "bg-black border border-white/10 text-white rounded-br-none" 
                    : "bg-slate-900 border border-white/5 text-slate-100 rounded-bl-none shadow-md"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="space-y-2">
                      <div className="prose prose-invert max-w-none">
                        {renderFormattedText(msg.text)}
                      </div>

                      {/* source label */}
                      {msg.source && (
                        <div className="flex items-center gap-1 mt-2 pt-1.5 border-t border-white/5 text-[9px] text-slate-400 font-mono">
                          {msg.source === "database" ? (
                            <>
                              <Database className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Source: DevBoard Database (Apna Data)</span>
                            </>
                          ) : msg.source === "llm_web" ? (
                            <>
                              <Globe className="w-2.5 h-2.5 text-cyan-400" />
                              <span>Source: Gemini + Web Search</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                              <span>Source: AI Model</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>

              </div>
            ))}

            {/* Visual Search Pipeline Steps */}
            {isLoading && (
              <div className="bg-slate-950 border border-cyan-500/10 rounded-xl p-3 space-y-2 shadow-inner">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  <span className="text-xs font-semibold text-slate-200">Processing Query...</span>
                </div>
                <div className="space-y-1 font-mono text-[10px] text-slate-400 border-l border-cyan-500/20 pl-3.5 ml-1.5">
                  {currentSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400">►</span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions at the bottom */}
          {!isLoading && messages.length <= 1 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-white/5 bg-slate-950/40">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(s.query)}
                  className="text-[10px] bg-slate-900 border border-white/10 hover:bg-slate-800 text-slate-300 hover:text-white px-2 py-1 rounded-full cursor-pointer transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Settings Sub-Panel View */}
          <div className={`absolute top-0 bottom-0 left-0 right-0 bg-slate-950/98 backdrop-blur-xl border-t border-white/10 p-4 space-y-4 transition-all duration-300 flex flex-col z-10 ${
            showSettings ? "translate-x-0" : "translate-x-full"
          }`}>
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Settings2 className="w-4 h-4 text-cyan-400" />
                Settings & Credentials
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Model Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">LLM Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setSelectedModel("gemini"); saveSetting("db_chat_model", "gemini"); }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                      selectedModel === "gemini" 
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" 
                        : "border-white/10 bg-slate-900 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="font-bold text-xs">Gemini</span>
                    <span className="text-[9px] mt-0.5 opacity-70">2.5 Flash (Default)</span>
                  </button>
                  <button
                    onClick={() => { setSelectedModel("openai"); saveSetting("db_chat_model", "openai"); }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all ${
                      selectedModel === "openai" 
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-300" 
                        : "border-white/10 bg-slate-900 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="font-bold text-xs">OpenAI</span>
                    <span className="text-[9px] mt-0.5 opacity-70">GPT-4o-Mini</span>
                  </button>
                </div>
              </div>

              {/* API Keys */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Custom Gemini Key</label>
                    {customGeminiKey && (
                      <button 
                        onClick={() => { setCustomGeminiKey(""); saveSetting("db_chat_gemini_key", ""); }}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="Enter custom API key..."
                    value={customGeminiKey}
                    onChange={(e) => { setCustomGeminiKey(e.target.value); saveSetting("db_chat_gemini_key", e.target.value); }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Custom OpenAI Key</label>
                    {customOpenaiKey && (
                      <button 
                        onClick={() => { setCustomOpenaiKey(""); saveSetting("db_chat_openai_key", ""); }}
                        className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder="Enter custom API key..."
                    value={customOpenaiKey}
                    onChange={(e) => { setCustomOpenaiKey(e.target.value); saveSetting("db_chat_openai_key", e.target.value); }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Preferences / Toggles */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Search Components</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={enableDbSearch}
                      onChange={(e) => { setEnableDbSearch(e.target.checked); saveSetting("db_chat_enable_db", e.target.checked.toString()); }}
                      className="rounded border-white/10 bg-slate-900 text-cyan-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Enable DevBoard Database Search</span>
                  </label>
                  <label className="flex items-center space-x-2.5 cursor-pointer text-slate-300 hover:text-white select-none">
                    <input
                      type="checkbox"
                      checked={enableWebSearch}
                      onChange={(e) => { setEnableWebSearch(e.target.checked); saveSetting("db_chat_enable_web", e.target.checked.toString()); }}
                      className="rounded border-white/10 bg-slate-900 text-cyan-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Enable Google Fallback Search</span>
                  </label>
                </div>
              </div>

              {/* Customizing Animations */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Icon Glow Animation</label>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400">Speed</span>
                  <select
                    value={glowSpeed}
                    onChange={(e) => { setGlowSpeed(e.target.value as any); saveSetting("db_chat_glow_speed", e.target.value); }}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-2 py-1.5 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="static">Static (None)</option>
                    <option value="slow">Slow</option>
                    <option value="medium">Medium</option>
                    <option value="fast">Fast</option>
                    <option value="pulse">Pulse Only</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-lg active:scale-98"
            >
              Apply Settings
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(inputVal); }}
          className="p-3 border-t border-white/10 bg-slate-950 flex gap-2 items-center"
        >
          <input
            type="text"
            placeholder={isLoading ? "Processing query..." : "Ask assistant..."}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={isLoading}
            autoComplete="off"
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/35 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isLoading}
            className="p-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-xl transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {/* Global CSS Styles injected for Robot Icon Animations */}
      <style jsx global>{`
        /* Custom scrollbar for message feed */
        .chat-feed-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .chat-feed-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-feed-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 9999px;
        }
        .chat-feed-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Robot Head Bobbing Idle Animation */
        @keyframes robotFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .robot-idle {
          animation: robotFloat 3.5s ease-in-out infinite;
        }

        /* Robot Eye Blinking Animation */
        @keyframes robotEyeBlink {
          0%, 94%, 98%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.08); }
        }
        .robot-eye-group {
          animation: robotEyeBlink 4.5s ease-in-out infinite;
        }

        /* Robot Eye Dash Ring Rotate / Scan Animation */
        @keyframes robotEyeScan {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .robot-eye-scan {
          animation: robotEyeScan 6s linear infinite;
        }

        /* Robot Eye Glow Pulsing Animation */
        @keyframes robotEyeGlowPulse {
          0%, 100% { opacity: 0.8; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        .robot-eye-glow {
          animation: robotEyeGlowPulse 2s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}
