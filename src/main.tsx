import { render } from 'solid-js/web'
import { RouterProvider } from '@tanstack/solid-router'
import { QueryClientProvider } from '@tanstack/solid-query'

import { queryClient, router } from './router'
import './styles.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Root element not found')
}

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  ),
  root,
)
