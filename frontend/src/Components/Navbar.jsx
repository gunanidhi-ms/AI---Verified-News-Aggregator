// src/components/Navbar.jsx
import React from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function Navbar({ user }) {
  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="flex items-center justify-between bg-white shadow-md px-6 py-3 sticky top-0 z-50">
      {/* App Logo / Title */}
      <h1 className="text-xl font-bold text-blue-600">
        🧠 Verified News
      </h1>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <span className="text-gray-600 text-sm hidden sm:inline">
          {user?.email}
        </span>
        <button
          onClick={handleLogout}
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
