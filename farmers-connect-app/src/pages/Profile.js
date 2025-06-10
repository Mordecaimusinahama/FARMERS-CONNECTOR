import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

const Profile = () => {
  const { currentUser, userProfile, refreshUserProfile, loading: authLoading } = useAuth();
  const [isFarmerStatus, setIsFarmerStatus] = useState(false);
  // Separate loading/error/success states for different actions
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState('');
  const [roleSuccessMessage, setRoleSuccessMessage] = useState('');

  const [farmLatitude, setFarmLatitude] = useState('');
  const [farmLongitude, setFarmLongitude] = useState('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationSuccessMessage, setLocationSuccessMessage] = useState('');

  const [preferredContact, setPreferredContact] = useState('');
  const [isContactLoading, setIsContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactSuccessMessage, setContactSuccessMessage] = useState('');

  useEffect(() => {
    if (userProfile) {
      setIsFarmerStatus(userProfile.isFarmer);
      setFarmLatitude(userProfile.farmLatitude?.toString() || '');
      setFarmLongitude(userProfile.farmLongitude?.toString() || '');
      setPreferredContact(userProfile.preferredContact || '');
    }
  }, [userProfile]);

  const handleRoleChange = async (e) => {
    const newStatus = e.target.checked;
    setIsFarmerStatus(newStatus); // Update checkbox immediately for responsiveness

    if (!currentUser || !currentUser.uid) {
      setRoleError("User not found. Please re-login.");
      return;
    }

    setIsRoleLoading(true);
    setRoleError('');
    setRoleSuccessMessage('');

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        isFarmer: newStatus
      });
      await refreshUserProfile();
      setRoleSuccessMessage('Your role has been updated successfully!');
    } catch (err) {
      setRoleError('Failed to update role. Please try again. ' + err.message);
      setIsFarmerStatus(!newStatus);
    } finally {
      setIsRoleLoading(false);
      setTimeout(() => { setRoleError(''); setRoleSuccessMessage(''); }, 3000);
    }
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.uid) {
      setLocationError("User not found. Please re-login.");
      return;
    }
    const lat = parseFloat(farmLatitude);
    const lon = parseFloat(farmLongitude);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setLocationError("Invalid latitude or longitude values. Latitude (-90 to 90), Longitude (-180 to 180).");
      return;
    }

    setIsLocationLoading(true);
    setLocationError('');
    setLocationSuccessMessage('');

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        farmLatitude: lat,
        farmLongitude: lon,
      });
      await refreshUserProfile();
      setLocationSuccessMessage('Farm location saved successfully!');
    } catch (err) {
      setLocationError('Failed to save location. Please try again. ' + err.message);
    } finally {
      setIsLocationLoading(false);
      setTimeout(() => { setLocationError(''); setLocationSuccessMessage(''); }, 3000);
    }
  };

  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentUser.uid) {
      setContactError("User not found. Please re-login.");
      return;
    }

    setIsContactLoading(true);
    setContactError('');
    setContactSuccessMessage('');

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        preferredContact: preferredContact.trim(), // Save trimmed value
      });
      await refreshUserProfile();
      setContactSuccessMessage('Preferred contact method saved successfully!');
    } catch (err) {
      setContactError('Failed to save contact method. Please try again. ' + err.message);
    } finally {
      setIsContactLoading(false);
      setTimeout(() => { setContactError(''); setContactSuccessMessage(''); }, 3000);
    }
  };

  if (authLoading) {
    return <div className="p-8 text-center">Loading user data...</div>;
  }

  if (!currentUser) {
    return <div className="p-8 text-center text-red-500">Please login to view your profile.</div>;
  }

  return (
    <div className="p-8 animate-slide-up max-w-lg mx-auto bg-white shadow-md rounded-lg">
      <h2 className="text-3xl font-heading text-primary-700 mb-6 border-b pb-3">User Profile</h2>

      {roleError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{roleError}</div>}
      {roleSuccessMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{roleSuccessMessage}</div>}
      {locationError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{locationError}</div>}
      {locationSuccessMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{locationSuccessMessage}</div>}
      {contactError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{contactError}</div>}
      {contactSuccessMessage && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{contactSuccessMessage}</div>}

      <div className="mb-4">
        <strong className="text-primary-600">Email:</strong>
        <span className="text-primary-900 ml-2">{currentUser.email}</span>
      </div>

      {userProfile ? (
        <>
          {/* Role Section */}
          <div className="mb-6 pb-6 border-b">
            <strong className="text-primary-600 block mb-2">Role:</strong>
            <span className="text-primary-900 ml-2 mb-2 block">{userProfile.isFarmer ? 'Farmer' : 'Buyer'}</span>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="isFarmerToggle"
                checked={isFarmerStatus}
                onChange={handleRoleChange}
                disabled={isRoleLoading}
                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="isFarmerToggle" className="text-primary-700">
                {isRoleLoading ? 'Updating...' : 'Register as a Farmer / Update Role'}
              </label>
            </div>
          </div>

          {/* Contact Method Section - Available to all users */}
          <form onSubmit={handleSaveContact} className="space-y-4 mb-6 pb-6 border-b">
            <h3 className="text-xl font-semibold text-primary-600 mb-2">Contact Information</h3>
            <div>
              <label htmlFor="preferredContact" className="block text-sm font-medium text-primary-700">
                Preferred Contact Method (Optional)
              </label>
              <input type="text" name="preferredContact" id="preferredContact"
                value={preferredContact} onChange={(e) => setPreferredContact(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., your@email.com, phone (use caution)"
              />
              <p className="mt-1 text-xs text-gray-500">This will be visible to others on your listings.</p>
            </div>
            <button type="submit" disabled={isContactLoading}
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition disabled:opacity-70">
              {isContactLoading ? 'Saving Contact...' : 'Save Contact Method'}
            </button>
          </form>

          {/* Farm Location Section - Only for Farmers */}
          {userProfile.isFarmer && (
            <form onSubmit={handleSaveLocation} className="space-y-4">
              <h3 className="text-xl font-semibold text-primary-600 mb-2">Farm Location</h3>
              <div>
                <label htmlFor="farmLatitude" className="block text-sm font-medium text-primary-700">Farm Latitude</label>
                <input type="number" name="farmLatitude" id="farmLatitude" step="any"
                  value={farmLatitude} onChange={(e) => setFarmLatitude(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 34.0522"
                />
              </div>
              <div>
                <label htmlFor="farmLongitude" className="block text-sm font-medium text-primary-700">Farm Longitude</label>
                <input type="number" name="farmLongitude" id="farmLongitude" step="any"
                  value={farmLongitude} onChange={(e) => setFarmLongitude(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., -118.2437"
                />
              </div>
              <button type="submit" disabled={isLocationLoading}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition disabled:opacity-70">
                {isLocationLoading ? 'Saving Location...' : 'Save Farm Location'}
              </button>
            </form>
          )}

          {userProfile.createdAt && (
            <p className="text-sm text-gray-500 mt-6 pt-6 border-t">
              Profile created on: {new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString()}
            </p>
          )}
        </>
      ) : (
        <p className="text-primary-800">Loading profile details...</p>
      )}
    </div>
  );
};

export default Profile;