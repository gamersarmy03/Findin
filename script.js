const API_KEY = 'AIzaSyAgfVERAJvUGMY2hXycbYhL_eEFiuk1G-g';
const CX = 'b62679164034f475d';
const SEARCH_API = 'https://www.googleapis.com/customsearch/v1';
const SUGGEST_API = 'https://suggestqueries.google.com/complete/search?client=firefox&q=';

let currentPage = 1;
let currentType = 'sites';
const resultsPerPage = 10;

// Function to check if the input is a valid URL
function isValidUrl(string) {
    const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/i;
    return urlPattern.test(string);
}

// Function to normalize and display the URL in an iframe
function displayUrlInIframe(input) {
    let url = input.trim();
    // Add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    // Display the URL in the iframe
    const iframe = document.getElementById('website-iframe');
    iframe.src = url;
    iframe.style.display = 'block';
    // Hide search results and pagination
    document.getElementById('results').style.display = 'none';
    document.getElementById('results-info').style.display = 'none';
    document.getElementById('pagination').style.display = 'none';
    document.getElementById('filter-bar').style.display = 'none';
}

document.getElementById('search-button').addEventListener('click', (e) => {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        if (isValidUrl(query)) {
            displayUrlInIframe(query);
        } else {
            currentPage = 1;
            search(query, currentPage, currentType);
            document.getElementById('website-iframe').style.display = 'none'; // Hide iframe for normal searches
        }
    }
});

document.getElementById('search-input').addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query.length > 2) {
        const suggestions = await getSuggestions(query);
        displaySuggestions(suggestions);
    } else {
        document.getElementById('suggestions').style.display = 'none';
    }
});

document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        if (query) {
            if (isValidUrl(query)) {
                displayUrlInIframe(query);
            } else {
                currentPage = 1;
                search(query, currentPage, currentType);
                document.getElementById('website-iframe').style.display = 'none';
            }
        }
    }
});

document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentType = button.getAttribute('data-type');
        const query = document.getElementById('search-input').value;
        if (query) {
            currentPage = 1;
            search(query, currentPage, currentType);
            document.getElementById('website-iframe').style.display = 'none';
        }
    });
});

async function getSuggestions(query) {
    try {
        const response = await fetch(`${SUGGEST_API}${encodeURIComponent(query)}`);
        const data = await response.json();
        return data[1];
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
    }
}

function displaySuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = '';
    if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.textContent = suggestion;
            div.addEventListener('click', () => {
                document.getElementById('search-input').value = suggestion;
                suggestionsDiv.style.display = 'none';
                if (isValidUrl(suggestion)) {
                    displayUrlInIframe(suggestion);
                } else {
                    currentPage = 1;
                    search(suggestion, currentPage, currentType);
                    document.getElementById('website-iframe').style.display = 'none';
                }
            });
            suggestionsDiv.appendChild(div);
        });
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

async function search(query, page, type) {
    const start = (page - 1) * resultsPerPage + 1;
    let url = `${SEARCH_API}?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&start=${start}`;
    
    if (type === 'images') {
        url += '&searchType=image';
    } else if (type === 'videos') {
        url += '&q=site:youtube.com';
    }

    console.log('Search URL:', url);
    try {
        const startTime = performance.now();
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const endTime = performance.now();
        const searchTime = ((endTime - startTime) / 1000).toFixed(2);
        console.log('Search response:', data);
        console.log('Items:', data.items);
        displayResults(data, type, searchTime);
        setupPagination(data, query, type);
        document.getElementById('filter-bar').style.display = 'flex';
        document.getElementById('results-info').style.display = 'block';
    } catch (error) {
        console.error('Error fetching search results:', error);
        document.getElementById('results').innerHTML = '<p>Error fetching results. Check API key or quota.</p>';
        document.getElementById('results-info').innerHTML = '';
        document.getElementById('filter-bar').style.display = 'flex';
        document.getElementById('results-info').style.display = 'block';
    }
}

function displayResults(data, type, searchTime) {
    const resultsDiv = document.getElementById('results');
    const resultsInfoDiv = document.getElementById('results-info');
    resultsDiv.innerHTML = '';
    resultsInfoDiv.innerHTML = '';

    if (!data || !data.queries || !data.queries.request) {
        console.error('Invalid API response structure:', data);
        resultsDiv.innerHTML = '<p>Error: Invalid response from server.</p>';
        resultsInfoDiv.innerHTML = `0 results (${searchTime} seconds)`;
        return;
    }

    const totalResults = parseInt(data.queries.request[0].totalResults) || 0;
    resultsInfoDiv.innerHTML = `About ${totalResults.toLocaleString()} results (${searchTime} seconds)`;

    if (data.items && data.items.length > 0) {
        if (type === 'images') {
            data.items.forEach(item => {
                const resultItem = document.createElement('div');
                resultItem.className = 'image-result';
                resultItem.innerHTML = `
                    <a href="${item.link}" target="_blank">
                        <img src="${item.link}" alt="${item.title || 'Image'}">
                    </a>
                    <p><a href="${item.image?.contextLink || item.link}" target="_blank">${item.title || 'View source'}</a></p>
                `;
                resultsDiv.appendChild(resultItem);
            });
        } else if (type === 'videos') {
            data.items.forEach(item => {
                const resultItem = document.createElement('div');
                resultItem.className = 'video-result';
                resultItem.innerHTML = `
                    <a href="${item.link}" target="_blank">
                        <img src="${item.pagemap?.cse_thumbnail?.[0]?.src || ''}" alt="${item.title || 'Video'}">
                    </a>
                    <div>
                        <h3><a href="${item.link}" target="_blank">${item.title}</a></h3>
                        <p>${item.snippet}</p>
                    </div>
                `;
                resultsDiv.appendChild(resultItem);
            });
        } else {
            data.items.forEach(item => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.innerHTML = `
                    <h3>${item.title}</h3>
                    <a href="${item.link}" target="_blank">${item.link}</a>
                    <p>${item.snippet}</p>
                `;
                resultsDiv.appendChild(resultItem);
            });
        }
    } else {
        console.warn('No items found in response:', data);
        resultsDiv.innerHTML = '<p>No results found. Try a different query or check API settings.</p>';
    }
}

function setupPagination(data, query, type) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';
    const totalResults = parseInt(data.queries.request[0].totalResults) || 0;
    const totalPages = Math.ceil(totalResults / resultsPerPage);

    if (totalPages > 1) {
        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = 'Previous';
            prevButton.addEventListener('click', () => {
                currentPage--;
                search(query, currentPage, type);
                document.getElementById('website-iframe').style.display = 'none';
            });
            paginationDiv.appendChild(prevButton);
        }

        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.addEventListener('click', () => {
                currentPage++;
                search(query, currentPage, type);
                document.getElementById('website-iframe').style.display = 'none';
            });
            paginationDiv.appendChild(nextButton);
        }
    }
}
