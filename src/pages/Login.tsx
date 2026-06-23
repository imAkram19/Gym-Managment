import React, { useState } from 'react';
import { Dumbbell, Lock, User, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const expectedUsername = import.meta.env.VITE_APP_USERNAME || '123';
        const expectedPassword = import.meta.env.VITE_APP_PASSWORD || '123';

        // Direct matching for solid, reliable feel
        if (username === expectedUsername && password === expectedPassword) {
            localStorage.setItem('irongym_authenticated', 'true');
            onLoginSuccess();
        } else {
            setError('Invalid username or password');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-sm w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex p-3 bg-indigo-50 rounded-xl border border-indigo-100 mb-3">
                        <Dumbbell className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Iron Gym</h1>
                    <p className="text-slate-500 text-sm mt-1">Management System Login</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg mb-6 font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-2">Username</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400">
                                <User className="w-4 h-4" />
                            </span>
                            <input
                                required
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter Username"
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 text-sm font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-700 text-sm font-semibold mb-2">Password</label>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-slate-400">
                                <Lock className="w-4 h-4" />
                            </span>
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter Password"
                                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400 text-sm font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 bg-transparent border-none outline-none cursor-pointer"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-sm"
                    >
                        <span>Unlock</span>
                    </button>
                </form>
            </div>
            
            <div className="text-center mt-6 text-xs text-slate-400 font-medium">
                Iron Gym Management System
            </div>
        </div>
    );
};
