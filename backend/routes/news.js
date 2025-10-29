const express = require("express");
const axios = require("axios");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const router = express.Router();

/* ---------------------------------------------------------
   1. Utility: Encoding Cleaner
--------------------------------------------------------- */
function cleanEncoding(text = "") {
  return text
    .replace(/â€™/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/â€“/g, "-")
    .replace(/â€”/g, "—")
    .replace(/â€˜/g, "'")
    .replace(/Ã©/g, "é")
    .replace(/Ã¨/g, "è")
    .replace(/Ã¢/g, "â")
    .replace(/Ã´/g, "ô")
    .replace(/Ã¼/g, "ü")
    .replace(/Ã¶/g, "ö")
    .replace(/Â/g, "")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------------------------------------------------
   2. Utility: Article Preprocessor
--------------------------------------------------------- */
function preprocessArticle(article) {
  return {
    title: cleanEncoding(article.title || "Untitled"),
    description: cleanEncoding(article.description || ""),
    content: cleanEncoding(article.content || ""),
    url: article.url || "",
    image: article.urlToImage || "",
    publishedAt: article.publishedAt || new Date().toISOString(),
    source: article.source?.name || "Unknown",
    verified: false,
    verified_sources: [],
  };
}

/* ---------------------------------------------------------
   3. Python Helper Functions
--------------------------------------------------------- */
function runPython(scriptName, inputData) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, `../${scriptName}`);
    const python = spawn("python", [scriptPath]);

    let result = "";
    python.stdout.on("data", (data) => (result += data.toString()));
    python.stderr.on("data", (data) => console.error(`${scriptName} stderr:`, data.toString()));

    python.on("close", () => {
      try {
        resolve(JSON.parse(result || "[]"));
      } catch (err) {
        reject(err);
      }
    });

    python.stdin.write(JSON.stringify(inputData));
    python.stdin.end();
  });
}

/* ---------------------------------------------------------
   4. Caching System
--------------------------------------------------------- */
const CACHE_DIR = path.join(__dirname, "../cache");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR);

function getCache(sector) {
  const cacheFile = path.join(CACHE_DIR, `${sector}.json`);
  if (!fs.existsSync(cacheFile)) return null;

  const ageMinutes = (Date.now() - fs.statSync(cacheFile).mtimeMs) / 60000;
  if (ageMinutes > 30) return null; // cache valid for 30 min

  return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
}

function saveCache(sector, data) {
  fs.writeFileSync(path.join(CACHE_DIR, `${sector}.json`), JSON.stringify(data, null, 2));
}

/* ---------------------------------------------------------
   5. Fetch + Process Pipeline
--------------------------------------------------------- */
async function fetchRawArticles(sources) {
  if (!process.env.NEWS_API_KEY) {
    console.warn("Missing NEWS_API_KEY");
    return [];
  }

  try {
    const apiUrl = `https://newsapi.org/v2/top-headlines?sources=${sources.join(
      ","
    )}&pageSize=100&sortBy=publishedAt&apiKey=${process.env.NEWS_API_KEY}`;

    const { data } = await axios.get(apiUrl);
    return (data.articles || []).map(preprocessArticle);
  } catch (err) {
    console.warn(`NewsAPI fetch failed: ${err.message}`);
    return [];
  }
}

async function processSector(sector, articles) {
  try {
    console.log(`Processing ${sector} via Python...`);
    const scraped = await runPython("scrapper.py", articles);
    const verified = await runPython("verify_news.py", scraped);
    const summarized = await runPython("summarizer.py", verified);
    saveCache(sector, summarized);
    console.log(`${sector} updated & cached`);
  } catch (err) {
    console.error(`Error processing ${sector}:`, err);
  }
}

