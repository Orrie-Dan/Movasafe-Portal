'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { MessageSquare, X } from 'lucide-react'

type Section = 'home' | 'mission' | 'services' | 'contact' | null

export default function LandingPage() {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [activeSection, setActiveSection] = useState<Section>('home')

  const handlePortalAccess = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsTransitioning(true)
    setTimeout(() => {
      router.push('/login')
    }, 500)
  }

  const handleNavClick = (section: Section, e: React.MouseEvent) => {
    e.preventDefault()
    setActiveSection(section)
  }

  const closeSection = () => {
    setActiveSection('home')
  }

  return (
    <div className={`relative min-h-screen w-full overflow-hidden font-sans text-white transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/WMS.jpg"
          alt="Waste Management Background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="text-lg md:text-xl font-bold tracking-wider">WMS</div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-xs md:text-sm font-normal tracking-wide">
          <button 
            onClick={(e) => handleNavClick('home', e)}
            className={`hover:text-white/80 transition-colors ${
              activeSection === 'home' ? 'text-white underline underline-offset-4' : 'text-white/70'
            }`}
          >
            Home
          </button>
          <button 
            onClick={(e) => handleNavClick('mission', e)}
            className={`hover:text-white/80 transition-colors ${
              activeSection === 'mission' ? 'text-white underline underline-offset-4' : 'text-white/70'
            }`}
          >
            Mission
          </button>
          <button 
            onClick={(e) => handleNavClick('services', e)}
            className={`hover:text-white/80 transition-colors ${
              activeSection === 'services' ? 'text-white underline underline-offset-4' : 'text-white/70'
            }`}
          >
            Services
          </button>
          <button 
            onClick={(e) => handleNavClick('contact', e)}
            className={`hover:text-white/80 transition-colors ${
              activeSection === 'contact' ? 'text-white underline underline-offset-4' : 'text-white/70'
            }`}
          >
            Contact
          </button>
          <button 
            onClick={handlePortalAccess}
            className="hover:text-white/80 transition-colors text-white/70"
          >
            Portal Access
          </button>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white">
          <span className="sr-only">Open menu</span>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Main Content / Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 text-center">
        {/* Home Section - Default View */}
        <div 
          className={`transition-all duration-700 ${
            activeSection === 'home' 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 -translate-y-10 pointer-events-none absolute'
          }`}
        >
          <p className="font-serif text-lg md:text-xl lg:text-2xl font-normal mb-4 drop-shadow-md text-white/95 tracking-wide">
            Welcome to
          </p>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight mb-6 drop-shadow-lg leading-tight">
            WASTE MANAGEMENT<br />
            SYSTEM
          </h1>
          
          <p className="font-serif text-base md:text-lg lg:text-xl font-light tracking-wide mb-10 drop-shadow-md text-white/90 italic">
            Efficient • Sustainable • Smart
          </p>

          <Button 
            onClick={handlePortalAccess}
            className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-4 text-sm md:text-base font-normal tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95"
          >
            Access Portal
          </Button>
        </div>

        {/* Mission Section */}
        <div 
          className={`max-w-4xl mx-auto transition-all duration-700 ${
            activeSection === 'mission' 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10 pointer-events-none absolute'
          }`}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <button
              onClick={closeSection}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 drop-shadow-lg">
              Our Mission
            </h2>
            <div className="space-y-4 text-left text-white/90">
              <p className="text-lg md:text-xl leading-relaxed">
                To revolutionize waste management through innovative technology, creating a sustainable and efficient system that protects our environment for future generations.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-3">Environmental Protection</h3>
                  <p className="text-white/80">Reducing waste impact on natural ecosystems through smart collection and recycling programs.</p>
                </div>
                <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-3">Community Engagement</h3>
                  <p className="text-white/80">Empowering communities to participate actively in sustainable waste management practices.</p>
                </div>
                <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-3">Innovation</h3>
                  <p className="text-white/80">Leveraging cutting-edge technology to optimize waste collection and processing efficiency.</p>
                </div>
                <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                  <h3 className="text-xl font-bold mb-3">Sustainability</h3>
                  <p className="text-white/80">Building a circular economy where waste becomes a valuable resource for future use.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div 
          className={`max-w-4xl mx-auto transition-all duration-700 ${
            activeSection === 'services' 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10 pointer-events-none absolute'
          }`}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <button
              onClick={closeSection}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 drop-shadow-lg">
              Our Services
            </h2>
            <div className="space-y-6 text-left text-white/90">
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-3">Waste Collection</h3>
                <p className="text-white/80 text-lg">Regular scheduled pickups for residential and commercial areas, ensuring timely and efficient waste removal.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-3">Recycling Programs</h3>
                <p className="text-white/80 text-lg">Comprehensive recycling services for plastics, paper, glass, and metals to promote circular economy.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-3">Waste Tracking</h3>
                <p className="text-white/80 text-lg">Real-time tracking system allowing residents to monitor collection schedules and report issues instantly.</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-3">Environmental Cleanup</h3>
                <p className="text-white/80 text-lg">Specialized cleanup services for public spaces, parks, and natural areas to maintain environmental health.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div 
          className={`max-w-2xl mx-auto transition-all duration-700 ${
            activeSection === 'contact' 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10 pointer-events-none absolute'
          }`}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/20 shadow-2xl">
            <button
              onClick={closeSection}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-8 drop-shadow-lg">
              Contact Us
            </h2>
            <div className="space-y-6 text-left text-white/90">
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2">Email</h3>
                <p className="text-white/80 text-lg">info@wastemanagement.com</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2">Phone</h3>
                <p className="text-white/80 text-lg">+1 (555) 123-4567</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2">Office Hours</h3>
                <p className="text-white/80 text-lg">Monday - Friday: 8:00 AM - 6:00 PM<br />Saturday: 9:00 AM - 2:00 PM</p>
              </div>
              <div className="bg-white/5 rounded-lg p-6 backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2">Emergency Hotline</h3>
                <p className="text-white/80 text-lg">24/7 Service: +1 (555) 123-HELP</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Chat/Support Floating Action Button */}
      <div className="absolute bottom-8 right-8 md:right-12 z-20">
        <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/10 shadow-lg transition-all group">
          <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  )
}
