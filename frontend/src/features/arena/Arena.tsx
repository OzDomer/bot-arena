import { useEffect, useRef, useState } from 'react'
import { FRAME_MS, Player } from '../../render/Player'
import { DARK, LIGHT } from '../../render/theme'
import { type ViewMode, fitView, makeCamera, panBy, zoomAt } from '../../render/camera'
import useTheme from '../../shared/hooks/useTheme'
import type { Match } from './useMatch'
import type { Outcome, Ship } from '@arena/sim'

type ArenaProps = { match: Match }

function resultText(result: Outcome, names: Record<Ship['id'], string>): string {
    switch (result.kind) {
        case 'win': return `${names[result.winner]} wins!`
        case 'draw': return `Draw`
        case 'timeout': return `Timeout`
    }
}

function Arena({ match }: ArenaProps) {

    const canvasRef = useRef<HTMLCanvasElement>(null)
    const playerRef = useRef<Player>(null)
    const [turn, setTurn] = useState(0)
    const [viewMode, setViewMode] = useState<ViewMode>('iso')
    const [speed, setSpeed] = useState(1)
    const { theme, toggleTheme } = useTheme()
    const lastTurn = match.history.at(-1)!.world.turn
    const finished = turn === lastTurn

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('no 2d context')


        const cam = makeCamera('iso', fitView('iso', match.rules, canvas.clientWidth, canvas.clientHeight))
        const player = new Player(ctx, cam, match.history, setTurn, match.names, match.intent, LIGHT)
        playerRef.current = player

        return () => {
            player.pause()
            playerRef.current = null
        }

    },
        [match])

    useEffect(() => {
        const canvas = canvasRef.current
        const player = playerRef.current
        if (!canvas || !player) return


        const refit = () => {
            fitCanvas()
            view = fitView(viewMode, match.rules, canvas.clientWidth, canvas.clientHeight)
            player.setCamera(makeCamera(viewMode, view))
        }
        // fires once immediatly and refit sets the camera
        const ro = new ResizeObserver(refit)
        ro.observe(canvas)
        const fitCanvas = () => {
            const dpr = window.devicePixelRatio
            canvas.width = canvas.clientWidth * dpr
            canvas.height = canvas.clientHeight * dpr
        }

        fitCanvas()
        let view = fitView(viewMode, match.rules, canvas.clientWidth, canvas.clientHeight)


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

    }, [viewMode, match])

    useEffect(() => {
        playerRef.current?.setTheme(theme === 'dark' ? DARK : LIGHT)
    }, [theme, match])

    useEffect(() => {
        playerRef.current?.setFrameMs(FRAME_MS / speed)   // 2× → 75 ms, 0.5× → 300 ms
    }, [speed, match])

    return (
        <>
            <div id="controls">
                {finished && <span>{resultText(match.result, match.names)}</span>}
                <button onClick={() => playerRef.current?.play()}>Play</button>
                <button onClick={() => playerRef.current?.pause()}>Pause</button>
                <button onClick={() => playerRef.current?.stepBack()}>Back</button>
                <button onClick={() => playerRef.current?.stepForward()}>Forward</button>
                <button onClick={() => setSpeed(1)}>1x</button>
                <button onClick={() => setSpeed(0.5)}>0.5x</button>
                <button onClick={() => setSpeed(2)}>2x</button>
                <button onClick={() => setSpeed(4)}>4x</button>
                <button onClick={() => setViewMode(viewMode === 'iso' ? 'top' : 'iso')}>View</button>
                <button onClick={() => playerRef.current?.toggleIntent()} >Intent</button>
                <button onClick={toggleTheme}>dark/light</button>
                <span>Turn: <span>{turn}</span></span>
            </div>
            <canvas id="gameCanvas" ref={canvasRef}></canvas>
        </>
    )
}
export default Arena