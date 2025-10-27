// src/pages/ArticleDetail.jsx
import React, { useState } from "react";
import { db } from "../firebase";
import { doc, setDoc, updateDoc, getDoc } from "firebase/firestore";

export default function ArticleDetail({ article, onBack }) {
  const [liked, setLiked] = useState(false);
  const [imgError, setImgError] = useState(false); // ✅ Track image load errors

  if (!article) return null;

  // Determine verification status
  const verifiedScore = article.verified_score || 0;
  let verificationLabel = "❌ Maybe Fake News";
  let verificationColor = "text-red-600";

  if (article.verified === true) {
    verificationLabel = "✅ Verified News";
    verificationColor = "text-green-600";
  } else if (verifiedScore > 0 && verifiedScore < 1) {
    verificationLabel = "🟡 Partially Verified";
    verificationColor = "text-yellow-600";
  }

  // Handle like button click
  const handleLike = async () => {
    setLiked(true);
    try {
      const userId = "guest_user"; // Replace with actual logged-in user id later
      const sector = article.sector || "general";

      const userRef = doc(db, "user_preferences", userId);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        await updateDoc(userRef, {
          [sector]: (docSnap.data()[sector] || 0) + 1,
        });
      } else {
        await setDoc(userRef, { [sector]: 1 });
      }
    } catch (err) {
      console.error("Error updating preferences:", err);
    }
  };

  // ✅ Default fallback image URL
  const defaultImage = "https://tse4.mm.bing.net/th/id/OIP.8GWxDEp1bmhqwBL7Z1szTwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3"; // Place this in your /public folder

  // Decide which image to show
  const imageToShow =
    !article.image || imgError ? defaultImage : article.image;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-11/12 md:w-3/5 lg:w-2/5 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onBack}
          className="mb-4 bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
        >
          ← Back
        </button>

        {/* ✅ Robust image handling */}
        <img
          src={imageToShow}
          alt={article.title || "News image"}
          onError={() => setImgError(true)} // If broken, switch to default
          className="w-full max-h-80 object-cover rounded-lg mb-4"
        />

        <h2 className="text-2xl font-bold mb-2">{article.title}</h2>
        <p className={`${verificationColor} font-semibold mb-4`}>
          {verificationLabel}
        </p>

        <h3 className="text-xl font-semibold mt-4 mb-2">📌 Summarised Content:</h3>
        <ul className="list-disc ml-6 text-gray-700 mb-4">
          {Array.isArray(article.summary)
            ? article.summary.map((point, idx) => <li key={idx}>{point}</li>)
            : <li>{article.summary || article.description || "No summary available."}</li>}
        </ul>

        <h3 className="text-green-600 font-semibold mb-2">✅ Verified by:</h3>
        <ul className="list-disc ml-6 mb-4">
          {(article.verified_sources || []).map((src, i) => {
            const name = typeof src === "string" ? src : src.source || src.name || "Unknown";
            const url = typeof src === "string" ? "#" : src.url || src.link || "#";
            return (
              <li key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {name}
                </a>
              </li>
            );
          })}
        </ul>

        <button
          onClick={handleLike}
          className={`px-4 py-2 rounded-lg text-white font-semibold ${
            liked ? "bg-gray-400" : "bg-pink-600 hover:bg-pink-700"
          }`}
          disabled={liked}
        >
          ❤️ {liked ? "Liked" : "Like this Article"}
        </button>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-4 text-blue-700 underline font-medium"
        >
          Read Full Article →
        </a>
      </div>
    </div>
  );
}
