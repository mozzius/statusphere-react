import { useState } from 'react'
import { Link } from 'react-router-dom'

import Header from '#/components/Header'
import { useAuth } from '#/hooks/useAuth'

const LoginPage = () => {
  const [handle, setHandle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login, loading } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!handle.trim()) {
      setError('Handle cannot be empty')
      return
    }

    try {
      const { redirectUrl } = await login(handle)
      // Redirect to ATProto OAuth flow
      window.location.href = redirectUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <Header />

      <div className="bg-white rounded-lg p-6 shadow-sm max-w-md mx-auto w-full">
        <h2 className="text-xl font-semibold mb-4">Login with your handle</h2>

        {error && (
          <div className="text-red-500 mb-4 p-2 bg-red-50 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="handle" className="block mb-2 text-gray-700">
              Enter your Bluesky handle:
            </label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="example.bsky.social"
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-4 py-2 rounded-md bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link
            to="/"
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
