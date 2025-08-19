document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    fetchAllNews();
});

// --- API Configuration ---
// IMPORTANT: Get your free API key from https://newsapi.org/ and replace 'YOUR_API_KEY'
const NEWS_API_KEY = 'YOUR_API_KEY'; 
const SPACEFLIGHT_API_URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=30';
const RSS2JSON_API_URL = 'https://api.rss2json.com/v1/api.json?rss_url=';

const RSS_FEEDS = [
    { name: 'Space.com', url: 'https://www.space.com/feeds/all' },
    { name: 'Sky & Telescope', url: 'https://skyandtelescope.org/astronomy-news/feed' },
    { name: 'Astronomy Magazine', url: 'https://www.astronomy.com/feed' },
    { name: 'NASA News', url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss' },
    { name: 'EarthSky', url: 'https://earthsky.org/feed' },
    { name: 'The Planetary Society', url: 'https://www.planetary.org/rss/articles' },
    { name: 'Universe Today', url: 'https://www.universetoday.com/feed' },
    { name: 'The Space Review', url: 'https://thespacereview.com/articles.xml' },
    { name: 'Astrobites', url: 'https://astrobites.org/feed' },
    { name: 'Orbital Index', url: 'https://orbitalindex.com/feed.xml' },
];

// A selection of keywords for NewsAPI.org. The query is limited to 500 characters.
const NEWS_API_KEYWORDS = [
    'astronomy', 'astrophysics', 'cosmology', 'galaxy', 'nebula', '"black hole"', 
    '"dark matter"', '"james webb"', 'nasa', 'esa', 'spacex', '"artemis program"', 
    '"mars rover"', 'exoplanet', 'supernova', 'observatory', 'hubble'
];
const NEWS_API_URL = `https://newsapi.org/v2/everything?q=(${NEWS_API_KEYWORDS.join(' OR ')})&sortBy=publishedAt&language=en&pageSize=30&apiKey=${NEWS_API_KEY}`;

// --- DOM Elements ---
const newsContainer = document.getElementById('news-container');
const topicsList = document.getElementById('topics-list');
const totalArticlesSpan = document.getElementById('total-articles');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');

// --- Application State ---
const state = {
    allArticles: [],
    filteredArticles: [],
    currentFilter: null,
};

async function fetchAllNews() {
    newsContainer.innerHTML = '<p style="text-align: center;">Loading news...</p>';

    try {
        // Create a list of all fetch promises
        const fetchPromises = [
            fetchSpaceflightNews(),
            fetchNewsApiArticles()
        ];
        RSS_FEEDS.forEach(feed => {
            fetchPromises.push(fetchRssFeed(feed));
        });

        // Fetch from all sources concurrently
        const results = await Promise.allSettled(fetchPromises);

        // Combine articles from all successful fetches
        const fetchedArticles = results
            .filter(result => result.status === 'fulfilled')
            .flatMap(result => result.value);

        if (fetchedArticles.length === 0) {
            throw new Error("Could not fetch news from any source.");
        }

        // De-duplicate articles based on their URL and sort by date
        const uniqueArticles = Array.from(new Map(fetchedArticles.map(article => [article.url, article])).values());
        uniqueArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

        state.allArticles = uniqueArticles;
        displayNews(state.allArticles);
        updateSidebar(state.allArticles);

    } catch (error) {
        console.error("Could not fetch news:", error);
        let errorMessage = '<p style="text-align: center; color: #ff6b6b;">Sorry, we could not load the news at this time. Please try again later.</p>';
        if (NEWS_API_KEY === 'YOUR_API_KEY') {
            errorMessage += '<p style="text-align: center; font-size: 0.9rem;">Please make sure to add your NewsAPI.org API key in `script.js`.</p>';
        }
        newsContainer.innerHTML = errorMessage;
    }
}

async function fetchSpaceflightNews() {
    const response = await fetch(SPACEFLIGHT_API_URL);
    if (!response.ok) throw new Error(`Spaceflight API error! status: ${response.status}`);
    const data = await response.json();
    // Normalize the data to our standard format
    return data.results.map(article => ({
        title: article.title,
        summary: article.summary,
        url: article.url,
        image_url: article.image_url,
        news_site: article.news_site,
        published_at: article.published_at,
    }));
}

async function fetchNewsApiArticles() {
    if (!NEWS_API_KEY || NEWS_API_KEY === 'YOUR_API_KEY') {
        console.warn("NewsAPI key is not set. Skipping fetch from NewsAPI.org.");
        return []; // Return empty array if key is not set
    }
    const response = await fetch(NEWS_API_URL);
    if (!response.ok) throw new Error(`NewsAPI.org error! status: ${response.status}`);
    const data = await response.json();
    // Normalize the data to our standard format
    return data.articles.map(article => ({
        title: article.title,
        summary: article.description || 'No summary available.',
        url: article.url,
        image_url: article.urlToImage,
        news_site: article.source.name,
        published_at: article.publishedAt,
    }));
}

async function fetchRssFeed(feed) {
    try {
        const encodedUrl = encodeURIComponent(feed.url);
        const response = await fetch(`${RSS2JSON_API_URL}${encodedUrl}`);
        if (!response.ok) throw new Error(`RSS feed error for ${feed.name}! status: ${response.status}`);
        const data = await response.json();
        if (data.status !== 'ok') throw new Error(`rss2json API error for ${feed.name}: ${data.message}`);

        return data.items.map(item => ({
            title: item.title,
            summary: stripHtml(item.description).substring(0, 250) + (item.description.length > 250 ? '...' : ''),
            url: item.link,
            image_url: item.thumbnail || (item.enclosure && item.enclosure.link) || null,
            news_site: feed.name,
            published_at: item.pubDate,
        }));
    } catch (error) {
        console.error(`Failed to fetch or process RSS feed: ${feed.name}`, error);
        return []; // Return empty array on failure to not break the app
    }
}

function displayNews(articles) {
    newsContainer.innerHTML = '';

    if (!articles || articles.length === 0) {
        newsContainer.innerHTML = '<p>No news articles found.</p>';
        return;
    }

    articles.forEach(article => {
        const articleElement = document.createElement('div');
        articleElement.classList.add('article');

        // Use a placeholder for missing images
        const imageUrl = article.image_url || 'https://via.placeholder.com/400x200.png?text=No+Image';

        articleElement.innerHTML = `
            <img src="${imageUrl}" alt="" class="article-image" onerror="this.onerror=null;this.src='https://via.placeholder.com/400x200.png?text=Image+Error';">
            <div class="article-content">
                <h2>${article.title}</h2>
                <p class="article-source">Source: ${article.news_site}</p>
                <p>${article.summary}</p>
                <a href="${article.url}" target="_blank" rel="noopener noreferrer">Read More</a>
            </div>
        `;
        newsContainer.appendChild(articleElement);
    });
}

function updateSidebar(articles) {
    totalArticlesSpan.textContent = articles.length;

    const topicCounts = articles.reduce((acc, article) => {
        // Sanitize news site name to prevent issues
        const topic = article.news_site.replace(/ \.com$/, '');
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
    }, {});

    topicsList.innerHTML = '';

    // Sort topics by count in descending order
    const sortedTopics = Object.entries(topicCounts).sort(([, countA], [, countB]) => countB - countA);

    sortedTopics.forEach(([topic, count]) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="topic-name">${topic}</span>
            <span class="topic-count">${count}</span>
        `;
        topicsList.appendChild(listItem);
    });
}

/**
 * Utility function to strip HTML tags from a string.
 * @param {string} html The HTML string to clean.
 * @returns {string} The text content without HTML tags.
 */
function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}

// --- Chat Functionality ---

sendButton.addEventListener('click', handleChatSubmit);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit();
    }
});

async function handleChatSubmit() {
    const userInput = chatInput.value.trim();
    if (!userInput || sendButton.disabled) return;

    if (state.allArticles.length === 0) {
        addChatMessage('Please wait for articles to load before chatting.', 'bot');
        return;
    }

    addChatMessage(userInput, 'user');
    chatInput.value = '';
    sendButton.disabled = true;

    const botMessageElement = addChatMessage('Thinking...', 'bot');

    try {
        await queryOllama(userInput, botMessageElement);
    } catch (error) {
        console.error("Ollama query failed:", error);
        botMessageElement.textContent = "Sorry, I couldn't connect to the chat service. Make sure Ollama is running at http://localhost:11434.";
    } finally {
        sendButton.disabled = false;
        chatInput.focus();
    }
}

function addChatMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    messageElement.textContent = message;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll
    return messageElement;
}

async function queryOllama(userInput, botMessageElement) {
    const OLLAMA_URL = 'http://localhost:11434/api/chat';
    const OLLAMA_MODEL = 'llama3'; // Or 'mistral', 'gemma', etc.

    const articleContext = state.allArticles.map(article => {
        return `Source: ${article.news_site}\nTitle: ${article.title}\nSummary: ${article.summary}`;
    }).join('\n\n---\n\n');

    const systemPrompt = "You are ANA, an expert astronomy news analyst. The user will provide you with a list of recent news article titles and summaries. Your task is to answer the user's questions based *only* on the provided articles. Identify trends, common themes, or answer specific questions about the news. Be concise and helpful. Do not mention that you are an AI or that you were given a list of articles. Just answer the question directly based on the information.";
    const userPrompt = `Here is the list of today's articles:\n\n${articleContext}\n\nMy question is: ${userInput}`;

    const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: true,
        }),
    });

    if (!response.ok) throw new Error(`Ollama API error! status: ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    botMessageElement.textContent = ''; // Clear "Thinking..."

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
            const parsed = JSON.parse(line);
            if (parsed.message && parsed.message.content) {
                fullResponse += parsed.message.content;
                botMessageElement.textContent = fullResponse;
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            if (parsed.done) return;
        }
    }
}