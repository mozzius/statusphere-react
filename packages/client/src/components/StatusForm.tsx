import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XyzStatusphereDefs } from '@statusphere/lexicon'

import useAuth from '#/hooks/useAuth'
import api from '#/services/api'

export const STATUS_OPTIONS = [
  '👍',
  '👎',
  '💙',
  '🥹',
  '😧',
  '😤',
  '🙃',
  '😉',
  '😎',
  '🤓',
  '🤨',
  '🥳',
  '😭',
  '😢',
  '🤯',
  '🫡',
  '💀',
  '✊',
  '🤘',
  '👀',
  '🧠',
  '👩‍💻',
  '🧑‍💻',
  '🥷',
  '🧌',
  '🦋',
  '🚀',
  '😴',
]

const StatusForm = () => {
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get current user's status emoji
  const currentUserStatus = user?.status?.status || null

  // Use React Query mutation for creating a status
  const mutation = useMutation({
    mutationFn: (emoji: string) => api.createStatus({ status: emoji }),
    onMutate: async (emoji) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic updates
      await queryClient.cancelQueries({ queryKey: ['statuses'] })
      await queryClient.cancelQueries({ queryKey: ['currentUser'] })

      // Snapshot the previous values
      const previousStatuses = queryClient.getQueryData(['statuses'])
      const previousUser = queryClient.getQueryData(['currentUser'])

      // Optimistically update the statuses
      queryClient.setQueryData(['statuses'], (oldData: any) => {
        if (!oldData) return oldData
        if (!user) return oldData

        // Create a provisional status
        const optimisticStatus = {
          uri: `optimistic-${Date.now()}`,
          profile: {
            did: user.profile.did,
            handle: user.profile.handle,
          },
          status: emoji,
          createdAt: new Date().toISOString(),
        } satisfies XyzStatusphereDefs.StatusView

        return {
          ...oldData,
          statuses: [optimisticStatus, ...oldData.statuses],
        }
      })

      // Optimistically update the user's profile status
      queryClient.setQueryData(['currentUser'], (oldUserData: any) => {
        if (!oldUserData) return oldUserData

        return {
          ...oldUserData,
          status: {
            ...oldUserData.status,
            status: emoji,
            createdAt: new Date().toISOString(),
          },
        }
      })

      // Return a context with the previous data
      return { previousStatuses, previousUser }
    },
    onSuccess: () => {
      // Refetch after success to get the correct data
      queryClient.invalidateQueries({ queryKey: ['statuses'] })
    },
    onError: (err, _emoji, context) => {
      const message =
        err instanceof Error ? err.message : 'Failed to create status'
      setError(message)

      // If we have a previous context, roll back to it
      if (context) {
        if (context.previousStatuses) {
          queryClient.setQueryData(['statuses'], context.previousStatuses)
        } else {
          queryClient.invalidateQueries({ queryKey: ['statuses'] })
        }

        if (context.previousUser) {
          queryClient.setQueryData(['currentUser'], context.previousUser)
        } else {
          queryClient.invalidateQueries({ queryKey: ['currentUser'] })
        }
      } else {
        // Otherwise refresh all the data
        queryClient.invalidateQueries({ queryKey: ['statuses'] })
        queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      }
    },
  })

  const handleSubmitStatus = (emoji: string) => {
    if (mutation.isPending) return

    setError(null)
    mutation.mutate(emoji)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">How are you feeling?</h2>
      {(error || mutation.error) && (
        <div className="text-red-500 mb-4 p-2 bg-red-50 dark:bg-red-950 dark:bg-opacity-30 rounded-md">
          {error ||
            (mutation.error instanceof Error
              ? mutation.error.message
              : 'Failed to create status')}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        {STATUS_OPTIONS.map((emoji) => {
          const isSelected = mutation.variables === emoji && mutation.isPending
          const isCurrentStatus = currentUserStatus === emoji

          return (
            <button
              key={emoji}
              onClick={() => handleSubmitStatus(emoji)}
              disabled={mutation.isPending}
              className={`
                p-2 rounded-md
                text-2xl w-11 h-11 leading-none
                flex items-center justify-center
                transition-all duration-200
                ${isSelected ? 'opacity-60' : 'opacity-100'}
                ${!isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-110' : ''}
                ${
                  isCurrentStatus
                    ? 'bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-900 dark:bg-opacity-30 dark:ring-blue-700'
                    : ''
                }
                active:scale-95
                focus:outline-none focus:ring-2 focus:ring-blue-300 dark:focus:ring-blue-500
              `}
              title={isCurrentStatus ? 'Your current status' : undefined}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default StatusForm
