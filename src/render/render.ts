import { DELTAS, type World } from "../types";

export const TILE = 40;

export function drawGrid(ctx: CanvasRenderingContext2D, world: World) {

    for (let x = 0; x <= world.rules.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * TILE, 0);
        ctx.lineTo(x * TILE, world.rules.height * TILE);
        ctx.stroke();
    }

    for (let y = 0; y <= world.rules.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0 * TILE, y * TILE);
        ctx.lineTo(world.rules.width * TILE, y * TILE);
        ctx.stroke();
    }
}

const COLORS = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#8338ec'];
const DEAD = '#999';

export function drawShips(ctx: CanvasRenderingContext2D, world: World) {
    for (const ship of world.ships) {
        const px = ship.position.x * TILE   // pixel x of the tile's top-left
        const py = ship.position.y * TILE

        ctx.fillStyle = ship.hp <= 0 ? DEAD : COLORS[ship.id % COLORS.length]
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);   // 4px inset

        ctx.fillStyle = '#000'
        ctx.font = '14px monospace'
        ctx.fillText(`${ship.hp} ${ship.id}`, px + 6, py + 16)
        if (ship.hp > 0) {
            const cx = px + TILE / 2;
            const cy = py + TILE / 2;
            const { dx, dy } = DELTAS[ship.facing];
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + dx * TILE / 3, cy + dy * TILE / 3);
            ctx.stroke();
        }
    }
}

export function drawWorld(ctx: CanvasRenderingContext2D, world: World) {
    ctx.clearRect(0, 0, world.rules.width * TILE, world.rules.height * TILE);
    ctx.fillText(`${world.turn}`, 11, 11)
    drawGrid(ctx, world);
    drawShips(ctx, world);
}