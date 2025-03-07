import Header from '#/components/Header'
import StatusForm, { STATUS_OPTIONS } from '#/components/StatusForm'
import StatusList from '#/components/StatusList'
import { useAuth } from '#/hooks/useAuth'

const HomePage = () => {
  const { user, loading, error } = useAuth()

  // Get a random emoji from the STATUS_OPTIONS array
  const randomEmoji =
    STATUS_OPTIONS[Math.floor(Math.random() * STATUS_OPTIONS.length)]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <div className="text-9xl animate-pulse">{randomEmoji}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
            Error
          </h2>
          <p className="text-red-500 mb-4">{error}</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            Try logging in again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      <Header />

      {user && <StatusForm />}

      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Recent Statuses
        </h2>
        <StatusList />
      </div>
    </div>
  )
}

export default HomePage
