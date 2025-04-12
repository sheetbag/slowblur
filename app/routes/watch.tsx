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
      console.log(`Redirecting from /watch?v=${videoId} to /?v=${videoId}`)
      // Replace the current history entry to avoid breaking the back button
      navigate({ to: '/', search: { v: videoId }, replace: true })
    } else {
      // If no video ID, redirect to the root page without any params
      console.log('No video ID found on /watch, redirecting to /')
      navigate({ to: '/', replace: true })
    }
    // We only want this effect to run once on mount to perform the redirect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array ensures it runs only once

  // Render null or a loading indicator while redirecting
  return null
}