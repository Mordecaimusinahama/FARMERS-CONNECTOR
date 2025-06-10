import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const features = [
    {
      title: "Buy & Sell",
      description: "Trade crops, equipment, and supplies with verified farmers",
      icon: "🛒"
    },
    {
      title: "Smart Farming",
      description: "Get AI-powered insights for better crop management",
      icon: "🌱"
    },
    {
      title: "Market Access",
      description: "Connect with buyers and expand your market reach",
      icon: "🌍"
    },
    {
      title: "Digital Wallet",
      description: "Secure payments and financial management",
      icon: "💳"
    }
  ];

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-heading text-primary-700 mb-6">
              Zimbabwe's Agricultural Marketplace
            </h1>
            <p className="text-xl text-primary-900 mb-8 max-w-3xl mx-auto">
              Buy, sell, and manage your farm all in one place. Join thousands of farmers in Zimbabwe's digital agricultural revolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/market"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
              >
                Browse Marketplace
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 border border-primary-600 text-lg font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors duration-200"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-heading text-center text-primary-700 mb-12">
            Everything You Need for Modern Farming
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-lg bg-primary-50 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-heading text-primary-700 mb-2">{feature.title}</h3>
                <p className="text-primary-900">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-heading text-white mb-6">
            Ready to Transform Your Farming Business?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join our community of farmers and start trading today.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 border-2 border-white text-lg font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors duration-200"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage; "Marketplace" link to the Navbar, 