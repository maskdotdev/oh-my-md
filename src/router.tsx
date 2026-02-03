import { createRouter } from '@tanstack/solid-router'
import { QueryClient } from '@tanstack/solid-query'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

export type RouterContext = {
  queryClient: QueryClient
}

export const queryClient = new QueryClient()

// Create a new router instance
export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
})
