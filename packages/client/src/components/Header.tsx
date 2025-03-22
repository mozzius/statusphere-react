import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '#/hooks/useAuth'

const Header = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    // Force refetch by removing the data from cache but def defeats the purpose of tanstack
    // queryClient.removeQueries({
    //   queryKey: ['searchStatus', searchQuery.trim()],
    // })
    navigate(`/search?handle=${encodeURIComponent(searchQuery.trim())}`)
  }

  return (
    <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
      <div className="flex justify-between items-center">
        <h1 className="m-0 text-2xl font-bold">
          <Link
            to="/"
            className="no-underline text-inherit hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            Statusphere
          </Link>
        </h1>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 w-64 mx-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ATProto Handle..."
              className="w-full px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2
              focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2
                                   px-2 py-0.5 bg-blue-500 text-white rounded-md
                                   hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </form>
        <nav>
          {user ? (
            <div className="flex gap-4 items-center">
              {user.profile.avatar ? (
                <img
                  src={user.profile.avatar}
                  alt={user.profile.displayName || user.profile.handle}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              )}
              <span className="text-gray-700 dark:text-gray-300">
                {user.profile.displayName || user.profile.handle}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-md transition-colors">
                Login
              </button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
