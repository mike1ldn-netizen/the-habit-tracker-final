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
    const canvas = canvasRef.curren
