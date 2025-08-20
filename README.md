# ANA - Astronomy News Aggregator

![ANA Screenshot]("Screenshot 2025-08-19 222859.png")

ANA is a sleek, modern web application that aggregates astronomy and space exploration news from various sources into a single, easy-to-navigate interface. It features a "glassmorphism" design, topic filtering, real-time search, and an integrated AI chat assistant to help you digest the latest cosmic discoveries.

## Features

-   **Multi-Source Aggregation**: Fetches the latest articles from the Spaceflight News API, NewsAPI.org, and a curated list of RSS feeds from top astronomy sites.
-   **Modern "Glassmorphism" UI**: A visually appealing interface with a cosmic background and frosted-glass panels, inspired by modern design trends.
-   **Automatic Topic Filtering**: Articles are automatically categorized into topics like *Astrophysics*, *Planetary Science*, *Space Missions*, and more, allowing for easy browsing.
-   **Live Search**: Instantly search through the titles and summaries of all loaded articles to find exactly what you're looking for.
-   **AI Chat Assistant (ANA)**: Chat with a local AI (powered by Ollama) that has context on all the loaded articles. Ask it to summarize trends, find specific information, or explain concepts based on the day's news.
-   **Responsive Design**: A clean layout that works well on different screen sizes.

## Tech Stack

-   **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
-   **APIs**:
    -   [Spaceflight News API](https://api.spaceflightnewsapi.net/v4/documentation)
    -   [NewsAPI.org](https://newsapi.org/)
    -   [rss2json](https://rss2json.com/) (for converting RSS feeds)
-   **AI Chat**: [Ollama](https://ollama.com/) running a local large language model (e.g., Llama 3.1, Mistral).

## Getting Started

To run this project locally, follow these steps:

### Prerequisites

1.  A modern web browser (e.g., Chrome, Firefox, Edge).
2.  **(Optional but Recommended for Chat)** [Ollama](https://ollama.com/) installed and running on your machine. You will also need to pull a model.
    ```sh
    # Example: Pull the Llama 3.1 model
    ollama pull llama3.1
    ```

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Add your NewsAPI.org API Key:**
    -   Get a free API key from [NewsAPI.org](https://newsapi.org/).
    -   Open `script.js` in your code editor.
    -   Find the line `const NEWS_API_KEY = '...';` and replace the placeholder with your actual key.
    ```javascript
    // script.js
    const NEWS_API_KEY = 'YOUR_API_KEY_HERE';
    ```

3.  **Run the application:**
    -   Simply open the `index.html` file in your web browser. No local server is required.

## File Structure

```
.
├── index.html      # The main HTML structure of the application.
├── styles.css      # All styles for the application, including the glassmorphism theme.
├── script.js       # Core application logic: API fetching, state management, DOM manipulation, and chat functionality.
└── README.md       # This file.
```

## How It Works

-   **Data Fetching**: On page load, `script.js` makes concurrent API calls to all configured news sources using `Promise.allSettled`.
-   **Deduplication**: Fetched articles are combined, and duplicates are removed based on the article URL.
-   **Topic Extraction**: Each article's title and summary are scanned for keywords to assign it to one or more relevant topics. These topics populate the sidebar filter.
-   **Filtering & Searching**: The UI allows users to filter articles by topic and/or search term. These filters are applied to the master list of articles in the application's state.
-   **AI Chat**: When a user sends a chat message, the titles and summaries of all loaded articles are sent as context to a local Ollama instance. The AI is prompted to answer the user's query based *only* on that provided context.
