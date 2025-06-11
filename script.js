const API_KEY = 'AIzaSyAsC26etChOJbWDfbmzgJf6MuOwyuCWNQw';
const CX = 'YOUR_CX_ID'; // Replace with your Custom Search Engine ID
const SEARCH_API = 'https://www.googleapis.com/customsearch/v1';
const SUGGEST_API = 'https://suggestqueries.google.com/complete/search?client=firefox&q=';

let currentPage = 1;
const resultsPerPage = 10;

document.getElementById('search-button').addEventListener('click', () => {
    const query = document.getElementById('search-input').value;
    if (query) {
        search(query, currentPage);
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
            search(query, currentPage);
        }
    }
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
                search(suggestion, currentPage);
            });
            suggestionsDiv.appendChild(div);
        });
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.style.display = 'none';
    }
}

async function search(query, page) {
    const start = (page - 1) * resultsPerPage + 1;
    try {
        const response = await fetch(`${SEARCH_API}?key=${API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}&start=${start}`);
        const data = await response.json();
        displayResults(data);
        setupPagination(data, query);
    } catch (error) {
        console.error('Error fetching search results:', error);
        document.getElementById('results').innerHTML = '<p>Error fetching results. Please try again.</p>';
    }
}

function displayResults(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    if (data.items && data.items.length > 0) {
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
    } else {
        resultsDiv.innerHTML = '<p>No results found.</p>';
    }
}

function setupPagination(data, query) {
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
                search(query, currentPage);
            });
            paginationDiv.appendChild(prevButton);
        }

        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next';
            nextButton.addEventListener('click', () => {
                currentPage++;
                search(query, currentPage);
            });
            paginationDiv.appendChild(nextButton);
        }
    }
}
