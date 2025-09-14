import React, { useState } from 'react';

const AdminDashboardPage = () => {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock data for dashboard
  const stats = {
    totalUsers: 1247,
    totalBookings: 89,
    totalRevenue: 245000,
    activeDestinations: 12,
    monthlyGrowth: 15.3,
    avgRating: 4.7
  };

  const recentBookings = [
    { id: 1, customer: 'John Doe', destination: 'Netarhat', amount: 2500, status: 'Confirmed', date: '2024-01-15' },
    { id: 2, customer: 'Jane Smith', destination: 'Betla National Park', amount: 3200, status: 'Pending', date: '2024-01-14' },
    { id: 3, customer: 'Mike Johnson', destination: 'Deoghar', amount: 1800, status: 'Confirmed', date: '2024-01-13' },
    { id: 4, customer: 'Sarah Wilson', destination: 'Hundru Falls', amount: 1200, status: 'Completed', date: '2024-01-12' },
    { id: 5, customer: 'David Brown', destination: 'Patratu Valley', amount: 2100, status: 'Confirmed', date: '2024-01-11' }
  ];

  const topDestinations = [
    { name: 'Netarhat', visitors: 245, revenue: 61250 },
    { name: 'Betla National Park', visitors: 189, revenue: 56700 },
    { name: 'Deoghar', visitors: 156, revenue: 31200 },
    { name: 'Hundru Falls', visitors: 134, revenue: 20100 },
    { name: 'Patratu Valley', visitors: 98, revenue: 19600 }
  ];

  const feedbackData = [
    { sentiment: 'Positive', count: 45, percentage: 75 },
    { sentiment: 'Neutral', count: 10, percentage: 17 },
    { sentiment: 'Negative', count: 5, percentage: 8 }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'bookings', name: 'Bookings', icon: '📋' },
    { id: 'destinations', name: 'Destinations', icon: '🗺️' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'feedback', name: 'Feedback', icon: '💬' }
  ];

  const StatCard = ({ title, value, change, icon, color = 'primary' }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change={12.5}
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          change={8.2}
          icon="📋"
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          change={15.3}
          icon="💰"
          color="yellow"
        />
        <StatCard
          title="Active Destinations"
          value={stats.activeDestinations}
          change={0}
          icon="🗺️"
          color="purple"
        />
        <StatCard
          title="Average Rating"
          value={stats.avgRating}
          change={2.1}
          icon="⭐"
          color="orange"
        />
        <StatCard
          title="Monthly Growth"
          value={`${stats.monthlyGrowth}%`}
          change={3.2}
          icon="📈"
          color="indigo"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">New booking from John Doe for Netarhat</span>
            <span className="text-xs text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">New user registration: Sarah Wilson</span>
            <span className="text-xs text-gray-400">4 hours ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Payment received: ₹3,200</span>
            <span className="text-xs text-gray-400">6 hours ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Booking cancelled: Mike Johnson</span>
            <span className="text-xs text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Bookings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentBookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#{booking.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.customer}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.destination}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{booking.amount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDestinations = () => (
    <div className="bg-white rounded-lg shadow-md">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Top Destinations</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {topDestinations.map((dest, index) => (
            <div key={dest.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-600">{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{dest.name}</h4>
                  <p className="text-sm text-gray-600">{dest.visitors} visitors</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₹{dest.revenue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart placeholder - Revenue over time</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-500">Chart placeholder - User growth</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Sentiment</h3>
          <div className="space-y-3">
            {feedbackData.map((item) => (
              <div key={item.sentiment} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${
                    item.sentiment === 'Positive' ? 'bg-green-500' :
                    item.sentiment === 'Neutral' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900">{item.sentiment}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.sentiment === 'Positive' ? 'bg-green-500' :
                        item.sentiment === 'Neutral' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-900">"Amazing experience at Netarhat! The sunrise was breathtaking."</p>
              <p className="text-xs text-gray-500 mt-1">- John Doe, 2 days ago</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-gray-900">"Good service but could improve on communication."</p>
              <p className="text-xs text-gray-500 mt-1">- Jane Smith, 5 days ago</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-900">"Excellent guide and beautiful destinations. Highly recommended!"</p>
              <p className="text-xs text-gray-500 mt-1">- Mike Johnson, 1 week ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'bookings':
        return renderBookings();
      case 'destinations':
        return renderDestinations();
      case 'analytics':
        return renderAnalytics();
      case 'feedback':
        return renderFeedback();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your tourism platform and monitor performance</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
