import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  const userIds = req.nextUrl.searchParams.get('userIds')

  if (userIds) {
    const ids = userIds.split(',')
    const { data } = await supabaseAdmin.from('picks').select('*').in('user_id', ids)
    return NextResponse.json(data || [])
  }

  if (userId) {
    const { data } = await supabaseAdmin.from('picks').select('*').eq('user_id', userId).single()
    return NextResponse.json(data || {})
  }

  return NextResponse.json({})
}

export async function POST(req: NextRequest) {
  const { userId, ...updates } = await req.json()
  const { data: existing } = await supabaseAdmin.from('picks').select('*').eq('user_id', userId).single()
  const current = existing || { user_id: userId, final4: [], winner: null, weekly: {} }
  const merged = { ...current, ...updates, user_id: userId }
  const { data, error } = await supabaseAdmin.from('picks').upsert(merged).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
