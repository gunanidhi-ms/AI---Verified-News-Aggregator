// src/App.jsx
import React, { useState, useEffect } from "react";
import Login from "./Components/Login";
import Home from "./pages/Home";
import ArticleDetail from "./pages/ArticleDetail";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import Navbar from "./Components/Navbar";

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  // ⏳ Show temporary loader while Firebase checks session
  if (loading) return <p className="text-center mt-10 text-gray-600">Loading...</p>;

  // 🔒 Auto redirect to login if not authenticated (session ended / tab closed)
  if (!user) return <Login onLogin={() => setUser(auth.currentUser)} />;

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar user={user} onLogout={() => signOut(auth)} />
      {!selectedArticle ? (
        <Home onSelectArticle={setSelectedArticle} />
      ) : (
        <ArticleDetail
          article={selectedArticle}
          onBack={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
}
