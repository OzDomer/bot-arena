import { useEffect, useState, useSyncExternalStore } from 'react'
import { createAuthSession } from './authSession'

export function useAuth() {
    const [session] = useState(createAuthSession)
    const { status, user, pending, error } = useSyncExternalStore(session.subscribe, session.getSnapshot)

    useEffect(() => session.start(), [session])

    return {
        status, user, pending, error,
        register: session.register,
        login: session.login,
        logout: session.logout,
        rename: session.rename,
        deleteAccount: session.deleteAccount,
        retry: session.retry
    }
}
