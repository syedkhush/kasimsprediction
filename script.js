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
const fundamentalsGrid = document.getElementById('fundamentals-grid');
const sourceIndicator = document.getElementById('data-source-indicator');
const marqueeTicker = document.getElementById('marquee-ticker');

// Hardcoded explicit active key structure
const API_KEY = "EIKH0Z28X1LS0G4L";

// Pre-fill visual dashboard state
if (apiKeyInput) apiKeyInput.value = '••••••••••••••••';
if (sourceIndicator) sourceIndicator.textContent = "Live Mode: Alpha Vantage Active (EIKH0Z...)";

// Listen for the "Enter" key on search input
searchInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        let symbol = searchInput.value.trim().toUpperCase();
        if (!symbol) return;

        // Auto-append .BSE suffix for Indian Stock pipeline compatibility
        if (!symbol.includes('.') && !symbol.includes(':')) {
            symbol = `${symbol}.BSE`;
        }

        sourceIndicator.textContent = `Fetching live Indian market data for ${symbol}...`;

        try {
            // Fetch live Daily summary structure
            const response = await fetch(`https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}`);
            const data = await response.json();

            // Handle API Rate Limits or incorrect tickers explicitly
            if (data["Note"]) {
                throw new Error("Alpha Vantage free rate limit hit (5 requests/min). Please wait 60 seconds and try again.");
            }
            if (data["Error Message"] || !data["Time Series (Daily)"]) {
                throw new Error(`Invalid Symbol layout. Ensure "${symbol.replace('.BSE', '')}" is actively listed on NSE/BSE.`);
            }

            // Extract the latest two days to compute price shifts
            const timeSeries = data["Time Series (Daily)"];
            const dates = Object.keys(timeSeries);
            const latestDate = dates[0];
            const previousDate = dates[1];
            
            const latestData = timeSeries[latestDate];
            const prevData = timeSeries[previousDate];

            const open = parseFloat(latestData["1. open"]);
            const high = parseFloat(latestData["2. high"]);
            const low = parseFloat(latestData["3. low"]);
            const close = parseFloat(latestData["4. close"]);
            const volume = parseInt(latestData["5. volume"]);
            
            const prevClose = parseFloat(prevData["4. close"]);
            const netChange = close - prevClose;
            const pctChange = (netChange / prevClose) * 100;

            // Calculate Camarilla Turning Points
            const levels = calculateCamarilla(high, low, close);

            // Unhide Dashboard
            dashboard.classList.remove('hidden');

            // 1. Populate the Price Ladder (Support and Resistance)
            pivotLadder.innerHTML = `
                <div class="ladder-row bear"><span>R4 (Breakout Target)</span><span class="mono">₹${levels.r4.toFixed(2)}</span></div>
                <div class="ladder-row bear"><span>R3 (Short Entry Zone)</span><span class="mono">₹${levels.r3.toFixed(2)}</span></div>
                <div class="ladder-row bear"><span>R2 (Resistance Point)</span><span class="mono">₹${levels.r2.toFixed(2)}</span></div>
                <div class="ladder-row bear"><span>R1 (Minor Resistance)</span><span class="mono">₹${levels.r1.toFixed(2)}</span></div>
                <div class="ladder-row active"><span>LAST PRICE (${symbol.replace('.BSE', '')})</span><span class="mono">₹${close.toFixed(2)}</span></div>
                <div class="ladder-row bull"><span>S1 (Minor Support)</span><span class="mono">₹${levels.s1.toFixed(2)}</span></div>
                <div class="ladder-row bull"><span>S2 (Support Point)</span><span class="mono">₹${levels.s2.toFixed(2)}</span></div>
                <div class="ladder-row bull"><span>S3 (Long Entry Zone)</span><span class="mono">₹${levels.s3.toFixed(2)}</span></div>
                <div class="ladder-row bull"><span>S4 (Breakout Target)</span><span class="mono">₹${levels.s4.toFixed(2)}</span></div>
            `;

            // 2. Populate the Technical Fundamentals Card dynamically
            const changeColor = netChange >= 0 ? '#10B981' : '#EF4444';
            const changeSign = netChange >= 0 ? '+' : '';

            fundamentalsGrid.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:1.1rem; font-weight:600; border-bottom:1px solid #1E293B; padding-bottom:6px;">
                    <span>Ticker Symbol:</span>
                    <span style="color:#38BDF8">${symbol.replace('.BSE', '')}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>Net Performance:</span>
                    <span style="color:${changeColor}; font-weight:bold;">${changeSign}${netChange.toFixed(2)} (${changeSign}${pctChange.toFixed(2)}%)</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>Session Open:</span>
                    <span class="mono">₹${open.toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>Session High:</span>
                    <span class="mono" style="color:#10B981">₹${high.toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>Session Low:</span>
                    <span class="mono" style="color:#EF4444">₹${low.toFixed(2)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>Trade Volume:</span>
                    <span class="mono">${volume.toLocaleString('en-IN')}</span>
                </div>
            `;

            sourceIndicator.textContent = `Live NSE/BSE Session: ${symbol.replace('.BSE', '')} (${latestDate})`;

        } catch (error) {
            console.error(error);
            sourceIndicator.textContent = "Query execution paused. Review warning message.";
            alert(error.message);
        }
    }
});

// Setup dynamic continuous Indian Stock marquee top-bar
if (marqueeTicker) {
    marqueeTicker.innerHTML = `
        <span>NIFTY 50: ₹23,520.10 (+0.45%) &nbsp;&nbsp;|&nbsp;&nbsp; SENSEX: ₹77,310.45 (+0.38%) &nbsp;&nbsp;|&nbsp;&nbsp; RELIANCE: ₹2,450.50 (+1.2%) &nbsp;&nbsp;|&nbsp;&nbsp; TCS: ₹3,420.00 (-0.8%) &nbsp;&nbsp;|&nbsp;&nbsp; HDFCBANK: ₹1,610.15 (+3.1%) &nbsp;&nbsp;|&nbsp;&nbsp;</span>
        <span>NIFTY 50: ₹23,520.10 (+0.45%) &nbsp;&nbsp;|&nbsp;&nbsp; SENSEX: ₹77,310.45 (+0.38%) &nbsp;&nbsp;|&nbsp;&nbsp; RELIANCE: ₹2,450.50 (+1.2%) &nbsp;&nbsp;|&nbsp;&nbsp; TCS: ₹3,420.00 (-0.8%) &nbsp;&nbsp;|&nbsp;&nbsp; HDFCBANK: ₹1,610.15 (+3.1%) &nbsp;&nbsp;|&nbsp;&nbsp;</span>
    `;
}
