import { useState, useEffect, useMemo } from 'react';
import { auth, db } from '../config/firebase.js';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export function useFirebaseSync() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authenticate anonymously
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Firebase auth error:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch or listen to user data
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        // Initialize with default/local data
        const initialData = {
          preferredLanguages: JSON.parse(localStorage.getItem('yt_languages') || '["en"]'),
          subscriptions: JSON.parse(localStorage.getItem('yt_subscriptions') || '[]'),
          history: JSON.parse(localStorage.getItem('yt_history') || '[]'),
          likedVideos: JSON.parse(localStorage.getItem('yt_liked') || '[]'),
          watchLater: JSON.parse(localStorage.getItem('yt_watch_later') || '[]'),
          userPlaylists: JSON.parse(localStorage.getItem('yt_playlists') || '[]'),
        };
        setDoc(userRef, initialData, { merge: true });
        setData(initialData);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase snapshot error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Sync function to push updates
  const syncToFirebase = async (updates) => {
    if (!user) return;
    
    // Firestore throws error for undefined values. Strip them natively.
    const sanitize = (obj) => {
      if (obj === window || (typeof Element !== 'undefined' && obj instanceof Element)) return null; // safety
      if (obj === null || typeof obj !== 'object') return obj;
      if (Array.isArray(obj)) return obj.map(sanitize);
      const res = {};
      for (const [key, val] of Object.entries(obj)) {
        if (val !== undefined) res[key] = sanitize(val);
      }
      return res;
    };

    try {
      const sanitizedUpdates = sanitize(updates);
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, sanitizedUpdates, { merge: true });
    } catch (error) {
      console.error("Error syncing to Firebase:", error);
    }
  };

  return useMemo(() => ({ user, data, loading, syncToFirebase }), [user, data, loading]);
}
