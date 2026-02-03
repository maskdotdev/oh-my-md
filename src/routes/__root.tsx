import { Outlet, createRootRouteWithContext } from '@tanstack/solid-router'
import { Suspense } from 'solid-js'
import type { RouterContext } from '../router'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <Suspense>
      <Outlet />
    </Suspense>
  )
}
