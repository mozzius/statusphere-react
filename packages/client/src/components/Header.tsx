import { Link } from 'react-router-dom'

import { useAuth } from '#/hooks/useAuth'

const Header = () => {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
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
        <nav>
          {user ? (
            <div className="flex gap-4 items-center">
              {user.profile.avatar ? (
                <img
                  src={user.profile.avatar}
                  alt={user.profile.displayName || user.profile.handle}
                  className="w-8 h-8 rounded-full text-transparent"
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
