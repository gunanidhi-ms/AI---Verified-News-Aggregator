// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAF33bNHTzQt0eMBfLWyPbi5Z4yrPUvd9E",
  authDomain: "ai-news-aggregator-3b5bb.firebaseapp.com",
  databaseURL: "https://ai-news-aggregator-3b5bb-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ai-news-aggregator-3b5bb",
  storageBucket: "ai-news-aggregator-3b5bb.firebasestorage.app",
  messagingSenderId: "120922610371",
  appId: "1:120922610371:web:af2e85d9e5b8a6e000e076",
  measurementId: "G-6NFF5ZHJNT",
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Auth + Firestore setup
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Auto logout when tab closed (session-only mode)
setPersistence(auth, browserSessionPersistence)
  .then(() => console.log("Firebase session persistence: ACTIVE"))
  .catch((err) => console.error("Session persistence error:", err));

// ✅ Export both
export { auth, db };
