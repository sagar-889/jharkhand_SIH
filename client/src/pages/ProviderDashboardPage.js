import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Star,
  TrendingUp,
  MessageSquare,
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';

const ProviderDashboardPage = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const dashboardStats = [
    { icon: Users, label: 'Total Visitors', value: '1,234', change: '+12%', color: 'blue' },
    { icon: Calendar, label: 'Bookings This Month', value: '89', change: '+23%', color: 'green' },
    { icon: DollarSign, label: 'Revenue', value: '₹1,25,430', change: '+18%', color: 'purple' },
    { icon: Star, label: 'Average Rating', value: '4.7', change: '+0.3', color: 'yellow' }
  ];

  const recentActivities = [
    { type: 'booking', message: 'New booking for Ranchi Heritage Walk', time: '2 hours ago' },
    { type: 'review', message: 'Received 5-star review from Priya S.', time: '4 hours ago' },
    { type: 'inquiry', message: 'New inquiry about Betla Safari package', time: '6 hours ago' },
    { type: 'payment', message: 'Payment received for booking #1234', time: '1 day ago' }
  ];

  const myListings = [
    {
      id: 1,
      title: 'Ranchi Heritage Walk',
      category: 'Tour',
      price: '₹500',
      status: 'active',
      bookings: 45,
      rating: 4.8,
      image: '/api/placeholder/300/200'
    },
    {
      id: 2,
      title: 'Betla National Park Safari',
      category: 'Adventure',
      price: '₹1,200',
      status: 'active',
      bookings: 32,
      rating: 4.6,
      image: '/api/placeholder/300/200'
    },
    {
      id: 3,
      title: 'Tribal Village Experience',
      category: 'Cultural',
      price: '₹800',
      status: 'pending',
      bookings: 0,
      rating: 0,
      image: '/api/placeholder/300/200'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
              <p className="text-gray-600">Welcome back, Rajesh Kumar</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Listing
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'listings', label: 'My Listings', icon: MapPin },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'reviews', label: 'Reviews', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeSection === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Dashboard Content */}
        {activeSection === 'dashboard' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardStats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-lg shadow-sm border"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`p-3 bg-${stat.color}-50 rounded-full`}>
                      <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                    <span className="text-sm text-gray-500 ml-1">from last month</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activities</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'booking' ? 'bg-green-400' :
                        activity.type === 'review' ? 'bg-yellow-400' :
                        activity.type === 'inquiry' ? 'bg-blue-400' :
                        'bg-purple-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Listings Content */}
        {activeSection === 'listings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <img
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{listing.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        listing.status === 'active' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {listing.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{listing.category}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold text-blue-600">{listing.price}</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{listing.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{listing.bookings} bookings</p>
                    <div className="flex space-x-2">
                      <button className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </button>
                      <button className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                      <button className="flex items-center justify-center px-3 py-2 border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Other sections placeholder */}
        {(activeSection === 'bookings' || activeSection === 'reviews') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm border p-8 text-center"
          >
            <div className="text-gray-400 mb-4">
              <Calendar className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} Section
            </h3>
            <p className="text-gray-500">
              This section is under development. Please check back later.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboardPage;
