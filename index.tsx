import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  Loader2, 
  Trophy, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Play,
  RefreshCw,
  FastForward,
  Divide,
  Coins,
  User,
  ListOrdered,
  WifiOff
} from "lucide-react";

// --- Types ---

interface Question {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ScoreEntry {
  name: string;
  score: number;
  date: string;
}

type GameState = 'START' | 'LOADING' | 'PLAYING' | 'FEEDBACK' | 'GAME_OVER' | 'VICTORY';

interface Lifelines {
  fiftyFifty: boolean;
  skips: number;
  aiHelp: boolean;
}

// --- Configuration ---

const PRIZE_LADDER = [
  1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000
];

const TOPICS = {
  easy: ["Cores e Números", "Cumprimentos e Verbo To Be", "Animais e Comida", "Família e Roupas", "Dias da Semana e Meses", "Objetos da Casa", "Adjetivos Simples", "Pronomes Pessoais"],
  medium: ["Presente Simples vs Contínuo", "Passado Simples", "Preposições de Lugar/Tempo", "Comparativos e Superlativos", "Pronomes Possessivos", "Falsos Cognatos", "Vocabulário de Viagem", "Futuro com Will/Going to"],
  hard: ["Present Perfect", "Condicionais (If clauses)", "Phrasal Verbs Comuns", "Voz Passiva", "Discurso Indireto (Reported Speech)", "Vocabulário de Trabalho", "Conectivos (Linking Words)"],
  expert: ["Expressões Idiomáticas (Idioms)", "Gírias Nativas", "Inversão Gramatical", "Vocabulário Acadêmico", "Nuances de Significado", "Phrasal Verbs Avançados", "Inglês Literário", "Mixed Conditionals"]
};

// --- API Helper ---

const getDifficultyParams = (index: number) => {
  let level = "Básico (Nível A1/A2)";
  let tier: keyof typeof TOPICS = 'easy';
  
  if (index >= 3) { level = "Intermediário (Nível B1/B2)"; tier = 'medium'; }
  if (index >= 6) { level = "Avançado (Nível C1)"; tier = 'hard'; }
  if (index >= 9) { level = "Fluente/Nativo (Nível C2 - Vocabulary/Nuance)"; tier = 'expert'; }

  const topics = TOPICS[tier];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  return { level, topic: randomTopic };
};

const generateQuestion = async (index: number): Promise<Question> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const { level, topic } = getDifficultyParams(index);
  
  const prompt = `ATENÇÃO: Você é o gerador de perguntas para o 'Show do Milhão'.
  Nível Exigido: ${level}. (Obrigatório respeitar a dificuldade).
  Tema: ${topic}.
  
  Instruções de Dificuldade:
  - Se Nível for Avançado/Fluente, use vocabulário complexo, phrasal verbs raros ou regras gramaticais obscuras. NÃO faça perguntas fáceis para estes níveis.
  - Se Nível for Básico, mantenha simples e direto.
  
  Retorne um objeto JSON válido com: text, options (4 strings), correctIndex (0-3), explanation.`;

  // Try 3 times before giving up
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "A pergunta." },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            },
            required: ["text", "options", "correctIndex", "explanation"]
          }
        }
      });

      if (response.text) {
        // Robust JSON extraction
        const text = response.text;
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        
        if (start !== -1 && end !== -1) {
          const jsonStr = text.substring(start, end + 1);
          return JSON.parse(jsonStr) as Question;
        }
      }
    } catch (e) {
      console.warn(`Attempt ${attempt + 1} failed for question generation:`, e);
      // Exponential backoff: 500ms, 1000ms, 1500ms...
      await new Promise(res => setTimeout(res, 500 * (attempt + 1)));
    }
  }

  // If we get here, all retries failed. Throw error to UI.
  throw new Error("Falha na conexão com a IA. Tente novamente.");
};

