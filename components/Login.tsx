import React, { useState } from 'react';
import { GraduationCap, AlertCircle, ArrowRight, BookOpenCheck, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError('Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000039] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Abstract Shapes - Brand Colors */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#10898b] rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#0f5c5e] rounded-full mix-blend-screen filter blur-[120px] opacity-30"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in duration-300 border border-white/10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-5 bg-[#10898b] rounded-2xl shadow-lg shadow-[#10898b]/30 mb-6 transform hover:scale-105 transition-transform duration-300">
            <GraduationCap className="text-white" size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-[#000039] tracking-tight">EDUCAÇÃO <span className="text-[#10898b]">5.0</span></h1>
          <p className="text-gray-500 mt-2 font-medium text-sm tracking-wide uppercase flex items-center justify-center gap-2">
            <span className="w-8 h-[1px] bg-gray-300"></span>
            Gestão Inteligente
            <span className="w-8 h-[1px] bg-gray-300"></span>
          </p>
        </div>
        
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm shadow-sm animate-in slide-in-from-top-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#10898b] uppercase tracking-wider ml-1">E-mail Corporativo</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10898b] focus:bg-white focus:border-transparent outline-none transition-all text-[#000039] placeholder-gray-400 font-medium"
              placeholder="seu@escola.com"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#10898b] uppercase tracking-wider ml-1">Senha de Acesso</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#10898b] focus:bg-white focus:border-transparent outline-none transition-all text-[#000039] placeholder-gray-400 font-medium"
              placeholder="••••••••"
            />
          </div>
          <div className="pt-2">
            <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full bg-[#000039] hover:bg-[#10898b] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
            >
                {isLoading ? 'Autenticando...' : (
                    <>Acessar Plataforma <ArrowRight size={18} /></>
                )}
            </button>
          </div>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5">
                <ShieldCheck size={14} className="text-[#10898b]" /> Ambiente Seguro e Monitorado
            </p>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-white/20 text-xs font-light">
         © {new Date().getFullYear()} Educação 5.0 - Tecnologia Educacional
      </div>
    </div>
  );
};