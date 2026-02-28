import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from './Icons';

const UpgradeCard: React.FC = () => {
    return (
        <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-brand-500/20 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black tracking-tight">The Go Pro</h3>
                        <p className="text-white/80 font-bold">Unlock unlimited AI generations & more</p>
                    </div>
                </div>
                <Link
                    to="/pricing"
                    className="px-8 py-4 bg-white text-brand-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all shadow-lg active:scale-95"
                >
                    Upgrade Now
                </Link>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
        </div>
    );
};

export default UpgradeCard;
