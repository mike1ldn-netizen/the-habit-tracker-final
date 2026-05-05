import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const DAYS   = ['S','M','T','W','T','F','S']
const COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF','#FF9A3C','#00C9A7']

const getWeekDates = () => {
  const today = new Date()
  const day   = today.getDay()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - day + i)
    return d.toISOString().split('T')[0]
  })
}

const todayStr = () => new Date().toISOString().split('T')[0]

const defaultHabits = [
  { id: 1, name: 'Morning walk',    color: COLORS[2], completions: {}, bestStreak: 0 },
  { id: 2, name: 'Read 20 mins',    color: COLORS[3], completions: {}, bestStreak: 0 },
  { id: 3, name: 'Drink 8 glasses', color: COLORS[0], completions: {}, bestStreak: 0 },
]

function computeStreak(completions) {
  const today = todayStr()
  const yest  = new Date()
  yest.setDate(yest.getDate() - 1)
  const yesterdayStr = yest.toISOString().split('T')[0]
  if (!completions[today] && !completions[yesterdayStr]) return 0
  let streak = 0
  const cursor = new Date()
  if (!completions[today]) cursor.setDate(cursor.getDate() - 1)
  while (true) {
    const d = cursor.toISOString().split('T')[0]
    if (!completions[d]) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

let audioCtx = null
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}
function playTone(freq, type = 'sine', duration = 0.18, gain = 0.18) {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const g   = ctx.createGain()
    osc.connect(g); g.connect(ctx.destination)
    osc.frequency.value = freq
    osc.type = type
    g.gain.setValueAtTime(gain, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {}
}
function playCheck()   { playTone(660, 'sine', 0.14, 0.15); setTimeout(() => playTone(880, 'sine', 0.12, 0.10), 80) }
function playPerfect() { [523,659,784,1047].forEach((f,i) => setTimeout(() => playTone(f,'sine',0.22,0.13), i*70)) }
function playUncheck() { playTone(330, 'sine', 0.12, 0.08) }

const CONFETTI_COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#C77DFF','#FF9A3C','#00C9A7','#fff']
function makeParticles(n = 38) {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20, y: 45,
    vx: (Math.random() - 0.5) * 14,
    vy: -(Math.random() * 10 + 6),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    r: Math.random() * 5 + 3,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 12,
    life: 1,
    decay: Math.random() * 0.022 + 0.02,
  }))
}

function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null)
  const animRef   = useRef(null)
  const particles = useRef([])

  useEffect(() => {
    if (!active) { particles.current = []; return }
    particles.current = makeParticles(38)
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.current = particles.current.filter(p => p.life > 0)
      particles.current.forEach(p => {
        p.x += p.vx * 0.6; p.y += p.vy * 0.6
        p.vy += 0.35; p.rot += p.rotV; p.life -= p.decay
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.translate(p.x * canvas.width / 100, p.y * canvas.height / 100)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.fillStyle = p.color
        if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill() }
        else { ctx.fillRect(-p.r, -p.r/2, p.r*2, p.r) }
        ctx.restore()
      })
      if (particles.current.length > 0) animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [active])

  return (
    <canvas ref={canvasRef} width={400} height={300}
      style={{ position:'fixed', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:100 }}
    />
  )
}

