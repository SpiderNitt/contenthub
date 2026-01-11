'use client';

// import { Dialog, ... } from '@/components/ui/dialog'; // Removed
import { useX402 } from '@/hooks/useX402';
import { usePrivy } from '@privy-io/react-auth';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Simplified Modal implementation if UI lib not present
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                {children}
            </div>
        </div>
    );
}

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: {
        name: string;
        price: string;
        period: string;
        creatorAddress: string;
        tierId: number;
    };
    onSuccess: (tierId: number) => void;
}

export default function SubscriptionModal({ isOpen, onClose, plan, onSuccess }: SubscriptionModalProps) {
    const { handlePayment, paymentState, setPaymentState, resetPayment, error: paymentError } = useX402();
    const { getAccessToken } = usePrivy();
    const router = useRouter();
    const [error, setError] = useState('');

    const onSubscribe = async () => {
        try {
            setError('');
            const token = await getAccessToken();

            // 1. Initial request to backend to get Payment Metadata (returns 402)
            const res = await fetch('/api/x402/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    creatorAddress: plan.creatorAddress,
                    tierId: plan.tierId,
                    idempotencyKey: crypto.randomUUID()
                })
            });

            if (res.status === 402) {
                const metadata = await res.json();
                console.log("[SubscriptionModal] Received payment metadata:", metadata);

                // 2. Trigger Payment (this will now wait for confirmation)
                let txHash;
                try {
                    txHash = await handlePayment(metadata);
                } catch (paymentErr: any) {
                    // Payment errors are already handled in useX402
                    throw paymentErr;
                }

                console.log("[SubscriptionModal] Payment confirmed, sending proof:", txHash);

                // 3. Retry with Proof (transaction is already confirmed)
                const retryRes = await fetch('/api/x402/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-PAYMENT': txHash
                    },
                    body: JSON.stringify({
                        creatorAddress: plan.creatorAddress,
                        tierId: plan.tierId,
                        idempotencyKey: crypto.randomUUID()
                    })
                });

                if (retryRes.ok) {
                    const result = await retryRes.json();
                    console.log("[SubscriptionModal] Subscription activated:", result);
                    setPaymentState('success');
                    setTimeout(() => {
                        onSuccess(plan.tierId);
                        onClose();
                        router.refresh();
                    }, 2000);
                } else {
                    const errorData = await retryRes.json();
                    throw new Error(errorData.details || errorData.error || "Activation failed after payment");
                }
            } else if (res.ok) {
                // Already subscribed
                setPaymentState('success');
                setTimeout(() => {
                    onClose();
                    router.refresh();
                }, 1000);
            } else {
                const errorData = await res.json();
                throw new Error(errorData.details || errorData.error || "Request failed");
            }
        } catch (e: any) {
            console.error("[SubscriptionModal] Error:", e);
            setError(e.message || "Payment failed");
            setPaymentState('error');
        }
    };

    return (
        <Modal open={isOpen} onClose={onClose}>
            <div className="space-y-6 text-center">
                <h2 className="text-2xl font-bold text-white">Subscribe to {plan.name}</h2>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-sm text-slate-400">Price</div>
                    <div className="text-3xl font-bold text-white">{plan.price} ETH</div>
                    <div className="text-xs text-slate-500">per {plan.period}</div>
                </div>

                {paymentState === 'idle' && (
                    <button
                        onClick={onSubscribe}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:brightness-110 transition-all shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]"
                    >
                        Pay with Wallet
                    </button>
                )}

                {(paymentState === 'paying' || paymentState === 'confirming' || paymentState === 'verifying') && (
                    <div className="flex flex-col items-center gap-3 py-4">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                        <p className="text-slate-300 animate-pulse">
                            {paymentState === 'paying' && 'Confirm in Wallet...'}
                            {paymentState === 'confirming' && 'Confirming Transaction...'}
                            {paymentState === 'verifying' && 'Verifying Subscription...'}
                        </p>
                        {paymentState === 'confirming' && (
                            <p className="text-xs text-slate-500">Waiting for blockchain confirmation</p>
                        )}
                    </div>
                )}

                {paymentState === 'success' && (
                    <div className="flex flex-col items-center gap-3 py-4">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                        <p className="text-white font-medium">Subscription Activated!</p>
                    </div>
                )}

                {paymentState === 'error' && (
                    <div className="flex flex-col items-center gap-3 py-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <p className="text-red-400 text-sm font-medium">
                            {paymentError?.message || error || 'Something went wrong.'}
                        </p>
                        {paymentError?.code && (
                            <p className="text-xs text-slate-500">Error code: {paymentError.code}</p>
                        )}
                        <button
                            onClick={() => {
                                resetPayment();
                                setError('');
                            }}
                            className="text-sm text-slate-400 hover:text-white underline transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                <div className="text-xs text-slate-600">
                    Powered by x402 on Base Sepolia.
                </div>
            </div>
        </Modal>
    );
}
