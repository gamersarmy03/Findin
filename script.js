const API_KEY = 'AIzaSyAsC26etChOJbWDfbmzgJf6MuOwyuCWNQw';
const CX = 'b62679164034f475d';
const SEARCH_API = 'https://www.googleapis.com/customsearch/v1';
const SUGGEST_API = 'https://suggestqueries.google.com/complete/search?client=firefox&q=';

let currentPage = 1;
let currentType = 'sites';
const resultsPerPage = 10;

document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    if (query) {
        currentPage = 1;
        search(query, currentPage, currentType);
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
        const query = document.getElementById('search-input').value;
        if (query) {
            currentPage = 1;
            search(query, currentPage, currentType);
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
                currentPage = 1;
                search(suggestion, currentPage, currentType);
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

    try {
        const startTime = performance.now();
        const response = await fetch(url);
        const data = await response.json();
        const endTime = performance.now();
        const searchTime = ((endTime - startTime) / 1000).toFixed(2);
        displayResults(data, type, searchTime);
        setupPagination(data, query, type);
    } catch (error) {
        console.error('Error fetching search results:', error);
        document.getElementById('results').innerHTML = '<p>Error fetching results. Please try again.</p>';
        document.getElementById('results-info').innerHTML = '';
    }
}

function displayResults(data, type, searchTime) {
    const resultsDiv = document.getElementById('results');
    const resultsInfoDiv = document.getElementById('results-info');
    resultsDiv.innerHTML = '';
    resultsInfoDiv.innerHTML = '';
    
    if (data.items && data.items.length > 0) {
        const totalResults = parseInt(data.queries.request[0].totalResults);
        resultsInfoDiv.innerHTML = `About ${totalResults.toLocaleString()} results (${searchTime} seconds)`;
        
        if (type === 'images') {
            data.items.forEach(item => {
                const resultItem = document.createElement('div');
                resultItem.className = 'image-result';
                resultItem.innerHTML = `
                    <a href="${item.link}" target="_blank">
                        <img src="${item.link}" alt="${item.title || 'Image'}">
                    </a>
                    <p><a href="${item.image.contextLink}" target="_blank">${item.title || 'View source'}</a></p>
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
        resultsDiv.innerHTML = '<p>No results found.</p>';
        resultsInfoDiv.innerHTML = `0 results (${searchTime} seconds)`;
    }
}

function setupPagination(data, query, type) {
    const paginationDiv = document.getElementById('pagination');
    paginationDiv.innerHTML = '';
    const totalResults = parseInt(data.queries.request[0].totalResults);
    const totalPages = Math.ceil(totalResults / resultsPerPage);

    if (totalPages > 1) {
        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = 'Previous';
            prevButton.addEventListener('click', () => {
                currentPage--;
                search(query, currentPage, type);
            });
            paginationDiv.appendChild(prevButton);
        }

        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.addEventListener('click', () => {
                currentPage++;
                search(query, currentPage, type);
            });
            paginationDiv.appendChild(nextButton);
        }
    }
}
