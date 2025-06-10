import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDoc } from 'firebase/firestore'; // Added getDoc
import { ref, deleteObject } from 'firebase/storage';
import CreateProduceListing from '../components/CreateProduceListing';

const FarmersMarket = () => {
  const { currentUser, userProfile } = useAuth();
  const [produceListings, setProduceListings] = useState([]);
  const [sellerProfiles, setSellerProfiles] = useState({}); // To store seller contact info
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleListingOperationComplete = (message) => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setEditingListing(null);
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const openCreateForm = () => {
    setActionError('');
    setActionSuccess('');
    setEditingListing(null); // Ensure not in edit mode
    setShowEditForm(false); // Close edit form if open
    setShowCreateForm(true);
  };

  const openEditForm = (listing) => {
    setActionError('');
    setActionSuccess('');
    setEditingListing(listing);
    setShowCreateForm(false); // Close create form if open
    setShowEditForm(true);
  };


  // Helper to extract storage path from URL (basic version)
  const getStoragePathFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      // Pathname is like /v0/b/project-id.appspot.com/o/folder%2Ffile.jpg?alt=media&token=...
      // We need to decode the path part after /o/
      const path = urlObj.pathname.split('/o/')[1].split('?')[0];
      return decodeURIComponent(path);
    } catch (e) {
      console.error("Error extracting path from URL:", e, url);
      return null;
    }
  };

  const handleDelete = async (listingId, imageUrl) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }
    setActionError('');
    setActionSuccess('');
    try {
      // Delete Firestore document
      await deleteDoc(doc(db, 'produce', listingId));

      // Delete image from Storage
      if (imageUrl) {
        const imagePath = getStoragePathFromUrl(imageUrl);
        if (imagePath) {
          const imageRef = ref(storage, imagePath);
          await deleteObject(imageRef);
        } else {
          console.warn("Could not determine image path for deletion for URL:", imageUrl);
          // Not setting error for this, as main data is deleted.
        }
      }
      setActionSuccess('Listing deleted successfully.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      console.error("Error deleting listing:", err);
      setActionError(`Failed to delete listing: ${err.message}`);
      setTimeout(() => setActionError(''), 5000);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    const produceCollectionRef = collection(db, 'produce');
    const q = query(produceCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProduceListings(listings);

      // Fetch seller profiles for new listings
      const farmerIdsToFetch = [...new Set(listings.map(l => l.farmerId))]
                                .filter(id => !sellerProfiles[id]);

      if (farmerIdsToFetch.length > 0) {
        const profilesPromises = farmerIdsToFetch.map(id => getDoc(doc(db, 'users', id)));
        try {
          const profileDocs = await Promise.all(profilesPromises);
          const newProfiles = {};
          profileDocs.forEach(docSnap => {
            if (docSnap.exists()) {
              newProfiles[docSnap.id] = {
                preferredContact: docSnap.data().preferredContact || '',
                // displayName: docSnap.data().displayName || docSnap.data().email, // farmerName is already on listing
              };
            }
          });
          setSellerProfiles(prev => ({ ...prev, ...newProfiles }));
        } catch (profileError) {
          console.error("Error fetching seller profiles:", profileError);
          // Not setting main error, as listings are still displayed
        }
      }
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching produce listings:", err);
      setError("Failed to fetch produce listings. " + err.message);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []); // sellerProfiles dependency removed to avoid re-fetching profiles unnecessarily on its own update

  if (isLoading) {
    return <div className="p-8 text-center">Loading market listings...</div>;
  }

  // Display general fetching error first if it exists
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 md:p-8 animate-slide-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-heading text-primary-700">Farmers Market</h2>
        {currentUser && userProfile?.isFarmer && !showCreateForm && !showEditForm && (
          <button
            onClick={openCreateForm}
            className="bg-accent-500 text-white px-6 py-2 rounded-lg hover:bg-accent-600 transition duration-300 shadow-md"
          >
            List New Produce
          </button>
        )}
      </div>

      {/* Action Messages */}
      {actionError && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 animate-fade-in">{actionError}</p>}
      {actionSuccess && <p className="bg-green-100 text-green-700 p-3 rounded mb-4 animate-fade-in">{actionSuccess}</p>}

      {/* Create or Edit Produce Form Modal */}
      {(showCreateForm || showEditForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white p-0 rounded-lg shadow-2xl max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
            <CreateProduceListing
              onListingOperationComplete={() => handleListingOperationComplete(
                showEditForm ? 'Produce updated successfully!' : 'Produce listed successfully!'
              )}
              initialData={editingListing} // This will be null for create, or listing data for edit
            />
            <button
              onClick={() => {
                setShowCreateForm(false);
                setShowEditForm(false);
                setEditingListing(null);
              }}
              className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 text-2xl leading-none"
              aria-label="Close form"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {produceListings.length === 0 && !showCreateForm && !showEditForm && (
        <p className="text-primary-800 text-center py-10">
          No produce listed in the market yet. Be the first if you're a farmer!
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {produceListings.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col justify-between transform hover:scale-105 transition-transform duration-300">
            <div>
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.produceName}
                  className="w-full h-48 object-cover"
                />
              )}
              {!item.imageUrl && (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="text-xl font-semibold text-primary-600 mb-2">{item.produceName}</h3>
                <p className="text-gray-700 mb-1 text-sm h-10 overflow-hidden" title={item.description}>{item.description}</p>
                <p className="text-lg font-bold text-accent-500 mb-2">
                  ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                </p>
                <p className="text-sm text-gray-600 mb-2">Quantity: {item.quantity}</p>
                {item.farmerName && (
                  <p className="text-xs text-gray-500 italic mb-1">Sold by: {item.farmerName}</p>
                )}
                {sellerProfiles[item.farmerId]?.preferredContact && (
                  <p className="text-xs text-gray-500 mt-1">
                    Contact: <span className="font-medium text-primary-700">{sellerProfiles[item.farmerId].preferredContact}</span>
                  </p>
                )}
              </div>
            </div>
            {currentUser && currentUser.uid === item.farmerId && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2">
                <button
                  onClick={() => openEditForm(item)}
                  className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.imageUrl)}
                  className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FarmersMarket;