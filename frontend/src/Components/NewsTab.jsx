// src/components/NewsCard.jsx
import React from "react";
import { motion } from "framer-motion";

export default function NewsCard({ article, onClick }) {
  const imgSrc = article.image || article.imageUrl || article.urlToImage || '';
  const summary = article.description || article.summary || article.content || '';

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-white shadow-md rounded-xl overflow-hidden cursor-pointer max-w-sm"
      onClick={onClick}
    >
      {imgSrc ? (
        <img src={imgSrc} alt={article.title} className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
          No image
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{article.title}</h3>
        <p className="text-gray-600 text-sm">{summary}</p>
      </div>
    </motion.div>
  );
}
