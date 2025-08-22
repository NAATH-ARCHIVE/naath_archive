import React from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-naath-blue text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative w-8 h-8">
                <div className="absolute w-5 h-6 bg-naath-bronze rounded-t-lg"></div>
                <div className="absolute top-3 left-0 w-8 h-1 bg-naath-bronze"></div>
                <div className="absolute top-1 left-1.5 w-1.5 h-5 bg-naath-blue"></div>
                <div className="absolute top-1 left-4.5 w-1.5 h-5 bg-naath-blue"></div>
              </div>
              <span className="text-lg font-bold">NAATH ARCHIVE</span>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Preserving and sharing the rich cultural heritage of the Naath people through 
              articles, artifacts, oral histories, and educational resources.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-naath-bronze transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-naath-bronze transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-naath-bronze transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-naath-bronze">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/articles" className="text-gray-300 hover:text-white transition-colors">
                  Articles
                </Link>
              </li>
              <li>
                <Link to="/archive" className="text-gray-300 hover:text-white transition-colors">
                  Archive
                </Link>
              </li>
              <li>
                <Link to="/donate" className="text-gray-300 hover:text-white transition-colors">
                  Donate
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-naath-bronze">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-naath-bronze" />
                <span className="text-gray-300">info@naatharchive.org</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-naath-bronze" />
                <span className="text-gray-300">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-naath-bronze" />
                <span className="text-gray-300">Juba, South Sudan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © {currentYear} Naath Archive. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-gray-300 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-300 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to="/accessibility" className="text-gray-300 hover:text-white text-sm transition-colors">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
