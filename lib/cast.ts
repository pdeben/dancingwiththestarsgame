export const PAIRS = [
  { id: 1,  celeb: 'Tatyana Ali',         pro: 'Pasha Pashkov' },
  { id: 2,  celeb: 'Tyler Cameron',       pro: 'Sharna Burgess' },
  { id: 3,  celeb: 'Giada de Laurentiis', pro: 'Alan Bersten' },
  { id: 4,  celeb: 'Jenna Dewan',         pro: 'Val Chmerkovskiy' },
  { id: 5,  celeb: 'Ezra Frech',          pro: 'Daniella Karagach' },
  { id: 6,  celeb: 'Amber Glenn',         pro: 'Pasha Pashkov' },
  { id: 7,  celeb: 'Maura Higgins',       pro: 'Mark Ballas' },
  { id: 8,  celeb: 'Conner Leavitt',      pro: 'Adele Zaikman' },
  { id: 9,  celeb: 'Ciara Miller',        pro: 'Brandon Armstrong' },
  { id: 10, celeb: 'Sarah Jane Nader',    pro: 'Hailey Bills' },
  { id: 11, celeb: 'Jackson Olson',       pro: 'Emma Slater' },
  { id: 12, celeb: 'Guillermo Rodriguez', pro: 'Witney Carson' },
  { id: 13, celeb: 'Harry Shum Jr.',      pro: 'Jenna Johnson' },
  { id: 14, celeb: 'Julia Stiles',        pro: 'Ezra Sosa' },
  { id: 15, celeb: 'Connor Wood',         pro: 'Rylee Arnold' },
  { id: 16, celeb: 'Taylor Hanson',       pro: 'Britt Stewart' },
]

export const PTS = { elim: 5, f4: 15, winner: 50 }

export function pairById(id: number) {
  return PAIRS.find(p => p.id === id)
}

export function calcPoints(picks: any, admin: any) {
  let pts = 0
  const detail: { label: string; pts: number; correct: boolean | null }[] = []
  if (!picks || !admin) return { pts, detail }

  const elim: Record<string, number> = admin.eliminated || {}
  const actualF4: number[] = admin.actual_final4 || []
  const actualWin: number | null = admin.actual_winner || null

  for (const pairId of (picks.final4 || [])) {
    const name = pairById(pairId)?.celeb || '?'
    if (actualF4.length > 0) {
      const correct = actualF4.includes(pairId)
      if (correct) pts += PTS.f4
      detail.push({ label: `Final 4: ${name}`, pts: PTS.f4, correct })
    } else {
      detail.push({ label: `Final 4: ${name}`, pts: PTS.f4, correct: null })
    }
  }

  if (picks.winner) {
    const name = pairById(picks.winner)?.celeb || '?'
    if (actualWin !== null) {
      const correct = picks.winner === actualWin
      if (correct) pts += PTS.winner
      detail.push({ label: `Winner: ${name}`, pts: PTS.winner, correct })
    } else {
      detail.push({ label: `Winner: ${name}`, pts: PTS.winner, correct: null })
    }
  }

  for (const [wk, pairId] of Object.entries(picks.weekly || {})) {
    const wkNum = parseInt(wk)
    const pid = pairId as number
    const name = pairById(pid)?.celeb || '?'
    const actualEntry = Object.entries(elim).find(([, w]) => parseInt(String(w)) === wkNum)
    const aId = actualEntry ? parseInt(actualEntry[0]) : null
    if (aId !== null) {
      const correct = pid === aId
      if (correct) pts += PTS.elim
      detail.push({ label: `Wk ${wkNum}: ${name}`, pts: PTS.elim, correct })
    } else {
      detail.push({ label: `Wk ${wkNum}: ${name}`, pts: PTS.elim, correct: null })
    }
  }

  return { pts, detail }
}
