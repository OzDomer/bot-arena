import './style.css'
import { NetBrain, runMatch, showcase, type Frame, type Ship, type Weights, makeMatch, PRESETS } from './index'
import { Player } from './render/Player'
import { fitView, makeCamera, panBy, zoomAt, type ViewMode } from './render/camera'
import { LIGHT, DARK, type Theme } from './render/theme'

const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')
if (!canvas) throw new Error('no canvas')

const turnCounter = document.getElementById("turnCounter")
if (!turnCounter) throw new Error('turnCounter')

const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('no 2d context')

const dark = window.matchMedia('(prefers-color-scheme: dark)')
let theme = dark.matches ? DARK : LIGHT

let mode: ViewMode = 'iso'

const seed = Date.now();
// const seed = 1790266907455;


console.log(`Match seed: ${seed}`);


const { world, brains } = makeMatch(showcase, seed, PRESETS.bigmap)

const history: Frame[] = [{ world, hits: [] }]




const final = runMatch(world, brains, (w, hits) => history.push({ world: w, hits }))


console.log('done at turn', final.turn, 'alive:', final.ships.filter(s => s.hp > 0).map(s => s.id));





const fitCanvas = () => {
  const dpr = window.devicePixelRatio
  canvas.width = canvas.clientWidth * dpr
  canvas.height = canvas.clientHeight * dpr
}


fitCanvas()
let view = fitView(mode, world.rules, canvas.clientWidth, canvas.clientHeight)
const cam = makeCamera(mode, view)

const names: Record<Ship['id'], string> = {}
showcase.forEach((e, i) => { names[i + 1] = e.name })

const intent: Record<Ship['id'], Weights> = {}

for (const [id, brain] of Object.entries(brains))
  if (brain instanceof NetBrain) intent[Number(id)] = brain.weights

const player = new Player(ctx, cam, history, turnCounter, names, intent, theme)

const refit = () => {
  fitCanvas()
  view = fitView(mode, world.rules, canvas.clientWidth, canvas.clientHeight)
  player.setCamera(makeCamera(mode, view))
}
window.addEventListener('resize', refit)
document.getElementById('play')!.onclick = () => player.play()
document.getElementById('pause')!.onclick = () => player.pause()
document.getElementById('stepBack')!.onclick = () => player.stepBack()
document.getElementById('stepForward')!.onclick = () => player.stepForward()
document.getElementById('view')!.onclick = () => {
  mode = mode === 'iso' ? 'top' : 'iso'
  refit()
}
document.getElementById('intent')!.onclick = () => player.toggleIntent()

const applyTheme = (t: Theme) => {
  theme = t
  document.documentElement.dataset.theme = t === DARK ? 'dark' : 'light'
  player.setTheme(t)
}
applyTheme(theme)

let dragging = false
let last = {
  x: 0, y: 0

}

canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId)
  dragging = true
  last = { x: e.clientX, y: e.clientY }
})

canvas.addEventListener('pointermove', e => {
  if (!dragging) return
  view = panBy(view, e.clientX - last.x, e.clientY - last.y)
  last = { x: e.clientX, y: e.clientY }
  player.setCamera(makeCamera(mode, view))
})

canvas.addEventListener('pointerup', () => {
  dragging = false
})


canvas.addEventListener('wheel', e => {
  e.preventDefault()
  const r = canvas.getBoundingClientRect()
  const at = { x: e.clientX - r.left, y: e.clientY - r.top }
  const factor = e.deltaY < 0 ? 1.25 : 0.8
  view = zoomAt(view, at, factor)
  player.setCamera(makeCamera(mode, view))
}, { passive: false })

dark.addEventListener('change', e => applyTheme(e.matches ? DARK : LIGHT))

document.getElementById('mode')!.onclick = () => {
  applyTheme(theme === DARK ? LIGHT : DARK)
  player.setTheme(theme)
}

