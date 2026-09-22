'use client'
import { useEffect, useState, useCallback } from 'react'
import { PAIRS, PTS, calcPoints, pairById } from '@/lib/cast'

const COLORS = ['#C9963A','#50B464','#4A8FD4','#C45478','#9B7FD4','#E07840','#4ABFCF','#B8C440']

type Admin = { id:number; current_week:number; eliminated:Record<string,number>; picks_locked:boolean; actual_final4:number[]; actual_winner:number|null }
type Picks = { user_id:string; name:string; final4:number[]; winner:number|null; weekly:Record<string,number> }
type Group = { code:string; name:string; created_by:string; member_ids:string[]; members:Record<string,{name:string;color:string;isAdmin:boolean}> }

const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--gold:#C9963A;--gdim:rgba(201,150,58,.14);--gborder:rgba(201,150,58,.28);--rose:#C45478;--rdim:rgba(196,84,120,.12);--rborder:rgba(196,84,120,.3);--green:#50B464;--grdim:rgba(80,180,100,.11);--grborder:rgba(80,180,100,.32);--blue:#4A8FD4;--bdim:rgba(74,143,212,.12);--bborder:rgba(74,143,212,.3);--bg:#060D18;--card:#0C1829;--card2:#111F33;--border:rgba(255,255,255,.07);--text:#E4ECF5;--muted:#6A8BAA}
  body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh;overflow-x:hidden}
  .tabs{display:flex;background:var(--card);border-bottom:1px solid var(--border);overflow-x:auto;scrollbar-width:none;position:sticky;top:0;z-index:10}
  .tabs::-webkit-scrollbar{display:none}
  .tab{flex:1;min-width:68px;padding:12px 5px 10px;text-align:center;font-size:11px;font-weight:600;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:color .15s,border-color .15s;white-space:nowrap;user-select:none}
  .tab.on{color:var(--gold);border-bottom-color:var(--gold)}
  .view{padding:15px;max-width:600px;margin:0 auto}
  .card{background:var(--card);border:1px solid var(--border);border-radius:13px;overflow:hidden;margin-bottom:11px}
  .card-head{padding:13px 15px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:8px}
  .card-body{padding:13px 15px}
  .banner{border-radius:13px;padding:16px 18px;margin-bottom:14px;text-align:center}
  .slabel{font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin:16px 0 9px;padding-bottom:5px;border-bottom:1px solid var(--border)}
  input[type=text]{width:100%;background:var(--card2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;padding:10px 12px;outline:none;font-family:inherit}
  input[type=text]:focus{border-color:var(--gborder)}
  .btn{border:none;border-radius:10px;font-family:inherit;font-weight:700;cursor:pointer;transition:opacity .15s;display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 17px;font-size:13px}
  .btn:active{opacity:.75}
  .btn-gold{background:var(--gold);color:#0D1B2E}
  .btn-full{width:100%;font-size:14px;padding:13px;border-radius:11px}
  .btn-sm{font-size:11px;padding:6px 11px;background:var(--card2);border:1px solid var(--border);color:var(--muted);border-radius:8px}
  .btn-outline{background:transparent;border:1px solid var(--gborder);color:var(--gold)}
  .popt{background:var(--card2);border:1.5px solid var(--border);border-radius:10px;padding:10px 12px;cursor:pointer;transition:all .14s;display:flex;align-items:center;gap:10px;user-select:none;margin-bottom:7px}
  .popt:hover{border-color:var(--gborder)}
  .popt.sel-elim{background:var(--rdim);border-color:var(--rborder)}
  .popt.sel-f4{background:var(--bdim);border-color:var(--bborder)}
  .popt.sel-win{background:rgba(201,150,58,.18);border-color:var(--gborder)}
  .pcheck{width:18px;height:18px;border-radius:5px;border:1.5px solid var(--border);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:transparent;transition:all .14s}
  .popt.sel-elim .pcheck{background:var(--rose);border-color:var(--rose);color:#fff}
  .popt.sel-f4 .pcheck{background:var(--blue);border-color:var(--blue);color:#fff}
  .popt.sel-win .pcheck{background:var(--gold);border-color:var(--gold);color:#0D1B2E}
  .badge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:14px;white-space:nowrap}
  .b-gold{background:var(--gdim);border:1px solid var(--gborder);color:var(--gold)}
  .b-blue{background:var(--bdim);border:1px solid var(--bborder);color:var(--blue)}
  .b-rose{background:var(--rdim);border:1px solid var(--rborder);color:var(--rose)}
  .b-green{background:var(--grdim);border:1px solid var(--grborder);color:var(--green)}
  .b-muted{background:var(--card2);border:1px solid var(--border);color:var(--muted)}
  .lbrow{display:flex;align-items:center;gap:11px;padding:12px 15px;border-bottom:1px solid var(--border)}
  .lbrow:last-child{border-bottom:none}
  .lbrow.me-row{background:rgba(201,150,58,.05)}
  .group-card{background:var(--card);border:1px solid var(--border);border-radius:13px;padding:14px 15px;margin-bottom:10px;cursor:pointer;transition:border-color .15s}
  .group-card:hover{border-color:var(--gborder)}
  .codebox{background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:10px 14px;font-family:monospace;font-size:22px;font-weight:700;letter-spacing:.12em;color:var(--gold);text-align:center;margin:8px 0;cursor:pointer;user-select:all}
  .bkrow{display:flex;align-items:center;padding:9px 0;border-bottom:1px solid var(--border);gap:10px}
  .bkrow:last-child{border-bottom:none}
  .weekrow{display:flex;align-items:center;gap:8px;margin-bottom:14px}
  .divider{height:1px;background:var(--border);margin:13px 0}
  .toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(90px);background:var(--green);color:#fff;font-size:13px;font-weight:600;padding:9px 20px;border-radius:28px;z-index:999;transition:transform .25s ease;white-space:nowrap;pointer-events:none}
  .toast.on{transform:translateX(-50%) translateY(0)}
  .toast.err{background:var(--rose)}
  .spinner{width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite;margin:40px auto;display:block}
  @keyframes spin{to{transform:rotate(360deg)}}
  .avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0}
`

function mkId() { return Math.random().toString(36).slice(2,10) }
function mkCode() {
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join('')
}

// Simple localStorage-based identity
function getMyId(): string {
  let id = localStorage.getItem('dwts_uid')
  if(!id){ id=mkId(); localStorage.setItem('dwts_uid',id) }
  return id
}
function getMyName(): string { return localStorage.getItem('dwts_name')||'' }
function getMyColor(): string { return localStorage.getItem('dwts_color')||COLORS[0] }

export default function App() {
  const [ready, setReady] = useState(false)
  const [myId, setMyId] = useState('')
  const [myName, setMyName] = useState('')
  const [myColor, setMyColor] = useState(COLORS[0])
  const [nameInput, setNameInput] = useState('')
  const [tab, setTab] = useState('groups')
  const [admin, setAdmin] = useState<Admin>({id:1,current_week:1,eliminated:{},picks_locked:false,actual_final4:[],actual_winner:null})
  const [myPicks, setMyPicks] = useState<Picks>({user_id:'',name:'',final4:[],winner:null,weekly:{}})
  const [groups, setGroups] = useState<Group[]>([])
  const [allPicks, setAllPicks] = useState<Picks[]>([])
  const [openGroup, setOpenGroup] = useState<Group|null>(null)
  const [groupTab, setGroupTab] = useState('lb')
  const [myPicksTab, setMyPicksTab] = useState('preseason')
  const [toast, setToast] = useState({msg:'',err:false,on:false})
  const [newGroupName, setNewGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const showToast = useCallback((msg:string,err=false)=>{
    setToast({msg,err,on:true})
    setTimeout(()=>setToast(t=>({...t,on:false})),2200)
  },[])

  useEffect(()=>{
    const name=getMyName()
    const id=getMyId()
    const color=getMyColor()
    setMyId(id); setMyName(name); setMyColor(color)
    setReady(true)
    fetch('/api/admin').then(r=>r.json()).then(d=>{if(d)setAdmin(d)})
  },[])

  useEffect(()=>{
    if(!myId||!myName) return
    fetch(`/api/picks?userId=${myId}`).then(r=>r.json()).then(d=>{if(d?.user_id)setMyPicks(d)})
    fetch(`/api/groups?userId=${myId}`).then(r=>r.json()).then(d=>{if(Array.isArray(d))setGroups(d)})
  },[myId,myName])

  useEffect(()=>{
    if(!openGroup) return
    const ids=openGroup.member_ids.join(',')
    fetch(`/api/picks?userIds=${ids}`).then(r=>r.json()).then(d=>{if(Array.isArray(d))setAllPicks(d)})
  },[openGroup])

  async function saveName(){
    const n=nameInput.trim()
    if(!n){showToast('Enter your name',true);return}
    const color=COLORS[Math.floor(Math.random()*COLORS.length)]
    localStorage.setItem('dwts_name',n)
    localStorage.setItem('dwts_color',color)
    setMyName(n); setMyColor(color)
  }

  async function savePicks(updates:Partial<Picks>){
    const merged={...myPicks,...updates,user_id:myId,name:myName}
    setMyPicks(merged as Picks)
    await fetch('/api/picks',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:myId,name:myName,...updates})})
  }

  async function saveAdmin(updates:Partial<Admin>){
    setAdmin(a=>({...a,...updates}))
    await fetch('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(updates)})
  }

  async function createGroup(){
    if(!newGroupName.trim()){showToast('Enter a group name',true);return}
    const res=await fetch('/api/groups',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newGroupName.trim(),userId:myId,userName:myName,userColor:myColor})})
    const g=await res.json()
    setGroups(gs=>[...gs,g]); setNewGroupName(''); setOpenGroup(g); showToast('Group created!')
  }

  async function joinGroup(){
    const code=joinCode.trim().toUpperCase()
    if(code.length!==6){showToast('Enter a 6-letter code',true);return}
    const res=await fetch('/api/groups',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,userId:myId,userName:myName,userColor:myColor,action:'join'})})
    if(!res.ok){showToast('Group not found',true);return}
    const g=await res.json()
    setGroups(gs=>[...gs.filter(x=>x.code!==code),g]); setJoinCode(''); setOpenGroup(g); showToast('Joined '+g.name+'!')
  }

  async function leaveGroup(code:string){
    if(!confirm('Leave this group?'))return
    await fetch('/api/groups',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,userId:myId,action:'leave'})})
    setGroups(gs=>gs.filter(g=>g.code!==code)); setOpenGroup(null); showToast('Left group')
  }

  async function deleteGroup(code:string){
    if(!confirm('Delete group?'))return
    await fetch('/api/groups',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})})
    setGroups(gs=>gs.filter(g=>g.code!==code)); setOpenGroup(null); showToast('Deleted')
  }

  async function forceSync(){
    setSyncing(true); setSyncMsg('Searching for latest results…')
    try{
      const res=await fetch('/api/sync',{headers:{authorization:`Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET||'dwts-cron-secret-2026'}`}})
      const d=await res.json()
      if(d.applied?.length){
        setSyncMsg('✓ Updated: '+d.applied.join(', '))
        const fresh=await fetch('/api/admin').then(r=>r.json())
        if(fresh)setAdmin(fresh)
      } else { setSyncMsg(d.message||'No new results found') }
    }catch(e){setSyncMsg('Sync failed')}
    setSyncing(false); setTimeout(()=>setSyncMsg(''),5000)
  }

  const alive=PAIRS.filter(p=>!admin.eliminated[p.id])
  const dName=(uid:string)=>openGroup?.members[uid]?.name||(uid===myId?myName:'?')
  const dColor=(uid:string)=>openGroup?.members[uid]?.color||COLORS[uid.charCodeAt(0)%COLORS.length]

  if(!ready) return <><style>{css}</style><div className="spinner"/></>

  // NAME SETUP
  if(!myName) return <>
    <style>{css}</style>
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',padding:24,textAlign:'center',gap:16}}>
      <div style={{fontSize:48}}>🪞</div>
      <div style={{fontFamily:'serif',fontSize:28,fontWeight:900,color:'#fff'}}>Dancing with the <span style={{color:'var(--gold)',fontStyle:'italic'}}>Stars</span></div>
      <div style={{fontSize:14,color:'var(--muted)',maxWidth:300}}>Season 35 Pick'em — enter your name to get started</div>
      <input type="text" value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Your name" maxLength={20} style={{maxWidth:280,textAlign:'center'}} onKeyDown={e=>e.key==='Enter'&&saveName()}/>
      <button className="btn btn-gold" style={{fontSize:15,padding:'12px 28px'}} onClick={saveName}>Let's Play</button>
    </div>
  </>

  // PICKS TAB
  function renderMyPicks(){
    const w=admin.current_week; const locked=admin.picks_locked
    const actualElimEntry=Object.entries(admin.eliminated||{}).find(([,wk])=>parseInt(String(wk))===w)
    const actualElimId=actualElimEntry?parseInt(actualElimEntry[0]):null
    const {pts,detail}=calcPoints(myPicks,admin)
    return <div className="view">
      <div style={{display:'flex',gap:6,marginBottom:14}}>
        {['preseason','weekly','score'].map(t=><div key={t} className={`tab ${myPicksTab===t?'on':''}`} style={{flex:1,background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,borderBottom:myPicksTab===t?'2px solid var(--gold)':'2px solid transparent'}} onClick={()=>setMyPicksTab(t)}>{t==='preseason'?'Preseason':t==='weekly'?`Week ${w}`:'My Score'}</div>)}
      </div>
      {myPicksTab==='preseason'&&<>
        {!locked?<>
          <div className="slabel">🔝 Final Four <span className="badge b-blue" style={{marginLeft:4}}>{PTS.f4} pts each</span></div>
          <div style={{fontSize:11,color:'var(--muted)',marginBottom:10}}>Pick 4 dancers you think make the finale. {myPicks.final4?.length||0}/4 picked</div>
          {PAIRS.map(p=>{const inF4=myPicks.final4?.includes(p.id);const full=(myPicks.final4?.length||0)>=4&&!inF4
            return <div key={p.id} className={`popt ${inF4?'sel-f4':''}`} onClick={()=>{
              if(full){showToast('Final 4 is full — remove one first',true);return}
              const f4=inF4?myPicks.final4.filter((x:number)=>x!==p.id):[...(myPicks.final4||[]),p.id]
              const winner=inF4&&myPicks.winner===p.id?null:myPicks.winner
              setMyPicks(mp=>({...mp,final4:f4,winner}))
            }}>
              <div className="pcheck">{inF4?'✓':''}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.celeb}</div><div style={{fontSize:10,color:'var(--muted)'}}>{p.pro}</div></div>
              {inF4&&<span className="badge b-blue">Final 4</span>}
              {full&&<span style={{fontSize:10,color:'var(--muted)'}}>Full</span>}
            </div>})}
          {(myPicks.final4?.length||0)>=1&&<>
            <div className="slabel" style={{marginTop:16}}>🏅 Season Winner <span className="badge b-gold" style={{marginLeft:4}}>{PTS.winner} pts</span></div>
            <div style={{fontSize:11,color:'var(--muted)',marginBottom:10}}>Must be one of your Final Four</div>
            {(myPicks.final4||[]).map((pairId:number)=>{const p=pairById(pairId)!;const isW=myPicks.winner===pairId
              return <div key={pairId} className={`popt ${isW?'sel-win':''}`} onClick={()=>{
                setMyPicks(mp=>({...mp,winner:isW?null:pairId}))
              }}>
                <div className="pcheck">{isW?'★':''}</div>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.celeb}</div><div style={{fontSize:10,color:'var(--muted)'}}>{p.pro}</div></div>
                {isW&&<span className="badge b-gold">My Winner</span>}
              </div>})}
          </>}
          {(myPicks.final4?.length||0)>0&&<button className="btn btn-gold btn-full" style={{marginTop:14}} onClick={async()=>{
            await savePicks({final4:myPicks.final4,winner:myPicks.winner})
            showToast('Preseason picks saved! ✓')
          }}>Save Preseason Picks</button>}
        </>:<>
          <div className="banner" style={{background:'var(--card2)',border:'1px solid var(--border)'}}><div style={{fontSize:13,fontWeight:700,color:'var(--muted)'}}>🔒 Picks Locked</div></div>
          <div className="card"><div className="card-body">
            {myPicks.winner&&(()=>{const correct=admin.actual_winner?myPicks.winner===admin.actual_winner:null
              return <div className="bkrow" style={{border:'none',padding:0}}>
                <div style={{fontSize:18}}>{correct===true?'✅':correct===false?'❌':'🏅'}</div>
                <div style={{flex:1}}><div style={{fontSize:11,color:'var(--gold)',fontWeight:700}}>Winner Pick</div><div style={{fontSize:13,fontWeight:600}}>{pairById(myPicks.winner)?.celeb}</div></div>
                <div style={{fontSize:12,fontWeight:700,color:correct===true?'var(--green)':'var(--muted)'}}>{correct===true?'+'+PTS.winner:correct===false?'0':'??'} pts</div>
              </div>})()}
            {(myPicks.final4||[]).map((pid:number)=>{const correct=admin.actual_final4?.length>0?admin.actual_final4.includes(pid):null
              return <div key={pid} className="bkrow" style={{paddingTop:8}}>
                <div style={{fontSize:16}}>{correct===true?'✅':correct===false?'❌':'🔝'}</div>
                <div style={{flex:1}}><div style={{fontSize:11,color:'var(--blue)',fontWeight:700}}>Final Four</div><div style={{fontSize:13,fontWeight:600}}>{pairById(pid)?.celeb}</div></div>
                <div style={{fontSize:12,fontWeight:700,color:correct===true?'var(--green)':'var(--muted)'}}>{correct===true?'+'+PTS.f4:correct===false?'0':'??'} pts</div>
              </div>})}
          </div></div>
        </>}
      </>}
      {myPicksTab==='weekly'&&<>
        <div className="slabel">❌ Week {w} Elimination <span className="badge b-rose" style={{marginLeft:4}}>{PTS.elim} pts</span></div>
        {actualElimId&&(()=>{const ep=pairById(actualElimId);const correct=myPicks.weekly?.[w]===actualElimId
          return <div className="banner" style={{background:correct?'var(--grdim)':'var(--rdim)',border:`1px solid ${correct?'var(--grborder)':'var(--rborder)'}`,marginBottom:10}}>
            <div style={{fontSize:24,marginBottom:4}}>{correct?'✅':'❌'}</div>
            <div style={{fontSize:15,fontWeight:700,color:correct?'var(--green)':'var(--rose)'}}>{correct?`Correct! +${PTS.elim} pts`:'Wrong this week'}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{ep?.celeb} was eliminated</div>
          </div>})()}
        {!actualElimId&&<>
          <div style={{fontSize:11,color:'var(--muted)',marginBottom:9}}>Tap who you think gets eliminated this week.</div>
          {alive.map(p=>{const isPicked=myPicks.weekly?.[w]===p.id;const inMyF4=myPicks.final4?.includes(p.id);const isMyWinner=myPicks.winner===p.id
            return <div key={p.id} className={`popt ${isPicked?'sel-elim':''}`} onClick={async()=>{const weekly={...(myPicks.weekly||{}),[w]:p.id};await savePicks({weekly})}}>
              <div className="pcheck">{isPicked?'✕':''}</div>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.celeb}</div><div style={{fontSize:10,color:'var(--muted)'}}>{p.pro}</div></div>
              <div style={{display:'flex',gap:4,flexShrink:0}}>
                {isMyWinner&&<span className="badge b-gold">🏅 My Winner</span>}
                {!isMyWinner&&inMyF4&&<span className="badge b-blue">🔝 My Final 4</span>}
                {isPicked&&<span className="badge b-rose">My Pick</span>}
              </div>
            </div>})}
          {myPicks.weekly?.[w]&&<>
            <button className="btn btn-gold btn-full" style={{marginTop:10}} onClick={async()=>{
              await savePicks({weekly:myPicks.weekly})
              showToast('Week '+w+' pick saved! ✓')
            }}>Save Week {w} Pick</button>
            <div style={{fontSize:11,color:'var(--muted)',textAlign:'center',marginTop:8}}>
              Picked <strong style={{color:'var(--rose)'}}>{pairById(myPicks.weekly[w])?.celeb}</strong> · <span style={{cursor:'pointer',textDecoration:'underline'}} onClick={()=>{const weekly={...myPicks.weekly};delete weekly[w];setMyPicks(mp=>({...mp,weekly}))}}>change</span>
            </div>
          </>}
        </>}
      </>}
      {myPicksTab==='score'&&<>
        <div className="card" style={{marginBottom:12}}>
          <div className="card-head"><div style={{fontWeight:700}}>Total Score</div><div style={{fontSize:26,fontWeight:900,color:'var(--gold)',fontFamily:'serif'}}>{pts} pts</div></div>
          <div className="card-body">
            {!detail.length&&<div style={{fontSize:12,color:'var(--muted)'}}>Submit picks to earn points.</div>}
            {detail.map((d,i)=><div key={i} className="bkrow">
              <div style={{fontSize:13}}>{d.correct===true?'✅':d.correct===false?'❌':'⏳'}</div>
              <div style={{flex:1,fontSize:12}}>{d.label}</div>
              <div style={{fontSize:12,fontWeight:700,color:d.correct===true?'var(--green)':'var(--muted)'}}>{d.correct===true?'+'+d.pts:d.correct===null?'—':'0'}</div>
            </div>)}
          </div>
        </div>
      </>}
    </div>
  }

  function renderResults(){
    const w=admin.current_week
    return <div className="view">
      {Array.from({length:w},(_,i)=>w-i).map(wk=>{
        const actualElim=Object.entries(admin.eliminated||{}).find(([,ewk])=>parseInt(String(ewk))===wk)
        const elimId=actualElim?parseInt(actualElim[0]):null
        const ep=elimId?pairById(elimId):null
        return <div key={wk} className="card">
          <div className="card-head">
            <div style={{fontWeight:700,fontSize:14}}>Week {wk}</div>
            {ep?<span className="badge b-rose">✕ {ep.celeb}</span>:<span className="badge b-muted">Pending</span>}
          </div>
          {ep&&<div className="card-body">
            {(['Correct','Wrong','No pick'] as const).map(type=>{
              const filtered=allPicks.filter(p=>{const pick=p.weekly?.[wk];if(type==='Correct')return pick===elimId;if(type==='Wrong')return pick&&pick!==elimId;return!pick})
              if(!filtered.length)return null
              return <div key={type} style={{marginBottom:8}}>
                <div style={{fontSize:10,fontWeight:700,color:type==='Correct'?'var(--green)':type==='Wrong'?'var(--rose)':'var(--muted)',marginBottom:4}}>{type==='Correct'?`✓ CORRECT +${PTS.elim}pts`:type==='Wrong'?'✗ WRONG':'NO PICK'}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                  {filtered.map(p=>{const wrongPick=type==='Wrong'?pairById(p.weekly?.[wk]):null
                    return <span key={p.user_id} className={`badge ${type==='Correct'?'b-green':type==='Wrong'?'b-rose':'b-muted'}`}>{p.name||'?'}{wrongPick?` (${wrongPick.celeb})`:''}</span>})}
                </div>
              </div>})}
          </div>}
        </div>})}
    </div>
  }

  function renderGroups(){
    if(openGroup){
      const members=openGroup.member_ids
      const picksMap:Record<string,Picks>={}
      allPicks.forEach(p=>{picksMap[p.user_id]=p})
      const ranked=members.map(uid=>({uid,...calcPoints(picksMap[uid]||{},admin)})).sort((a,b)=>b.pts-a.pts)
      const isAdmin=openGroup.members[myId]?.isAdmin
      return <div className="view">
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,cursor:'pointer',color:'var(--muted)',fontSize:12,fontWeight:600}} onClick={()=>{setOpenGroup(null);setGroupTab('lb')}}>← All Groups</div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:18,fontFamily:'serif',color:'var(--gold)'}}>{openGroup.name}</div>
          <span className="badge b-muted">Week {admin.current_week}</span>
        </div>
        <div style={{display:'flex',gap:6,marginBottom:14}}>
          {['lb','picks','info'].map(t=><div key={t} className={`tab ${groupTab===t?'on':''}`} style={{flex:1,background:'var(--card2)',border:'1px solid var(--border)',borderRadius:8,borderBottom:groupTab===t?'2px solid var(--gold)':'2px solid transparent'}} onClick={()=>setGroupTab(t)}>{t==='lb'?'Standings':t==='picks'?'All Picks':'Info'}</div>)}
        </div>
        {groupTab==='lb'&&<div className="card"><div>
          {ranked.map((r,i)=><div key={r.uid} className={`lbrow${r.uid===myId?' me-row':''}`}>
            <div style={{fontFamily:'serif',fontSize:20,fontWeight:900,color:i<3?'var(--gold)':'var(--muted)',minWidth:26}}>{i+1}</div>
            <div className="avatar" style={{background:dColor(r.uid)}}>{dName(r.uid)[0]?.toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{dName(r.uid)}{r.uid===myId?' (you)':''}</div>
              <div style={{fontSize:10,color:'var(--muted)'}}>{r.pts} pts</div>
            </div>
            <div style={{fontFamily:'serif',fontSize:20,fontWeight:700,color:'var(--gold)'}}>{r.pts}</div>
          </div>)}
        </div></div>}
        {groupTab==='picks'&&ranked.map(r=>{const picks=picksMap[r.uid]||{};const wPick=picks.weekly?.[admin.current_week]
          return <div key={r.uid} className="card" style={{marginBottom:9}}>
            <div className="card-head" style={{padding:'10px 13px'}}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div className="avatar" style={{background:dColor(r.uid),width:24,height:24,fontSize:10}}>{dName(r.uid)[0]?.toUpperCase()}</div>
                <div style={{fontSize:13,fontWeight:600}}>{dName(r.uid)}{r.uid===myId?' (you)':''}</div>
              </div>
              <div style={{fontFamily:'serif',fontSize:15,fontWeight:700,color:'var(--gold)'}}>{r.pts} pts</div>
            </div>
            <div className="card-body" style={{padding:'10px 13px',fontSize:11,color:'var(--muted)',display:'grid',gap:4}}>
              <div>🏅 {picks.winner?`Winner: ${pairById(picks.winner)?.celeb}`:'No winner pick'}</div>
              <div>🔝 Final 4: {(picks.final4||[]).length?(picks.final4||[]).map((id:number)=>pairById(id)?.celeb).join(', '):'None'}</div>
              <div>❌ Wk {admin.current_week}: {wPick?<strong style={{color:'var(--rose)'}}>{pairById(wPick)?.celeb}</strong>:'No pick'}</div>
            </div>
          </div>})}
        {groupTab==='info'&&<>
          <div className="slabel">Invite Code</div>
          <div className="codebox" onClick={()=>navigator.clipboard.writeText(openGroup.code).then(()=>showToast('Copied!'))}>{openGroup.code}</div>
          <div style={{fontSize:11,color:'var(--muted)',textAlign:'center',marginBottom:14}}>Tap to copy</div>
          <div className="slabel">Members ({members.length})</div>
          <div className="card"><div className="card-body">
            {members.map(uid=><div key={uid} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
              <div className="avatar" style={{background:dColor(uid)}}>{dName(uid)[0]?.toUpperCase()}</div>
              <div style={{flex:1,fontSize:13,fontWeight:600}}>{dName(uid)}{uid===myId?' (you)':''}</div>
              {openGroup.members[uid]?.isAdmin&&<span className="badge b-gold">Admin</span>}
            </div>)}
          </div></div>
          {isAdmin?<button className="btn btn-full" style={{marginTop:6,background:'var(--rdim)',border:'1px solid var(--rborder)',color:'var(--rose)'}} onClick={()=>deleteGroup(openGroup.code)}>Delete Group</button>
          :<button className="btn btn-sm btn-full" style={{marginTop:6}} onClick={()=>leaveGroup(openGroup.code)}>Leave Group</button>}
        </>}
      </div>}

    return <div className="view">
      <div className="banner" style={{background:'linear-gradient(135deg,#0D1B2E,var(--card))',border:'1px solid var(--gborder)'}}>
        <div style={{fontFamily:'serif',fontSize:18,fontWeight:900,color:'var(--gold)',marginBottom:4}}>DWTS Pick'em S35</div>
        <div style={{fontSize:12,color:'var(--muted)'}}>Create a group, share the code, compete all season.</div>
      </div>
      <div className="slabel">Scoring</div>
      <div className="card"><div className="card-body" style={{display:'grid',gap:10}}>
        {[{label:'🏅 Season Winner',color:'var(--gold)',pts:PTS.winner,sub:'Locked before Week 1'},{label:'🔝 Final Four (each)',color:'var(--blue)',pts:PTS.f4,sub:'Locked before Week 1'},{label:'❌ Weekly Elimination',color:'var(--rose)',pts:PTS.elim,sub:'Per correct pick'}].map((s,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:10,paddingTop:i?10:0,borderTop:i?'1px solid var(--border)':undefined}}>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:s.color}}>{s.label}</div><div style={{fontSize:11,color:'var(--muted)'}}>{s.sub}</div></div>
          <div style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:14,background:'var(--card2)',color:s.color}}>{s.pts} pts</div>
        </div>)}
      </div></div>
      <div className="slabel">My Groups</div>
      {!groups.length&&<div style={{textAlign:'center',padding:'20px 16px',color:'var(--muted)',fontSize:13}}>No groups yet</div>}
      {groups.map(g=><div key={g.code} className="group-card" onClick={()=>{setOpenGroup(g);setGroupTab('lb')}}>
        <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>{g.name}</div>
        <div style={{fontSize:11,color:'var(--muted)'}}>{g.member_ids.length} member{g.member_ids.length!==1?'s':''} · Week {admin.current_week} · Code: {g.code}</div>
      </div>)}
      <div className="slabel">Create a Group</div>
      <div style={{display:'flex',gap:8,marginBottom:4}}>
        <input type="text" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} placeholder="Group name" maxLength={30} onKeyDown={e=>e.key==='Enter'&&createGroup()}/>
        <button className="btn btn-gold" onClick={createGroup}>Create</button>
      </div>
      <div className="slabel">Join with Code</div>
      <div style={{display:'flex',gap:8}}>
        <input type="text" value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="6-letter code" maxLength={6} style={{letterSpacing:'.1em',textTransform:'uppercase'}} onKeyDown={e=>e.key==='Enter'&&joinGroup()}/>
        <button className="btn btn-gold" onClick={joinGroup}>Join</button>
      </div>
      <div style={{fontSize:11,color:'var(--muted)',textAlign:'center',marginTop:16,cursor:'pointer'}} onClick={()=>{localStorage.removeItem('dwts_name');setMyName('')}}>Switch name</div>
    </div>
  }

  function renderAdmin(){
    const w=admin.current_week
    const elim=admin.eliminated||{}
    const thisWeekElimEntry=Object.entries(elim).find(([,wk])=>parseInt(String(wk))===w)
    const thisElimId=thisWeekElimEntry?parseInt(thisWeekElimEntry[0]):null
    return <div className="view">
      <div className="banner" style={{background:'linear-gradient(135deg,#1A1408,var(--card))',border:'1px solid var(--gborder)'}}>
        <div style={{fontFamily:'serif',fontSize:18,fontWeight:900,color:'var(--gold)',marginBottom:4}}>⚙️ Commissioner Panel</div>
        <div style={{fontSize:12,color:'var(--muted)'}}>Auto-syncs every Tuesday night. Enter manually if needed.</div>
      </div>
      <div className="card" style={{marginBottom:14}}><div className="card-body">
        <div style={{fontSize:13,fontWeight:600,marginBottom:5}}>Auto-sync</div>
        <div style={{fontSize:11,color:'var(--muted)',marginBottom:10}}>Runs automatically every Wednesday at 3am UTC via Vercel cron.</div>
        <button className="btn btn-full btn-outline" onClick={forceSync} disabled={syncing}>{syncing?'Searching…':'🔄 Run sync now'}</button>
        {syncMsg&&<div style={{fontSize:12,color:'var(--green)',marginTop:8,textAlign:'center'}}>{syncMsg}</div>}
      </div></div>
      <div className="slabel">Preseason Picks</div>
      <div className="card" style={{marginBottom:14}}><div className="card-body">
        <div style={{fontSize:13,fontWeight:600,marginBottom:5}}>Status: <span style={{color:admin.picks_locked?'var(--rose)':'var(--green)'}}>{admin.picks_locked?'🔒 Locked':'🟢 Open'}</span></div>
        <div style={{fontSize:11,color:'var(--muted)',marginBottom:10}}>{admin.picks_locked?'Players cannot change preseason picks.':'Lock before the show starts.'}</div>
        <button className="btn btn-full" style={{background:admin.picks_locked?'var(--grdim)':'var(--rdim)',border:`1px solid ${admin.picks_locked?'var(--grborder)':'var(--rborder)'}`,color:admin.picks_locked?'var(--green)':'var(--rose)'}} onClick={()=>saveAdmin({picks_locked:!admin.picks_locked})}>{admin.picks_locked?'🔓 Unlock':'🔒 Lock Preseason Picks'}</button>
      </div></div>
      <div className="slabel">Current Week</div>
      <div className="weekrow">
        <button className="btn btn-sm" onClick={()=>saveAdmin({current_week:Math.max(1,w-1)})}>◀</button>
        <div style={{fontFamily:'serif',fontSize:26,fontWeight:900,color:'var(--gold)',flex:1,textAlign:'center'}}>Week {w}</div>
        <button className="btn btn-sm" onClick={()=>saveAdmin({current_week:Math.min(12,w+1)})}>▶</button>
      </div>
      <div className="slabel">Week {w} — Who Was Eliminated?</div>
      <div style={{fontSize:11,color:'var(--muted)',marginBottom:9}}>Tap to set. Auto-locks picks.</div>
      {alive.map(p=>{const isSel=thisElimId===p.id
        return <div key={p.id} className={`popt ${isSel?'sel-elim':''}`} onClick={async()=>{
          const newElim={...elim}
          Object.keys(newElim).forEach(pid=>{if(newElim[parseInt(pid)]===w)delete newElim[parseInt(pid)]})
          if(!isSel)newElim[p.id]=w
          const updates:Partial<Admin>={eliminated:newElim}
          if(!isSel&&w>=admin.current_week)updates.current_week=w+1
          if(!isSel&&w===1&&!admin.picks_locked)updates.picks_locked=true
          await saveAdmin(updates); showToast(isSel?'Undone':p.celeb+' eliminated!')
        }}>
          <div className="pcheck">{isSel?'✕':''}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.celeb}</div><div style={{fontSize:10,color:'var(--muted)'}}>{p.pro}</div></div>
          {isSel&&<span className="badge b-rose">Eliminated</span>}
        </div>})}
      <div className="slabel" style={{marginTop:18}}>Actual Final Four</div>
      <div style={{fontSize:11,color:'var(--muted)',marginBottom:9}}>{(admin.actual_final4||[]).length}/4</div>
      {PAIRS.map(p=>{const inF4=(admin.actual_final4||[]).includes(p.id)
        return <div key={p.id} className={`popt ${inF4?'sel-f4':''}`} onClick={async()=>{
          const f4=inF4?admin.actual_final4.filter((x:number)=>x!==p.id):[...(admin.actual_final4||[]),p.id]
          if(!inF4&&f4.length>4){showToast('Final 4 full',true);return}
          await saveAdmin({actual_final4:f4,actual_winner:inF4&&admin.actual_winner===p.id?null:admin.actual_winner})
        }}>
          <div className="pcheck">{inF4?'✓':''}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.celeb}</div></div>
          {inF4&&<span className="badge b-blue">Finalist</span>}
        </div>})}
      <div className="slabel" style={{marginTop:18}}>Actual Season Winner</div>
      {(admin.actual_final4?.length?PAIRS.filter(p=>admin.actual_final4.includes(p.id)):PAIRS).map(p=>{const isWin=admin.actual_winner===p.id
        return <div key={p.id} className={`popt ${isWin?'sel-win':''}`} onClick={()=>saveAdmin({actual_winner:isWin?null:p.id})}>
          <div className="pcheck">{isWin?'★':''}</div>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{p.celeb}</div></div>
          {isWin&&<span className="badge b-gold">Winner</span>}
        </div>})}
      {Object.keys(elim).length>0&&<>
        <div className="slabel" style={{marginTop:18}}>Elimination Log</div>
        <div className="card"><div className="card-body">
          {Object.entries(elim).sort((a,b)=>a[1]-b[1]).map(([pid,wk])=>{const p=pairById(parseInt(pid))
            return <div key={pid} className="bkrow">
              <span className="badge b-muted">Wk {wk}</span>
              <div style={{flex:1,fontSize:13,fontWeight:600}}>{p?.celeb}</div>
              <button className="btn btn-sm" style={{fontSize:10,padding:'4px 8px'}} onClick={async()=>{const newElim={...elim};delete newElim[parseInt(pid)];await saveAdmin({eliminated:newElim})}}>Undo</button>
            </div>})}
        </div></div>
      </>}
    </div>
  }

  return <>
    <style>{css}</style>
    <header style={{padding:'18px 18px 14px',textAlign:'center',borderBottom:'1px solid var(--border)',background:'linear-gradient(170deg,#0D1B2E,#060D18)',position:'relative'}}>
      <div style={{position:'absolute',top:14,right:14,display:'flex',alignItems:'center',gap:8}}>
        <div className="avatar" style={{background:myColor,width:26,height:26,fontSize:11}}>{myName[0]?.toUpperCase()}</div>
        <span style={{fontSize:12,fontWeight:600,color:'var(--muted)'}}>{myName}</span>
      </div>
      <div style={{fontSize:10,fontWeight:700,letterSpacing:'.14em',color:'var(--gold)',textTransform:'uppercase',marginBottom:4}}>Season 35 · 2026</div>
      <div style={{fontFamily:'serif',fontSize:24,fontWeight:900,color:'#fff',lineHeight:1.05}}>Dancing with the <span style={{color:'var(--gold)',fontStyle:'italic'}}>Stars</span></div>
    </header>
    <div className="tabs">
      {[{id:'groups',icon:'🏟️',label:'Groups'},{id:'mypicks',icon:'🎯',label:'My Picks'},{id:'results',icon:'📋',label:'Results'},{id:'admin',icon:'⚙️',label:'Admin'}].map(t=><div key={t.id} className={`tab ${tab===t.id?'on':''}`} onClick={()=>{setTab(t.id);if(t.id==='results'&&openGroup){const ids=openGroup.member_ids.join(',');fetch(`/api/picks?userIds=${ids}`).then(r=>r.json()).then(d=>{if(Array.isArray(d))setAllPicks(d)})}}}>
        <span style={{fontSize:14,display:'block',marginBottom:2}}>{t.icon}</span>{t.label}
      </div>)}
    </div>
    {tab==='groups'&&renderGroups()}
    {tab==='mypicks'&&renderMyPicks()}
    {tab==='results'&&renderResults()}
    {tab==='admin'&&renderAdmin()}
    <div className={`toast${toast.on?' on':''}${toast.err?' err':''}`}>{toast.msg}</div>
  </>
}
