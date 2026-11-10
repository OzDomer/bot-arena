import { useEffect, useState } from 'react'

// Hands back the last non-null value for `ms` after it turns null, so
// whatever showed it can animate out. Compares by identity: give it a
// value that only changes when its content does.
export function useLeaving<T>(value: T | null, ms: number): T | null {
    const [last, setLast] = useState<T | null>(value)
    const [leaving, setLeaving] = useState<T | null>(null)

    if (value !== last) {
        setLast(value)
        setLeaving(value === null ? last : null)
    }

    useEffect(() => {
        if (leaving === null) return
        const timer = setTimeout(() => setLeaving(null), ms)
        return () => clearTimeout(timer)
    }, [leaving, ms])

    return leaving
}
