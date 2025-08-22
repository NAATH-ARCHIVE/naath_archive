import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Archive, Heart, Users } from 'lucide-react'

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-naath text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-shadow-lg">
            Preserving Naath Cultural Heritage
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-gray-100">
            Discover, explore, and learn about the rich traditions, artifacts, and stories 
            that define the Naath people's cultural identity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/articles"
              className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
            >
              <span>Explore Articles</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/archive"
              className="btn-outline text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-naath-blue"
            >
              Browse Archive
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title">What We Offer</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive archive provides multiple ways to engage with and learn about 
              Naath cultural heritage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-naath-bronze/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-naath-bronze" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Articles</h3>
              <p className="text-gray-600">
                In-depth articles exploring Naath culture, history, and traditions.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-naath-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Archive className="h-8 w-8 text-naath-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Artifacts</h3>
              <p className="text-gray-600">
                Digital preservation of cultural artifacts and historical objects.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-naath-bronze/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-naath-bronze" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Oral Histories</h3>
              <p className="text-gray-600">
                First-hand accounts and stories from community members.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-naath-blue/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-naath-blue" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Education</h3>
              <p className="text-gray-600">
                Educational resources for students and researchers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Support Our Mission
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Help us continue preserving and sharing Naath cultural heritage for future generations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donate"
              className="btn-primary text-lg px-8 py-3"
            >
              Make a Donation
            </Link>
            <Link
              to="/register"
              className="btn-outline text-lg px-8 py-3"
            >
              Become a Contributor
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
