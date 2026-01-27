'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import Image from 'next/image';

export default function Navbar() {
    const { login, logout, authenticated, ready, user } = usePrivy();
    const pathname = usePathname();

    const truncateAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const navLinks = [
        { href: '/explore', label: 'Explore' },
        { href: '/creators', label: 'Creators' },
        ...(authenticated ? [
            { href: '/library', label: 'My Library' },
            { href: '/dashboard', label: 'Dashboard' }
        ] : [])
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group relative">
                    <div className="absolute -inset-2 bg-cyan-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative w-10 h-10 flex items-center justify-center group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                        <Image src="/logo.png" alt="ContentHub" fill className="object-contain" />
                    </div>
                    <span className="relative font-bold text-white tracking-tight text-lg">Content<span className="text-cyan-400">Hub</span></span>
                </Link>

                {/* Links */}
                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`relative transition-colors ${pathname === link.href ? 'text-white' : 'hover:text-white'}`}
                        >
                            {link.label}
                            {pathname === link.href && (
                                <motion.div
                                    layoutId="navbar-underline"
                                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.5)]"
                                />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4">
                    {!ready ? (
                        <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
                    ) : authenticated ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
                                <Wallet className="w-4 h-4 text-cyan-500" />
                                <span className="text-sm font-mono text-slate-300">
                                    {user?.wallet?.address ? truncateAddress(user.wallet.address) : 'No Wallet'}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={login}
                            className="px-5 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_-5px_rgba(34,211,238,0.5)]"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
