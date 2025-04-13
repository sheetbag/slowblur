import * as React from 'react'
import { createFileRoute, useRouter, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/watch')({
  component: WatchRedirect,
})

function WatchRedirect() {
  const router = useRouter()
  const navigate = useNavigate()
  const searchParams = new URLSearchParams(router.state.location.searchStr)
  const videoId = searchParams.get('v')

  React.useEffect(() => {
    if (videoId) {
      navigate({ to: '/', search: { v: videoId }, replace: true })
    } else {
      navigate({ to: '/', replace: true })
    }
  }, [])

  return null
}