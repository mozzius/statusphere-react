import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import Header from '#/components/Header'
import api from '#/services/api'

const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const handle = searchParams.get('handle')

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ['searchStatus', handle],
    queryFn: async () => {
      if (!handle) return null

      const { data } = await api.getStatusesByUser({
        handle: handle,
      })
      return data
    },
    refetchInterval: 30e3, // Refetch every 30 seconds
  })

  useEffect(() => {
    if (error) {
      console.error(error)
    }
  }, [error])

  // Destructure data
  const statuses = data?.statuses || []

  if (isError) {
    return (
      <>
        <Header />
        <div className="py-4 text-red-500">
          {(error as Error)?.message || 'Failed to load statuses'}
        </div>
      </>
    )
  }

  if (isPending) {
    return (
      <>
        <Header />
        <div className="py-4 text-center text-gray-500 dark:text-grey-400">
          Searching user statuses for "{handle}"...
        </div>
      </>
    )
  }

  const LoadingSpinner = ({ size = 'md', color = 'blue' }) => {
    const sizeClasses = {
      sm: 'w-5 h-5',
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
    }

    const colorClasses = {
      blue: 'border-blue-500',
      gray: 'border-gray-500',
      green: 'border-green-500',
      red: 'border-red-500',
    }

    return (
      <div className="flex justify-center items-center">
        <div
          className={`${sizeClasses[size]} border-4 border-t-transparent border-solid rounded-full animate-spin ${colorClasses[color]}`}
        ></div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday =
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()

    if (isToday) return 'today'
    else
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
  }
  return (
    <>
      <Header />
      {/*show a subtle refetching indicator */}
      {handle && (isPending || isFetching) && (
        <div className="loading-overlay">
          <LoadingSpinner />
        </div>
      )}
      <div className="px-4">
        <div className="relative">
          <div className="absolute left-[20.5px] top-[22.5px] bottom-[22.5px] w-0.5 bg-gray-200 dark:bg-gray-700"></div>
          {statuses.map((status) => {
            const handle =
              status.profile.handle ||
              status.profile.did.substring(0, 15) + '...'
            const formattedDate = formatDate(status.createdAt)
            const isToday = formattedDate === 'today'

            return (
              <div
                key={status.uri}
                className="relative flex items-center gap-5 py-4"
              >
                <div className="relative z-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-[45px] w-[45px] flex items-center justify-center shadow-sm">
                  <div className="text-2xl">{status.status}</div>
                </div>
                <div className="flex-1">
                  <div className="text-gray-600 dark:text-gray-300 text-base">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={`https://bsky.app/profile/${handle}`}
                      className="font-medium text-gray-700 dark:text-gray-200 hover:underline"
                    >
                      @{handle}
                    </a>{' '}
                    {isToday ? (
                      <span>
                        is feeling{' '}
                        <span className="font-semibold">{status.status}</span>{' '}
                        today
                      </span>
                    ) : (
                      <span>
                        was feeling{' '}
                        <span className="font-semibold">{status.status}</span>{' '}
                        on {formattedDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

export default SearchResults
