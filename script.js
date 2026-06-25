// --- Core Logic ---
const AV_URL = 'https://www.alphavantage.co/query';
let debounceTimer;

document.addEventListener('DOMContentLoaded', () => {
    initTicker();
    checkApiKey();
    setupEventListeners();
});

function initTicker() {
    const marquee = document.getElementById('marquee-ticker');
    // Double the data for seamless loop
    const items = [...TICKER_DATA, ...TICKER_DATA];
    marquee.innerHTML = items.map(item => `
        <span class="ticker-item">
            ${item.s} <span style="color: ${item.c.includes('+') ? 'var(--bull)' : 'var(--bear)'}">${item.c}</span>
        </span>
    `).join('');
}

function checkApiKey() {
    const savedKey = localStorage.getItem('av_key');
    if (savedKey) {
        document.getElementById('api-key-input').value = '********';
        updateDataSourceLabel(true);
    }
}

function updateDataSourceLabel(isLive) {
    const label = document.getElementById('data-source-indicator');
    label.innerText = isLive ? 'Mode: Live Alpha Vantage Data' : 'Demo Mode: Offline Data';
    label.style.color = isLive ? 'var(--accent)' : 'var(--text-muted)';
}

function setupEventListeners() {
    // API Key Storage
    document.getElementById('save-key-btn').addEventListener('click', () => {
        const key = document.getElementById('api-key-input').value;
        if (key && key !== '********') {
            localStorage.setItem('av_key', key);
            alert('Key saved to localStorage');
            updateDataSourceLabel(true);
        }
    });

    document.getElementById('clear-key-btn').addEventListener('click', () => {
        localStorage.removeItem('av_key');
        document.getElementById('api-key-input').value = '';
        updateDataSourceLabel(false);
    });

    // Search Logic
    const searchInput = document.getElementById('symbol-search');
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.toUpperCase();
        if (query.length < 2) {
            hideDropdown();
            return;
        }
        debounceTimer = setTimeout(() => handleSearch(query), 400);
    });

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) hideDropdown();
    });
}

async function handleSearch(query) {
    const key = localStorage.getItem('av_key');
    if (key) {
        try {
            const res = await fetch(`${AV_URL}?function=SYMBOL_SEARCH&keywords=${query}&apikey=${key}`);
            const data = await res.json();
            if (data.bestMatches) {
                showResults(data.bestMatches.map(m => ({
                    symbol: m['1. symbol'],
                    name: m['2. name']
                })));
                return;
            }
        } catch (e) { console.error("API Error", e); }
    }
    
    // Fallback to local
    const localMatches = Object.keys(DEMO_QUOTES)
        .filter(s => s.includes(query))
        .map(s => ({ symbol: s, name: 'Offline Demo Symbol' }));
    showResults(localMatches);
}

function showResults(results) {
    const dropdown = document.getElementById('search-results');
    if (results.length === 0) {
        hideDropdown();
        return;
    }
    dropdown.innerHTML = results.map(r => `
        <div class="search-item" onclick="selectSymbol('${r.symbol}')">
            <strong>${r.symbol}</strong> <small>${r.name}</small>
        </div>
    `).join('');
    dropdown.classList.remove('hidden');
}

function hideDropdown() {
    document.getElementById('search-results').classList.add('hidden');
}

async function selectSymbol(symbol) {
    hideDropdown();
    document.getElementById('symbol-search').value = symbol;
    
    let quote;
    const key = localStorage.getItem('av_key');
    
    if (key) {
        try {
            const res = await fetch(`${AV_URL}?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${key}`);
            const data = await res.json();
            const timeSeries = data['Time Series (Daily)'];
            if (timeSeries) {
                const dates = Object.keys(timeSeries);
                const latest = timeSeries[dates[0]];
                const prev = timeSeries[dates[1]];
                quote = {
                    open: parseFloat(latest['1. open']),
                    high: parseFloat(latest['2. high']),
                    low: parseFloat(latest['3. low']),
                    close: parseFloat(latest['4. close']),
                    volume: latest['5. volume'],
                    prevClose: parseFloat(prev['4. close'])
                };
            }
        } catch (e) { console.error("Live Fetch Failed", e); }
    }

    if (!quote) quote = DEMO_QUOTES[symbol] || DEMO_QUOTES['AAPL'];
    
    renderDashboard(symbol, quote);
}

