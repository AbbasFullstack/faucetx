import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // 1) Get session from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const body = await req.json();
    const { answer, expected, walletAddress } = body;

    // 2) Validate captcha
    if (answer === undefined || expected === undefined) {
      return NextResponse.json({ error: 'Missing captcha' }, { status: 400 });
    }
    if (parseInt(answer) !== parseInt(expected)) {
      return NextResponse.json({ error: 'Wrong captcha answer' }, { status: 400 });
    }

    // 3) Check timer (10 minutes)
    const { data: balanceRow, error: fetchErr } = await supabase
      .from('balances')
      .select('last_claim, balance, total_claims')
      .eq('user_id', user.id)
      .single();

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    const now = new Date();
    if (balanceRow?.last_claim) {
      const lastClaim = new Date(balanceRow.last_claim);
      const diff = now.getTime() - lastClaim.getTime();
      const remaining = 10 * 60 * 1000 - diff;
      if (remaining > 0) {
        return NextResponse.json({
          error: 'Please wait',
          secondsLeft: Math.ceil(remaining / 1000),
        }, { status: 429 });
      }
    }

    // 4) Random reward (0.0001 to 0.0010 POL)
    const reward = 0.0001 + Math.random() * 0.0009;

    // 5) Upsert balance row if doesn't exist
    const currentBalance = balanceRow?.balance ? Number(balanceRow.balance) : 0;
    const currentClaims = balanceRow?.total_claims || 0;

    if (!balanceRow) {
      const { error } = await supabase.from('balances').insert({
        user_id: user.id,
        balance: reward,
        total_claims: 1,
        last_claim: now.toISOString(),
        wallet_address: walletAddress || null,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const updateData: any = {
        balance: currentBalance + reward,
        total_claims: currentClaims + 1,
        last_claim: now.toISOString(),
      };
      if (walletAddress && !balanceRow.wallet_address) {
        updateData.wallet_address = walletAddress;
      }
      const { error } = await supabase
        .from('balances')
        .update(updateData)
        .eq('user_id', user.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 6) Log claim
    await supabase.from('claims').insert({
      user_id: user.id,
      amount: reward,
    });

    return NextResponse.json({
      success: true,
      reward: reward,
      newBalance: currentBalance + reward,
      nextClaimAt: new Date(now.getTime() + 10 * 60 * 1000).toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
