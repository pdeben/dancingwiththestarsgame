import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabaseAdmin.from('admin').select('*').eq('id', 1).single()
  return NextResponse.json(data || { id: 1, current_week: 1, eliminated: {}, picks_locked: false, actual_final4: [], actual_winner: null })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data: existing } = await supabaseAdmin.from('admin').select('*').eq('id', 1).single()
  const current = existing || { id: 1, current_week: 1, eliminated: {}, picks_locked: false, actual_final4: [], actual_winner: null }
  const updated = { ...current, ...body, id: 1 }
  const { data, error } = await supabaseAdmin.from('admin').upsert(updated).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