function PerfectOverlay({ show, onDone }) {
  useEffect(() => {
    if (!show) return
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [show, onDone])

  if (!show) return null
  return (
    <div style={{ position:'fixed', inset:0, zIndex:99, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
      <div style={{ animation:'perfectIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards', textAlign:'center' }}>
        <div style={{ fontSize:46, marginBottom:8, filter:'drop-shadow(0 0 12px #FFD93D77)' }}>👑</div>
        <div style={{ fontFamily:"'Playfair Display', serif", fontSize:24, fontWeight:700, color:'#FFD93D', textShadow:'0 0 18px #FFD93D55', letterSpacing:'-0.01em', marginBottom:6 }}>
          Perfect Day
        </div>
        <div style={{ fontSize:10, color:'#888', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          all habits complete
        </div>
      </div>
    </div>
  )
}

function ReportCard({ habits, weekDates, today, onClose }) {
  const pastDates  = weekDates.filter(d => d <= today)
  const possible   = pastDates.length * habits.length
  const done       = habits.reduce((a,h) => a + pastDates.filter(d => h.completions[d]).length, 0)
  const pct        = possible ? Math.round((done / possible) * 100) : 0
  const grade      = pct===100?'S':pct>=80?'A':pct>=60?'B':pct>=40?'C':'D'
  const gradeColor = pct===100?'#FFD93D':pct>=80?'#6BCB77':pct>=60?'#4D96FF':pct>=40?'#FF9A3C':'#FF6B6B'
  const msg        = pct===100?'Flawless week. Legendary.':pct>=80?'Solid week. Keep pushing.':pct>=60?'Good start. More to give.':pct>=40?"Room to grow. Don't stop.":'Rough week. Tomorrow counts.'

  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'#0f0f13ee', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)', animation:'fadeIn 0.2s ease' }}
      onClick={onClose}>
      <div style={{ background:'#18181f', border:'1px solid #2a2a38', borderRadius:20, padding:'32px 28px', width:300, animation:'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:10, color:'#38384a', letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:20 }}>week in review</div>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:72, fontFamily:"'Playfair Display', serif", fontWeight:700, color:gradeColor, textShadow:`0 0 40px ${gradeColor}66`, lineHeight:1, marginBottom:8 }}>{grade}</div>
          <div style={{ fontSize:13, color:'#888', letterSpacing:'0.05em' }}>{msg}</div>
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {[{label:'done',val:done},{label:'possible',val:possible},{label:'score',val:`${pct}%`}].map(s => (
            <div key={s.label} style={{ flex:1, background:'#111118', borderRadius:10, padding:'10px 0', textAlign:'center' }}>
              <div style={{ fontSize:18, fontWeight:500, color:'#e2e2ea', letterSpacing:'-0.02em' }}>{s.val}</div>
              <div style={{ fontSize:9, color:'#38384a', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:22 }}>
          {habits.map(h => {
            const hDone = pastDates.filter(d => h.completions[d]).length
            const hPct  = pastDates.length ? hDone / pastDates.length : 0
            return (
              <div key={h.id}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:11, color:'#888' }}>{h.name}</span>
                  <span style={{ fontSize:11, color:'#555' }}>{hDone}/{pastDates.length}</span>
                </div>
                <div style={{ background:'#111118', borderRadius:99, height:3 }}>
                  <div style={{ height:3, borderRadius:99, background:h.color, width:`${hPct*100}%`, transition:'width 0.6s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={onClose} style={{ width:'100%', background:'#23232e', border:'1px solid #2a2a38', borderRadius:10, padding:'11px', color:'#888', fontFamily:"'DM Mono', monospace", fontSize:12, cursor:'pointer', letterSpacing:'0.06em', transition:'all 0.15s' }}>
          close
        </button>
      </div>
    </div>
  )
}

function getMicroCopy(pct, habits) {
  if (habits.length === 0) return 'add your first habit'
  if (pct === 100) return 'perfect day 👑'
  if (pct >= 75)  return 'almost there…'
  const h = new Date().getHours()
  if (pct === 0 && h >= 20) return "still time — let's go"
  if (pct === 0) return 'start your streak'
  if (pct >= 50) return 'on a roll'
  return 'keep going'
}

export default function App() {
  const [habits, setHabits] = useState(() => {
    try { const s = localStorage.getItem('habits-v4'); return s ? JSON.parse(s) : defaultHabits }
    catch { return defaultHabits }
  })
  const [soundOn,      setSoundOn]      = useState(true)
  const [newName,      setNewName]      = useState('')
  const [newColor,     setNewColor]     = useState(COLORS[0])
  const [adding,       setAdding]       = useState(false)
  const [deletingId,   setDeletingId]   = useState(null)
  const [justDone,     setJustDone]     = useState(null)
  const [showPerfect,  setShowPerfect]  = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showReport,   setShowReport]   = useState(false)
  const prevPctRef = useRef(0)
  const timerRef   = useRef(null)

  const weekDates = getWeekDates()
  const today     = todayStr()

  useEffect(() => {
    try { localStorage.setItem('habits-v4', JSON.stringify(habits)) } catch {}
  }, [habits])

  const todayDone  = habits.filter(h => h.completions[today]).length
  const todayPct   = habits.length ? Math.round((todayDone / habits.length) * 100) : 0
  const pastDates  = weekDates.filter(d => d <= today)
  const possibleWk = pastDates.length * habits.length
  const doneWk     = habits.reduce((a,h) => a + pastDates.filter(d => h.completions[d]).length, 0)
  const weeklyPct  = possibleWk ? Math.round((doneWk / possibleWk) * 100) : 0

  useEffect(() => {
    if (habits.length > 0 && todayPct === 100 && prevPctRef.current < 100) {
      setShowPerfect(true)
      setShowConfetti(true)
      if (soundOn) playPerfect()
      setTimeout(() => setShowConfetti(false), 1600)
    }
    prevPctRef.current = todayPct
  }, [todayPct, habits.length, soundOn])

  const toggle = useCallback((id, date) => {
    setHabits(prev => prev.map(hab => {
      if (hab.id !== id) return hab
      const wasOff = !hab.completions[date]
      if (soundOn) wasOff ? playCheck() : playUncheck()
      if (wasOff) {
        try { navigator.vibrate?.(10) } catch {}
        clearTimeout(timerRef.current)
        setJustDone(`${id}-${date}`)
        timerRef.current = setTimeout(() => setJustDone(null), 700)
      }
      const newCompletions = { ...hab.completions, [date]: wasOff }
      const streak = computeStreak(newCompletions)
      return { ...hab, completions: newCompletions, bestStreak: Math.max(hab.bestStreak || 0, streak) }
    }))
  }, [soundOn])

  const addHabit = () => {
    const name = newName.trim()
    if (!name) return
    setHabits(h => [...h, { id: Date.now(), name, color: newColor, completions: {}, bestStreak: 0 }])
    setNewName(''); setNewColor(COLORS[Math.floor(Math.random() * COLORS.length)]); setAdding(false)
  }

  const deleteHabit  = id  => { setHabits(h => h.filter(x => x.id !== id)); setDeletingId(null) }
  const weekCount    = hab => weekDates.filter(d => hab.completions[d]).length
  const isPerfectDay = date => habits.length > 0 && habits.every(h => h.completions[date])
  const microCopy    = getMicroCopy(todayPct, habits)

  return (
    <div className="app-root">
      <ConfettiCanvas active={showConfetti} />
      <PerfectOverlay show={showPerfect} onDone={() => setShowPerfect(false)} />
      {showReport && <ReportCard habits={habits} weekDates={weekDates} today={today} onClose={() => setShowReport(false)} />}

      <div className="app-inner">
        <div style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:10, color:'#38384a', letterSpacing:'0.13em', textTransform:'uppercase' }}>
              {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button className="icon-btn" onClick={() => setSoundOn(s => !s)} title={soundOn ? 'Mute' : 'Unmute'}>
                {soundOn ? '🔔' : '🔕'}
              </button>
              <button className="icon-btn" onClick={() => setShowReport(true)} title="Week report">📊</button>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h1 style={{ fontFamily:"'Playfair Display', serif", color:'#e2e2ea', fontSize:28, fontWeight:700, letterSpacing:'-0.01em' }}>
              Habits
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:9, background:'#18181f', border:`1px solid ${todayPct===100?'#FFD93D44':'#21212c'}`, borderRadius:999, padding:'6px 12px 6px 10px', transition:'border-color 0.4s' }}>
              <svg width="26" height="26" viewBox="0 0 26 26" style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
                <circle cx="13" cy="13" r="10" fill="none" stroke="#21212c" strokeWidth="2.5" />
                <circle cx="13" cy="13" r="10" fill="none"
                  stroke={todayPct===100?'#FFD93D':todayPct>=75?'#6BCB77':'#4D96FF'}
                  strokeWidth="2.5"
                  strokeDasharray={`${2*Math.PI*10}`}
                  strokeDashoffset={`${2*Math.PI*10*(1-todayPct/100)}`}
                  strokeLinecap="round"
                  style={{ transition:'stroke-dashoffset 0.55s cubic-bezier(0.34,1.56,0.64,1), stroke 0.4s' }}
                />
              </svg>
              <div>
                <div style={{ fontSize:17, fontWeight:500, letterSpacing:'-0.02em', lineHeight:1, color:todayPct===100?'#FFD93D':'#e2e2ea', transition:'color 0.3s' }}>
                  {todayPct}<span style={{ fontSize:10, color:'#38384a' }}>%</span>
                </div>
                <div style={{ fontSize:9, color:'#38384a', letterSpacing:'0.1em', textTransform:'uppercase' }}>today</div>
              </div>
            </div>
          </div>

          <div className="micro-copy" style={{ color:todayPct===100?'#FFD93D':todayPct>=50?'#6BCB77':'#38384a', marginBottom:14 }}>
            {microCopy}
          </div>

          <div style={{ marginBottom:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
              <span style={{ fontSize:9, color:'#38384a', letterSpacing:'0.12em', textTransform:'uppercase' }}>this week</span>
              <span style={{ fontSize:9, color:weeklyPct>=80?'#6BCB77':'#48485a', letterSpacing:'0.06em', transition:'color 0.3s' }}>
                {doneWk}/{possibleWk} · {weeklyPct}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{
                width:`${weeklyPct}%`,
                background: weeklyPct===100?'linear-gradient(90deg,#FFD93D,#FF9A3C)':weeklyPct>=60?'linear-gradient(90deg,#4D96FF,#6BCB77)':'#4D96FF',
              }} />
            </div>
          </div>

          <div style={{ display:'flex', gap:4 }}>
            {weekDates.map((date, i) => {
              const isToday   = date === today
              const isPast    = date < today
              const doneCount = habits.filter(h => h.completions[date]).length
              const pct       = habits.length ? doneCount / habits.length : 0
              const perfect   = isPerfectDay(date) && isPast
              return (
                <div key={date} style={{ flex:1, textAlign:'center', position:'relative' }}>
                  {perfect && <div className="crown">👑</div>}
                  <div style={{ fontSize:9, marginBottom:perfect?14:5, letterSpacing:'0.04em', color:isToday?'#888':'#2e2e3e', fontWeight:isToday?500:400 }}>
                    {DAYS[i]}
                  </div>
                  <div style={{ height:32, background:'#141419', borderRadius:6, position:'relative', overflow:'hidden', border:isToday?'1px solid #2d2d3d':'1px solid #18181f' }}>
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, height:`${pct*100}%`, background:pct===1?'linear-gradient(180deg,#FFD93D,#FF9A3C)':isToday?'#4D96FF55':isPast&&pct>0?'#253050':'transparent', borderRadius:4, transition:'height 0.4s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', marginBottom:5, paddingRight:28 }}>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', gap:4 }}>
            {weekDates.map((date, i) => (
              <div key={date} style={{ width:34, textAlign:'center', fontSize:9, color:date===today?'#666':'#272736', letterSpacing:'0.04em' }}>
                {DAYS[i]}
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding:'6px', marginBottom:10 }}>
          {habits.length === 0 && (
            <div style={{ textAlign:'center', color:'#2e2e3e', padding:'30px 0', fontSize:12, letterSpacing:'0.06em' }}>No habits yet</div>
          )}
          {habits.map((hab, idx) => {
            const streak = computeStreak(hab.completions)
            const best   = hab.bestStreak || 0
            const wk     = weekCount(hab)
            return (
              <div key={hab.id} className="habit-row slide-in" style={{ display:'flex', alignItems:'center', padding:'10px 8px', gap:6, borderBottom:idx<habits.length-1?'1px solid #16161e':'none' }}>
                <div style={{ flex:1, minWidth:0, marginRight:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:hab.color, flexShrink:0, boxShadow:`0 0 6px ${hab.color}55` }} />
                    <span style={{ fontSize:13, color:'#ccccd8', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{hab.name}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                    <div className="mini-track"><div className="mini-fill" style={{ width:`${(wk/7)*100}%`, background:hab.color }} /></div>
                    <span style={{ fontSize:9, color:'#38384a', letterSpacing:'0.07em' }}>{wk}/7</span>
                    {streak >= 2 && (
                      <span className="streak-badge" style={{ color:streak>=7?'#FFD93D':'#666', background:streak>=7?'#FFD93D15':'#1e1e28', border:`1px solid ${streak>=7?'#FFD93D35':'#28283a'}` }}>
                        {streak >= 7 ? '🔥' : '⚡'} {streak}d
                      </span>
                    )}
                    {best >= 3 && (
                      <span style={{ fontSize:9, color:'#383848', letterSpacing:'0.05em' }}>best {best}d</span>
                    )}
                  </div>
                </div>

                <div style={{ display:'flex', gap:4 }}>
                  {weekDates.map(date => {
                    const done     = !!hab.completions[date]
                    const isToday  = date === today
                    const isFuture = date > today
                    const key      = `${hab.id}-${date}`
                    return (
                      <button key={date}
                        className={['day-btn', isToday?'today-ring':'', justDone===key?'just-done':''].filter(Boolean).join(' ')}
                        onClick={() => !isFuture && toggle(hab.id, date)}
                        disabled={isFuture}
                        style={{ background:done?hab.color:'#16161e', color:done?'rgba(0,0,0,0.7)':isFuture?'#16161e':'#2e2e3e', cursor:isFuture?'default':'pointer' }}
                      >
                        {done ? '✓' : ''}
                      </button>
                    )
                  })}
                </div>

                {deletingId === hab.id ? (
                  <div style={{ display:'flex', gap:3, alignItems:'center', flexShrink:0 }}>
                    <button onClick={() => deleteHabit(hab.id)} style={{ background:'#ff6b6b18', border:'1px solid #ff6b6b44', color:'#ff6b6b', borderRadius:6, padding:'3px 7px', cursor:'pointer', fontSize:10, fontFamily:'inherit' }}>del</button>
                    <button onClick={() => setDeletingId(null)} className="cancel-btn" style={{ padding:'3px 7px', fontSize:10 }}>✕</button>
                  </div>
                ) : (
                  <button className="delete-btn" onClick={() => setDeletingId(hab.id)}>×</button>
                )}
              </div>
            )
          })}
        </div>

        {adding ? (
          <div className="card slide-in" style={{ padding:14, marginBottom:10 }}>
            <input className="input-field" placeholder="Habit name..." value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') addHabit(); if (e.key==='Escape') setAdding(false) }}
              autoFocus style={{ marginBottom:12 }}
            />
            <div style={{ display:'flex', gap:7, alignItems:'center', marginBottom:14 }}>
              <span style={{ fontSize:9, color:'#38384a', letterSpacing:'0.1em', textTransform:'uppercase', marginRight:2 }}>color</span>
              {COLORS.map(c => (
                <button key={c} className={`color-swatch${newColor===c?' selected':''}`} style={{ background:c }} onClick={() => setNewColor(c)} />
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="confirm-btn" style={{ background:newColor, color:'rgba(0,0,0,0.8)', flex:1 }} onClick={addHabit}>Add habit</button>
              <button className="cancel-btn" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="add-btn" onClick={() => setAdding(true)}>+ new habit</button>
        )}

        <div style={{ marginTop:18, textAlign:'center', fontSize:9, color:'#1e1e28', letterSpacing:'0.12em', textTransform:'uppercase' }}>
          tap a day to toggle · saved locally
        </div>
      </div>
    </div>
  )
}
