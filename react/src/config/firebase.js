import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBblX3N0s3_whnY1acnZhQnjn7zOs5lbPc",
  authDomain: "fir-45dba.firebaseapp.com",
  projectId: "fir-45dba",
  storageBucket: "fir-45dba.firebasestorage.app",
  messagingSenderId: "219785901066",
  appId: "1:219785901066:web:237021a3946684deb6dbf3",
  measurementId: "G-ZMMDDM5BNL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
