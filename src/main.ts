import type { World } from './types'
import { runMatch } from './sim/match'
import { Player } from './render/Player'
import { makeMatch } from './sim/setup'
import { showcase } from './bots/lineups'
import { PRESETS } from './sim/presets'
import { makeCamera, type Camera, type ViewMode } from './render/camera'


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

const cam = makeCamera(mode, world.rules)

const history: World[] = [world];


const final = runMatch(world, brains, w => {
  history.push(w)
})
console.log('done at turn', final.turn, 'alive:', final.ships.filter(s => s.hp > 0).map(s => s.id));

canvas.width = cam.width
canvas.height = cam.height

const fitCanvas = (cam: Camera) => {
  canvas.width = cam.width
  canvas.height = cam.height
}

const player = new Player(ctx, cam, history, turnCounter);
document.getElementById('play')!.onclick = () => player.play()
document.getElementById('pause')!.onclick = () => player.pause()
document.getElementById('stepBack')!.onclick = () => player.stepBack()
document.getElementById('stepForward')!.onclick = () => player.stepForward()
document.getElementById('view')!.onclick = () => {
  mode = mode === 'iso' ? 'top' : 'iso'
  const camera = makeCamera(mode, world.rules)
  fitCanvas(camera)
  player.setCamera(camera)
}

