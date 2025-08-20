document.addEventListener('DOMContentLoaded', () => {
    // Initialize the application
    fetchAllNews();
    // Add event listener for search
    searchInput.addEventListener('input', handleSearch);
});

// --- API Configuration ---
// IMPORTANT: Get your free API key from https://newsapi.org/ and replace 'YOUR_API_KEY'
const NEWS_API_KEY = 'de1e17c1655841c8a8ddd0952e363ff4'; 
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

// --- Topic Extraction Keywords ---
const TOPIC_KEYWORDS = {
    'Astrophysics': ['astrophysics', 'theoretical astrophysics', 'quantum cosmology', 'computational astrophysics'],
    'Observational Astronomy': ['observational astronomy', 'radio astronomy', 'infrared astronomy', 'optical astronomy', 'ultraviolet astronomy', 'x-ray astronomy', 'gamma-ray astronomy'],
    'Extragalactic Astronomy': ['extragalactic astronomy', 'extragalactic'],
    'Galactic Astronomy': ['galactic astronomy', 'milky way', 'galaxy structure', 'galactic center'],
    'Cosmology': ['cosmology', 'big bang', 'cosmic inflation', 'expansion of the universe', 'dark matter', 'dark energy', 'multiverse'],
    'Relativistic Astrophysics': ['relativistic astrophysics', 'gravitational waves', 'black hole'],
    'High Energy Astrophysics': ['high energy astrophysics', 'gamma ray bursts', 'active galactic nuclei'],
    'Stellar Astronomy': ['stellar astronomy', 'star formation', 'stellar evolution', 'supernova', 'nova', 'hypernova'],
    'Compact Objects': ['white dwarf', 'neutron star', 'black hole', 'magnetar', 'strange star'],
    'Planetary Science': ['planetary science', 'planet', 'moon', 'planetary system', 'planetary exploration'],
    'Exoplanets': ['exoplanet', 'extrasolar planet', 'habitability', 'exoplanet discovery', 'biosignatures'],
    'Planetary Rings': ['planetary rings', 'magnetosphere'],
    'Small Solar System Bodies': ['asteroid', 'comet', 'kuiper belt', 'oort cloud'],
    'Space Missions': ['space mission', 'nasa', 'esa', 'spacex', 'rover', 'spacecraft', 'artemis', 'sls', 'orion', 'starship', 'falcon 9'],
    'Stars': ['star', 'red giant', 'brown dwarf', 'white dwarf', 'neutron star', 'pulsar'],
    'Nebulae': ['nebula', 'emission nebula', 'reflection nebula', 'planetary nebula', 'supernova remnant'],
    'Galaxies': ['galaxy', 'galaxies', 'spiral galaxy', 'elliptical galaxy', 'irregular galaxy', 'andromeda', 'milky way'],
    'Star Clusters': ['star cluster', 'globular cluster', 'open cluster'],
    'Cosmic Microwave Background': ['cosmic microwave background', 'cmb'],
    'Compact Objects': ['white dwarf', 'neutron star', 'black hole'],
    'Supernovae': ['supernova', 'nova', 'hypernova'],
    'Gamma Ray Bursts': ['gamma ray burst', 'grb'],
    'Large Scale Structure': ['galaxy cluster', 'filament', 'void', 'supercluster'],
    'Astrometry': ['astrometry', 'stellar motion', 'orbit determination'],
    'Photometry': ['photometry', 'light measurement'],
    'Spectroscopy': ['spectroscopy', 'spectral analysis'],
    'Gravitational Waves': ['gravitational waves', 'gw'],
    'Cosmic Rays': ['cosmic ray', 'high energy particle'],
    'Neutrino Astronomy': ['neutrino astronomy', 'neutrino detection'],
    'Astrobiology': ['astrobiology', 'origin of life', 'life in space', 'biosignatures'],
    'Astrochemistry': ['astrochemistry', 'chemical processes in space'],
    'Plasma Astrophysics': ['plasma astrophysics', 'cosmic plasma'],
    'Interstellar Medium': ['interstellar medium', 'ism', 'intergalactic medium'],
    'Archaeoastronomy': ['archaeoastronomy', 'ancient astronomy'],
    'Atmospheric Science': ['planetary atmosphere', 'atmosphere'],
    'Space Weather': ['space weather', 'solar wind', 'solar activity', 'geomagnetic storm'],
    'Aerospace Engineering': ['aerospace engineering', 'rockets', 'spacecraft engineering'],
    'Astronomy History': ['astronomy history', 'historical astronomy'],
    'Space Law': ['space law', 'space treaties', 'outer space treaty'],
    'Space Commercialization': ['space commercialization', 'space industry', 'space tourism'],
    'Space Debris': ['space debris', 'orbital debris', 'space junk'],
    'Ethics in Space': ['space ethics', 'philosophy of space exploration'],
    'International Cooperation': ['international space cooperation', 'space agencies', 'nasa', 'esa', 'roscosmos', 'isro', 'cnsa']
};

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
const searchInput = document.getElementById('search-input-field');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');

