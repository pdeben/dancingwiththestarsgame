import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { PAIRS, pairById } from '@/lib/cast'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Fetch current admin state
  const { data: adminRow } = await supabaseAdmin
    .from('admin')
    .select('*')
    .eq('id', 1)
    .single()

  const admin = adminRow || { id: 1, current_week: 1, eliminated: {}, picks_locked: false, actual_final4: [], actual_winner: null }
  const elim: Record<string, number> = admin.eliminated || {}
  const alreadyElim = Object.entries(elim)
    .map(([pid, wk]) => `Week ${wk}: ${pairById(parseInt(pid))?.celeb}`)
    .join(', ') || 'none'

  const castList = PAIRS.map(p => `ID ${p.id}: ${p.celeb}`).join(', ')

  const prompt = `Dancing with the Stars Season 35 (2026) started September 15, 2026. Today is ${new Date().toDateString()}.

Cast with IDs: ${castList}

Already recorded eliminations: ${alreadyElim}

What NEW eliminations have happened in Season 35 NOT already recorded? Give current week and any Final Four/winner if announced.

Respond with ONLY raw JSON, no markdown:
{"eliminations":[{"pairId":<number>,"week":<number>}],"finalFour":[<numbers>] or null,"winner":<number> or null,"currentWeek":<number>,"confidence":"high" or "low","source":"<one sentence>"}`

  // Call Anthropic API with web search
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Anthropic API failed', status: response.status })
  }

  const data = await response.json()
  const textBlock = data.content?.find((b: any) => b.type === 'text')
  if (!textBlock?.text) {
    return NextResponse.json({ error: 'no text in response' })
  }

  let result: any
  try {
    const clean = textBlock.text.replace(/```[a-z]*\n?/g, '').trim()
    result = JSON.parse(clean)
  } catch (e) {
    return NextResponse.json({ error: 'JSON parse failed', raw: textBlock.text })
  }

  if (!result || result.confidence === 'low') {
    return NextResponse.json({ message: 'low confidence, no update' })
  }

  const newElim = { ...elim }
  let latestWeek = admin.current_week || 1
  const applied: string[] = []

  for (const e of result.eliminations || []) {
    const pid = parseInt(e.pairId)
    const wk = parseInt(e.week)
    if (!pid || !wk || isNaN(pid) || isNaN(wk)) continue
    const p = pairById(pid)
    if (!p) continue
    const weekTaken = Object.values(newElim).includes(wk)
    if (weekTaken) continue
    newElim[pid] = wk
    if (wk >= latestWeek) latestWeek = wk + 1
    applied.push(`Wk ${wk}: ${p.celeb}`)
  }

  const updates: any = {}
  if (Object.keys(newElim).length !== Object.keys(elim).length) {
    updates.eliminated = newElim
    updates.current_week = latestWeek
    if (applied.some(a => a.startsWith('Wk 1')) && !admin.picks_locked) {
      updates.picks_locked = true
    }
  }

  if (result.finalFour?.length === 4 && !(admin.actual_final4?.length)) {
    const valid = result.finalFour.map(Number).filter((id: number) => PAIRS.find(p => p.id === id))
    if (valid.length === 4) updates.actual_final4 = valid
  }

  if (result.winner && !admin.actual_winner) {
    const wid = parseInt(result.winner)
    if (PAIRS.find(p => p.id === wid)) updates.actual_winner = wid
  }

  if (Object.keys(updates).length > 0) {
    await supabaseAdmin.from('admin').upsert({ id: 1, ...admin, ...updates })
  }

  await supabaseAdmin.from('sync_log').insert({
    ran_at: new Date().toISOString(),
    found: applied.join(', ') || 'none',
    source: result.source || '',
    confidence: result.confidence,
  })

  return NextResponse.json({ applied, updates, source: result.source })
}
