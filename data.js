const DECISION_LOG = {
    "AAPL": [
        { date: "2024-06-10", action: "BUY", price: 193.20, note: "Strong support at S3, bounce with volume." },
        { date: "2024-06-12", action: "SELL", price: 198.45, note: "Profit taken at R4 resistance level." }
    ],
    "TSLA": [
        { date: "2024-06-15", action: "HOLD", price: 178.10, note: "Consolidating between Pivot and R1." }
    ],
    "MSFT": [
        { date: "2024-06-08", action: "BUY", price: 420.50, note: "Breakout above R3 confirmed." }
    ],
    "RELIANCE.BSE": [
        { date: "2024-06-18", action: "BUY", price: 2950.00, note: "Long term accumulation zone." }
    ]
};

const DEMO_QUOTES = {
    "AAPL": { open: 192.30, high: 195.10, low: 191.50, close: 193.80, prevClose: 190.20, volume: "52M" },
    "TSLA": { open: 175.20, high: 182.40, low: 174.10, close: 179.50, prevClose: 177.10, volume: "90M" },
    "MSFT": { open: 425.00, high: 430.50, low: 423.20, close: 428.15, prevClose: 424.00, volume: "22M" },
    "GOOGL": { open: 176.10, high: 178.50, low: 175.20, close: 177.40, prevClose: 175.90, volume: "18M" },
    "RELIANCE.BSE": { open: 2940.00, high: 2985.00, low: 2930.00, close: 2970.00, prevClose: 2935.00, volume: "5.4M" },
    "TCS.BSE": { open: 3820.00, high: 3855.00, low: 3810.00, close: 3835.00, prevClose: 3815.00, volume: "1.2M" }
};

// For Ticker Marquee
const TICKER_DATA = [
    { s: "AAPL", c: "+1.2%" }, { s: "TSLA", c: "-0.8%" }, 
    { s: "MSFT", c: "+0.5%" }, { s: "NVDA", c: "+2.4%" }, 
    { s: "BTC/USD", c: "+3.1%" }, { s: "RELIANCE", c: "-0.2%" }
];
