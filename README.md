# AI Verified News Aggregator

A full-stack AI-powered platform that collects, verifies, and summarizes news from multiple sources using advanced NLP techniques.  
The system ensures factual accuracy, filters fake or misleading content, and generates concise summaries for quick reading.

---

## Table of Contents
1. Overview  
2. System Requirements  
3. Architecture and Workflow  
4. Backend Modules  
5. Frontend Overview  
6. Cache Layer  
7. Installation and Setup  
8. Running the Application (Step-by-Step)  
9. API Endpoints  
10. Future Improvements  
11. License  

---

## Overview

The AI Verified News Aggregator integrates **news collection**, **cross-source verification**, and **extractive summarization** into one cohesive system.  
When APIs provide incomplete data, the platform automatically scrapes articles, verifies them across multiple sources, and produces verified summaries.

---

## System Requirements

| Component | Minimum Version | Purpose |
|------------|----------------|----------|
| Python | 3.9+ | NLP and verification |
| Node.js | 18+ | Backend server |
| npm | 9+ | Frontend dependencies |
| Firebase | — | Authentication and data storage |
| React.js | 18+ | Frontend framework |
| RAM | 8 GB | Recommended for NLP models |
| OS | Windows / macOS / Linux | Supported platforms |

---

## Architecture and Workflow

1. **News Collection**  
   - Retrieves headlines and snippets from NewsAPI.  
   - If content is incomplete, uses web scraping (Cheerio) to fetch full text.

2. **Preprocessing**  
   - Cleans text, removes HTML tags and stopwords, and normalizes punctuation.

3. **Verification Pipeline (Multi-Source Fake News Detection)**  
   - For each fetched article, the system verifies authenticity across multiple publishers.  
   - **Step 1 – Primary Source:** Collects the article from the selected source (e.g., BBC, NDTV, Reuters).  
   - **Step 2 – Cross Verification:**  
     - Searches for similar headlines from other outlets.  
     - Compares the content using:  
       - **BERT Similarity** for semantic meaning.  
       - **Cosine Similarity** for contextual similarity.  
       - **Jaccard Similarity** for lexical overlap.  
   - **Step 3 – Decision Logic:**  
     - Multiple strong matches → Verified  
     - Partial similarity → Partially Verified  
     - Low similarity → Maybe Fake  
   - The combined score is displayed in the frontend with verification status.

4. **Summarization**  
   - Uses extractive summarization (term frequency + sentence ranking).  
   - Displays key bullet points under “Summarized Content”.

5. **Caching**  
   - Uses a backend in-memory cache to store processed results.  
   - Prevents redundant API or scraping calls.

6. **Frontend**  
   - Displays verified, summarized articles with verification labels and like functionality.

---

## Backend Modules

| Module | Function |
|---------|-----------|
| `newsapi.js` | Fetches news from NewsAPI |
| `scraper.js` | Scrapes full article text |
| `preprocess.py` | Cleans and tokenizes text |
| `verify_news.py` | Handles multi-source verification (BERT, cosine, Jaccard) |
| `summarizer.py` | Performs extractive summarization |
| `cache.js` | Stores cached results |
| `routes/news.js` | Express routes for APIs |

**Tech Stack:**  
- Node.js + Express.js  
- Python (Transformers, Scikit-learn, NLTK)  
- Firebase for user management  
- Integration between Node.js and Python using `child_process`

---

## Frontend Overview

The frontend is developed with **React.js** and styled using **Tailwind CSS**.  
It displays categorized news, summaries, and verification status.

**Main Components:**
- `Home.jsx` – Displays categorized verified news.  
- `ArticleDetail.jsx` – Displays summaries, verification labels, and like button.  
- `Navbar.jsx` – Category navigation.  
- `firebase.js` – Firebase connection (secured using environment variables).

Verification labels are displayed as:
- Green – Verified  
- Yellow – Partially Verified  
- Red – Maybe Fake

If no image is available, a default fallback image is shown.

---

## Cache Layer

Implements a backend in-memory cache using a simple JavaScript object.  
When an article is fetched, the result is stored for future reuse.  
This prevents repeated API/scraper calls and improves response time.

---

## Installation and Setup

### 1. Clone Repository

### 1. Clone Repository

```bash
git clone https://github.com/gunanidhi-ms/AI---Verified-News-Aggregator.git
cd AI---Verified-News-Aggregator
```
## 2. Backend Setup

The backend handles data fetching, verification, summarization, and caching.

### Navigate and Create Virtual Environment

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Create a Python virtual environment:
    ```bash
    python -m venv venv
    ```

3.  Activate the virtual environment:
    ```bash
    venv\Scripts\activate          # For Windows
    # OR
    source venv/bin/activate       # For macOS / Linux
    ```

### Install Python Dependencies

Install the required Python packages.

* Install dependencies from the `requirements.txt` file (if available):
    ```bash
    pip install -r requirements.txt
    ```

* If `requirements.txt` is missing, manually install the dependencies:
    ```bash
    pip install transformers torch scikit-learn nltk flask beautifulsoup4 requests
    ```

### Install Node.js Dependencies

Install the necessary Node.js packages (e.g., for Express, build tools, or utility scripts):

```bash
npm install
```

3. Frontend Setup

Navigate to the frontend directory:

cd ../frontend


Install dependencies:

npm install


Create a .env file in the frontend/ directory and add your Firebase credentials:

REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id


Ensure .env is listed in .gitignore to protect credentials.

4. Running the Application (Step-by-Step)
Terminal 1 – Start Backend Server
cd backend
venv\Scripts\activate    # or source venv/bin/activate (for macOS/Linux)
nodemon index.js


The backend runs on http://localhost:3000
.

Terminal 2 – Start Frontend (React)
cd frontend
npm start


The frontend runs on http://localhost:5173
 (or whichever port appears in terminal).

API Endpoints
Endpoint	Method	Description
/api/news	GET	Fetches all verified news
/api/news/:category	GET	Fetches category-specific news
/api/verify	POST	Runs verification for a given article
/api/summarize	POST	Summarizes the given content text
Future Improvements

Add abstractive summarization (using T5 or Pegasus).

Integrate Redis or MongoDB for persistent caching.

Implement bias detection across publishers.

Add user dashboards for personalization and saved articles.

Deploy via Docker and set up CI/CD pipeline.

License

This project is open source and distributed under the MIT License.
