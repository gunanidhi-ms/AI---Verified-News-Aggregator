const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors"); // ✅ import cors
require("dotenv").config();

const app = express();
const newsRouter = require("./routes/news");

const PORT = process.env.PORT || 5000;
const HOST = `http://localhost:${PORT}`;

// ✅ Enable CORS for frontend origin (React)
app.use(
  cors({
    origin: "http://localhost:3000", // frontend address
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());
app.use("/api/news", newsRouter);

const sectors = [
  "business",
  "sports",
  "entertainment",
  "technology",
  "politics",
  "stockmarket",
  "international",
  "topheadlines",
];

async function updateAllSectorsSequentially() {
  console.log("Refreshing all news sectors...");
  for (const sector of sectors) {
    try {
      console.log(`Fetching ${sector}...`);
      await axios.get(`${HOST}/api/news/fetch?sector=${sector}&startup=true`);
      console.log(`${sector} updated`);
    } catch (err) {
      console.error(`Failed to update ${sector}:`, err.message);
    }
  }
  console.log("All sectors processed and cached.\n");
}

app.listen(PORT, async () => {
  console.log(`Server running on ${HOST}`);
  await updateAllSectorsSequentially();
  setInterval(updateAllSectorsSequentially, 30 * 60 * 1000);
});