const getAiHelp = async (question: Question): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Estou em um game show. Pergunta: "${question.text}". Opções: ${question.options.join(', ')}. Dê uma dica curta, engraçada e útil sem dar a resposta direta.`,
    });
    return response.text || "Hmm, essa é difícil até para mim!";
  } catch (e) {
    console.error("AI Help failed", e);
    return "Minha conexão telepática falhou! Confie no seu instinto.";
  }
};

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false, 
  className = '' 
}: { 
  children?: React.ReactNode, 
  onClick: () => void, 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'correct' | 'wrong',
  disabled?: boolean,
  className?: string
}) => {
  const baseStyles = "relative overflow-hidden px-6 py-4 rounded-2xl font-bold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 shadow-xl backdrop-blur-sm group";
  
  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-indigo-500/30 border border-white/10",
    secondary: "bg-slate-800/80 text-white hover:bg-slate-700 shadow-black/20 border border-white/5",
    outline: "border-2 border-white/20 text-white hover:border-violet-400 hover:bg-violet-500/10 hover:text-violet-200",
    ghost: "bg-transparent text-slate-400 hover:text-white shadow-none",
    correct: "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-green-500/40 border border-emerald-400/30 animate-pulse",
    wrong: "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-500/40 border border-red-400/30"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      {children}
    </button>
  );
};

// --- Logo Component ---
const GameLogo = () => (
  <svg 
    viewBox="0 0 600 300" 
    className="w-full max-w-[400px] drop-shadow-2xl animate-in zoom-in duration-700 mx-auto"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#312e81" />
        <stop offset="50%" stopColor="#4338ca" />
        <stop offset="100%" stopColor="#312e81" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
        <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="textShadow">
        <feDropShadow dx="2" dy="2" stdDeviation="1" floodColor="#000" floodOpacity="0.7"/>
      </filter>
    </defs>

    {/* Shapes */}
    <path 
      d="M50 150 L300 20 L550 150 L300 280 Z" 
      fill="url(#bgGrad)" 
      stroke="#6366f1" 
      strokeWidth="4"
      className="drop-shadow-lg"
    />
    
    <path 
      d="M70 150 L300 40 L530 150 L300 260 Z" 
      fill="none" 
      stroke="#818cf8" 
      strokeWidth="2" 
      opacity="0.3"
    />

    {/* Text */}
    <g style={{ fontFamily: 'Arial Black, sans-serif', textAnchor: 'middle' }}>
      <text x="300" y="135" fontSize="55" fill="url(#goldGrad)" stroke="#854d0e" strokeWidth="2" filter="url(#textShadow)">
        SHOW DO
      </text>
      <text x="300" y="215" fontSize="85" fill="url(#goldGrad)" stroke="#854d0e" strokeWidth="2.5" filter="url(#textShadow)">
        INGLÊS
      </text>
    </g>

    {/* Decorative Stars */}
    <g fill="#fff">
      <circle cx="100" cy="150" r="3" className="animate-pulse" />
      <circle cx="500" cy="150" r="3" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
      <circle cx="300" cy="50" r="3" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
      <circle cx="300" cy="250" r="3" className="animate-pulse" style={{ animationDelay: '0.7s' }} />
    </g>
  </svg>
);

const App = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>('START');
  
  // Dynamic Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Player & Leaderboard
  const [playerName, setPlayerName] = useState('');
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);

  // Lifelines
  const [lifelines, setLifelines] = useState<Lifelines>({ fiftyFifty: true, skips: 3, aiHelp: true });
  
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);

  // Load Leaderboard on Mount
  useEffect(() => {
    const stored = localStorage.getItem('show-ingles-leaderboard');
    if (stored) {
      try {
        setLeaderboard(JSON.parse(stored));
      } catch (e) {
        console.error("Erro ao carregar leaderboard", e);
      }
    }
  }, []);

  // Pre-fetch Logic: Always try to ensure we have the NEXT question ready
  useEffect(() => {
    const prefetch = async () => {
      // Only fetch if playing, not full, and next question doesn't exist yet
      if (gameState === 'PLAYING' && questions.length <= currentQIndex + 1 && questions.length < PRIZE_LADDER.length && !isFetchingNext) {
        setIsFetchingNext(true);
        try {
          const nextIndex = questions.length;
          const q = await generateQuestion(nextIndex);
          setQuestions(prev => [...prev, q]);
        } catch (e) {
          console.error("Falha no pre-fetch da próxima questão", e);
          // Retry silently or let the user hit the loading state later
        } finally {
          setIsFetchingNext(false);
        }
      }
    };
    
    prefetch();
  }, [gameState, questions.length, currentQIndex, isFetchingNext]);

  const saveScore = (prize: number) => {
    if (prize === 0) return;
    
    const newEntry: ScoreEntry = {
      name: playerName || "Anônimo",
      score: prize,
      date: new Date().toLocaleDateString('pt-BR')
    };

    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    setLeaderboard(newLeaderboard);
    localStorage.setItem('show-ingles-leaderboard', JSON.stringify(newLeaderboard));
  };

  const startGame = async () => {
    if (!playerName.trim()) {
      setErrorMsg("Por favor, digite seu nome para começar.");
      return;
    }

    setGameState('LOADING');
    setErrorMsg(null);
    setQuestions([]); // Limpa perguntas antigas
    
    try {
      // Gera apenas a PRIMEIRA pergunta para começar rápido
      const firstQ = await generateQuestion(0);
      setQuestions([firstQ]);
      setCurrentQIndex(0);
      setLifelines({ fiftyFifty: true, skips: 3, aiHelp: true });
      setHiddenOptions([]);
      setAiTip(null);
      setGameState('PLAYING');
    } catch (err) {
      console.error(err);
      // Removed Fallback - Show error instead
      setErrorMsg("Não foi possível conectar à IA. Verifique sua conexão e tente novamente.");
      setGameState('START');
    }
  };

  const handleAnswer = (index: number) => {
    setSelectedOption(index);
    setGameState('FEEDBACK');
  };

  const nextQuestion = () => {
    if (gameState !== 'FEEDBACK') return;
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    const isCorrect = selectedOption === currentQ.correctIndex;

    if (isCorrect) {
      if (currentQIndex + 1 >= PRIZE_LADDER.length) {
        const finalPrize = PRIZE_LADDER[PRIZE_LADDER.length - 1];
        saveScore(finalPrize);
        setGameState('VICTORY');
      } else {
        setCurrentQIndex(prev => prev + 1);
        setSelectedOption(null);
        setHiddenOptions([]);
        setAiTip(null);
        setGameState('PLAYING');
      }
    } else {
      const currentPrize = currentQIndex > 0 ? PRIZE_LADDER[currentQIndex - 1] : 0;
      saveScore(currentPrize);
      setGameState('GAME_OVER');
    }
  };

  // Lifelines
  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty) return;
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;
    
    const correct = currentQ.correctIndex;
    const allOptions = [0, 1, 2, 3];
    const wrongOptions = allOptions.filter(i => i !== correct);
    const toHide = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    
    setHiddenOptions(toHide);
    setLifelines(prev => ({ ...prev, fiftyFifty: false }));
  };

  const useSkip = async () => {
    if (lifelines.skips <= 0 || isSkipping) return;
    
    setIsSkipping(true);
    setAiTip(null);

    try {
      // Gera nova pergunta do mesmo nível de dificuldade para substituir a atual
      const newQuestion = await generateQuestion(currentQIndex);
      
      setQuestions(prev => {
        const updated = [...prev];
        updated[currentQIndex] = newQuestion;
        return updated;
      });
      
      setSelectedOption(null);
      setHiddenOptions([]);
      setLifelines(prev => ({ ...prev, skips: prev.skips - 1 }));
      
    } catch (error) {
      console.error("Erro ao pular pergunta:", error);
    } finally {
      setIsSkipping(false);
    }
  };

  const useAiHelp = async () => {
    if (!lifelines.aiHelp) return;
    const currentQ = questions[currentQIndex];
    if (!currentQ) return;

    setLifelines(prev => ({ ...prev, aiHelp: false }));
    const tip = await getAiHelp(currentQ);
    setAiTip(tip);
  };

  // --- Render Screens ---

  if (gameState === 'START') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
           <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        </div>

        <div className="z-10 w-full max-w-4xl flex flex-col md:flex-row gap-8 items-stretch">
          
          {/* Main Card */}
          <div className="flex-1 flex flex-col items-center text-center backdrop-blur-3xl bg-white/5 p-8 rounded-3xl border border-white/10 shadow-2xl">
            
            {/* Logo Custom Component - Replaces broken Image */}
            <div className="relative mb-8 group w-full flex justify-center">
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-500"></div>
              <GameLogo />
            </div>
            
            <p className="text-slate-400 mb-8 text-lg font-light">Teste seu inglês com IA em tempo real.</p>
            
            <div className="w-full max-w-sm space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Digite seu nome..."
                  className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  maxLength={15}
                />
              </div>

              <Button onClick={startGame} className="w-full text-lg py-4 shadow-violet-500/20" disabled={!playerName.trim()}>
                <Play className="fill-current" />
                JOGAR AGORA
              </Button>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 text-red-200 p-3 rounded-xl mt-4 w-full border border-red-500/20 text-sm flex items-center justify-center gap-2">
                <WifiOff size={16} />
                {errorMsg}
              </div>
            )}
          </div>

          {/* Leaderboard Card */}
          <div className="w-full md:w-80 backdrop-blur-3xl bg-slate-900/40 p-6 rounded-3xl border border-white/10 shadow-xl flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <ListOrdered className="text-indigo-400" />
              <h3 className="text-xl font-bold text-white">Top Jogadores</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
              {leaderboard.length === 0 ? (
                <div className="text-center text-slate-500 py-10 flex flex-col items-center">
                  <Trophy size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">Seja o primeiro a vencer!</p>
                </div>
              ) : (
                leaderboard.slice(0, 5).map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                        ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : ''}
                        ${idx === 1 ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30' : ''}
                        ${idx === 2 ? 'bg-orange-700/20 text-orange-400 border border-orange-700/30' : ''}
                        ${idx > 2 ? 'bg-slate-800 text-slate-500' : ''}
                      `}>
                        {idx + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm truncate max-w-[100px]">{entry.name}</span>
                        <span className="text-[10px] text-slate-500">{entry.date}</span>
                      </div>
                    </div>
                    <span className="font-mono text-green-400 font-bold text-sm">
                      ${entry.score.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'LOADING') {
    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/20 via-[#0f172a] to-[#0f172a]"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500 blur-xl opacity-20"></div>
            <Loader2 size={64} className="animate-spin text-violet-400 mb-6" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Preparando o Palco</h2>
          <p className="text-slate-400 animate-pulse">Olá, <span className="text-indigo-400 font-bold">{playerName}</span>! Boa sorte.</p>
        </div>
      </div>
    );
  }

  if (gameState === 'VICTORY' || gameState === 'GAME_OVER') {
    const isVictory = gameState === 'VICTORY';
    const finalPrize = isVictory 
      ? PRIZE_LADDER[PRIZE_LADDER.length - 1] 
      : (currentQIndex > 0 ? PRIZE_LADDER[currentQIndex - 1] : 0);
    
    const isHighScore = leaderboard.length > 0 && finalPrize >= leaderboard[0].score && finalPrize > 0;

    return (
      <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-[#0f172a] to-[#0f172a]"></div>
        
        <div className="z-10 backdrop-blur-xl bg-white/5 p-10 rounded-3xl border border-white/10 max-w-md w-full shadow-2xl animate-in zoom-in duration-500">
          {isVictory ? (
            <div className="inline-block p-4 rounded-full bg-yellow-500/20 mb-6 animate-bounce">
              <Sparkles size={80} className="text-yellow-400" />
            </div>
          ) : (
            <div className="inline-block p-4 rounded-full bg-red-500/20 mb-6">
              <XCircle size={80} className="text-red-400" />
            </div>
          )}
          
          <h2 className="text-4xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-400">
            {isVictory ? "LENDÁRIO!" : "FIM DE JOGO"}
          </h2>
          
          <p className="text-slate-400 text-lg mb-6">
            Belo jogo, <span className="text-white font-bold">{playerName}</span>!
          </p>

          <div className="my-8 py-6 bg-slate-900/50 rounded-2xl border border-white/5">
            <p className="text-slate-400 text-sm uppercase tracking-wider mb-2">Prêmio Total</p>
            <p className="text-5xl font-mono font-bold text-green-400 drop-shadow-lg">
              ${finalPrize.toLocaleString()}
            </p>
            {isHighScore && (
              <div className="mt-2 inline-flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-3 py-1 rounded-full">
                <Trophy size={12} /> NOVO RECORDE
              </div>
            )}
          </div>
          
          <Button onClick={() => setGameState('START')} variant="secondary" className="w-full">
            <RefreshCw size={20} /> Jogar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Handle waiting for next question
  const currentQ = questions[currentQIndex];
  
  // If we are playing but the question hasn't loaded yet (fast player!)
  if (!currentQ && gameState === 'PLAYING') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-400 mb-4" />
        <p className="text-indigo-200 font-bold animate-pulse">Gerando próxima pergunta...</p>
      </div>
    );
  }

  const isFeedback = gameState === 'FEEDBACK';
  const progressPercent = ((currentQIndex) / PRIZE_LADDER.length) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col relative font-sans overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-900/20 blur-[120px] rounded-full"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl sticky top-0 z-30 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur opacity-40 rounded-full"></div>
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner relative z-10 border border-white/10">
                {currentQIndex + 1}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Questão</span>
              <span className="text-xs text-slate-300 font-medium">de {PRIZE_LADDER.length}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <User size={14} className="text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 max-w-[100px] truncate">{playerName}</span>
          </div>
          
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Valendo</span>
             <div className="font-mono text-green-400 font-bold text-2xl flex items-center gap-1 drop-shadow-sm">
               <span className="text-green-600">$</span>
               {PRIZE_LADDER[currentQIndex].toLocaleString()}
             </div>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-800">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700 ease-out" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 pb-24 flex flex-col justify-center gap-6 relative z-10">
        
        {/* Question Card */}
        <div className="bg-white/5 backdrop-blur-md p-6 sm:p-10 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden group">
           {isSkipping && (
             <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-300">
               <Loader2 size={48} className="animate-spin text-indigo-400 mb-2" />
               <p className="text-indigo-200 font-bold animate-pulse">Trocando pergunta...</p>
             </div>
           )}
           
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <HelpCircle size={100} />
           </div>

           {/* Level Badge (Without source icon) */}
           <div className="flex items-center gap-2 mb-4">
             <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
               {currentQIndex < 3 ? 'Nível Básico' : currentQIndex < 6 ? 'Nível Médio' : currentQIndex < 9 ? 'Nível Difícil' : 'Nível Especialista'}
             </div>
           </div>
           
           <h2 className="text-xl sm:text-3xl font-bold leading-relaxed text-slate-100 relative z-10 drop-shadow-sm">
             {currentQ.text}
           </h2>

           {/* AI Tip Bubble */}
           {aiTip && (
             <div className="mt-6 bg-indigo-950/60 border border-indigo-500/30 p-4 rounded-xl flex gap-4 animate-in fade-in slide-in-from-left-4">
               <div className="bg-indigo-500/20 p-2 rounded-lg h-fit">
                 <Sparkles className="text-indigo-300" size={20} />
               </div>
               <div>
                 <p className="text-indigo-200 text-sm italic leading-relaxed">"{aiTip}"</p>
                 <p className="text-[10px] text-indigo-400 mt-1 font-bold uppercase tracking-wider">Dica da IA</p>
               </div>
             </div>
           )}
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 gap-4">
          {currentQ.options.map((option, idx) => {
            if (hiddenOptions.includes(idx)) return <div key={idx} className="h-[72px] sm:h-[80px]" />; 

            let variant: 'primary' | 'secondary' | 'correct' | 'wrong' = 'secondary';
            if (isFeedback) {
              if (idx === currentQ.correctIndex) variant = 'correct';
              else if (idx === selectedOption) variant = 'wrong';
              else variant = 'secondary';
            } else if (selectedOption === idx) {
              variant = 'primary';
            }

            return (
              <button
                key={idx}
                onClick={() => !isFeedback && handleAnswer(idx)}
                disabled={isFeedback || isSkipping}
                className={`
                  w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex items-center justify-between group relative overflow-hidden
                  ${variant === 'secondary' 
                    ? 'bg-slate-800/60 border-white/5 hover:bg-slate-700/80 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10' 
                    : ''}
                  ${variant === 'primary' 
                    ? 'bg-indigo-600 border-indigo-400 shadow-xl shadow-indigo-900/50 scale-[1.02]' 
                    : ''}
                  ${variant === 'correct' 
                    ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-100 shadow-lg shadow-emerald-900/20' 
                    : ''}
                  ${variant === 'wrong' 
                    ? 'bg-red-900/40 border-red-500/50 text-red-100 opacity-60' 
                    : ''}
                `}
              >
                {/* Hover gradient effect */}
                {variant === 'secondary' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/10 to-indigo-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                )}

                <div className="flex items-center gap-5 relative z-10">
                  <span className={`
                    w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border transition-colors
                    ${variant === 'secondary' ? 'bg-slate-900 border-slate-700 text-slate-400 group-hover:border-indigo-400 group-hover:text-indigo-300' : 'bg-black/20 border-white/20 text-white'}
                  `}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-lg sm:text-xl font-medium">{option}</span>
                </div>
                
                <div className="relative z-10">
                  {variant === 'correct' && <CheckCircle2 className="text-emerald-400 animate-in zoom-in duration-300" size={24} />}
                  {variant === 'wrong' && <XCircle className="text-red-400 animate-in zoom-in duration-300" size={24} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Feedback / Controls */}
        {isFeedback && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-white/10 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1">
                 <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Explicação</p>
                 <p className="text-white text-sm sm:text-base leading-snug">{currentQ.explanation}</p>
              </div>
              <Button onClick={nextQuestion} className="w-full sm:w-auto min-w-[200px]" variant={selectedOption === currentQ.correctIndex ? "correct" : "wrong"}>
                {selectedOption === currentQ.correctIndex ? "Continuar" : "Ver Resultado"} <ArrowRight size={20} />
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Lifelines Footer */}
      {!isFeedback && (
        <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-lg border-t border-white/5 p-4 z-40">
          <div className="max-w-2xl mx-auto flex justify-center gap-3 sm:gap-6">
            <LifelineButton 
              icon={<Divide size={20} />} 
              label="50:50" 
              active={lifelines.fiftyFifty && !isSkipping} 
              onClick={useFiftyFifty} 
            />
            <LifelineButton 
              icon={isSkipping ? <Loader2 size={20} className="animate-spin" /> : <FastForward size={20} />} 
              label={isSkipping ? "..." : "Pular"} 
              count={lifelines.skips}
              active={lifelines.skips > 0 && !isSkipping} 
              onClick={useSkip} 
            />
            <LifelineButton 
              icon={<Brain size={20} />} 
              label="Ajuda IA" 
              active={lifelines.aiHelp && !isSkipping} 
              onClick={useAiHelp} 
            />
          </div>
        </footer>
      )}
    </div>
  );
};

const LifelineButton = ({ 
  icon, 
  label, 
  active, 
  onClick, 
  count 
}: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  count?: number 
}) => (
  <button
    onClick={onClick}
    disabled={!active}
    className={`
      flex flex-col items-center justify-center py-2 px-4 rounded-xl min-w-[80px] transition-all duration-300 relative group overflow-hidden
      ${active 
        ? 'bg-slate-800 text-slate-300 hover:bg-indigo-600 hover:text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/20 border border-white/5' 
        : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-transparent'}
    `}
  >
    <div className={`mb-1 transition-transform group-hover:scale-110 ${active ? 'text-indigo-400 group-hover:text-white' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
    
    {/* Badge for Count */}
    {count !== undefined && (
      <div className={`
        absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-slate-900
        ${active ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-500'}
      `}>
        {count}
      </div>
    )}
  </button>
);

const root = createRoot(document.getElementById('app')!);
root.render(<App />);