/* ---------------------------------------------------------
   6. Source Groups
--------------------------------------------------------- */
const sourceGroups = {
  business: [
    "business-insider",
    "financial-post",
    "fortune",
    "bloomberg",
    "the-wall-street-journal",
    "cnbc",
    "forbes",
    "marketwatch",
    "economist",
    "harvard-business-review",
    "inc",
    "entrepreneur",
    "wired",
    "fast-company",
    "adweek",
    "mit-technology-review",
    "reuters",
    "financial-times",
    "business-standard",
    "ndtv-profit"
  ],
  sports: [
    "espn",
    "bbc-sport",
    "sky-sports-news",
    "yahoo-sports",
    "the-athletic",
    "bleacher-report",
    "reuters",
    "sporting-news",
    "fox-sports",
    "sportstar",
    "inside-sport",
    "sports-business-journal",
    "runners-world",
    "slam",
    "golf-digest",
    "lindys-sports",
    "the-guardian-uk",
    "eurosport",
    "cbs-sports",
    "icc"
  ],
  entertainment: [
    "variety",
    "the-hollywood-reporter",
    "deadline",
    "entertainment-weekly",
    "eonline",
    "rolling-stone",
    "billboard",
    "indiewire",
    "vulture",
    "pitchfork",
    "vanity-fair",
    "people",
    "etonline",
    "tmz",
    "the-guardian-uk",
    "vogue",
    "vibe",
    "nme",
    "filmmaker",
    "the-wrap"
  ]
  ,
  technology: [
    "wired",
    "mit-technology-review",
    "techcrunch",
    "the-verge",
    "cnet",
    "engadget",
    "ars-technica",
    "gizmodo",
    "mashable",
    "pcmag",
    "computerworld",
    "zdnet",
    "fast-company",
    "digital-trends",
    "venturebeat",
    "analytics-insight",
    "technowize",
    "tecknexus",
    "reuters"
  ],
  politics: [
    "the-new-york-times",
    "the-washington-post",
    "the-economist",
    "bbc-news",
    "cnn",
    "reuters",
    "the-guardian-uk",
    "politico",
    "al-jazeera-english",
    "time",
    "national-review",
    "the-nation",
    "new-statesman",
    "foreign-policy",
    "the-wall-street-journal",
    "newsweek",
    "axios",
    "mother-jones",
    "harpers",
    "the-atlantic"
  ],
  stockmarket: [
    "bloomberg",
    "cnbc",
    "the-wall-street-journal",
    "financial-times",
    "reuters",
    "marketwatch",
    "yahoo-finance",
    "barrons",
    "the-economist",
    "forbes",
    "business-insider",
    "seeking-alpha",
    "kiplinger",
    "investopedia",
    "finbold",
    "morningstar",
    "the-trade-news",
    "traders-magazine",
    "technical-analysis-of-stocks-commodities",
    "nikkei-asia"
  ],
  international: [
    "foreign-affairs",
    "foreign-policy",
    "the-economist",
    "the-diplomat",
    "bbc-news",
    "al-jazeera-english",
    "e-international-relations",
    "global-politics-magazine",
    "chatham-house",
    "council-on-foreign-relations",
    "le-monde-diplomatique",
    "the-guardian-uk",
    "the-new-york-times",
    "the-washington-post",
    "el-pais",
    "the-straits-times",
    "nikkei-asia",
    "russia-in-global-affairs",
    "world-politics-review",
    "reuters"
  ],
  topheadlines: [
    "bbc-news",
    "reuters",
    "cnn",
    "al-jazeera-english",
    "associated-press",
    "the-wall-street-journal",
    "financial-times",
    "axios",
    "time",
    "bloomberg",
    "cbs-news",
    "nbc-news",
    "usa-today",
    "the-guardian-uk",
    "independent",
    "telegraph",
    "new-york-times",
    "washington-post",
    "abc-news",
    "forbes"
  ]
};

/* ---------------------------------------------------------
   7. Sector Route (Dual Mode: startup vs frontend)
--------------------------------------------------------- */
router.get("/fetch", async (req, res) => {
  try {
    const { sector, startup } = req.query;

    if (!sector || !sourceGroups[sector]) {
      return res.status(400).json({ error: "Invalid or missing sector" });
    }

    const cached = getCache(sector);

    // Serve cached if available (and not startup)
    if (cached && !startup) {
      console.log(`Serving ${sector} from cache`);
      return res.json({ category: sector, articles: cached, cached: true });
    }

    // Fetch new articles
    const articles = await fetchRawArticles(sourceGroups[sector]);
    if (!articles.length) {
      return res.status(404).json({ error: "No articles found" });
    }

    if (startup) {
      // During server startup → wait until processing & caching done
      console.log(`Startup mode: fully processing ${sector}...`);
      await processSector(sector, articles);
      const updated = getCache(sector);
      return res.json({ category: sector, articles: updated || [], cached: false });
    } else {
      // Normal frontend call → queue background processing
      console.log(`Frontend mode: queuing ${sector} processing...`);
      await processSector(sector, articles);
      return res.json({ category: sector, status: "queued", cached: false });
    }

  } catch (err) {
    console.error("Error fetching sector:", err);
    res.status(500).json({ error: "Failed to fetch sector news" });
  }
});

module.exports = router;
