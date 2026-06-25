// Camarilla Pivot Points Formula Engine
function calculateCamarilla(high, low, close) {
    const range = high - low;
    
    return {
        r4: close + (range * 1.1 / 2),
        r3: close + (range * 1.1 / 4),
        r2: close + (range * 1.1 / 6),
        r1: close + (range * 1.1 / 12),
        s1: close - (range * 1.1 / 12),
        s2: close - (range * 1.1 / 6),
        s3: close - (range * 1.1 / 4),
        s4: close - (range * 1.1 / 2)
    };
}

// Global UI Elements
const searchInput = document.getElementById('symbol-search');
const saveKeyBtn = document.getElementById('save-key-btn');
const clearKeyBtn = document.getElementById('clear-key-btn');
const apiKeyInput = document.getElementById('api-key-input');
const dashboard = document.getElementById('dashboard');
const pivotLadder = document.getElementById('pivot-ladder');
const sourceIndicator = document.getElementById('data-source-indicator');
const marqueeTicker = document.getElementById('marquee-ticker');

// Load API Key from local storage if it exists
let apiKey = localStorage.getItem('alpha_vantage_key') || '';
if (apiKey) {
    apiKeyInput.value = '••••••••••••••••';
    sourceIndicator.textContent = "Live Mode: Alpha Vantage API Active";
}

// Save API Key Function
saveKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key && key !== '••••••••••••••••') {
        apiKey = key;
        localStorage.setItem('alpha_vantage_key', key);
        apiKeyInput.value = '••••••••••••••••';
        sourceIndicator.textContent = "Live Mode: Alpha Vantage API Active";
        alert('API Key Saved Successfully!');
    }
});

// Clear API Key Function
clearKeyBtn.addEventListener('click', () => {
    apiKey = '';
    localStorage.removeItem('alpha_vantage_key');
    apiKeyInput.value = '';
    sourceIndicator.textContent = "Demo Mode: Offline Data";
    alert('API Key Cleared.');
});

// Listen for the "Enter" key on search input
searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const symbol = searchInput.value.trim().toUpperCase();
        if (!symbol) return;

        if (!apiKey) {
            alert("Please enter and save your Alpha Vantage API Key first to fetch real-time data.");
            return;
        }

        sourceIndicator.textContent = `Fetching data for ${symbol}...`;

        try {
            // Fetch daily stock data from Alpha Vantage API
            const response = await fetch(`https://www.alphavantage.co/query?function=DAILY&symbol=${symbol}&apikey=${apiKey}`);
            const data = await response.json();

            // Error handling for API rate limits or bad symbols
            if (data["Note"] || data["Error Message"] || !data["Time Series (Daily)"]) {
                throw new Error(data["Note"] || data["Error Message"] || "Invalid Symbol");
            }

            // Get the most recent day's data
            const timeSeries = data["Time Series (Daily)"];
            const dates = Object.keys(timeSeries);
            const latestDate = dates[0];
            const latestData = timeSeries[latestDate];

            const high = parseFloat(latestData["2. high"]);
            const low = parseFloat(latestData["3. low"]);
            const close = parseFloat(latestData["4. close"]);

            // Calculate Camarilla Support & Resistance Levels
            const levels = calculateCamarilla(high, low, close);

            // Display the Dashboard Grid
            dashboard.classList.remove('hidden');

            // Render levels beautifully into the Price Ladder panel
            pivotLadder.innerHTML = `
                <div class="ladder-row bear"><span>R4 (Breakout Target)</span><span class="mono">${levels.r4.toFixed(2)}</span></div>
                <div class="ladder-row bear"><span>R3 (Reversal Zone)</span><span class="mono">${levels.r3.toFixed(2)}</span></div>
                <div class="ladder-row bear"><span>R2 (Resistance)</span><span class="mono">${levels.r2.toFixed(2)}</span></div>
                <div class="ladder-row bear"><span>R1 (Resistance)</span><span class="mono">${levels.r1.toFixed(2)}</span></div>
                <div class="ladder-row active"><span>LAST CLOSE (${symbol})</span><span class="mono">${close.toFixed(2)}</span></div>
                <div class="ladder-row bull"><span>S1 (Support)</span><span class="mono">${levels.s1.toFixed(2)}</span></div>
                <div class="ladder-row bull"><span>S2 (Support)</span><span class="mono">${levels.s2.toFixed(2)}</span></div>
                <div class="ladder-row bull"><span>S3 (Reversal Zone)</span><span class="mono">${levels.s3.toFixed(2)}</span></div>
                <div class="ladder-row bull"><span>S4 (Breakout Target)</span><span class="mono">${levels.s4.toFixed(2)}</span></div>
            `;

            sourceIndicator.textContent = `Live Data Loaded: ${symbol} (${latestDate})`;

        } catch (error) {
            console.error(error);
            sourceIndicator.textContent = "Error fetching live data. Check console or API key limit.";
            alert(`Failed to fetch live data: ${error.message}`);
        }
    }
});

// Setup a clean dummy ticker text row for the marquee top-bar
marqueeTicker.innerHTML = `
    <span>AAPL: +1.2% &nbsp;&nbsp;|&nbsp;&nbsp; TSLA: -0.8% &nbsp;&nbsp;|&nbsp;&nbsp; NVDA: +2.4% &nbsp;&nbsp;|&nbsp;&nbsp; AMD: +3.1% &nbsp;&nbsp;|&nbsp;&nbsp; MSFT: -0.2% &nbsp;&nbsp;|&nbsp;&nbsp;</span>
    <span>AAPL: +1.2% &nbsp;&nbsp;|&nbsp;&nbsp; TSLA: -0.8% &nbsp;&nbsp;|&nbsp;&nbsp; NVDA: +2.4% &nbsp;&nbsp;|&nbsp;&nbsp; AMD: +3.1% &nbsp;&nbsp;|&nbsp;&nbsp; MSFT: -0.2% &nbsp;&nbsp;|&nbsp;&nbsp;</span>
`;
