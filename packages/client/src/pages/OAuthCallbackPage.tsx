import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { api } from '../services/api'

const OAuthCallbackPage = () => {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('Completing authentication...')
  const navigate = useNavigate()

  useEffect(() => {
    console.log('OAuth callback page reached')
    setMessage('OAuth callback page reached. Checking authentication...')

    const checkAuth = async () => {
      try {
        // Check if there's an error in the URL
        const params = new URLSearchParams(window.location.search)
        if (params.get('error')) {
          console.error('Auth error detected in URL params')
          setError('Authentication failed')
          return
        }

        // Give cookies a moment to be processed
        await new Promise((resolve) => setTimeout(resolve, 500))
        setMessage("Checking if we're authenticated...")

        // Check if we're authenticated by fetching current user
        try {
          console.log('Checking current user')
          console.log(
            'Cookies being sent:',
            document.cookie
              .split(';')
              .map((c) => c.trim())
              .join(', '),
          )

          const user = await api.getCurrentUser({})
          console.log('Current user check result:', user)

          if (user) {
            console.log('Successfully authenticated', user)
            setMessage('Authentication successful! Redirecting...')
            // Redirect to home after a short delay
            setTimeout(() => {
              navigate('/')
            }, 1000)
          } else {
            console.error('Auth check returned no user')
            setError('Authentication session not found')
          }
        } catch (apiErr) {
          console.error('API error during auth check:', apiErr)
          setError('Failed to verify authentication')
        }
      } catch (err) {
        console.error('General error in OAuth callback:', err)
        setError('Failed to complete authentication')
      }
    }

    checkAuth()
  }, [navigate])

  return (
    <div className="flex items-center justify-center py-16">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 max-w-md w-full text-center">
        {error ? (
          <div>
            <h2 className="text-2xl font-bold text-red-500 mb-4">
              Authentication Failed
            </h2>
            <p className="text-red-500 mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
              Authentication in Progress
            </h2>
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default OAuthCallbackPage
