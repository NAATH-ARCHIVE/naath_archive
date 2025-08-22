import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, User, Search, LogOut, Settings, BookOpen, Plus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Articles', href: '/articles', current: location.pathname.startsWith('/articles') },
    { name: 'Archive', href: '/archive', current: location.pathname === '/archive' },
    { name: 'Donate', href: '/donate', current: location.pathname === '/donate' },
  ]

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [location.pathname])

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsUserMenuOpen(false)
  }

  return (
    <header className="bg-naath-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center">
              {/* Logo implementation using the brand colors */}
              <div className="relative w-10 h-10">
                {/* Anchor-like symbol in bronze */}
                <div className="absolute w-6 h-8 bg-naath-bronze rounded-t-lg"></div>
                <div className="absolute top-4 left-0 w-10 h-1 bg-naath-bronze"></div>
                {/* Vertical bars in dark blue */}
                <div className="absolute top-1 left-2 w-2 h-6 bg-naath-blue"></div>
                <div className="absolute top-1 left-6 w-2 h-6 bg-naath-blue"></div>
              </div>
              <span className="text-xl font-bold text-white ml-3">NAATH ARCHIVE</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-naath-bronze bg-white/10'
                    : 'text-white hover:text-naath-bronze hover:bg-white/5'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side - Search and User */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Search Button */}
            <button className="p-2 text-white hover:text-naath-bronze hover:bg-white/5 rounded-md transition-colors duration-200">
              <Search className="h-5 w-5" />
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-2 text-white hover:text-naath-bronze hover:bg-white/5 rounded-md transition-colors duration-200"
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.firstName}</span>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.role}</p>
                    </div>
                    
                    <Link
                      to="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                    
                    {(user.role === 'contributor' || user.role === 'admin') && (
                      <Link
                        to="/dashboard/articles/new"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Article
                      </Link>
                    )}
                    
                    <Link
                      to="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-white hover:text-naath-bronze transition-colors duration-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-naath-bronze text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-naath-bronze-dark transition-colors duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-white hover:text-naath-bronze hover:bg-white/5 rounded-md transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-naath-blue-dark">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive(item.href)
                    ? 'text-naath-bronze bg-white/10'
                    : 'text-white hover:text-naath-bronze hover:bg-white/5'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-white/20">
              {user ? (
                <>
                  <div className="px-3 py-2 border-b border-white/20">
                    <p className="text-sm text-white">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-naath-bronze">{user.role}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-white hover:text-naath-bronze transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  {(user.role === 'contributor' || user.role === 'admin') && (
                    <Link
                      to="/dashboard/articles/new"
                      className="block px-3 py-2 text-white hover:text-naath-bronze transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      New Article
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-white hover:text-naath-bronze transition-colors duration-200"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-white hover:text-naath-bronze transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 text-white hover:text-naath-bronze transition-colors duration-200"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
