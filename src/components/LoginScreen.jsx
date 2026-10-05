import React, { useState, useEffect } from 'react'

const AUTH_KEY = 'ffi_auth'
const CREDENTIALS_KEY = 'ffi_credentials'

// --- Crypto helpers ---

async function hashPassword(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  )
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function saveCredentials(username, password) {
  const salt = crypto.randomUUID()
  const hash = await hashPassword(password, salt)
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify({ username: username.trim(), hash, salt }))
}

export async function verifyCredentials(username, password) {
  const stored = localStorage.getItem(CREDENTIALS_KEY)
  if (!stored) return false
  const { username: storedUsername, hash: storedHash, salt } = JSON.parse(stored)
  if (username.trim() !== storedUsername) return false
  const hash = await hashPassword(password, salt)
  return hash === storedHash
}

export function hasStoredCredentials() {
  return !!localStorage.getItem(CREDENTIALS_KEY)
}

export function isAuthenticated() {
  return localStorage.getItem(AUTH_KEY) === '1'
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

// --- Logo ---

function Logo() {
  return (
    <div className="mb-10 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
        <svg className="w-9 h-9 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M10 11v6M14 11v6" />
        </svg>
      </div>
      <h1 className="text-xl font-black text-white">Fuel Farm Inspector</h1>
    </div>
  )
}

// --- Password visibility toggle button ---

function EyeButton({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
      tabIndex={-1}
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  )
}

// --- Setup screen (first launch) ---

function SetupScreen({ onSetup }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim()) return setError('Username is required')
    if (password.length < 8) return setError('Password must be at least 8 characters')
    if (password !== confirm) return setError('Passwords do not match')
    setLoading(true)
    await saveCredentials(username, password)
    localStorage.setItem(AUTH_KEY, '1')
    onSetup()
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6">
      <Logo />
      <p className="text-sm text-gray-400 mb-6 text-center -mt-6">
        Create your account to get started.
      </p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            placeholder="Choose a username"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className="input-field pr-10"
            />
            <EyeButton show={showPassword} onToggle={() => setShowPassword(v => !v)} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm Password</label>
          <input
            type={showPassword ? 'text' : 'password'}
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError('') }}
            placeholder="Repeat password"
            autoComplete="new-password"
            className="input-field"
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base font-semibold mt-2 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}

// --- Login screen ---

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const ok = await verifyCredentials(username, password)
    setLoading(false)
    if (ok) {
      localStorage.setItem(AUTH_KEY, '1')
      onLogin()
    } else {
      setError('Invalid username or password')
      setPassword('')
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center p-6">
      <Logo />
      <p className="text-sm text-gray-500 -mt-6 mb-6">Sign in to continue</p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
          <input
            type="text"
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            placeholder="Username"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Password"
              autoComplete="current-password"
              className="input-field pr-10"
            />
            <EyeButton show={showPassword} onToggle={() => setShowPassword(v => !v)} />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base font-semibold mt-2 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}

// --- Main export ---

export default function LoginScreen({ onLogin }) {
  const [isSetup, setIsSetup] = useState(null)

  useEffect(() => {
    setIsSetup(!hasStoredCredentials())
  }, [])

  if (isSetup === null) return null // brief flash prevention

  return isSetup
    ? <SetupScreen onSetup={onLogin} />
    : <LoginForm onLogin={onLogin} />
}
