'use client';

import { motion } from 'framer-motion';

const stats = [
    { label: 'Total Value Locked', value: '$12.5M+' },
    { label: 'Active Supervisors', value: '45.2K' },
    { label: 'Content Hours', value: '120K+' },
    { label: 'Creator Earnings', value: '$4.8M' },
];

export default function StatsTicker() {
    return (
        <div className="w-full bg-slate-900/50 border-y border-white/5 py-6 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-transparent to-slate-950 z-10 pointer-events-none" />
            <motion.div
                className="flex items-center gap-16 w-max"
                animate={{ x: "-50%" }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "linear"
                }}
            >
                {[...stats, ...stats, ...stats].map((stat, i) => (
                    <div key={i} className="flex items-center gap-4 group cursor-default">
                        <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 font-mono">
                            {stat.value}
                        </span>
                        <span className="text-sm font-medium text-cyan-500 uppercase tracking-widest">
                            {stat.label}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
