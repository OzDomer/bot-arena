import { type World } from "../types"
import type { Camera } from "./camera"
import { buildFloor } from "./floor"
import { paint } from "./paint"
import { buildShipsFlat } from "./ships";

export const TILE = 40;



export function drawWorld(ctx: CanvasRenderingContext2D, cam: Camera, world: World) {
    ctx.save()
    ctx.clearRect(0, 0, cam.width, cam.height)
    paint(ctx, cam, buildFloor(world))
    paint(ctx, cam, buildShipsFlat(world))
    ctx.restore()
}

