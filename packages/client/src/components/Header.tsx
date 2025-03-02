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
    <header className="mb-8 border-b border-gray-200 pb-4">
      <div className="flex justify-between items-center">
        <h1 className="m-0 text-2xl font-bold">
          <Link
            to="/"
            className="no-underline text-inherit hover:text-blue-600 transition-colors"
          >
            Statusphere
          </Link>
        </h1>
        <nav>
          {user ? (
            <div className="flex gap-4 items-center">
              <span className="text-gray-700">
                {user.profile?.displayName ||
                  user.profile?.handle ||
                  user.did.substring(0, 15)}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login">
              <button className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-md transition-colors">
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
