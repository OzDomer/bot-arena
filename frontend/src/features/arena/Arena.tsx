import { useEffect, useRef, useState } from 'react'
import { runMatch, type Frame, type Ship, type Weights, makeMatch, PRESETS } from '@arena/sim'
import { NetBrain, showcase } from '@arena/sim/bots'
import { Player } from '../../render/Player'
import { DARK, LIGHT, type Theme } from '../../render/theme'
import { type ViewMode, fitView, makeCamera, panBy, zoomAt } from '../../render/camera'

function Arena() {

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const playerRef = useRef<Player>(null)
    const [turn, setTurn] = useState(0)
    const [viewMode, setViewMode] = useState<ViewMode>('iso')

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('no 2d context')



        const dark = window.matchMedia('(prefers-color-scheme: dark)')
        let theme = dark.matches ? DARK : LIGHT


        const seed = Date.now();
        // const seed = 1790266907455;

        console.log(`Match seed: ${seed}`);


        const { world, brains } = makeMatch(showcase, seed, PRESETS.bigmap)

        const history: Frame[] = [{ world, hits: [] }]

        const final = runMatch(world, brains, (w, hits) => history.push({ world: w, hits }))


        console.log('done at turn', final.turn, 'alive:', final.ships.filter(s => s.hp > 0).map(s => s.id));

        const names: Record<Ship['id'], string> = {}
        showcase.forEach((e, i) => { names[i + 1] = e.name })

        const intent: Record<Ship['id'], Weights> = {}

        for (const [id, brain] of Object.entries(brains))
            if (brain instanceof NetBrain) intent[Number(id)] = brain.weights

        const cam = makeCamera('iso', fitView('iso', world.rules, canvas.clientWidth, canvas.clientHeight))
        const player = new Player(ctx, cam, history, setTurn, names, intent, theme)
        playerRef.current = player


        const applyTheme = (t: Theme) => {
            theme = t
            document.documentElement.dataset.theme = t === DARK ? 'dark' : 'light'
            player.setTheme(t)
        }
        applyTheme(theme)

        const onSchemeChange = (e: MediaQueryListEvent) => {
            applyTheme(e.matches ? DARK : LIGHT)
        }
        dark.addEventListener('change', onSchemeChange)

        document.getElementById('mode')!.onclick = () => {
            applyTheme(theme === DARK ? LIGHT : DARK)
        }


        return () => {
            console.log('clean up isle 4')
            player.pause()
            dark.removeEventListener('change', onSchemeChange)
            playerRef.current = null

        }

    },
        [])
    useEffect(() => {
        const canvas = canvasRef.current
        const player = playerRef.current
        if (!canvas || !player) return

        const rules = PRESETS.bigmap

        const refit = () => {
            fitCanvas()
            view = fitView(viewMode, rules, canvas.clientWidth, canvas.clientHeight)
            player.setCamera(makeCamera(viewMode, view))
        }

        const ro = new ResizeObserver(refit)
        ro.observe(canvas)
        const fitCanvas = () => {
            const dpr = window.devicePixelRatio
            canvas.width = canvas.clientWidth * dpr
            canvas.height = canvas.clientHeight * dpr
        }

        fitCanvas()
        let view = fitView(viewMode, rules, canvas.clientWidth, canvas.clientHeight)


        let dragging = false
        let last = {
            x: 0, y: 0

        }
        const onPointerDown = (e: PointerEvent) => {
            canvas.setPointerCapture(e.pointerId)
            dragging = true
            last = { x: e.clientX, y: e.clientY }
        }

        canvas.addEventListener('pointerdown', onPointerDown)

        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return
            view = panBy(view, e.clientX - last.x, e.clientY - last.y)
            last = { x: e.clientX, y: e.clientY }
            player.setCamera(makeCamera(viewMode, view))
        }
        canvas.addEventListener('pointermove', onPointerMove)

        const onPointerUp = () => {
            dragging = false
        }
        canvas.addEventListener('pointerup', onPointerUp)

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const r = canvas.getBoundingClientRect()
            const at = { x: e.clientX - r.left, y: e.clientY - r.top }
            const factor = e.deltaY < 0 ? 1.25 : 0.8
            view = zoomAt(view, at, factor)
            player.setCamera(makeCamera(viewMode, view))
        }
        canvas.addEventListener('wheel', onWheel, { passive: false })




        return () => {
            canvas.removeEventListener('wheel', onWheel)
            canvas.removeEventListener('pointerdown', onPointerDown)
            canvas.removeEventListener('pointerup', onPointerUp)
            canvas.removeEventListener('pointermove', onPointerMove)
            ro.disconnect()

        }

    }, [viewMode])
    return (
        <>
            <div id="controls">
                <button onClick={() => playerRef.current?.play()}>Play</button>
                <button onClick={() => playerRef.current?.pause()}>Pause</button>
                <button onClick={() => playerRef.current?.stepBack()}>Back</button>
                <button onClick={() => playerRef.current?.stepForward()}>Forward</button>
                <button onClick={() => setViewMode(viewMode === 'iso' ? 'top' : 'iso')}>View</button>
                <button onClick={() => playerRef.current?.toggleIntent()} >Intent</button>
                <button id="mode">dark/light</button>
                <span>Turn: <span id="turnCounter">{turn}</span></span>
            </div>
            <canvas id="gameCanvas" ref={canvasRef}></canvas>
        </>
    )
}
export default Arena