function renderDashboard(symbol, data) {
    document.getElementById('dashboard').classList.remove('hidden');
    
    // 1. Calculations
    const range = data.high - data.low;
    const pivots = {
        r4: data.close + (range * 1.1 / 2),
        r3: data.close + (range * 1.1 / 4),
        r2: data.close + (range * 1.1 / 6),
        r1: data.close + (range * 1.1 / 12),
        s1: data.close - (range * 1.1 / 12),
        s2: data.close - (range * 1.1 / 6),
        s3: data.close - (range * 1.1 / 4),
        s4: data.close - (range * 1.1 / 2)
    };

    // 2. Render Ladder
    const ladderEl = document.getElementById('pivot-ladder');
    ladderEl.innerHTML = `
        <div class="ladder-row bear"><span>R4 (Target)</span><span>${pivots.r4.toFixed(2)}</span></div>
        <div class="ladder-row bear"><span>R3 (Reversal)</span><span>${pivots.r3.toFixed(2)}</span></div>
        <div class="ladder-row"><span>R2</span><span>${pivots.r2.toFixed(2)}</span></div>
        <div class="ladder-row"><span>R1</span><span>${pivots.r1.toFixed(2)}</span></div>
        <div class="ladder-row active"><span>LAST CLOSE</span><span>${data.close.toFixed(2)}</span></div>
        <div class="ladder-row"><span>S1</span><span>${data.s1?.toFixed(2) || (data.close - (range * 1.1 / 12)).toFixed(2)}</span></div>
        <div class="ladder-row"><span>S2</span><span>${pivots.s2.toFixed(2)}</span></div>
        <div class="ladder-row bull"><span>S3 (Reversal)</span><span>${pivots.s3.toFixed(2)}</span></div>
        <div class="ladder-row bull"><span>S4 (Target)</span><span>${pivots.s4.toFixed(2)}</span></div>
    `;

    // 3. Fundamentals
    const change = data.close - data.prevClose;
    const changePct = (change / data.prevClose) * 100;
    const fundEl = document.getElementById('fundamentals-grid');
    fundEl.innerHTML = `
        <div><span>Open</span><span>${data.open.toFixed(2)}</span></div>
        <div><span>Day High</span><span>${data.high.toFixed(2)}</span></div>
        <div><span>Day Low</span><span>${data.low.toFixed(2)}</span></div>
        <div><span>Prev Close</span><span>${data.prevClose.toFixed(2)}</span></div>
        <div><span>Change</span><span style="color: ${change >= 0 ? 'var(--bull)' : 'var(--bear)'}">
            ${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePct.toFixed(2)}%)
        </span></div>
        <div><span>Volume</span><span>${data.volume}</span></div>
    `;

    // 4. Journal
    const journalEl = document.getElementById('journal-list');
    const logs = DECISION_LOG[symbol] || [];
    if (logs.length === 0) {
        journalEl.innerHTML = `<p class="muted">No trade logs found for ${symbol}.</p>`;
    } else {
        journalEl.innerHTML = logs.map(entry => `
            <div class="entry">
                <div class="entry-meta">
                    <span class="action-${entry.action.toLowerCase()}">${entry.action}</span>
                    <span class="muted">${entry.date}</span>
                </div>
                <div>Price: <span class="mono">${entry.price.toFixed(2)}</span></div>
                <p class="muted" style="margin-top:5px italic">${entry.note}</p>
            </div>
        `).join('');
    }
}
