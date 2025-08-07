import React, { useState } from 'react'
import { Button } from "@/components/UI/Button"
import { Input } from "@/components/UI/Input"
import { User, Lock, Mail, Facebook, Twitter, Linkedin } from 'lucide-react'
import { Link } from 'react-router-dom'
import NotificationContainer from '../components/UI/NotificationContainer'

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600">
      {/* Background Image with Teal Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/images/hero-background.jpg')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/90 to-emerald-600/90" />
      
      {/* Geometric Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 border border-white/30 rotate-45"></div>
        <div className="absolute top-40 right-32 w-24 h-24 border border-white/20 rotate-12"></div>
        <div className="absolute bottom-32 left-32 w-40 h-40 border border-white/25 -rotate-12"></div>
      </div>

      {/* Centered Card Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        {/* Signup Card */}
        <div className="relative w-full max-w-4xl">
          {/* Curved White Card Background */}
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex">
              {/* Left Side - Curved Teal Section */}
              <div className="hidden lg:block lg:w-3/5 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600"></div>
                {/* Curved Edge */}
                <svg
                  className="absolute right-0 top-0 h-full w-24"
                  viewBox="0 0 100 400"
                  preserveAspectRatio="none"
                  fill="white"
                >
                  <path d="M0,0 C50,50 50,350 0,400 L100,400 L100,0 Z" />
                </svg>
                {/* Content overlay for left side */}
                <div className="relative z-10 p-12 h-full flex items-center">
                  <div className="text-white">
                    <h2 className="text-3xl font-bold mb-4">Join Our Community!</h2>
                    <p className="text-teal-100 text-lg">Create your account and start making a difference in your community</p>
                  </div>
                </div>
              </div>
              
              {/* Right Side - Form Section */}
              <div className="w-full lg:w-2/5 p-8 lg:p-12">
                <div className="w-full max-w-sm mx-auto space-y-6">
                  {/* Back to Home Link */}
                  <div className="text-center">
                    <Link
                      to="/"
                      className="inline-flex items-center text-sm text-gray-500 hover:text-teal-600 transition-colors"
                    >
                      ← Back to Home
                    </Link>
                  </div>

                  {/* Header */}
                  <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">Join Us</h1>
                    <p className="text-gray-500">Create your account to get started</p>
                  </div>

                  {/* Signup Form */}
                  <form className="space-y-4">
                    {/* Full Name Input */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-12 h-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 h-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    {/* Confirm Password Input */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <Input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-12 h-12 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    {/* Terms and Conditions */}
                    <div className="flex items-start space-x-3 pt-2">
                      <input
                        id="terms"
                        type="checkbox"
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded mt-0.5"
                      />
                      <label htmlFor="terms" className="block text-xs text-gray-500 leading-relaxed">
                        I agree to the{' '}
                        <Link to="#" className="text-teal-600 hover:text-teal-700 underline">
                          Terms and Conditions
                        </Link>
                      </label>
                    </div>

                    {/* Signup Button */}
                    <Button 
                      type="submit"
                      className="w-full h-12 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors duration-200 mt-6"
                    >
                      Create Account
                    </Button>
                  </form>

                  {/* Login Link */}
                  <div className="text-center">
                    <p className="text-gray-500 text-sm">
                      Already have an account?{' '}
                      <Link to="/login" className="text-teal-600 hover:text-teal-700 font-medium transition-colors">
                        Log in
                      </Link>
                    </p>
                  </div>

                  {/* Social Media Icons */}
                  <div className="flex justify-center space-x-4 pt-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      <Facebook className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                      <Twitter className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-700 transition-colors">
                      <Linkedin className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NotificationContainer />
    </div>
  )
}
