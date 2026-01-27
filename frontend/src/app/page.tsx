'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { ArrowRight, Play, Globe, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import FeaturedCreators from '@/components/FeaturedCreators';

export default function Home() {
  const { login, authenticated } = usePrivy();

  return (
    <div className="relative flex flex-col gap-32 pb-20 overflow-hidden">
      {/* Global Background Effects */}
      <div className="fixed inset-0 bg-slate-950 -z-50" />
      <div className="fixed inset-0 bg-grid-white/[0.02] bg-[size:50px_50px] -z-40 pointer-events-none masking-gradient" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -z-40 opacity-50 pointer-events-none mix-blend-screen" />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center space-y-12 px-4 pt-20">

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative group"
        >
          <div className="absolute inset-0 bg-cyan-500/30 blur-[40px] rounded-full -z-10 animate-pulse-slow group-hover:bg-cyan-400/40 transition-colors duration-500" />
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900/60 border border-cyan-500/20 text-cyan-300 text-sm font-semibold backdrop-blur-xl shadow-lg shadow-cyan-900/20 ring-1 ring-white/5 group-hover:scale-105 transition-transform duration-300 cursor-default">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 box-shadow-[0_0_12px_rgba(34,211,238,0.8)]"></span>
            </span>
            Live on Base Sepolia
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-8 max-w-6xl mx-auto"
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-extrabold tracking-tighter text-white leading-[0.9]">
            Stream. Read. <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 animate-gradient-x">Own.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-400/80 max-w-3xl mx-auto leading-relaxed font-light">
            The first decentralized content marketplace where creators keep <span className="text-white font-medium">100%</span> of revenue and users truly own their library.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          {authenticated ? (
            <Link
              href="/explore"
              className="px-10 py-5 rounded-full bg-white text-slate-950 font-bold text-lg hover:bg-cyan-50 transition-all flex items-center gap-3 shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] hover:shadow-[0_0_70px_-10px_rgba(255,255,255,0.5)] hover:scale-105"
            >
              Start Exploring <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <button
              onClick={login}
              className="group relative px-10 py-5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-lg transition-all shadow-[0_0_50px_-10px_rgba(34,211,238,0.5)] hover:shadow-[0_0_70px_-10px_rgba(34,211,238,0.6)] flex items-center gap-3 hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-3">Connect Wallet <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
            </button>
          )}
          <Link
            href="/creators"
            className="px-10 py-5 rounded-full bg-slate-950/30 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-medium transition-all backdrop-blur-md flex items-center gap-2"
          >
            For Creators
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {[
          {
            icon: <Globe className="w-8 h-8 text-cyan-400" />,
            title: "Decentralized Storage",
            desc: "Content is stored on Walrus & IPFS, ensuring permanence, lower costs, and zero censorship."
          },
          {
            icon: <ShieldCheck className="w-8 h-8 text-indigo-400" />,
            title: "x402 Payments",
            desc: "Programmable USDC subscription streams on Base. Pay once, access forever with on-chain guarantees."
          },
          {
            icon: <Play className="w-8 h-8 text-purple-400" />,
            title: "Premium Player",
            desc: "High-fidelity, token-gated streaming. Only verified subscribers can decrypt and view exclusive content."
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
            className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all duration-300 group backdrop-blur-md hover:-translate-y-2 hover:shadow-2xl hover:shadow-cyan-900/10"
          >
            <div className="mb-8 p-5 rounded-2xl bg-slate-950/50 w-fit group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-black/20 border border-white/5 group-hover:border-cyan-500/20 ring-1 ring-white/5">
              {feature.icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed text-lg font-light group-hover:text-slate-300 transition-colors">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Featured Creators Section */}
      <div className="relative z-10">
        <FeaturedCreators />
      </div>

      {/* Content Teaser */}
      <section className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 aspect-video md:aspect-[2/1] flex items-center justify-center border border-white/10 group shadow-2xl shadow-indigo-900/20">
          {/* Dynamic Background */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-30 blur-md scale-105 group-hover:scale-100 transition-transform duration-[10s]" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/60 to-transparent" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10 text-center space-y-8 p-12 max-w-4xl"
          >
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none">
              Originals.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Only on ContentHub.</span>
            </h2>
            <p className="text-slate-300 max-w-lg mx-auto text-xl font-light">
              Join thousands of users discovering the next generation of Web3 creators.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold border border-white/10 transition-all hover:scale-105"
            >
              Browse Library <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-slate-600 pb-10 text-sm">
        <p>© 2026 ContentHub. Decentralized & Unstoppable.</p>
      </footer>
    </div>
  );
}
