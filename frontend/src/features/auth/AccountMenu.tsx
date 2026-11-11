import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { User } from '../../shared/api'
import { accountLabel, creditsLabel } from './accountLabel'
import { useAuth } from './useAuth'
import './auth.css'

type Auth = ReturnType<typeof useAuth>
type AuthMode = 'login' | 'register'

function ErrorMessage({ message }: { message: string | null }) {
    return message && <p className="auth-error prose" role="alert">{message}</p>
}

function NameField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (value: string) => void; disabled: boolean }) {
    return (
        <label className="auth-field">
            <span>{label}</span>
            <input
                name="username"
                autoComplete="username"
                value={value}
                onChange={event => onChange(event.target.value)}
                minLength={3}
                maxLength={20}
                pattern="[A-Za-z0-9_]{3,20}"
                title="3 to 20 letters, digits or underscores"
                required
                disabled={disabled}
            />
        </label>
    )
}

function AuthForm({ auth }: { auth: Auth }) {
    const [mode, setMode] = useState<AuthMode>('login')
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

    function choose(next: AuthMode) {
        setMode(next)
        setPassword('')
    }

    return (
        <form className="auth-form" aria-label={registering ? 'Register an account' : 'Log in'} onSubmit={submit}>
            <div className="auth-modes" role="group" aria-label="Log in or register">
                <button type="button" aria-pressed={!registering} disabled={busy} onClick={() => choose('login')}>Log in</button>
                <button type="button" aria-pressed={registering} disabled={busy} onClick={() => choose('register')}>Register</button>
            </div>
            <NameField label="Name" value={name} onChange={setName} disabled={busy} />
            <label className="auth-field">
                <span>Password</span>
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
            {registering && <p className="auth-hint prose">A new account starts with 1,000 credits.</p>}
            <ErrorMessage message={auth.error} />
            <button className="btn auth-submit" type="submit" disabled={busy}>
                {busy ? 'Submitting…' : registering ? 'Create account' : 'Log in'}
            </button>
        </form>
    )
}

function RenameForm({ auth, user, onDone }: { auth: Auth; user: User; onDone: () => void }) {
    const [name, setName] = useState(user.name)
    const busy = auth.pending !== null

    return (
        <form className="auth-form" aria-label="Rename account" onSubmit={event => { event.preventDefault(); void auth.rename(name) }}>
            <NameField label="New name" value={name} onChange={setName} disabled={busy} />
            <ErrorMessage message={auth.error} />
            <div className="auth-row">
                <button className="btn" type="submit" disabled={busy}>{busy ? 'Renaming…' : 'Save name'}</button>
                <button className="btn btn-quiet" type="button" disabled={busy} onClick={onDone}>Done</button>
            </div>
        </form>
    )
}

function Account({ auth, user }: { auth: Auth; user: User }) {
    const [panel, setPanel] = useState<'rename' | 'delete' | null>(null)
    const busy = auth.pending !== null

    return (
        <div className="auth-account-panel">
            <p className="auth-summary" role="status">
                <strong>{user.name}</strong>
                <span>{creditsLabel(user.credits)}</span>
            </p>
            {panel === null && (
                <>
                    <div className="auth-row">
                        <button className="btn" type="button" disabled={busy} onClick={() => setPanel('rename')}>Rename</button>
                        <button className="btn" type="button" onClick={auth.logout}>Log out</button>
                    </div>
                    <button className="btn btn-quiet auth-danger" type="button" disabled={busy} onClick={() => setPanel('delete')}>Delete account</button>
                    <ErrorMessage message={auth.error} />
                </>
            )}
            {panel === 'rename' && <RenameForm auth={auth} user={user} onDone={() => setPanel(null)} />}
            {panel === 'delete' && (
                <div className="auth-confirmation" role="group" aria-label="Confirm account deletion">
                    <p className="prose">Really delete your account? This permanently removes it and its credits.</p>
                    <ErrorMessage message={auth.error} />
                    {/* Cancel comes first: it lands where "Delete account" was pressed,
                        so a double click backs out instead of confirming */}
                    <div className="auth-row">
                        <button className="btn" type="button" disabled={busy} onClick={() => setPanel(null)}>Cancel</button>
                        <button className="btn auth-danger" type="button" disabled={busy} onClick={() => { void auth.deleteAccount() }}>
                            {busy ? 'Deleting…' : 'Yes, delete my account'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// One button in the header and a popover under it. The popover is laid out
// outside the header's flow, so opening it never changes the header height.
export default function AccountMenu() {
    const auth = useAuth()
    const [open, setOpen] = useState(false)
    const [seenStatus, setSeenStatus] = useState(auth.status)
    const rootRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)

    // logging in, logging out and deleting all finish the job the popover was opened for
    if (auth.status !== seenStatus) {
        setSeenStatus(auth.status)
        setOpen(false)
    }

    useEffect(() => {
        if (!open) return
        popoverRef.current?.querySelector<HTMLElement>('input, button')?.focus()

        const onPointerDown = (event: PointerEvent) => {
            if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
        }
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return
            setOpen(false)
            triggerRef.current?.focus()
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    return (
        <div className="auth-account" ref={rootRef}>
            <button
                ref={triggerRef}
                className="btn auth-trigger"
                type="button"
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
            >
                <span className="auth-trigger-name">{accountLabel(auth.status, auth.user)}</span>
                {auth.status === 'authenticated' && auth.user && <span className="auth-trigger-credits">{creditsLabel(auth.user.credits)}</span>}
            </button>
            {open && (
                <div className="auth-popover" ref={popoverRef} role="dialog" aria-label="Account">
                    {auth.status === 'loading' && (
                        <>
                            <p className="prose" role="status">{auth.error ? 'Could not load your account.' : 'Loading your account…'}</p>
                            <ErrorMessage message={auth.error} />
                            {auth.error && (
                                <div className="auth-row">
                                    <button className="btn" type="button" disabled={auth.pending !== null} onClick={() => { void auth.retry() }}>Retry</button>
                                    <button className="btn btn-quiet" type="button" onClick={auth.logout}>Log out</button>
                                </div>
                            )}
                        </>
                    )}
                    {auth.status === 'anonymous' && <AuthForm auth={auth} />}
                    {auth.status === 'authenticated' && auth.user && <Account auth={auth} user={auth.user} />}
                </div>
            )}
        </div>
    )
}
