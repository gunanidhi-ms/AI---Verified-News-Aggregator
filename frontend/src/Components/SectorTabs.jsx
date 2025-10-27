// src/components/SectorTabs.jsx
import React from "react";

const sectors = [
  "topheadlines",
  "business",
  "politics",
  "technology",
  "sports",
  "entertainment",
  "international"
];

export default function SectorTabs({ activeSector, onChange }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-6">
      {sectors.map((sector) => (
        <button
          key={sector}
          onClick={() => onChange(sector)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${
            activeSector === sector
              ? "bg-blue-600 text-white"
              : "bg-gray-200 hover:bg-blue-200"
          }`}
        >
          {sector.charAt(0).toUpperCase() + sector.slice(1)}
        </button>
      ))}
    </div>
  );
}
