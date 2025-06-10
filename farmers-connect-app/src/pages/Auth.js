import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, db } from '../firebaseConfig'; // Import db
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFarmer, setIsFarmer] = useState(false); // State for farmer checkbox
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Function to create user document in Firestore
  const createUserDocument = async (user, isFarmerOverride = null) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    try {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        isFarmer: typeof isFarmerOverride === 'boolean' ? isFarmerOverride : isFarmer,
        createdAt: serverTimestamp()
      });
    } catch (firestoreError) {
      console.error("Error creating user document:", firestoreError);
      setError("Error creating user profile. Please try again. " + firestoreError.message);
      // Potentially sign out the user if profile creation fails critical to app logic
      // await auth.signOut();
      // navigate('/auth'); // Or some error page
      throw firestoreError; // Re-throw to be caught by calling function
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await createUserDocument(userCredential.user); // Create Firestore doc
      }
      navigate('/my-farm');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSocialSignIn = async (provider) => {
    setError(''); // Clear previous errors
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document already exists
      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        // New user, create document with default isFarmer: false
        await createUserDocument(user, false);
      }
      // If docSnap.exists(), user profile already exists, no action needed here for isFarmer status
      navigate('/my-farm');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = () => {
    handleSocialSignIn(new GoogleAuthProvider());
  };

  const handleFacebookSignIn = () => {
    handleSocialSignIn(new FacebookAuthProvider());
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md"
      >
        <h2 className="text-3xl font-heading text-primary-700 mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-primary-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-primary-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {!isLogin && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFarmer"
                checked={isFarmer}
                onChange={(e) => setIsFarmer(e.target.checked)}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isFarmer" className="text-primary-700">
                Register as a Farmer?
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50"
            >
              <img src="/google-icon.png" alt="Google" className="h-5 w-5 mr-2" />
              Google
            </button>
            <button
              onClick={handleFacebookSignIn}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white hover:bg-gray-50"
            >
              <img src="/facebook-icon.png" alt="Facebook" className="h-5 w-5 mr-2" />
              Facebook
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-gray-600">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-600 hover:text-primary-700"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;