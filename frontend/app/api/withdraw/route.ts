import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Wallet, JsonRpcProvider, parseEther, isAddress } from 'ethers';

const RPC = `https://polygon-amoy.infura.io/v3/${process.env.INFURA_KEY}`;
const MIN_WITHDRAW = 0.0005;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const { data: row } = await supabase
      .from('balances')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!row) return NextResponse.json({ error: 'Balance nahi mila' }, { status: 400 });

    const balance = Number(row.balance);
    const address = row.wallet_address;

    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: 'Pehle sahi wallet address save karein' }, { status: 400 });
    }
    if (balance < MIN_WITHDRAW) {
      return NextResponse.json({ error: `Minimum withdraw ${MIN_WITHDRAW} POL hai` }, { status: 400 });
    }

    const pk = process.env.FAUCET_PRIVATE_KEY;
    if (!pk) return NextResponse.json({ error: 'Faucet key missing' }, { status: 500 });

    const provider = new JsonRpcProvider(RPC);
    const faucet = new Wallet(pk, provider);

    const faucetBal = await provider.getBalance(faucet.address);
    const amount = parseEther(balance.toFixed(6));
    if (faucetBal < amount) {
      return NextResponse.json({ error: 'Faucet fund khatam ho gaya' }, { status: 500 });
    }

    // Server-side signing - asli Web3 payout!
    const tx = await faucet.sendTransaction({ to: address, value: amount });

    // Balance zero + payout record
    await supabase.from('balances').update({ balance: 0 }).eq('user_id', user.id);
    await supabase.from('payouts').insert({
      user_id: user.id,
      address,
      amount: balance,
      tx_hash: tx.hash,
      status: 'sent',
    });

    return NextResponse.json({ success: true, txHash: tx.hash, amount: balance });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Payout failed' }, { status: 500 });
  }
}