// --- Application State ---
const state = {
    allArticles: [],
    currentFilter: null,
    currentSearchTerm: '',
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
        applyFiltersAndSearch();
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
                <a href="${article.url}" class="read-more-btn" target="_blank" rel="noopener noreferrer">Read More</a>
            </div>
        `;
        newsContainer.appendChild(articleElement);
    });
}

/**
 * Extracts relevant topics from an article's title and summary based on a predefined keyword list.
 * @param {object} article The article object.
 * @returns {string[]} An array of topics found in the article.
 */
function extractTopicsFromArticle(article) {
    const topics = new Set();
    const textToSearch = `${article.title.toLowerCase()} ${article.summary.toLowerCase()}`;

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        for (const keyword of keywords) {
            if (textToSearch.includes(keyword)) {
                topics.add(topic);
                break; // Found a keyword for this topic, move to the next topic
            }
        }
    }
    return Array.from(topics);
}

function updateSidebar(articles) {
    totalArticlesSpan.textContent = articles.length;

    const topicCounts = articles.reduce((acc, article) => {
        const topics = extractTopicsFromArticle(article);
        topics.forEach(topic => {
            acc[topic] = (acc[topic] || 0) + 1;
        });
        return acc;
    }, {});

    topicsList.innerHTML = '';

    // --- Add a "Show All" option ---
    const showAllItem = document.createElement('li');
    showAllItem.classList.add('topic-item', 'active'); // Active by default
    showAllItem.innerHTML = `
        <span class="topic-name">All Topics</span>
        <span class="topic-count">${articles.length}</span>
    `;
    showAllItem.addEventListener('click', handleFilterClick);
    topicsList.appendChild(showAllItem);

    // Sort topics by count in descending order and take the top 10
    const sortedTopics = Object.entries(topicCounts).sort(([, countA], [, countB]) => countB - countA);
    const topTopics = sortedTopics.slice(0, 10);

    topTopics.forEach(([topic, count]) => {
        const listItem = document.createElement('li');
        listItem.classList.add('topic-item');
        listItem.dataset.topic = topic; // Use data attribute to store the topic
        listItem.innerHTML = `
            <span class="topic-name">${topic}</span>
            <span class="topic-count">${count}</span>
        `;
        listItem.addEventListener('click', handleFilterClick);
        topicsList.appendChild(listItem);
    });
}

/**
 * Handles clicks on topic filters in the sidebar.
 * @param {MouseEvent} event The click event.
 */
function handleFilterClick(event) {
    const clickedElement = event.currentTarget;
    const topic = clickedElement.dataset.topic; // Will be undefined for "All Topics"

    // Update active class on the list items
    document.querySelectorAll('#topics-list .topic-item').forEach(item => {
        item.classList.remove('active');
    });
    clickedElement.classList.add('active');

    // Update state and apply filters
    state.currentFilter = topic || null;

    // Clear search when changing topics for a cleaner UX
    searchInput.value = '';
    state.currentSearchTerm = '';

    applyFiltersAndSearch();
}

function handleSearch(event) {
    state.currentSearchTerm = event.target.value;
    applyFiltersAndSearch();
}

function applyFiltersAndSearch() {
    let articlesToDisplay = state.allArticles;

    // 1. Apply topic filter
    if (state.currentFilter) {
        articlesToDisplay = articlesToDisplay.filter(article =>
            extractTopicsFromArticle(article).includes(state.currentFilter)
        );
    }

    // 2. Apply search filter
    const searchTerm = state.currentSearchTerm.toLowerCase().trim();
    if (searchTerm) {
        articlesToDisplay = articlesToDisplay.filter(article =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.summary.toLowerCase().includes(searchTerm)
        );
    }

    displayNews(articlesToDisplay);
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
    const OLLAMA_MODEL = 'llama3.1'; // Or 'mistral', 'gemma', etc.

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