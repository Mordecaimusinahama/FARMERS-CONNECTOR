import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, storage } from '../firebaseConfig';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';

const CreateProduceListing = ({ onListingOperationComplete, initialData = null }) => {
  const { currentUser, userProfile } = useAuth();
  const isEditMode = Boolean(initialData);

  const [produceName, setProduceName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(''); // For new image preview
  const [existingImageUrl, setExistingImageUrl] = useState(''); // For edit mode
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (isEditMode && initialData) {
      setProduceName(initialData.produceName || '');
      setDescription(initialData.description || '');
      setPrice(initialData.price?.toString() || '');
      setQuantity(initialData.quantity || '');
      if (initialData.imageUrl) {
        setExistingImageUrl(initialData.imageUrl);
        setImagePreview(initialData.imageUrl); // Show existing image initially
      }
    }
  }, [isEditMode, initialData]);

  const getStoragePathFromUrl = (url) => { // Helper function
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
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !userProfile?.isFarmer) {
      setError(`You must be logged in as a farmer to ${isEditMode ? 'update' : 'list'} produce.`);
      return;
    }
    // In create mode, image is required. In edit mode, it's optional (if one already exists).
    if (!isEditMode && !imageFile) {
      setError("Please select an image for your produce.");
      return;
    }
    if (isEditMode && !imageFile && !existingImageUrl) {
      setError("Please select an image for your produce or ensure an existing one is present.");
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    setUploadProgress(0);

    const performFirestoreOperation = async (imageUrlToSave) => {
      const data = {
        farmerId: currentUser.uid,
        farmerName: currentUser.displayName || userProfile?.displayName || currentUser.email,
        produceName,
        description,
        price: parseFloat(price),
        quantity,
        imageUrl: imageUrlToSave,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        const docRef = doc(db, 'produce', initialData.id);
        await updateDoc(docRef, data);
        setSuccessMessage('Produce updated successfully!');
      } else {
        data.createdAt = serverTimestamp(); // Add createdAt only for new listings
        await addDoc(collection(db, 'produce'), data);
        setSuccessMessage('Produce listed successfully!');
      }

      // Clear form only on successful creation, not necessarily on edit
      if (!isEditMode) {
        setProduceName('');
        setDescription('');
        setPrice('');
        setQuantity('');
        setImageFile(null);
        setImagePreview(''); // Clear new image preview
        setExistingImageUrl(''); // Clear existing image URL too if it was a create form
      }
      setUploadProgress(0);
      if (onListingOperationComplete) {
        onListingOperationComplete();
      }
      setIsLoading(false);
    };

    try {
      if (imageFile) { // New image selected (for create or update)
        const imageName = `${Date.now()}_${imageFile.name}`;
        const newImageStorageRef = ref(storage, `produce_images/${currentUser.uid}/${imageName}`);
        const uploadTask = uploadBytesResumable(newImageStorageRef, imageFile);

        uploadTask.on('state_changed',
          (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          (uploadError) => {
            console.error("Upload error:", uploadError);
            setError(`Image upload failed: ${uploadError.message}`);
            setIsLoading(false);
          },
          async () => {
            const newDownloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            // If editing and there was an old image, delete it
            if (isEditMode && existingImageUrl && existingImageUrl !== newDownloadURL) {
              const oldImagePath = getStoragePathFromUrl(existingImageUrl);
              if (oldImagePath) {
                try {
                  await deleteObject(ref(storage, oldImagePath));
                } catch (deleteErr) {
                  console.warn("Failed to delete old image:", deleteErr);
                  // Non-critical, proceed with updating Firestore
                }
              }
            }
            await performFirestoreOperation(newDownloadURL);
          }
        );
      } else if (isEditMode && existingImageUrl) { // Editing, but no new image, use existing
        await performFirestoreOperation(existingImageUrl);
      } else {
        // This case should ideally be caught by earlier validation (e.g. new listing needs image)
         setError("No image provided for the operation.");
         setIsLoading(false);
      }
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'listing'} produce:`, err);
      setError(`Failed to ${isEditMode ? 'update' : 'list'} produce: ${err.message}`);
      setIsLoading(false);
    }
  };

  const canSubmit = produceName && description && price && quantity && (!isLoading) && (isEditMode || imageFile);

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl animate-fade-in">
      <h3 className="text-2xl font-semibold text-primary-700 mb-6 text-center">
        {isEditMode ? 'Edit Your Produce' : 'List Your Produce'}
      </h3>
      {error && <p className="text-red-500 bg-red-100 p-3 rounded mb-4">{error}</p>}
      {successMessage && <p className="text-green-600 bg-green-100 p-3 rounded mb-4">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="produceName" className="block text-sm font-medium text-primary-700 mb-1">Produce Name</label>
          <input
            type="text"
            id="produceName"
            value={produceName}
            onChange={(e) => setProduceName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-primary-700 mb-1">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            required
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-primary-700 mb-1">Price (e.g., 5.99)</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-primary-700 mb-1">Quantity (e.g., 10 kg, 5 crates)</label>
            <input
              type="text"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="imageFile" className="block text-sm font-medium text-primary-700 mb-1">Produce Image</label>
          <input
            type="file"
            id="imageFile"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            required={!isEditMode} // Only required in create mode
          />
          {imagePreview && ( // Shows existing image in edit mode, or new preview
            <div className="mt-4">
              <p className="text-xs text-gray-600 mb-1">
                {imageFile ? "New image preview:" : (isEditMode && existingImageUrl ? "Current image:" : "Image preview:")}
              </p>
              <img src={imagePreview} alt="Produce preview" className="h-40 w-auto rounded-lg shadow-sm"/>
            </div>
          )}
        </div>

        {isLoading && imageFile && uploadProgress > 0 && ( // Show progress only if a new file is being uploaded
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
             <p className="text-xs text-center text-primary-700 mt-1">{Math.round(uploadProgress)}% uploaded</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3 px-4 text-white font-semibold rounded-lg transition duration-300 ${
            canSubmit ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading
            ? (imageFile && uploadProgress < 100 ? 'Uploading Image...' : 'Saving...')
            : (isEditMode ? 'Update Produce' : 'List Produce')}
        </button>
      </form>
    </div>
  );
};

export default CreateProduceListing;
