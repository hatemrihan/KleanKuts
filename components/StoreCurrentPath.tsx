'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Component that stores the current path in localStorage
 * This should be included in the layout to save the current path on every page visit
 */
export default function StoreCurrentPath() {
  const pathname = usePathname()

  useEffect(() => {
    // Don't save the sign-in page itself as the last path
    if (pathname !== '/auth/signin') {
      localStorage.setItem('lastPath', pathname)
    }
  }, [pathname])

  // This component doesn't render anything
  return null
} 