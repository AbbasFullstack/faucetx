'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Droplets, Timer, Shield, Wallet, Trophy, ArrowRight, Zap, Users } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] text-white relative">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-500/[0.07] blur-[140px] rounded-full" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-blue-500/[0.05] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[400px] bg-emerald-500/[0.05] blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-black/30 backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-cyan-500/30 blur-md" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">FaucetX</h1>
              <p className="text-[11px] text-white/40">Crypto Rewards Platform</p>
            </div>
          </div>
          {user ? (
            <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-sm hover:scale-[1.02] transition-all">
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link href="/auth" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-semibold text-sm hover:bg-white/90 transition-all">
              Login
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 text-[11px] font-bold text-cyan-400 mb-8">
          <Zap className="w-3.5 h-3.5" /> 100% Free · No Investment Needed
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent mb-6">
          Claim Free Crypto
          <br />
          Every 10 Minutes
        </h1>

        <p className="text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
          Signup karein, har 10 minute mein rewards claim karein, aur jab balance threshold par pohnche toh
          <span className="text-cyan-400 font-semibold"> seedha apne wallet mein withdraw</span> karein!
        </p>

        <div className="flex items-center justify-center gap-3 mb-14 flex-wrap">
          <Link href={user ? '/dashboard' : '/auth'} className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all">
            <Droplets className="w-5 h-5" /> Start Earning Now
          </Link>
          <a href="#how" className="flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-white/80 hover:bg-white/10 transition-all">
            How It Works?
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto">
          {[
            { num: '10 min', label: 'Claim Timer' },
            { num: '100%', label: 'Free to Use' },
            { num: 'Instant', label: 'Auto Payouts' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
              <p className="text-2xl font-bold text-cyan-400">{s.num}</p>
              <p className="text-[11px] text-white/40 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="relative max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-8">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, step: '1', title: 'Account Banayein', desc: 'Free signup - sirf email aur password chahiye. Koi investment nahi!' },
            { icon: Timer, step: '2', title: 'Har 10 Min Claim Karein', desc: 'Captcha solve karein aur random rewards jeetein - har 10 minute mein!' },
            { icon: Wallet, step: '3', title: 'Wallet Mein Withdraw', desc: 'Threshold complete hote hi rewards seedha aapke crypto wallet mein!' },
          ].map(item => (
            <div key={item.step} className="relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-xl hover:bg-white/[0.06] transition-all">
              <div className="absolute top-4 right-4 text-4xl font-bold text-white/5">{item.step}</div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-bold mb-2">{item.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-center text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-8">
          Why FaucetX?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: Shield, title: 'Anti-Bot Protection', desc: 'Math captcha har claim par - bots ka koi chance nahi.' },
            { icon: Zap, title: 'Auto Payouts', desc: 'Server-side signing se instant withdrawals - manual jhanjhat nahi.' },
            { icon: Trophy, title: 'Leaderboard', desc: 'Top earners mein apna naam dekhein aur compete karein.' },
            { icon: Timer, title: 'Fair Timer', desc: 'Har user ke liye same 10-minute rule - koi cheating nahi.' },
          ].map(f => (
            <div key={f.title} className="flex items-start gap-4 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-5xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-3xl p-10 text-center backdrop-blur-xl">
          <h2 className="text-3xl font-bold mb-3">Ready to Start Earning? 💧</h2>
          <p className="text-white/50 max-w-md mx-auto mb-8">
            Aaj hi join karein aur pehla claim sirf 1 minute mein karein!
          </p>
          <Link href={user ? '/dashboard' : '/auth'} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold shadow-xl shadow-cyan-500/25 hover:scale-[1.02] transition-all">
            <Droplets className="w-5 h-5" /> Create Free Account
          </Link>
        </div>
      </section>

      <footer className="relative border-t border-white/5 py-8">
        <p className="text-center text-[11px] text-white/30">
          © 2026 FaucetX · Testnet rewards for learning · Made with ❤️ by Abbas Hussain
        </p>
      </footer>
    </main>
  );
}
