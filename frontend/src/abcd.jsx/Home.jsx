// src/pages/Home.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import SectorTabs from "../Components/SectorTabs";
import NewsCard from "../Components/NewsTab";

export default function Home({ onSelectArticle }) {
  const [sector, setSector] = useState(() => {
    // Load last viewed sector from sessionStorage, or default to "topheadlines"
    return sessionStorage.getItem("lastSector") || "topheadlines";
  });

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    axios
      .get(`http://localhost:5000/api/news/fetch?sector=${encodeURIComponent(sector.toLowerCase())}`)
      .then((res) => {
        if (!mounted) return;
        const list = res?.data?.articles || [];
        setNews(list);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error("Error fetching news:", err?.message || err);
        setError("Failed to fetch news. Make sure the backend is running.");
        setNews([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    // Save selected sector to sessionStorage (instead of localStorage)
    sessionStorage.setItem("lastSector", sector);

    return () => (mounted = false);
  }, [sector]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-4">
        AI Verified News Feed
      </h1>

      {/* Lowercase enforced */}
      <SectorTabs activeSector={sector} onChange={(s) => setSector(s.toLowerCase())} />

      {loading && <p className="text-center text-gray-600">Loading articles…</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && news.length === 0 && (
        <p className="text-center text-gray-600">No articles available yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {news.map((article, i) => (
          <NewsCard key={i} article={article} onClick={() => onSelectArticle(article)} />
        ))}
      </div>
    </div>
  );
}
