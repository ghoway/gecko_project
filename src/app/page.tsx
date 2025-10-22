'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Menu, X, Crown, Play, Palette, MessageSquare, Mail, Phone, MapPin, Check, Star, Sparkles } from 'lucide-react'
import type { Plan } from '@prisma/client'

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    fetchPlans()
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        if (data.success) {
          setIsLoggedIn(true)
        }
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
  }

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      const data = await response.json()
      if (data.success) {
        setPlans(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setPlansLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDuration = (days: number) => {
    if (days >= 30) {
      const months = Math.floor(days / 30)
      return `${months} Month`
    }
    return `${days} Days`
  }

  // Sort plans: put popular plan in the middle position
  const sortedByPrice = [...plans].sort((a, b) => a.price - b.price)
  const popularPlan = sortedByPrice.find(p => p.is_popular)
  const nonPopularPlans = sortedByPrice.filter(p => !p.is_popular)

  // Create final sorted array with popular plan in the middle
  const finalSortedPlans = [...nonPopularPlans]
  if (popularPlan) {
    // Insert popular plan at the middle position
    const midIndex = Math.floor(nonPopularPlans.length / 2)
    finalSortedPlans.splice(midIndex, 0, popularPlan)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-blue-100 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-red-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Gecko Store
              </span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a href="#services" className="text-gray-700 hover:text-orange-600 transition-colors">Services</a>
              <a href="#pricing" className="text-gray-700 hover:text-orange-600 transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-700 hover:text-orange-600 transition-colors">Contact</a>
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0">
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0">
                    Sign In
                  </Button>
                </Link>
              )}
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
                <a href="#services" className="text-gray-700 hover:text-orange-600 transition-colors">Services</a>
                <a href="#pricing" className="text-gray-700 hover:text-orange-600 transition-colors">Pricing</a>
                <a href="#contact" className="text-gray-700 hover:text-orange-600 transition-colors">Contact</a>
                {isLoggedIn ? (
                  <Link href="/dashboard">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 w-full">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <Link href="/auth/signin">
                    <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 w-full">
                      Sign In
                    </Button>
                  </Link>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-red-600 to-blue-600 bg-clip-text text-transparent">
              Premium Accounts SAAS
            </h1>
            <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
              Akses semua akun premium favorit Anda dengan satu langganan. Netflix, Canva, Spotify, ChatGPT, dan banyak lagi dalam satu platform terintegrasi.
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                Mulai Berlangganan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="relative z-10 py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Platform Tersedia
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-800">Streaming Services</CardTitle>
                <CardDescription className="text-gray-600">
                  Netflix, Disney+, HBO Max, Prime Video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Nikmati konten streaming premium tanpa batas dari semua platform favorit Anda dengan satu langganan.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-800">Productivity Tools</CardTitle>
                <CardDescription className="text-gray-600">
                  Canva, Adobe Creative, Figma, Notion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Akses tools kreatif dan produktivitas premium untuk meningkatkan kualitas kerja dan konten Anda.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-gray-800">AI & Music</CardTitle>
                <CardDescription className="text-gray-600">
                  ChatGPT, Spotify, YouTube Music, Midjourney
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Dapatkan akses ke AI tools canggih dan streaming musik premium untuk produktivitas dan hiburan.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

       {/* Pricing Section */}
       <section id="pricing" className="relative z-10 py-20 px-4">
         <div className="container mx-auto">
           <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
             Pilihan Langganan
           </h2>

           {plansLoading ? (
             <div className="flex justify-center items-center py-12">
               <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
             </div>
           ) : (
             <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
               {finalSortedPlans.map((plan, index) => {
                 const isPopular = plan.is_popular
                 const isFirst = index === 0
                 const isLast = index === finalSortedPlans.length - 1

                 return (
                   <Card
                     key={plan.id}
                     className={`group relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 ${
                       isPopular
                         ? 'bg-gradient-to-br from-red-50 to-blue-50 via-white/20 backdrop-blur-lg border-2 border-red-400/50 hover:border-red-400/80 transform hover:-translate-y-3 scale-105'
                         : 'bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/25 hover:border-white/40 transform hover:-translate-y-2'
                     }`}
                   >
                     {isPopular && (
                       <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-500 to-blue-500 text-white text-center py-2 text-sm font-semibold">
                         <div className="flex items-center justify-center gap-1">
                           <Star className="w-4 h-4 fill-current" />
                           Paling Populer
                         </div>
                       </div>
                     )}

                     <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                       isPopular
                         ? 'bg-gradient-to-br from-red-500/20 to-blue-500/20'
                         : isFirst
                         ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10'
                         : isLast
                         ? 'bg-gradient-to-br from-blue-500/10 to-orange-500/10'
                         : 'bg-gradient-to-br from-orange-500/10 to-red-500/10'
                     }`}></div>

                     <CardHeader className={`text-center relative z-10 ${isPopular ? 'pt-12' : ''}`}>
                       <CardTitle className={`text-2xl transition-colors duration-300 ${
                         isPopular
                           ? 'text-gray-800 group-hover:text-red-700'
                           : isFirst
                           ? 'text-gray-800 group-hover:text-orange-700'
                           : isLast
                           ? 'text-gray-800 group-hover:text-blue-700'
                           : 'text-gray-800 group-hover:text-orange-700'
                       }`}>
                         {plan.name}
                       </CardTitle>
                       <div className={`text-4xl font-bold transition-colors duration-300 ${
                         isPopular
                           ? 'text-red-600 group-hover:text-red-700'
                           : isFirst
                           ? 'text-orange-600 group-hover:text-orange-700'
                           : isLast
                           ? 'text-blue-600 group-hover:text-blue-700'
                           : 'text-orange-600 group-hover:text-orange-700'
                       }`}>
                         {formatPrice(plan.price)}
                       </div>
                       <CardDescription className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                         {formatDuration(plan.duration_in_days)} Access
                       </CardDescription>
                     </CardHeader>

                     <CardContent className="relative z-10">
                       <div className="space-y-3 mb-6">
                         {plan.features && Array.isArray(plan.features) && (plan.features as string[]).map((feature, featureIndex) => (
                           <div key={featureIndex} className="flex items-start gap-3">
                             <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                             <span className="text-sm text-gray-700 group-hover:text-gray-800 transition-colors duration-300">
                               {feature}
                             </span>
                           </div>
                         ))}
                       </div>

                       <Link href="/auth/signup" className="block">
                         <Button className={`w-full font-semibold py-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                           isPopular
                             ? 'bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-600 hover:to-blue-600'
                             : isFirst
                             ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                             : isLast
                             ? 'bg-gradient-to-r from-blue-500 to-orange-500 hover:from-blue-600 hover:to-orange-600'
                             : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                         }`}>
                           {isPopular && <Sparkles className="w-5 h-5 mr-2" />}
                           Mulai Berlangganan
                         </Button>
                       </Link>
                     </CardContent>
                   </Card>
                 )
               })}
             </div>
           )}
         </div>
       </section>

      {/* Contact Section */}
      <section id="contact" className="relative z-10 py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Hubungi Kami
          </h2>
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Email</p>
                      <p className="text-gray-600">support@geckostore.com</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">WhatsApp</p>
                      <p className="text-gray-600">+62 812-3456-7890</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Jam Operasional</p>
                      <p className="text-gray-600">Senin - Minggu, 24/7</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700">Nama Lengkap</Label>
                    <Input id="name" placeholder="Nama Anda" className="bg-white/20 border-white/30 placeholder-gray-500" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-700">Email</Label>
                    <Input id="email" type="email" placeholder="email@example.com" className="bg-white/20 border-white/30 placeholder-gray-500" />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-gray-700">Pesan</Label>
                    <Textarea id="message" placeholder="Tuliskan pesan Anda..." rows={4} className="bg-white/20 border-white/30 placeholder-gray-500" />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
                    Kirim Pesan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/10 backdrop-blur-md border-t border-white/20 py-8 px-4">
        <div className="container mx-auto text-center">
          <p className="text-gray-700">
            © 2024 Gecko Store - Premium Accounts SAAS. All rights reserved.
          </p>
        </div>
      </footer>


    </div>
  )
}
