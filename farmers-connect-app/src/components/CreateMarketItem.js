import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

const CATEGORIES = ['Equipment', 'Seeds', 'Fertilizers', 'Tools', 'Other Farm Supplies'];
const CONDITIONS = ['New', 'Used - Good', 'Used - Fair'];

const CreateMarketItem = ({ onOperationComplete, initialData = null }) => {
  const { currentUser } = useAuth(); // userProfile not strictly needed here if sellerName is from currentUser.displayName
  const isEditMode = Boolean(initialData);

  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Not used internally, parent handles this
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isEditMode && initialData) {
      setItemName(initialData.itemName || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category || CATEGORIES[0]);
      setPrice(initialData.price?.toString() || '');
      if (initialData.category === 'Equipment') {
        setCondition(initialData.condition || CONDITIONS[0]);
      }
      if (initialData.imageUrl) {
        setExistingImageUrl(initialData.imageUrl);
        setImagePreview(initialData.imageUrl);
      }
    } else {
      // Reset for create mode or if initialData is cleared
      setItemName('');
      setDescription('');
      setCategory(CATEGORIES[0]);
      setPrice('');
      setCondition(CONDITIONS[0]);
      setImageFile(null);
      setImagePreview('');
      setExistingImageUrl('');
    }
  }, [isEditMode, initialData]);

  const getStoragePathFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.split('/o/')[1].split('?')[0];
      return decodeURIComponent(path);
    } catch (e) {
      console.error("Error extracting path from URL:", e, url);
      return null;
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      // In edit mode, if user cancels file selection, revert to existing image preview
      setImagePreview(isEditMode && existingImageUrl ? existingImageUrl : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError(`You must be logged in to ${isEditMode ? 'update' : 'list'} an item.`);
      return;
    }
    if (!isEditMode && !imageFile) {
      setError("Please select an image for the item.");
      return;
    }
     if (isEditMode && !imageFile && !existingImageUrl) {
      setError("Please select an image or ensure an existing one is present.");
      return;
    }

    setIsLoading(true);
    setError('');
    setUploadProgress(0);

    const performFirestoreOperation = async (imageUrlToSave) => {
      const itemData = {
        sellerId: currentUser.uid,
        sellerName: currentUser.displayName || currentUser.email,
        itemName,
        description,
        category,
        price: parseFloat(price),
        imageUrl: imageUrlToSave,
        updatedAt: serverTimestamp(),
      };
      if (category === 'Equipment') {
        itemData.condition = condition;
      }

      try {
        if (isEditMode) {
          const docRef = doc(db, 'marketItems', initialData.id);
          await updateDoc(docRef, itemData);
        } else {
          itemData.createdAt = serverTimestamp();
          await addDoc(collection(db, 'marketItems'), itemData);
        }

        if (onOperationComplete) {
          onOperationComplete(isEditMode ? 'Item updated successfully!' : 'Item listed successfully!');
        }
        // Reset form only on successful creation
        if (!isEditMode) {
            setItemName(''); setDescription(''); setCategory(CATEGORIES[0]);
            setPrice(''); setCondition(CONDITIONS[0]); setImageFile(null);
            setImagePreview(''); setExistingImageUrl('');
        }
      } catch (firestoreError) {
        console.error("Firestore operation failed:", firestoreError);
        setError(`Error saving item: ${firestoreError.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    try {
      if (imageFile) { // New image selected
        const imageName = `${Date.now()}_${imageFile.name}`;
        const newImageStorageRef = ref(storage, `market_item_images/${currentUser.uid}/${imageName}`);
        const uploadTask = uploadBytesResumable(newImageStorageRef, imageFile);

        uploadTask.on('state_changed',
          (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          (uploadError) => {
            setError(`Image upload failed: ${uploadError.message}`);
            setIsLoading(false);
          },
          async () => {
            const newDownloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (isEditMode && existingImageUrl && existingImageUrl !== newDownloadURL) {
              const oldImagePath = getStoragePathFromUrl(existingImageUrl);
              if (oldImagePath) {
                try { await deleteObject(ref(storage, oldImagePath)); }
                catch (deleteErr) { console.warn("Old image deletion failed:", deleteErr); }
              }
            }
            await performFirestoreOperation(newDownloadURL);
          }
        );
      } else if (isEditMode && existingImageUrl) { // Editing, no new image
        await performFirestoreOperation(existingImageUrl);
      } else {
         setError("No image provided."); // Should be caught by initial validation
         setIsLoading(false);
      }
    } catch (err) {
      setError(`Operation failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  const canSubmit = itemName && description && category && price && (!isLoading) && (isEditMode || imageFile || existingImageUrl);

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl">
      <h3 className="text-2xl font-semibold text-primary-700 mb-6 text-center">
        {isEditMode ? 'Edit Market Item' : 'List New Item'}
      </h3>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="itemName" className="block text-sm font-medium text-primary-700 mb-1">Item Name</label>
          <input type="text" id="itemName" value={itemName} onChange={(e) => setItemName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" required />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-primary-700 mb-1">Description</label>
          <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" required></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-primary-700 mb-1">Category</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-primary-700 mb-1">Price (USD)</label>
            <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500" required />
          </div>
        </div>
        {category === 'Equipment' && (
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-primary-700 mb-1">Condition</label>
            <select id="condition" value={condition} onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500">
              {CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="imageFile" className="block text-sm font-medium text-primary-700 mb-1">Item Image</label>
          <input type="file" id="imageFile" accept="image/*" onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            required={!isEditMode} />
          {imagePreview && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-1">
                {imageFile ? "New image preview:" : (isEditMode && existingImageUrl ? "Current image:" : "Image preview:")}
              </p>
              <img src={imagePreview} alt="Item preview" className="h-32 w-auto rounded-lg shadow-sm"/>
            </div>
          )}
        </div>
        {isLoading && imageFile && uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
            <p className="text-xs text-center text-primary-700 mt-1">{Math.round(uploadProgress)}% uploaded</p>
          </div>
        )}
        <button type="submit" disabled={!canSubmit || isLoading}
          className={`w-full py-2.5 px-4 text-white font-semibold rounded-lg transition duration-300 ${
            canSubmit && !isLoading ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'
          }`}>
          {isLoading ? (imageFile ? 'Uploading...' : 'Saving...') : (isEditMode ? 'Update Item' : 'List Item')}
        </button>
      </form>
    </div>
  );
};

export default CreateMarketItem;
