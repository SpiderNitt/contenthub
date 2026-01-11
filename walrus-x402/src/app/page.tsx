'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { ArrowRight, Play, Globe, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import FeaturedCreators from '@/components/FeaturedCreators';

export default function Home() {
  const { login, authenticated } = usePrivy();

  return (
    <div className="flex flex-col gap-24">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center text-center space-y-12">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[80px] -z-10 animate-pulse delay-700" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-5xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-cyan-400 text-sm font-medium mb-4 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Live on Base Sepolia
          </div>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white leading-[1.1]">
            Stream. Read. <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Own.</span>
            <br />
            The Future of Content.
          </h1>
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            The first premium content marketplace powered by decentralized storage and x402 payments.
            <span className="text-slate-200 block mt-2">Fully decentralized. Censorship resistant. Creator owned.</span>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          {authenticated ? (
            <Link
              href="/explore"
              className="px-10 py-5 rounded-full bg-white text-slate-950 font-bold text-xl hover:bg-cyan-50 transition-colors flex items-center gap-3 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.4)]"
            >
              Start Exploring <ArrowRight className="w-6 h-6" />
            </Link>
          ) : (
            <button
              onClick={login}
              className="px-10 py-5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xl transition-all shadow-[0_0_40px_-10px_rgba(34,211,238,0.4)] hover:shadow-[0_0_60px_-10px_rgba(34,211,238,0.5)] flex items-center gap-3"
            >
              Connect Wallet <ArrowRight className="w-6 h-6" />
            </button>
          )}
          <Link
            href="/creators"
            className="px-10 py-5 rounded-full bg-slate-900/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-900 text-white font-medium transition-all backdrop-blur-sm"
          >
            For Creators
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-900/5 to-transparent -z-10" />
        {[
          {
            icon: <Globe className="w-10 h-10 text-cyan-400" />,
            title: "Decentralized Storage",
            desc: "Content is stored on decentralized infrastructure, ensuring permanence, lower costs, and censorship resistance."
          },
          {
            icon: <ShieldCheck className="w-10 h-10 text-blue-400" />,
            title: "x402 Payments",
            desc: "Seamless, programmable USDC subscription payments on Base. Pay once, access forever (or until expiry) with on-chain guarantees."
          },
          {
            icon: <Play className="w-10 h-10 text-purple-400" />,
            title: "Premium Player",
            desc: "High-fidelity streaming player. Token-gated access ensures only subscribers can decrypt and view your exclusive content."
          }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="p-10 rounded-3xl bg-slate-900/50 border border-white/5 hover:border-cyan-500/30 transition-all group hover:-translate-y-2"
          >
            <div className="mb-6 p-4 rounded-2xl bg-slate-950 w-fit group-hover:scale-110 transition-transform shadow-lg shadow-cyan-900/20">
              {feature.icon}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed text-lg">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Featured Creators */}
      <FeaturedCreators />

      {/* Content Teaser (Carousel Placeholder) */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 aspect-video md:aspect-[21/9] flex items-center justify-center border border-white/5 group">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')] bg-cover bg-center opacity-40 blur-sm scale-110 group-hover:scale-100 transition-transform duration-[20s]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        <div className="relative z-10 text-center space-y-6 p-6">
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Originals.<br />Only on ContentHub.
          </h2>
          <p className="text-slate-300 max-w-md mx-auto text-lg">
            Join thousands of users streaming premium Web3 content.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold border border-white/10 transition-colors"
          >
            Browse Library <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
