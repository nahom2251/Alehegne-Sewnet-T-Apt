import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Eye, EyeOff, Mail, Lock, User, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from './Logo';
import { api } from '../services/api';

interface AuthProps {
  onLogin: (user: any) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const { t, language, setLanguage } = useLanguage();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ UPDATED HANDLE SUBMIT
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const response = await api.auth.login({ email, password });

        if (!response || !response.user) {
          throw new Error("Invalid login response from server");
        }

        onLogin(response.user);
      } else {
        await api.auth.register({ email, password, name });

        setIsLogin(true);
        setError("Registration successful! Please login.");
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("Google login is not supported yet. Use email/password.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border relative overflow-hidden">

        {/* Background circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-yellow-400/5 rounded-full -ml-12 -mb-12" />

        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-6" showText={false} />
          <h1 className="text-2xl font-bold text-gray-900">{t('appName')}</h1>
          <p className="text-gray-500 mt-2">
            {isLogin ? t('login') : t('register')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name (Register only) */}
          {!isLogin && (
            <div>
              <label className="text-sm text-gray-700">{t('fullName')}</label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50 focus:outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-sm text-gray-700">{t('email')}</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl bg-gray-50 focus:outline-none"
                placeholder="admin@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-sm text-gray-700">{t('password')}</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border rounded-xl bg-gray-50 focus:outline-none"
                placeholder="••••••••"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-sm text-red-500 bg-red-50 p-3 rounded-lg"
            >
              {error}
            </motion.p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-yellow-500 text-white font-bold rounded-xl"
          >
            {loading ? "..." : isLogin ? t('login') : t('register')}
          </button>

          {/* Divider */}
          <div className="text-center text-xs text-gray-400 my-4">
            Or continue with
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full py-3 border rounded-xl flex justify-center items-center gap-2"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              className="w-5"
            />
            Google
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-gray-500"
          >
            {isLogin
              ? "Don't have an account? Register"
              : "Already have an account? Login"}
          </button>

          <div className="mt-4">
            <button
              onClick={() =>
                setLanguage(language === "en" ? "am" : "en")
              }
              className="text-xs text-gray-400 flex items-center justify-center gap-1"
            >
              <Globe size={14} />
              {language === "en" ? "አማርኛ" : "English"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};