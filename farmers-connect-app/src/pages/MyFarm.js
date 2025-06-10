import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const ITEM_TYPES = ['Seed', 'Fertilizer', 'Pesticide', 'Herbicide', 'Tool', 'Equipment Part', 'Animal Feed', 'Other'];

const Initial_Form_State = {
  itemName: '',
  itemType: ITEM_TYPES[0],
  quantity: '',
  unit: '',
  purchaseDate: '',
  notes: ''
};

const MyFarm = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [inventoryItems, setInventoryItems] = useState([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [actionFeedback, setActionFeedback] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState(Initial_Form_State);

  useEffect(() => {
    if (currentUser && userProfile?.isFarmer) {
      setIsLoadingInventory(true);
      const inventoryCollectionRef = collection(db, 'farmInventories');
      const q = query(
        inventoryCollectionRef,
        where('farmerId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInventoryItems(items);
        setIsLoadingInventory(false);
      }, (err) => {
        console.error("Error fetching farm inventory:", err);
        setFetchError("Failed to fetch farm inventory. " + err.message);
        setIsLoadingInventory(false);
      });

      return () => unsubscribe();
    } else if (userProfile && !userProfile.isFarmer) {
      setIsLoadingInventory(false); // Not a farmer, so not loading inventory
    }
  }, [currentUser, userProfile]);

  if (authLoading) {
    return <div className="p-8 text-center">Loading user data...</div>;
  }

  if (!currentUser) {
    return <div className="p-8 text-center text-red-500">Please login to access My Farm.</div>;
  }

  // User is logged in, but profile might still be loading OR they are not a farmer
  if (!userProfile) {
     return <div className="p-8 text-center">Loading profile... If you are a farmer, your inventory will show here.</div>;
  }

  if (!userProfile.isFarmer) {
    return (
      <div className="p-8 animate-slide-up">
        <h2 className="text-2xl font-heading text-primary-700 mb-4">My Farm Dashboard</h2>
        <p className="text-primary-900">This section is for farmers. Update your role in your profile if you are a farmer.</p>
        <hr className="my-6"/>
        <p className="text-gray-600">Weather, soil tips, and satellite overlays coming soon for all users!</p>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitInventoryItem = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setActionFeedback({ type: 'error', message: 'You must be logged in.' });
      return;
    }
    if (!formData.itemName || !formData.quantity || !formData.unit) {
      setActionFeedback({ type: 'error', message: 'Item name, quantity, and unit are required.' });
      return;
    }

    setIsSubmitting(true);
    setActionFeedback({ type: '', message: '' });

    const dataToSave = {
      ...formData,
      farmerId: currentUser.uid,
      quantity: parseFloat(formData.quantity) || formData.quantity,
      purchaseDate: formData.purchaseDate ? Timestamp.fromDate(new Date(formData.purchaseDate)) : null,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingInventoryItem) { // Update existing item
        const itemRef = doc(db, 'farmInventories', editingInventoryItem.id);
        await updateDoc(itemRef, dataToSave);
        setActionFeedback({ type: 'success', message: 'Inventory item updated successfully!' });
      } else { // Add new item
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, 'farmInventories'), dataToSave);
        setActionFeedback({ type: 'success', message: 'Inventory item added successfully!' });
      }
      setFormData(Initial_Form_State);
      setShowInventoryForm(false);
      setEditingInventoryItem(null);
    } catch (error) {
      console.error(`Error ${editingInventoryItem ? 'updating' : 'adding'} inventory item: `, error);
      setActionFeedback({ type: 'error', message: `Failed to ${editingInventoryItem ? 'update' : 'add'} item: ${error.message}` });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setActionFeedback({ type: '', message: '' }), 3000);
    }
  };

  const openAddItemForm = () => {
    setFormData(Initial_Form_State);
    setEditingInventoryItem(null);
    setShowInventoryForm(true);
    setActionFeedback({ type: '', message: '' });
  };

  const openEditItemForm = (item) => {
    setFormData({
      itemName: item.itemName || '',
      itemType: item.itemType || ITEM_TYPES[0],
      quantity: item.quantity?.toString() || '',
      unit: item.unit || '',
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate.seconds * 1000).toISOString().split('T')[0] : '',
      notes: item.notes || ''
    });
    setEditingInventoryItem(item);
    setShowInventoryForm(true);
    setActionFeedback({ type: '', message: '' });
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return;

    setActionFeedback({ type: '', message: '' });
    try {
      await deleteDoc(doc(db, 'farmInventories', itemId));
      setActionFeedback({ type: 'success', message: 'Item deleted successfully.' });
    } catch (error) {
      console.error("Error deleting item:", error);
      setActionFeedback({ type: 'error', message: `Failed to delete item: ${error.message}` });
    }
    setTimeout(() => setActionFeedback({ type: '', message: '' }), 3000);
  };

  // User is a farmer
  return (
    <div className="p-4 md:p-8 animate-slide-up">
      <h1 className="text-3xl font-heading text-primary-700 mb-6">My Farm Dashboard</h1>

      {actionFeedback.message && (
        <div className={`p-3 rounded mb-4 text-center ${actionFeedback.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {actionFeedback.message}
        </div>
      )}

      {/* Farm Satellite View Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-primary-600 mb-3">Farm Satellite View</h2>
        {(userProfile?.farmLatitude && userProfile?.farmLongitude && process.env.REACT_APP_GOOGLE_MAPS_API_KEY) ? (
          <img
            src={`https://maps.googleapis.com/maps/api/staticmap?center=${userProfile.farmLatitude},${userProfile.farmLongitude}&zoom=15&size=600x300&maptype=satellite&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`}
            alt="Farm Satellite View"
            className="w-full h-auto rounded-md shadow-md"
          />
        ) : (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) ? (
           <p className="text-gray-600">Map service is currently unavailable. Please try again later.</p>
        ) : (
          <p className="text-gray-600">
            Please set your farm location in your <Link to="/profile" className="text-primary-600 hover:underline">profile</Link> to see the satellite view.
          </p>
        )}
      </div>

      {/* Other MyFarm sections (placeholder) */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-primary-600 mb-3">Farm Activity Overview</h2>
        <p className="text-gray-600">Weather, soil tips, and other satellite overlays coming soon!</p>
      </div>

      {/* Farm Inventory Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-primary-600">My Farm Inventory</h2>
          {!showInventoryForm && (
            <button
              onClick={openAddItemForm}
              className="bg-accent-500 text-white px-5 py-2 rounded-lg hover:bg-accent-600 transition"
            >
              Add New Item
            </button>
          )}
        </div>

        {/* Add/Edit Inventory Form */}
        {showInventoryForm && (
          <div className="mb-8 p-6 border border-primary-200 rounded-lg bg-primary-50 animate-fade-in">
            <h3 className="text-xl font-semibold text-primary-700 mb-4">
              {editingInventoryItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            </h3>
            <form onSubmit={handleSubmitInventoryItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Item Name*</label>
                  <input type="text" name="itemName" id="itemName" value={formData.itemName} onChange={handleInputChange} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                </div>
                <div>
                  <label htmlFor="itemType" className="block text-sm font-medium text-gray-700">Item Type</label>
                  <select name="itemType" id="itemType" value={formData.itemType} onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
                    {ITEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity*</label>
                  <input type="text" name="quantity" id="quantity" value={formData.quantity} onChange={handleInputChange} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                </div>
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit* (e.g., kg, bags, pieces)</label>
                  <input type="text" name="unit" id="unit" value={formData.unit} onChange={handleInputChange} required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
                </div>
              </div>
              <div>
                <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Purchase Date (Optional)</label>
                <input type="date" name="purchaseDate" id="purchaseDate" value={formData.purchaseDate} onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"/>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                <textarea name="notes" id="notes" value={formData.notes} onChange={handleInputChange} rows="3"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"></textarea>
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button type="button" onClick={() => setShowInventoryForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
                  {isSubmitting ? (editingInventoryItem ? 'Updating...' : 'Adding...') : (editingInventoryItem ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoadingInventory && <p>Loading inventory...</p>}
        {fetchError && <p className="text-red-500">{fetchError}</p>}

        {!isLoadingInventory && !fetchError && inventoryItems.length === 0 && !showInventoryForm && (
          <p className="text-gray-600 text-center py-5">Your farm inventory is empty. Add some items to get started!</p>
        )}

        {!isLoadingInventory && !fetchError && inventoryItems.length > 0 && (
          <div className="overflow-x-auto mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchased</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.itemName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.itemType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.purchaseDate ? new Date(item.purchaseDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-500 max-w-xs truncate" title={item.notes}>{item.notes || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditItemForm(item)} className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFarm;