import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function mkCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json([])
  const { data } = await supabaseAdmin
    .from('groups')
    .select('*')
    .contains('member_ids', [userId])
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const { name, userId, userName, userAvatar } = await req.json()
  const code = mkCode()
  const { data, error } = await supabaseAdmin.from('groups').insert({
    code,
    name,
    created_by: userId,
    member_ids: [userId],
    members: { [userId]: { name: userName, avatar: userAvatar, isAdmin: true, joinedAt: Date.now() } },
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const { code, userId, userName, userAvatar, action } = await req.json()
  const { data: group } = await supabaseAdmin.from('groups').select('*').eq('code', code).single()
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  if (action === 'join') {
    const members = { ...group.members, [userId]: { name: userName, avatar: userAvatar, isAdmin: false, joinedAt: Date.now() } }
    const member_ids = [...new Set([...group.member_ids, userId])]
    const { data } = await supabaseAdmin.from('groups').update({ members, member_ids }).eq('code', code).select().single()
    return NextResponse.json(data)
  }

  if (action === 'leave') {
    const members = { ...group.members }
    delete members[userId]
    const member_ids = group.member_ids.filter((id: string) => id !== userId)
    const { data } = await supabaseAdmin.from('groups').update({ members, member_ids }).eq('code', code).select().single()
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const { code } = await req.json()
  await supabaseAdmin.from('groups').delete().eq('code', code)
  return NextResponse.json({ ok: true })
}
