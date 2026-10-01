import type { Frame, Ship, Weights } from './types'
import { runMatch } from './sim/match'
import { Player } from './render/Player'
import { makeMatch } from './sim/setup'
import { showcase } from './bots/lineups'
import { PRESETS } from './sim/presets'
import { fitView, makeCamera, naturalSize, type ViewMode } from './render/camera'
import { NetBrain } from './evo/NetBrain'


const canvas = document.querySelector<HTMLCanvasElement>('#gameCanvas')
if (!canvas) throw new Error('no canvas')

const turnCounter = document.getElementById("turnCounter")
if (!turnCounter) throw new Error('turnCounter')

const ctx = canvas.getContext('2d')
if (!ctx) throw new Error('no 2d context')


let mode: ViewMode = 'iso'

const seed = Date.now();
// const seed = 1790266907455;


console.log(`Match seed: ${seed}`);


const { world, brains } = makeMatch(showcase, seed, PRESETS.bigmap)

const history: Frame[] = [{ world, hits: [] }]




const final = runMatch(world, brains, (w, hits) => history.push({ world: w, hits }))


console.log('done at turn', final.turn, 'alive:', final.ships.filter(s => s.hp > 0).map(s => s.id));


const fitCanvas = (mode: ViewMode) => {
  const { width, height } = naturalSize(mode, world.rules)
  canvas.width = width
  canvas.height = height
}

fitCanvas(mode)
let view = fitView(mode, world.rules, canvas.width, canvas.height)
const cam = makeCamera(mode, view)

const names: Record<Ship['id'], string> = {}
showcase.forEach((e, i) => { names[i + 1] = e.name })

const intent: Record<Ship['id'], Weights> = {}

for (const [id, brain] of Object.entries(brains))
  if (brain instanceof NetBrain) intent[Number(id)] = brain.weights

const player = new Player(ctx, cam, history, turnCounter, names, intent)
document.getElementById('play')!.onclick = () => player.play()
document.getElementById('pause')!.onclick = () => player.pause()
document.getElementById('stepBack')!.onclick = () => player.stepBack()
document.getElementById('stepForward')!.onclick = () => player.stepForward()
document.getElementById('view')!.onclick = () => {
  mode = mode === 'iso' ? 'top' : 'iso'
  fitCanvas(mode)
  view = fitView(mode, world.rules, canvas.width, canvas.height)
  player.setCamera(makeCamera(mode, view))
}
document.getElementById('intent')!.onclick = () => player.toggleIntent()

