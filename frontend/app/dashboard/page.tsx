'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Droplets, LogOut, Timer, Trophy, Wallet, Zap, RefreshCw, History, ExternalLink, Receipt } from 'lucide-react';

interface Claim {
  id: string;
  amount: number;
  created_at: string;
}

interface Payout {
  id: string;
  amount: number;
  address: string;
  tx_hash: string;
  status: string;
  created_at: string;
}

const MIN_WITHDRAW = 0.0005;

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [totalClaims, setTotalClaims] = useState<number>(0);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [walletInput, setWalletInput] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [captcha, setCaptcha] = useState<{ a: number; b: number; op: '+' | '-' } | null>(null);
  const [answer, setAnswer] = useState('');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ amount: number } | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawResult, setWithdrawResult] = useState<{ txHash: string; amount: number } | null>(null);
  const [withdrawError, setWithdrawError] = useState('');

  // Auth + initial data
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
      await loadData(session.user.id);
    })();
  }, []);

  const loadData = async (userId: string) => {
    const { data: balRow } = await supabase
      .from('balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (balRow) {
      setBalance(Number(balRow.balance) || 0);
      setTotalClaims(balRow.total_claims || 0);
      setWalletAddress(balRow.wallet_address || '');
      setWalletInput(balRow.wallet_address || '');

      if (balRow.last_claim) {
        const last = new Date(balRow.last_claim).getTime();
        const next = last + 10 * 60 * 1000;
        const now = Date.now();
        setSecondsLeft(Math.max(0, Math.ceil((next - now) / 1000)));
      }
    } else {
      await supabase.from('balances').insert({
        user_id: userId,
        balance: 0,
        total_claims: 0,
      });
    }

    // Recent claims
    const { data: claimsData } = await supabase
      .from('claims')
      .select('id, amount, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    setClaims(claimsData || []);

    // Withdraw history
    const { data: payoutsData } = await supabase
      .from('payouts')
      .select('id, amount, address, tx_hash, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    setPayouts(payoutsData || []);

    // Leaderboard
    const { data: leaders } = await supabase
      .from('balances')
      .select('user_id, total_claims, balance')
      .order('total_claims', { ascending: false })
      .limit(10);
    setLeaderboard(leaders || []);

    generateCaptcha();
  };

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 20) + 5;
    const b = Math.floor(Math.random() * 10) + 1;
    const op: '+' | '-' = Math.random() > 0.5 ? '+' : '-';
    setCaptcha({ a, b, op });
    setAnswer('');
  };

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const saveWallet = async () => {
    if (!walletInput.startsWith('0x') || walletInput.length !== 42) {
      setError('Invalid wallet address (0x se shuru, 42 characters)');
      return;
    }
    const { error } = await supabase
      .from('balances')
      .update({ wallet_address: walletInput })
      .eq('user_id', user.id);
    if (error) {
      setError('Save failed: ' + error.message);
    } else {
      setWalletAddress(walletInput);
      setError('');
    }
  };

  const doWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawError('');
    setWithdrawResult(null);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        setWithdrawError(json.error);
      } else {
        setWithdrawResult({ txHash: json.txHash, amount: json.amount });
        setBalance(0);
        setPayouts(p => [{
          id: Date.now().toString(),
          amount: json.amount,
          address: walletAddress,
          tx_hash: json.txHash,
          status: 'sent',
          created_at: new Date().toISOString(),
        }, ...p].slice(0, 10));
      }
    } catch {
      setWithdrawError('Network error');
    }
    setWithdrawing(false);
  };

  const doClaim = async () => {
    if (!captcha) return;
    if (secondsLeft > 0) {
      setError('Timer abhi chal raha hai!');
      return;
    }
    setError('');
    setWithdrawError('');
    setLoading(true);

    const expected = captcha.op === '+' ? captcha.a + captcha.b : captcha.a - captcha.b;

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answer: parseInt(answer),
          expected,
          walletAddress: walletInput || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
        if (json.secondsLeft) setSecondsLeft(json.secondsLeft);
        generateCaptcha();
      } else {
        setSuccess({ amount: json.reward });
        setBalance(json.newBalance);
        setTotalClaims(t => t + 1);
        setSecondsLeft(600);
        setClaims(c => [{ id: Date.now().toString(), amount: json.reward, created_at: new Date().toISOString() }, ...c].slice(0, 10));
        generateCaptcha();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const formatMinutes = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const shortAddr = (a: string) => (a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '');

  const canClaim = secondsLeft === 0 && captcha && answer !== '';

  return (
    <main className="min-h-screen bg-[#050505] text-white relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-500/[0.07] blur-[140px] rounded-full" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[400px] bg-blue-500/[0.05] blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-black/30 backdrop-blur-2xl">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold">FaucetX</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-white/50">{user?.email}</span>
            <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-xs font-semibold text-white/70 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="relative max-w-3xl mx-auto px-4 py-8 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">
              <Wallet className="w-3 h-3" /> Balance
            </div>
            <p className="text-2xl font-bold text-cyan-400 font-mono">{balance.toFixed(4)}</p>
            <p className="text-[10px] text-white/40">POL</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">
              <Trophy className="w-3 h-3" /> Claims
            </div>
            <p className="text-2xl font-bold">{totalClaims}</p>
            <p className="text-[10px] text-white/40">Total</p>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">
              <Timer className="w-3 h-3" /> Next Claim
            </div>
            <p className={`text-2xl font-bold font-mono ${secondsLeft === 0 ? 'text-emerald-400' : 'text-white/60'}`}>
              {secondsLeft === 0 ? 'READY!' : formatMinutes(secondsLeft)}
            </p>
            <p className="text-[10px] text-white/40">{secondsLeft === 0 ? 'Claim now' : 'Wait'}</p>
          </div>
        </div>

        {/* Wallet Address */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3">
            <Wallet className="w-3 h-3" /> Wallet Address (for payouts)
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="0x... (your Polygon Amoy address)"
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono focus:outline-none focus:border-cyan-500 transition"
            />
            <button
              onClick={saveWallet}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
            >
              {walletAddress && walletAddress === walletInput ? '✓ Saved' : 'Save'}
            </button>
          </div>
          {!walletAddress && (
            <p className="text-[10px] text-amber-400 mt-2">⚠️ Payouts ke liye wallet address zaroori hai!</p>
          )}
        </div>

        {/* Withdraw */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Withdraw to Wallet
            </h2>
            <span className="text-[10px] text-white/40">Min: {MIN_WITHDRAW} POL</span>
          </div>
          {withdrawError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
              <p className="text-red-400 text-xs">{withdrawError}</p>
            </div>
          )}
          {withdrawResult && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-3">
              <p className="text-emerald-400 text-xs font-bold mb-1">✅ {withdrawResult.amount.toFixed(4)} POL bhej diya!</p>
              <a href={`https://amoy.polygonscan.com/tx/${withdrawResult.txHash}`} target="_blank" className="flex items-center gap-1 font-mono text-[10px] text-emerald-300 underline break-all">
                <ExternalLink className="w-3 h-3 flex-shrink-0" /> {withdrawResult.txHash}
              </a>
            </div>
          )}
          <button
            onClick={doWithdraw}
            disabled={withdrawing || balance < MIN_WITHDRAW || !walletAddress}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold disabled:opacity-40 hover:scale-[1.01] transition-all"
          >
            {withdrawing ? 'Sending...' : 'Withdraw Now →'}
          </button>
          <p className="text-[10px] text-white/30 mt-2 text-center">Payouts Polygon Amoy testnet par bheje jate hain</p>
        </div>

        {/* Claim Box */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Claim Reward
            </h2>
            <button onClick={generateCaptcha} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition" title="New captcha">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {captcha && (
            <div className="bg-black/30 border border-white/10 rounded-2xl p-5 text-center mb-4">
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2 font-bold">Solve this</p>
              <p className="text-4xl font-bold font-mono text-cyan-400">
                {captcha.a} {captcha.op} {captcha.b} = ?
              </p>
            </div>
          )}

          <input
            type="number"
            placeholder="Enter answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={secondsLeft > 0}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-center focus:outline-none focus:border-cyan-500 transition mb-3 disabled:opacity-50"
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          {success && success.amount > 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-3">
              <p className="text-emerald-400 text-xs font-bold">
                🎉 +{success.amount.toFixed(4)} POL earned!
              </p>
            </div>
          )}

          <button
            onClick={doClaim}
            disabled={!canClaim || loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] transition-all"
          >
            {loading ? 'Claiming...' : secondsLeft > 0 ? `Wait ${formatMinutes(secondsLeft)}` : 'Claim Reward →'}
          </button>
        </div>

        {/* Recent Claims */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2 mb-4">
            <History className="w-3.5 h-3.5" /> Recent Claims
          </h2>
          {claims.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-4">Abhi koi claim nahi - pehla claim karein!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {claims.map((c, i) => (
                <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Reward Claimed</p>
                      <p className="text-[10px] text-white/40">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-emerald-400 font-mono">+{Number(c.amount).toFixed(4)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Withdraw History */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2 mb-4">
            <Receipt className="w-3.5 h-3.5 text-cyan-400" /> Withdraw History
          </h2>
          {payouts.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-4">Abhi koi withdraw nahi hua!</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {payouts.map((p, i) => (
                <a
                  key={i}
                  href={`https://amoy.polygonscan.com/tx/${p.tx_hash}`}
                  target="_blank"
                  className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-lg p-3 hover:bg-white/[0.06] transition"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">Payout → {shortAddr(p.address)}</p>
                      <p className="text-[10px] text-white/40">{new Date(p.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-cyan-400 font-mono">-{Number(p.amount).toFixed(4)}</p>
                    <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase">
                      {p.status}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl">
          <h2 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2 mb-4">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Leaderboard
          </h2>
      <div className="space-y-2">
            {leaderboard.map((row, i) => {
              const isMe = row.user_id === user?.id;
              return (
                <div key={row.user_id} className={`flex items-center justify-between rounded-lg p-3 border ${isMe ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/[0.03] border-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : i === 2 ? 'bg-orange-700/20 text-orange-400' : 'bg-white/5 text-white/40'}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-xs font-semibold">{isMe ? 'You 🎉' : `User ...${row.user_id.slice(-4)}`}</p>
                      <p className="text-[10px] text-white/40">{row.total_claims} claims</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-cyan-400 font-mono">{Number(row.balance).toFixed(4)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
