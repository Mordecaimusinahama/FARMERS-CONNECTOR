import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore'; // Added getDoc
import { ref, deleteObject } from 'firebase/storage';
import CreateMarketItem from '../components/CreateMarketItem';

// Defined categories
const CATEGORIES_CONFIG = [
  { id: 'all', name: 'All Categories' },
  { id: 'Equipment', name: 'Equipment' },
  { id: 'Seeds', name: 'Seeds' },
  { id: 'Fertilizers', name: 'Fertilizers' },
  { id: 'Tools', name: 'Tools' },
  { id: 'Other Farm Supplies', name: 'Other Farm Supplies' },
];

const Marketplace = () => {
  const { currentUser } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [marketItemsList, setMarketItemsList] = useState([]);
  const [sellerItemProfiles, setSellerItemProfiles] = useState({}); // State for seller profiles
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });

  const getStoragePathFromUrl = (url) => { // Already present, ensure it's used correctly
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.split('/o/')[1].split('?')[0];
      return decodeURIComponent(path);
    } catch (e) {
      console.error("Error extracting path from URL:", e, url);
      return null;
    }
  };

  useEffect(() => {
    setIsLoadingData(true);
    const itemsCollectionRef = collection(db, 'marketItems');
    const q = query(itemsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMarketItemsList(items);

      const sellerIdsToFetch = [...new Set(items.map(item => item.sellerId))]
                                .filter(id => !sellerItemProfiles[id]);

      if (sellerIdsToFetch.length > 0) {
        const profilesPromises = sellerIdsToFetch.map(id => getDoc(doc(db, 'users', id)));
        try {
          const profileDocs = await Promise.all(profilesPromises);
          const newProfiles = {};
          profileDocs.forEach(docSnap => {
            if (docSnap.exists()) {
              newProfiles[docSnap.id] = {
                preferredContact: docSnap.data().preferredContact || '',
                // displayName: docSnap.data().displayName || docSnap.data().email, // sellerName is on item
              };
            }
          });
          setSellerItemProfiles(prev => ({ ...prev, ...newProfiles }));
        } catch (profileError) {
          console.error("Error fetching seller profiles for marketplace:", profileError);
        }
      }
      setIsLoadingData(false);
    }, (err) => {
      console.error("Error fetching market items:", err);
      setFetchError("Failed to fetch market items. " + err.message);
      setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, []); // sellerItemProfiles removed from dependency array

  const handleOperationComplete = (message) => {
    setShowItemModal(false);
    setEditingItem(null);
    setActionFeedback({ type: 'success', message });
    setTimeout(() => setActionFeedback({ type: '', message: '' }), 3000);
  };

  const openCreateItemModal = () => {
    setEditingItem(null);
    setActionFeedback({ type: '', message: '' });
    setShowItemModal(true);
  };

  const openEditItemModal = (item) => {
    setEditingItem(item);
    setActionFeedback({ type: '', message: '' });
    setShowItemModal(true);
  };

  const handleDeleteItem = async (itemId, imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    setActionFeedback({ type: '', message: '' }); // Clear previous
    try {
      await deleteDoc(doc(db, 'marketItems', itemId));
      if (imageUrl) {
        const imagePath = getStoragePathFromUrl(imageUrl);
        if (imagePath) {
          await deleteObject(ref(storage, imagePath));
        } else {
          console.warn("Could not determine image path for deletion from URL:", imageUrl);
        }
      }
      setActionFeedback({ type: 'success', message: 'Item deleted successfully.' });
    } catch (err) {
      console.error("Error deleting item:", err);
      setActionFeedback({ type: 'error', message: `Failed to delete item: ${err.message}` });
    }
    setTimeout(() => setActionFeedback({ type: '', message: '' }), 3000);
  };

  // Filtering logic (Phase 4 - already partially here)
  const filteredProducts = marketItemsList.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-heading text-primary-700">Marketplace</h1>
          {currentUser && (
            <button
              onClick={openCreateItemModal}
              className="bg-accent-500 text-white px-6 py-2 rounded-lg hover:bg-accent-600 transition duration-300 shadow-md"
            >
              List New Item
            </button>
          )}
        </div>
      </div>

      {/* Action Feedback Display */}
      {actionFeedback.message && (
        <div className={`p-4 text-center ${actionFeedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {actionFeedback.message}
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="w-full md:w-64 bg-white p-6 rounded-lg shadow self-start sticky top-20"> {/* Sticky sidebar */}
            <h2 className="text-lg font-heading text-primary-700 mb-4">Categories</h2>
            <div className="space-y-2">
              {CATEGORIES_CONFIG.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary-100 text-primary-700 font-semibold'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search items by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
              />
            </div>

            {isLoadingData && <p className="text-center py-10">Loading items...</p>}
            {fetchError && <p className="text-center py-10 text-red-500">{fetchError}</p>}

            {!isLoadingData && !fetchError && filteredProducts.length === 0 && (
              <p className="text-center py-10 text-gray-600">
                No items found matching your criteria. {currentUser ? 'Why not list something?' : ''}
              </p>
            )}

            {/* Products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col"
                >
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={item.imageUrl || '/placeholder-image.png'} // Fallback image
                      alt={item.itemName}
                      className="object-cover rounded-t-lg w-full h-full"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow">
                    <h3 className="text-lg font-semibold text-primary-700 mb-1">
                      {item.itemName}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">Category: {item.category}</p>
                    <p className="text-sm text-gray-600 mb-2 flex-grow h-16 overflow-y-auto">{item.description}</p>

                    {item.category === 'Equipment' && item.condition && (
                        <p className="text-xs text-gray-500 mb-2">Condition: {item.condition}</p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2">
                      <span className="text-xl font-bold text-accent-600">
                        ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                      </span>
                    </div>
                     {item.sellerName && (
                      <p className="text-xs text-gray-500 italic mt-2 mb-1">Sold by: {item.sellerName}</p>
                    )}
                    {sellerItemProfiles[item.sellerId]?.preferredContact && (
                      <p className="text-xs text-gray-500">
                        Contact: <span className="font-medium text-primary-700">{sellerItemProfiles[item.sellerId].preferredContact}</span>
                      </p>
                    )}
                    {currentUser && currentUser.uid === item.sellerId && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end space-x-2">
                        <button
                          onClick={() => openEditItemModal(item)}
                          className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.imageUrl)}
                          className="text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-0 rounded-lg shadow-2xl max-w-lg w-full relative max-h-[90vh] overflow-y-auto">
            <CreateMarketItem
              onOperationComplete={handleOperationComplete}
              initialData={editingItem}
            />
            <button
              onClick={() => { setShowItemModal(false); setEditingItem(null); }}
              className="absolute top-3 right-3 bg-red-500 text-white px-2 py-0.5 rounded-full hover:bg-red-600 text-xl leading-none animate-fade-in"
              aria-label="Close form"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;