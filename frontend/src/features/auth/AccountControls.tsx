import { useState, type FormEvent } from 'react'
import type { User } from '../../shared/api'
import { useAuth } from './useAuth'

type Auth = ReturnType<typeof useAuth>
type AuthMode = 'login' | 'register'

function ErrorMessage({ message }: { message: string | null }) {
    return message && <p className="auth-error" role="alert">{message}</p>
}

function AuthForm({ auth, initialMode, onCancel }: { auth: Auth; initialMode: AuthMode; onCancel: () => void }) {
    const [mode, setMode] = useState(initialMode)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const busy = auth.pending !== null
    const registering = mode === 'register'

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const submittedPassword = password
        setPassword('')
        void auth[mode](name, submittedPassword)
    }

    return (
        <form className="auth-form" aria-label={registering ? 'Register an account' : 'Log in'} onSubmit={submit}>
            <label>
                Name
                <input
                    name="username"
                    autoComplete="username"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    minLength={3}
                    maxLength={20}
                    pattern="[A-Za-z0-9_]{3,20}"
                    title="3 to 20 letters, digits or underscores"
                    required
                    disabled={busy}
                />
            </label>
            <label>
                Password
                <input
                    name="password"
                    type="password"
                    autoComplete={registering ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    minLength={8}
                    maxLength={72}
                    required
                    disabled={busy}
                />
            </label>
            <div className="auth-actions">
                <button type="submit" disabled={busy}>{busy ? 'Submitting…' : registering ? 'Register' : 'Log in'}</button>
                <button type="button" disabled={busy} onClick={() => { setMode(registering ? 'login' : 'register'); setPassword('') }}>
                    {registering ? 'Use an existing account' : 'Create an account'}
                </button>
                <button type="button" disabled={busy} onClick={onCancel}>Cancel</button>
            </div>
            <ErrorMessage message={auth.error} />
        </form>
    )
}

function AnonymousAccount({ auth }: { auth: Auth }) {
    const [mode, setMode] = useState<AuthMode | null>(null)

    if (mode) return <AuthForm auth={auth} initialMode={mode} onCancel={() => setMode(null)} />
    return (
        <>
            <div className="auth-actions">
                <button type="button" onClick={() => setMode('login')}>Log in</button>
                <button type="button" onClick={() => setMode('register')}>Register</button>
            </div>
            <ErrorMessage message={auth.error} />
        </>
    )
}

function RenameForm({ auth, user, onCancel }: { auth: Auth; user: User; onCancel: () => void }) {
    const [name, setName] = useState(user.name)
    const busy = auth.pending !== null

    return (
        <form className="auth-form" aria-label="Rename account" onSubmit={event => { event.preventDefault(); void auth.rename(name) }}>
            <label>
                New name
                <input
                    name="username"
                    autoComplete="username"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    minLength={3}
                    maxLength={20}
                    pattern="[A-Za-z0-9_]{3,20}"
                    title="3 to 20 letters, digits or underscores"
                    required
                    disabled={busy}
                />
            </label>
            <div className="auth-actions">
                <button type="submit" disabled={busy}>{busy ? 'Renaming…' : 'Save name'}</button>
                <button type="button" disabled={busy} onClick={onCancel}>Done</button>
            </div>
            <ErrorMessage message={auth.error} />
        </form>
    )
}

function AuthenticatedAccount({ auth, user }: { auth: Auth; user: User }) {
    const [panel, setPanel] = useState<'rename' | 'delete' | null>(null)
    const busy = auth.pending !== null

    return (
        <>
            <div className="auth-actions">
                <span className="auth-summary" role="status"><strong>{user.name}</strong> · {user.credits} credits</span>
                <button type="button" disabled={busy} onClick={() => setPanel('rename')}>Rename</button>
                <button type="button" onClick={auth.logout}>Log out</button>
                <button type="button" disabled={busy} onClick={() => setPanel('delete')}>Delete account</button>
            </div>
            {panel === 'rename' && <RenameForm auth={auth} user={user} onCancel={() => setPanel(null)} />}
            {panel === 'delete' && (
                <div className="auth-confirmation" role="group" aria-label="Confirm account deletion">
                    <p>Really delete your account? This permanently removes it.</p>
                    <div className="auth-actions">
                        <button type="button" disabled={busy} onClick={() => { void auth.deleteAccount() }}>
                            {busy ? 'Deleting…' : 'Yes, delete my account'}
                        </button>
                        <button type="button" disabled={busy} onClick={() => setPanel(null)}>Cancel</button>
                    </div>
                    <ErrorMessage message={auth.error} />
                </div>
            )}
            {!panel && <ErrorMessage message={auth.error} />}
        </>
    )
}

export default function AccountControls() {
    const auth = useAuth()

    return (
        <section className="auth-account" aria-label="Account">
            {auth.status === 'loading' && (
                <>
                    <span role="status">{auth.error ? 'Could not load your account' : 'Loading account…'}</span>
                    <ErrorMessage message={auth.error} />
                    {auth.error && (
                        <div className="auth-actions">
                            <button type="button" disabled={auth.pending !== null} onClick={() => { void auth.retry() }}>Retry</button>
                            <button type="button" onClick={auth.logout}>Log out</button>
                        </div>
                    )}
                </>
            )}
            {auth.status === 'anonymous' && <AnonymousAccount auth={auth} />}
            {auth.status === 'authenticated' && auth.user && <AuthenticatedAccount auth={auth} user={auth.user} />}
        </section>
    )
}
