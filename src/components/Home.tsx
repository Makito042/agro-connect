import React from 'react';
import { 
  ArrowRight,
  Sprout,
  Users,
  MessageCircle,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-[#2c3e50] text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Sprout className="w-20 h-20 text-[#3498db]" />
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Welcome to Agro-Connected
            </h1>
            <p className="text-xl mb-8 text-gray-300">
              Your digital platform for modern farming solutions. Connect with experts, share knowledge, and grow together.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                to="/register"
                className="bg-[#3498db] hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg inline-flex items-center transition-colors"
              >
                Join Community
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/features"
                className="bg-white text-[#2c3e50] hover:bg-gray-100 font-bold py-3 px-8 rounded-lg inline-flex items-center transition-colors"
              >
                Explore Features
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overview */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Agro-Connected?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-[#3498db]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Expert Community</h3>
              <p className="text-gray-600">Connect with agricultural experts and fellow farmers to share knowledge and experiences.</p>
            </div>
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <MessageCircle className="w-12 h-12 text-[#3498db]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Interactive Forum</h3>
              <p className="text-gray-600">Engage in discussions, share success stories, and get answers to your farming questions.</p>
            </div>
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <BarChart3 className="w-12 h-12 text-[#3498db]" />
              </div>
              <h3 className="text-xl font-bold mb-2">Data-Driven Insights</h3>
              <p className="text-gray-600">Access real-time agricultural data and analytics to make informed decisions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image Section */}
      <div className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Transform Your Farming Practice</h2>
              <p className="text-gray-600 mb-8">
                Join thousands of farmers who are already using Agro-Connected to improve their yields, reduce costs, and adopt sustainable farming practices.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center">
                  <div className="bg-[#3498db] rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Access to expert agricultural knowledge
                </li>
                <li className="flex items-center">
                  <div className="bg-[#3498db] rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Real-time weather and market data
                </li>
                <li className="flex items-center">
                  <div className="bg-[#3498db] rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  Community support and networking
                </li>
              </ul>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=1200" 
                alt="Modern farming" 
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}