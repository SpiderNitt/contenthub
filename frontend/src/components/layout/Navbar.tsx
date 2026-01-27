'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
    const { login, logout, authenticated, ready, user } = usePrivy();
    const pathname = usePathname();

    const truncateAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const navLinks = [
        { href: '/explore', label: 'Explore' },
        { href: '/creators', label: 'Creators' },
        ...(authenticated ? [{ href: '/library', label: 'My Library' }] : [])
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
            <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <span className="font-bold text-white text-lg">W</span>
                    </div>
                    <span className="font-bold text-white tracking-tight">Content<span className="text-cyan-400">Hub</span></span>
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
                                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-cyan-500 rounded-full"
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
