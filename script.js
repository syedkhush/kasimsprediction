// Main Core API Search Execution Pipeline
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                // Strip spaces and clean existing trailing suffixes to standardize
                let symbol = searchInput.value.trim().toUpperCase().replace(/\s+/g, '').replace('.BSE', '');
                if (!symbol) return;

                // Enforce perfect suffix layout
                symbol = `${symbol}.BSE`;

                currentActiveSymbol = symbol.replace('.BSE', '');
                sourceIndicator.textContent = `Fetching live Indian market data for ${symbol}...`;

                try {
                    // Correct functional endpoint payload
                    const response = await fetch(`https://www.alphavantage.co/query?function=DAILY&symbol=${symbol}&apikey=${API_KEY}`);
                    const data = await response.json();

                    if (data["Note"]) {
                        throw new Error("Alpha Vantage free rate limit hit (5 requests/min). Please wait 60 seconds.");
                    }
                    if (data["Error Message"] || !data["Time Series (Daily)"]) {
                        throw new Error(`Invalid ticker layout variable sequence returned from data supplier.`);
                    }

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
                    
                    lastFetchedClosePrice = close;
                    slPriceInput.value = (close * 0.99).toFixed(2); // Auto defaults SL to 1% below entry
                    calcResult.textContent = "";

                    const prevClose = parseFloat(prevData["4. close"]);
                    const netChange = close - prevClose;
                    const pctChange = (netChange / prevClose) * 100;

                    const levels = calculateCamarilla(high, low, close);
                    
                    // CRITICAL FIX 1: Instantly strip the hidden visibility class away
                    workspace.classList.remove('hidden');
                    workspace.style.display = "block"; // Explicit fallback enforcement
                    
                    // CRITICAL FIX 2: Reset the inner HTML framework of the chart container so the TradingView script has a clean target canvas
                    const chartContainer = document.getElementById('tv-chart-container');
                    if (chartContainer) {
                        chartContainer.innerHTML = ""; 
                        chartContainer.style.height = "450px";
                        chartContainer.style.display = "block";
                    }

                    // Step macro-task processing boundary to ensure display container paint complete before script runs
                    setTimeout(() => {
                        renderTradingViewChart(currentActiveSymbol);
                    }, 100);

                    // Render Pivot Rows
                    pivotLadder.innerHTML = `
                        <div class="ladder-row bear"><span>R4 (Breakout Target)</span><span class="mono">₹${levels.r4.toFixed(2)}</span></div>
                        <div class="ladder-row bear"><span>R3 (Short Entry Zone)</span><span class="mono">₹${levels.r3.toFixed(2)}</span></div>
                        <div class="ladder-row bear"><span>R2 (Resistance Point)</span><span class="mono">₹${levels.r2.toFixed(2)}</span></div>
                        <div class="ladder-row bear"><span>R1 (Minor Resistance)</span><span class="mono">₹${levels.r1.toFixed(2)}</span></div>
                        <div class="ladder-row active"><span>LAST PRICE (${currentActiveSymbol})</span><span class="mono">₹${close.toFixed(2)}</span></div>
                        <div class="ladder-row bull"><span>S1 (Minor Support)</span><span class="mono">₹${levels.s1.toFixed(2)}</span></div>
                        <div class="ladder-row bull"><span>S2 (Support Point)</span><span class="mono">₹${levels.s2.toFixed(2)}</span></div>
                        <div class="ladder-row bull"><span>S3 (Long Entry Zone)</span><span class="mono">₹${levels.s3.toFixed(2)}</span></div>
                        <div class="ladder-row bull"><span>S4 (Breakout Target)</span><span class="mono">₹${levels.s4.toFixed(2)}</span></div>
                    `;

                    // Render Data Metrics Card
                    const changeColor = netChange >= 0 ? '#10B981' : '#EF4444';
                    const changeSign = netChange >= 0 ? '+' : '';

                    fundamentalsGrid.innerHTML = `
                        <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:1.1rem; font-weight:600; border-bottom:1px solid #1E293B; padding-bottom:6px;">
                            <span>Ticker Symbol:</span><span style="color:#38BDF8">${currentActiveSymbol}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span>Net Performance:</span><span style="color:${changeColor}; font-weight:bold;">${changeSign}${netChange.toFixed(2)} (${changeSign}${pctChange.toFixed(2)}%)</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span>Session Open:</span><span class="mono">₹${open.toFixed(2)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span>Session High:</span><span class="mono" style="color:#10B981">₹${high.toFixed(2)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span>Session Low:</span><span class="mono" style="color:#EF4444">₹${low.toFixed(2)}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span>Trade Volume:</span><span class="mono">${volume.toLocaleString('en-IN')}</span>
                        </div>
                    `;

                    sourceIndicator.textContent = `Live NSE/BSE Session: ${currentActiveSymbol} (${latestDate})`;
                    displayJournalEntries();
                    
                    // Optional clean UI sweep
                    searchInput.value = "";

                } catch (error) {
                    console.error(error);
                    sourceIndicator.textContent = "Execution paused. Review input criteria metrics.";
                    alert(error.message);
                }
            }
        });
