import { useEffect, useState } from 'react'
import { shortHash } from './stageClock'

// The published commitment, sealed until the reveal. Copying it now is how a
// viewer can check the revealed secret against it later.
export default function HashChip({ hash }: { hash: string }) {
    // manual: the browser refused the clipboard, so the whole hash is shown to select by hand
    const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle')

    useEffect(() => {
        if (status !== 'copied') return
        const timer = setTimeout(() => setStatus('idle'), 1400)
        return () => clearTimeout(timer)
    }, [status])

    function copy() {
        navigator.clipboard.writeText(hash).then(() => setStatus('copied'), () => setStatus('manual'))
    }

    return (
        <button className="hash-chip" data-status={status} type="button" onClick={copy} title={`Copy the full commitment: ${hash}`}>
            <span className="hash-chip-label">sealed · sha256</span>
            <code>{status === 'manual' ? hash : shortHash(hash)}</code>
            <span className="hash-chip-action" aria-live="polite">
                {status === 'copied' ? 'copied' : status === 'manual' ? 'select' : 'copy'}
            </span>
        </button>
    )
}
