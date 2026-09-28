import { stormAt } from "../sim/storm";
import { DELTAS, type World } from "../types";
import type { Camera } from "./camera";
import { buildFloor } from "./floor";
import { paint } from "./paint";

export const TILE = 40;

const COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#8338ec'];
const DEAD = '#999';


export function drawWorld(ctx: CanvasRenderingContext2D, cam: Camera, world: World) {
    ctx.save()
    ctx.clearRect(0, 0, cam.width, cam.height)
    paint(ctx, cam, buildFloor(world))
    ctx.restore()
}

