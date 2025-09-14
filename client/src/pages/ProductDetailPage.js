import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Heart, ShoppingCart, MapPin, Users, Shield, Truck, RotateCcw, MessageCircle, Share2, Plus, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');

  // Mock product data - in real app, fetch based on ID
  const product = {
    id: parseInt(id),
    name: "Traditional Dokra Art Collection",
    category: "handicrafts",
    price: 2500,
    originalPrice: 3200,
    images: [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ],
    seller: {
      name: "Artisan Collective Ranchi",
      rating: 4.8,
      totalProducts: 45,
      yearsActive: 8,
      location: "Ranchi, Jharkhand",
      verified: true
    },
    rating: 4.8,
    reviews: 124,
    description: "Authentic brass figurines made using traditional lost-wax casting technique by skilled tribal artisans. Each piece is handcrafted and tells a story of ancient Jharkhand culture.",
    inStock: true,
    fastDelivery: true,
    tags: ["Handmade", "Traditional", "Authentic", "Brass", "Tribal Art"],
    location: "Ranchi",
    specifications: {
      "Material": "Brass",
      "Technique": "Lost-wax casting",
      "Origin": "Jharkhand, India",
      "Dimensions": "Various sizes (6-12 inches)",
      "Weight": "500g - 2kg",
      "Care": "Clean with dry cloth, avoid water"
    },
    features: [
      "100% Handmade by tribal artisans",
      "Traditional Dokra technique",
      "Unique designs, no two pieces alike",
      "Eco-friendly materials",
      "Supports local communities",
      "Certificate of authenticity included"
    ],
    shipping: {
      freeDelivery: true,
      estimatedDays: "3-5 business days",
      returnPolicy: "30-day return policy",
      warranty: "1-year craftsmanship warranty"
    }
  };

  const relatedProducts = [
    {
      id: 7,
      name: "Tribal Jewelry Collection",
      price: 1850,
      originalPrice: 2300,
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.6
    },
    {
      id: 4,
      name: "Bamboo Craft Deluxe Set",
      price: 1200,
      originalPrice: 1500,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.5
    },
    {
      id: 5,
      name: "Forest Honey & Spice Collection",
      price: 650,
      originalPrice: 800,
      image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.7
    }
  ];

  const reviews = [
    {
      id: 1,
      user: "Priya Sharma",
      rating: 5,
      date: "2 weeks ago",
      comment: "Absolutely beautiful craftsmanship! The details are incredible and it arrived perfectly packaged.",
      verified: true
    },
    {
      id: 2,
      user: "Rajesh Kumar",
      rating: 4,
      date: "1 month ago",
      comment: "Great quality and authentic piece. Delivery was quick and the seller was very responsive.",
      verified: true
    },
    {
      id: 3,
      user: "Anita Das",
      rating: 5,
      date: "6 weeks ago",
      comment: "Love supporting local artisans. This piece is now the centerpiece of my living room!",
      verified: true
    }
  ];

  const tabs = [
    { id: 'description', name: 'Description' },
    { id: 'specifications', name: 'Specifications' },
    { id: 'reviews', name: `Reviews (${reviews.length})` },
    { id: 'seller', name: 'Seller Info' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center mb-6">
          <Link to="/marketplace" className="flex items-center text-gray-600 hover:text-purple-600 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Product Images */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative rounded-lg overflow-hidden ${
                    selectedImage === index ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-20 object-cover hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center mb-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">({product.reviews} reviews)</span>
                </div>
                <div className="flex items-center text-gray-500 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  {product.location}
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Heart className="h-5 w-5" />
                </button>
                <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-3xl font-bold text-purple-600">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice > product.price && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    ₹{product.originalPrice.toLocaleString()}
                  </span>
                  <span className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-sm font-medium">
                    {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Quantity */}
            <div className="flex items-center space-x-4 mb-6">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mb-6">
              <Link
                to="/checkout"
                state={{ product, quantity }}
                className="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors text-center"
              >
                Buy Now
              </Link>
              <button className="flex-1 border border-purple-600 text-purple-600 py-3 px-6 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <Truck className="h-4 w-4 text-green-500 mr-2" />
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center">
                <RotateCcw className="h-4 w-4 text-blue-500 mr-2" />
                <span>30-day Returns</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 text-purple-500 mr-2" />
                <span>Authentic Product</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 text-orange-500 mr-2" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'description' && (
            <div>
              <p className="text-gray-700 mb-6">{product.description}</p>
              <h3 className="text-lg font-semibold mb-4">Key Features:</h3>
              <ul className="space-y-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="font-medium text-gray-600">{key}:</span>
                  <span className="text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center">
                        <span className="font-medium">{review.user}</span>
                        {review.verified && (
                          <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'seller' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{product.seller.name}</h3>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span>{product.seller.rating} rating</span>
                      {product.seller.verified && (
                        <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          Verified Seller
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span>{product.seller.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Years Active:</span>
                    <span>{product.seller.yearsActive} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Products:</span>
                    <span>{product.seller.totalProducts}</span>
                  </div>
                </div>
              </div>
              <div>
                <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors mb-3">
                  Contact Seller
                </button>
                <button className="w-full border border-purple-600 text-purple-600 py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors">
                  View All Products
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Related Products */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link
                key={relatedProduct.id}
                to={`/marketplace/${relatedProduct.id}`}
                className="group"
              >
                <div className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={relatedProduct.image}
                    alt={relatedProduct.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-2">{relatedProduct.name}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-purple-600">
                          ₹{relatedProduct.price.toLocaleString()}
                        </span>
                        {relatedProduct.originalPrice > relatedProduct.price && (
                          <span className="text-sm text-gray-400 line-through">
                            ₹{relatedProduct.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{relatedProduct.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
