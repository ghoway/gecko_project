'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Menu, X, Crown } from 'lucide-react'

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    }
    localStorage.removeItem('token')
    router.push('/auth/signin')
  }

  return (
    <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {process.env.APP_NAME || "Gecko Store"}
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/dashboard"
              className={`${pathname === '/dashboard' ? 'text-orange-600 font-medium' : 'text-gray-700'} hover:text-orange-600 transition-colors`}
            >
              Dashboard
            </Link>
            <Link
              href="/profile"
              className={`${pathname === '/profile' ? 'text-orange-600 font-medium' : 'text-gray-700'} hover:text-orange-600 transition-colors`}
            >
              Profile
            </Link>
            <Link
              href="/subscribe"
              className={`${pathname === '/subscribe' ? 'text-orange-600 font-medium' : 'text-gray-700'} hover:text-orange-600 transition-colors`}
            >
              Subscribe
            </Link>
            <Button
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-red-600 text-white border-0"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </nav>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20 pt-4">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/dashboard"
                className={`${pathname === '/dashboard' ? 'text-orange-600 font-medium' : 'text-gray-700'} hover:text-orange-600 transition-colors`}
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                className={`${pathname === '/profile' ? 'text-orange-600 font-medium' : 'text-gray-700'} hover:text-orange-600 transition-colors`}
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <Link
                href="/subscribe"
                className={`${pathname === '/subscribe' ? 'text-orange-600 font-medium' : 'text-gray-700'} hover:text-orange-600 transition-colors`}
                onClick={() => setIsMenuOpen(false)}
              >
                Subscribe
              </Link>
              <Button
                className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-red-600 text-white border-0 w-full"
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}