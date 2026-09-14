import { useEffect, useState, useRef } from "react";
import "./App.css";
import AnalyticsDashboard from "./components/AnalyticsDashboard.jsx";

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://mandi-mitra-backend.onrender.com";

const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

const API_URL = `${API_BASE_URL}/getdata`;

// Live Benchmark Data for Pan-India Commodity Market Pulse & Arbitrage Simulator
const COMMODITY_PULSE_DATA = [
  {
    id: "wheat",
    name: "Wheat (गेहूं)",
    variety: "Lokwan / Sharbati",
    icon: "🌾",
    state: "Punjab",
    mandi: "Khanna APMC",
    localRate: 2125,
    topRate: 2580,
    change24h: "+3.2%",
    trend: "up",
  },
  {
    id: "onion",
    name: "Onion (प्याज़)",
    variety: "Red Medium",
    icon: "🧅",
    state: "Maharashtra",
    mandi: "Lasalgaon APMC",
    localRate: 1450,
    topRate: 2240,
    change24h: "+6.8%",
    trend: "up",
  },
  {
    id: "tomato",
    name: "Tomato (टमाटर)",
    variety: "Hybrid Local",
    icon: "🍅",
    state: "Karnataka",
    mandi: "Kolar APMC",
    localRate: 1200,
    topRate: 1850,
    change24h: "-1.4%",
    trend: "down",
  },
  {
    id: "mustard",
    name: "Mustard (सरसों)",
    variety: "Bold Black",
    icon: "🌾",
    state: "Rajasthan",
    mandi: "Bharatpur APMC",
    localRate: 5050,
    topRate: 5920,
    change24h: "+2.5%",
    trend: "up",
  },
  {
    id: "soybean",
    name: "Soybean (सोयाबीन)",
    variety: "Yellow Grade A",
    icon: "🫘",
    state: "Madhya Pradesh",
    mandi: "Indore APMC",
    localRate: 4200,
    topRate: 4950,
    change24h: "+1.9%",
    trend: "up",
  },
  {
    id: "cotton",
    name: "Cotton (कपास)",
    variety: "Shankar-6 Medium",
    icon: "☁️",
    state: "Gujarat",
    mandi: "Rajkot APMC",
    localRate: 6700,
    topRate: 7650,
    change24h: "+4.1%",
    trend: "up",
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [activeNavSection, setActiveNavSection] = useState("home");
  const [state, setState] = useState("");
  const [commodity, setCommodity] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [todayOnly, setTodayOnly] = useState(true);

  const [states, setStates] = useState([]);
  const [commodities, setCommodities] = useState([]);

  const [results, setResults] = useState([]);
  const [pulseData, setPulseData] = useState(COMMODITY_PULSE_DATA);
  const [tickerData, setTickerData] = useState([]);

  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingCommodities, setLoadingCommodities] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Interactive Arbitrage Calculator State
  const [calcCrop, setCalcCrop] = useState("wheat");
  const [calcVolume, setCalcVolume] = useState(50);

  const activeCalcCrop =
    pulseData.find((c) => c.id === calcCrop) ||
    pulseData[0] ||
    COMMODITY_PULSE_DATA[0];

  const calcLocalTotal = calcVolume * activeCalcCrop.localRate;
  const calcTopTotal = calcVolume * activeCalcCrop.topRate;
  const calcGain = calcTopTotal - calcLocalTotal;
  const calcGainPercent = Math.round(
    ((activeCalcCrop.topRate - activeCalcCrop.localRate) /
      (activeCalcCrop.localRate || 1)) *
      100
  );

  // =====================================================
  // 1. LOAD LIVE TICKER & MARKET PULSE FEEDS
  // =====================================================
  useEffect(() => {
    let isSubscribed = true;

    const loadMarketFeeds = async (attempt = 1) => {
      try {
        const [tickerRes, pulseRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/v1/prices/ticker?limit=25`),
          fetch(`${API_BASE_URL}/api/v1/prices/pulse`)
        ]);
        const [tickerJson, pulseJson] = await Promise.all([
          tickerRes.json(),
          pulseRes.json()
        ]);
        if (!isSubscribed) return;

        if (tickerJson.success && Array.isArray(tickerJson.data) && tickerJson.data.length > 0) {
          setTickerData(tickerJson.data);
        } else if (attempt < 3 && isSubscribed) {
          setTimeout(() => loadMarketFeeds(attempt + 1), 3000);
        }

        if (pulseJson.success && Array.isArray(pulseJson.data) && pulseJson.data.length > 0) {
          setPulseData(pulseJson.data);
        }
      } catch (err) {
        console.error(`Market feeds load error (attempt ${attempt}):`, err);
        if (attempt < 3 && isSubscribed) {
          setTimeout(() => loadMarketFeeds(attempt + 1), 3000);
        }
      }
    };

    loadMarketFeeds();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // =====================================================
  // REUSABLE MANDI DATA FETCHER
  // =====================================================
  const fetchMandiData = async (
    targetState,
    targetCommodity,
    targetDate = selectedDate,
    shouldScroll = false
  ) => {
    if (!targetState || !targetCommodity) {
      setError("Please select a state and commodity.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: targetState,
          commodity: targetCommodity,
          date: targetDate || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch data.");
      }

      const data = result.data || [];
      setResults(data);

      if (data.length === 0) {
        setError(`No current market records found for ${targetCommodity} in ${targetState}. Try selecting another commodity.`);
      } else if (shouldScroll) {
        setTimeout(() => {
          const el = document.getElementById("search-results-anchor");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || "Unable to fetch mandi data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // 2. LOAD STATES
  // =====================================================
  useEffect(() => {
    let isSubscribed = true;

    const loadStates = async (attempt = 1) => {
      try {
        setLoadingStates(true);
        const response = await fetch(`${API_BASE_URL}/states`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load states.");
        }

        const stateList = result.data || [];
        if (!isSubscribed) return;

        if (stateList.length === 0 && attempt < 3) {
          // If server is still booting or seeding, retry in 3 seconds
          setTimeout(() => {
            if (isSubscribed) loadStates(attempt + 1);
          }, 3000);
          return;
        }

        setStates(stateList);
        setError("");
      } catch (err) {
        console.error(`States API Error (attempt ${attempt}):`, err);
        if (attempt < 3 && isSubscribed) {
          // Retry automatically to absorb cloud server wake-up lag
          setTimeout(() => {
            if (isSubscribed) loadStates(attempt + 1);
          }, 3500);
        } else if (isSubscribed) {
          setError(err.message || "Unable to load states. The server might be waking up; please refresh.");
        }
      } finally {
        if (isSubscribed) {
          setLoadingStates(false);
        }
      }
    };

    loadStates();
    return () => {
      isSubscribed = false;
    };
  }, []);

  // =====================================================
  // 3. LOAD COMMODITIES WHEN STATE CHANGES
  // =====================================================
  useEffect(() => {
    if (!state) {
      setCommodities([]);
      setCommodity("");
      return;
    }

    let isCancelled = false;

    const loadCommodities = async () => {
      try {
        setLoadingCommodities(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/commodities?state=${encodeURIComponent(state)}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to load commodities.");
        }

        const commList = result.data || [];
        if (!isCancelled) {
          setCommodities(commList);
          // If current commodity isn't in the new state's list, reset it
          if (commodity && !commList.includes(commodity)) {
            setCommodity("");
          }
        }
      } catch (err) {
        console.error("Commodities API Error:", err);
        if (!isCancelled) {
          setCommodities([]);
          setError("Unable to load commodities for this state.");
        }
      } finally {
        if (!isCancelled) {
          setLoadingCommodities(false);
        }
      }
    };

    loadCommodities();

    return () => {
      isCancelled = true;
    };
  }, [state]);

  // =====================================================
  // SEARCH MANDI DATA (FORM SUBMIT)
  // =====================================================
  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    fetchMandiData(state, commodity, selectedDate, true);
  };

  // =====================================================
  // VALID PRICE CALCULATIONS & TODAY FILTER
  // =====================================================
  const latestArrivalDate =
    results.length > 0 ? results[0]["Arrival Date"] : "14/09/2026";

  const displayResults =
    todayOnly && results.length > 0 && !selectedDate
      ? results.filter((item) => item["Arrival Date"] === latestArrivalDate)
      : results;

  const validMinPrices = displayResults
    .map((item) => Number(item["Min Price"]))
    .filter((price) => Number.isFinite(price) && price >= 1);

  const validModalPrices = displayResults
    .map((item) => Number(item["Modal Price"]))
    .filter((price) => Number.isFinite(price) && price >= 1);

  const validMaxPrices = displayResults
    .map((item) => Number(item["Max Price"]))
    .filter((price) => Number.isFinite(price) && price >= 1);

  const lowestPrice =
    validMinPrices.length > 0 ? Math.min(...validMinPrices) : "N/A";

  const averageModal =
    validModalPrices.length > 0
      ? Math.round(
          validModalPrices.reduce((sum, price) => sum + price, 0) /
            validModalPrices.length
        )
      : "N/A";

  const highestPrice =
    validMaxPrices.length > 0 ? Math.max(...validMaxPrices) : "N/A";

  const bestMandiRecord = displayResults.reduce((best, cur) => {
    const curModal = Number(cur["Modal Price"]) || 0;
    const bestModal = best ? Number(best["Modal Price"]) || 0 : 0;
    return curModal > bestModal ? cur : best;
  }, null);

  const bestModalPrice =
    bestMandiRecord ? Number(bestMandiRecord["Modal Price"]) || 0 : 0;

  const profitAdvantage =
    averageModal !== "N/A" && bestModalPrice > 0
      ? bestModalPrice - averageModal
      : 0;

  const profitAdvantagePct =
    averageModal !== "N/A" && averageModal > 0
      ? ((profitAdvantage / averageModal) * 100).toFixed(1)
      : 0;

  const lowestMandiRecord = displayResults.reduce((lowest, cur) => {
    const curMin =
      Number(cur["Min Price"]) || Number(cur["Modal Price"]) || Infinity;
    const lowMin = lowest
      ? Number(lowest["Min Price"]) || Number(lowest["Modal Price"]) || Infinity
      : Infinity;
    return curMin < lowMin ? cur : lowest;
  }, null);

  const priceSpreadVal =
    highestPrice !== "N/A" && lowestPrice !== "N/A"
      ? highestPrice - lowestPrice
      : 0;

  const isNavClickRef = useRef(false);
  const clickTimeoutRef = useRef(null);

  // ScrollSpy: Sync active menu item when scrolling down the page
  useEffect(() => {
    if (activeTab !== "home") return;

    const handleScroll = () => {
      // Don't override highlight if user just clicked an item
      if (isNavClickRef.current) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      // Bottom of page -> About
      if (scrollY + windowHeight >= fullHeight - 140) {
        setActiveNavSection("about");
        return;
      }

      // Top of page / Hero -> Home
      if (scrollY < 260) {
        setActiveNavSection("home");
        return;
      }

      // Section triggers
      const sections = [
        { id: "about", nav: "about" },
        { id: "market-pulse", nav: "market-pulse" },
        { id: "solutions", nav: "solutions" },
        { id: "search-card-container", nav: "search" },
      ];

      const triggerLine = 220; // Trigger line relative to viewport top
      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerLine) {
            setActiveNavSection(sec.nav);
            return;
          }
        }
      }

      setActiveNavSection("home");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

  const handleNavClick = (sectionNav, elementId) => {
    setActiveTab("home");
    setActiveNavSection(sectionNav);

    // Suppress scrollspy overriding while scrolling to clicked destination
    isNavClickRef.current = true;
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => {
      isNavClickRef.current = false;
    }, 750);

    if (!elementId || sectionNav === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      return;
    }

    const el = document.getElementById(elementId);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const handleLogoClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    // Reload the page in the home state
    if (window.location.pathname === "/" && !window.location.hash) {
      window.location.reload();
    } else {
      window.location.href = window.location.origin + "/";
    }
  };

  const scrollToSearch = () => {
    handleNavClick("search", "search-card-container");
  };

  return (
    <div className="app figma-theme">
      {/* ================= NAVBAR ================= */}
      <nav className="figma-navbar">
        <div
          className="figma-logo"
          onClick={handleLogoClick}
          style={{ cursor: "pointer" }}
          title="Mandi-Mitra Home (Reload)"
        >
          <span className="logo-leaf">🌱</span>
          <span className="logo-title">
            Mandi<strong>Mitra</strong>
          </span>
        </div>

        {/* Center Pill Navigation */}
        <div className="figma-nav-pill">
          <button
            type="button"
            className={`pill-nav-item ${
              activeTab === "home" && activeNavSection === "home" ? "active" : ""
            }`}
            onClick={() => handleNavClick("home", null)}
          >
            Home
          </button>
          <button
            type="button"
            className={`pill-nav-item ${
              activeTab === "home" && activeNavSection === "search" ? "active" : ""
            }`}
            onClick={() => handleNavClick("search", "search-card-container")}
          >
            Mandi Search
          </button>
          <button
            type="button"
            className={`pill-nav-item ${
              activeTab === "home" && activeNavSection === "solutions"
                ? "active"
                : ""
            }`}
            onClick={() => handleNavClick("solutions", "solutions")}
          >
            Marketing Precision
          </button>
          <button
            type="button"
            className={`pill-nav-item ${
              activeTab === "home" && activeNavSection === "market-pulse"
                ? "active"
                : ""
            }`}
            onClick={() => handleNavClick("market-pulse", "market-pulse")}
          >
            Market Pulse &amp; Calculator
          </button>
          <button
            type="button"
            className={`pill-nav-item ${
              activeTab === "home" && activeNavSection === "about" ? "active" : ""
            }`}
            onClick={() => handleNavClick("about", "about")}
          >
            About
          </button>
        </div>

        {/* Right CTA Buttons */}
        <div className="figma-nav-actions">
          <button
            type="button"
            className={`nav-analytics-btn ${
              activeTab === "analytics" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("analytics");
              setActiveNavSection("analytics");
            }}
          >
            📊 Market Analytics
          </button>

          <button
            type="button"
            className="nav-cta-btn"
            onClick={scrollToSearch}
          >
            🔍 Live Price Ticker
          </button>
        </div>
      </nav>

      {activeTab === "analytics" ? (
        <AnalyticsDashboard
          apiBaseUrl={API_BASE_URL}
          states={states}
          defaultState={state || "Punjab"}
          defaultCommodity={commodity || "Wheat"}
          defaultMandi={
            bestMandiRecord
              ? bestMandiRecord.Market || bestMandiRecord.Mandi
              : ""
          }
          onBack={() => setActiveTab("home")}
        />
      ) : (
        <>
          {/* ================= REAL-TIME AGMARK LIVE TICKER ================= */}
          {tickerData.length > 0 && (
            <div className="figma-live-ticker-wrap">
              <div className="ticker-label-chip">
                <span className="live-pulsing-dot"></span>
                <span className="ticker-badge-text">LIVE MARKET FEED</span>
                <span className="ticker-badge-date">{tickerData[0]?.arrivalDate || "14/09/2026"}</span>
              </div>
              <div className="ticker-marquee-track">
                <div className="ticker-marquee-content">
                  {tickerData.concat(tickerData).map((item, idx) => (
                    <span
                      key={idx}
                      className="ticker-quote-chip"
                      onClick={() => {
                        setState(item.state);
                        setCommodity(item.commodity);
                        fetchMandiData(item.state, item.commodity, "", true);
                      }}
                      title={`Click to view ${item.commodity} prices in ${item.state}`}
                    >
                      <strong className="quote-crop">{item.commodity}</strong>
                      <span className="quote-mandi">({item.mandi}, {item.state}):</span>
                      <span className="quote-price">₹{item.modalPrice.toLocaleString("en-IN")}<small>/Qtl</small></span>
                      <span className="quote-dot">·</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* ================= HERO SECTION (MARKETING & ANALYTICS FOCUS) ================= */}
          <section className="figma-hero-section">
            <div className="hero-container">
              {/* Top Tagline Badge */}
              <div className="hero-pill-badge">
                <span className="badge-sparkle">✦</span>
                <span>
                  Agricultural Commodity Marketing · Empowering Indian Farmers &amp; Economy
                </span>
                <span className="badge-sparkle">✦</span>
              </div>

              {/* Main Display Headline */}
              <h1 className="hero-main-title">
                Empowering Indian Farmers —<br />
                <span>With Smart Commodity Marketing &amp; Price Intelligence</span>
              </h1>

              <p className="hero-subtext">
                Strengthening India's agrarian economy by connecting farmers,
                traders, and cooperatives directly with real-time AGMARK commodity
                rates, multi-mandi market surveillance, and automated price
                arbitrage across all 36 States &amp; UTs.
              </p>

              {/* Hero Visual Card (Preserving tractor_hero.jpg as requested) */}
              <div className="hero-visual-card">
                <img
                  src="/assets/tractor_hero.jpg"
                  alt="Agricultural Commodity Marketing &amp; Indian Farmer Economic Intelligence"
                  className="hero-tractor-img"
                />
                <div className="hero-visual-overlay"></div>

                {/* Floating Interactive Search Bar */}
                <div
                  className="hero-floating-search-card"
                  id="search-card-container"
                >
                  <div className="search-card-header">
                    <span className="search-tag">
                      📈 REAL-TIME AGMARK PRICE DISCOVERY
                    </span>
                    <h3>Check Current APMC Market Prices & Arbitrage</h3>
                  </div>

                  <form className="figma-search-form" onSubmit={handleSearch}>
                    {/* STATE */}
                    <div className="search-field">
                      <label>STATE / REGION</label>
                      <select
                        value={state}
                        onChange={(e) => {
                          const newState = e.target.value;
                          setState(newState);
                          setCommodity("");
                        }}
                        disabled={loadingStates}
                      >
                        <option value="">
                          {loadingStates ? "Loading states..." : "Select State"}
                        </option>
                        {states.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* COMMODITY */}
                    <div className="search-field">
                      <label>COMMODITY / CROP</label>
                      <select
                        value={commodity}
                        onChange={(e) => setCommodity(e.target.value)}
                        disabled={!state || loadingCommodities}
                      >
                        <option value="">
                          {!state
                            ? "Select state first"
                            : loadingCommodities
                            ? "Loading commodities..."
                            : "Select Commodity"}
                        </option>
                        {commodities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DATE (OPTIONAL) */}
                    <div className="search-field">
                      <label>MARKET DATE (OPTIONAL)</label>
                      <div className="date-field-wrap">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedDate(val);
                            if (state && commodity) {
                              fetchMandiData(state, commodity, val, false);
                            }
                          }}
                        />
                        {selectedDate && (
                          <button
                            type="button"
                            className="clear-date-btn"
                            title="Reset to today"
                            onClick={() => {
                              setSelectedDate("");
                              if (state && commodity) {
                                fetchMandiData(state, commodity, "", false);
                              }
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="search-field search-btn-field">
                      <span className="search-btn-spacer" aria-hidden="true">&nbsp;</span>
                      <button
                        type="submit"
                        className="hero-search-btn"
                        disabled={loading || !state || !commodity}
                        id="hero-mandi-search-btn"
                      >
                        {loading ? "Analyzing..." : "🔍 Search Rates"}
                      </button>
                    </div>
                  </form>

                  {error && (
                    <div className="search-status-alert">
                      <div className="status-alert-content">
                        <span className="status-alert-icon">ℹ️</span>
                        <div>
                          <p className="status-alert-title">{error}</p>
                          {commodities && commodities.length > 0 && (
                            <div className="status-suggestions">
                              <span>Available in {state}:</span>
                              {commodities.slice(0, 5).map((crop) => (
                                <button
                                  key={crop}
                                  type="button"
                                  className="crop-suggestion-pill"
                                  onClick={() => {
                                    setCommodity(crop);
                                    fetchMandiData(state, crop, selectedDate, true);
                                  }}
                                >
                                  {crop}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ================= METRICS BAR (MARKET DATA FOCUS) ================= */}
          <section className="figma-metrics-section">
            <div className="metrics-container">
              <div className="metric-item">
                <h2>500+</h2>
                <p>Monitored APMC Mandis</p>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <h2>200+</h2>
                <p>Active Traded Commodities</p>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <h2>120,000+</h2>
                <p>Farmers &amp; Traders Empowered</p>
              </div>
              <div className="metric-divider"></div>
              <div className="metric-item">
                <h2>₹25,000+ Cr</h2>
                <p>Agrarian Commodity Value Tracked</p>
              </div>
            </div>
          </section>

          {/* Anchor for auto-scrolling to results */}
          <div id="search-results-anchor"></div>

          {/* ================= SEARCH RESULTS & LIVE ANALYTICS ================= */}
          {results.length > 0 && (
            <section className="results-section">
              <div className="results-header">
                <div>
                  <div className="current-data-tag-row">
                    {selectedDate ? (
                      <>
                        <span className="selected-date-badge">📅 MARKET DATE: {latestArrivalDate}</span>
                        <button
                          type="button"
                          className="switch-to-today-btn"
                          onClick={() => {
                            setSelectedDate("");
                            if (state && commodity) {
                              fetchMandiData(state, commodity, "", false);
                            }
                          }}
                        >
                          ⚡ Switch to Today's Live Rates
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="live-pulse-badge">🔴 LIVE MARKET FEED</span>
                        <span className="current-date-badge">📅 {latestArrivalDate}</span>
                      </>
                    )}
                  </div>
                  <p className="section-label">
                    {selectedDate ? "ARCHIVED MARKET INTELLIGENCE" : "MARKET INTELLIGENCE RESULTS"}
                  </p>
                  <h2>
                    {commodity} Commercial Prices in {state}
                  </h2>
                  <p className="result-count">
                    {displayResults.length} verified mandi market records{" "}
                    {selectedDate
                      ? `for ${latestArrivalDate}`
                      : todayOnly
                      ? `for today (${latestArrivalDate})`
                      : `across past 1 year`}
                  </p>
                </div>

                <div className="results-header-actions">
                  <div className="date-filter-toggle">
                    {selectedDate ? (
                      <>
                        <button
                          type="button"
                          className="filter-toggle-btn active"
                        >
                          📅 Date: {latestArrivalDate} ({displayResults.length} mandis)
                        </button>
                        <button
                          type="button"
                          className="filter-toggle-btn"
                          onClick={() => {
                            setSelectedDate("");
                            if (state && commodity) {
                              fetchMandiData(state, commodity, "", false);
                            }
                          }}
                        >
                          ⚡ Today's Live Rates
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={`filter-toggle-btn ${todayOnly ? "active" : ""}`}
                          onClick={() => setTodayOnly(true)}
                        >
                          ⚡ Today's Live Rates ({latestArrivalDate})
                        </button>
                        <button
                          type="button"
                          className={`filter-toggle-btn ${!todayOnly ? "active" : ""}`}
                          onClick={() => setTodayOnly(false)}
                        >
                          📅 1-Year History ({results.length})
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    type="button"
                    className="view-analytics-btn"
                    onClick={() => setActiveTab("analytics")}
                  >
                    📊 View Price Trends & Graphs →
                  </button>
                </div>
              </div>

              {/* SUMMARY GRID */}
              <div className="summary-grid">
                <div className="summary-card">
                  <span>🏪</span>
                  <div>
                    <small>REPORTING MARKETS</small>
                    <strong>{displayResults.length}</strong>
                  </div>
                </div>

                <div className="summary-card">
                  <span>📉</span>
                  <div>
                    <small>LOWEST MARKET PRICE</small>
                    <strong>
                      {lowestPrice === "N/A" ? "N/A" : `₹${lowestPrice}`}
                    </strong>
                  </div>
                </div>

                <div className="summary-card">
                  <span>📊</span>
                  <div>
                    <small>STATE AVERAGE MODAL</small>
                    <strong>
                      {averageModal === "N/A" ? "N/A" : `₹${averageModal}`}
                    </strong>
                  </div>
                </div>

                <div className="summary-card">
                  <span>📈</span>
                  <div>
                    <small>HIGHEST MARKET PRICE</small>
                    <strong>
                      {highestPrice === "N/A" ? "N/A" : `₹${highestPrice}`}
                    </strong>
                  </div>
                </div>
              </div>

              {/* MARKET INTELLIGENCE & CURRENT ANALYTICS WIDGET */}
              <div className="current-analytics-widget">
                <div className="analytics-widget-header">
                  <div>
                    <span className="widget-header-badge">
                      💡 Commercial Marketing & Profitability Intelligence
                    </span>
                    <h3>
                      Market Realization Summary for {commodity} in {state}
                    </h3>
                    <p>
                      Real-time APMC price arbitrage, commercial marketing
                      recommendation, and regional margin distribution.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="widget-analytics-link"
                    onClick={() => setActiveTab("analytics")}
                  >
                    📊 Open In-Depth Analytics & Trends →
                  </button>
                </div>

                <div className="widget-grid">
                  {/* Best APMC to Sell */}
                  <div className="widget-card widget-profit">
                    <div className="widget-icon">🏆</div>
                    <div className="widget-content">
                      <span className="widget-tag">
                        BEST APMC TO SELL (MAX NET REALIZATION)
                      </span>
                      <h4>
                        {bestMandiRecord
                          ? bestMandiRecord.Market || bestMandiRecord.Mandi
                          : "N/A"}
                      </h4>
                      <div className="widget-price">
                        ₹{bestModalPrice.toLocaleString()} <small>/ Qtl</small>
                      </div>
                      <div className="profit-premium-badge">
                        {profitAdvantage > 0
                          ? `+₹${profitAdvantage.toLocaleString()} / Qtl (+${profitAdvantagePct}% vs Regional Benchmark)`
                          : "Highest recorded selling price"}
                      </div>
                      <p className="widget-note">
                        📍 {bestMandiRecord?.District || "Market Hub"} · Target
                        this market destination to maximize commercial profit
                        margins.
                      </p>
                    </div>
                  </div>

                  {/* Lowest APMC */}
                  <div className="widget-card widget-buyer">
                    <div className="widget-icon">🛒</div>
                    <div className="widget-content">
                      <span className="widget-tag">
                        LOWEST APMC (PROCUREMENT FLOOR)
                      </span>
                      <h4>
                        {lowestMandiRecord
                          ? lowestMandiRecord.Market || lowestMandiRecord.Mandi
                          : "N/A"}
                      </h4>
                      <div className="widget-price">
                        ₹{lowestPrice.toLocaleString()} <small>/ Qtl</small>
                      </div>
                      <div className="buyer-discount-badge">
                        {averageModal !== "N/A" &&
                        lowestPrice !== "N/A" &&
                        averageModal > lowestPrice
                          ? `-₹${(
                              averageModal - lowestPrice
                            ).toLocaleString()} / Qtl below regional average`
                          : "Optimal procurement price floor"}
                      </div>
                      <p className="widget-note">
                        📍 {lowestMandiRecord?.District || "Market Hub"} · Most
                        cost-effective APMC for bulk agricultural procurement.
                      </p>
                    </div>
                  </div>

                  {/* Price Arbitrage Spread */}
                  <div className="widget-card widget-spread">
                    <div className="widget-icon">⚖️</div>
                    <div className="widget-content">
                      <span className="widget-tag">
                        MARKET ARBITRAGE SPREAD
                      </span>
                      <div className="widget-price">
                        ₹{priceSpreadVal.toLocaleString()} <small>/ Qtl</small>
                      </div>
                      <div className="spread-bar-container">
                        <div className="spread-labels">
                          <span>Min: ₹{lowestPrice}</span>
                          <span>Avg: ₹{averageModal}</span>
                          <span>Peak: ₹{highestPrice}</span>
                        </div>
                        <div className="spread-bar">
                          <div
                            className="spread-bar-fill"
                            style={{ width: "100%" }}
                          ></div>
                        </div>
                      </div>
                      <p className="widget-note">
                        Significant cross-mandi spread indicates actionable
                        geographic price arbitrage opportunities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TABLE */}
              <div className="table-container">
                <div className="table-header">
                  <div>
                    <h3>APMC Market Price Details</h3>
                    <span className="table-sub-badge">
                      {todayOnly
                        ? `Showing Today's Live Rates (${latestArrivalDate})`
                        : `Showing All ${results.length} Historical Arrivals`}
                    </span>
                  </div>
                  <span>{state}</span>
                </div>

                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>MANDI / APMC</th>
                        <th>DISTRICT</th>
                        <th>COMMODITY</th>
                        <th>MIN PRICE</th>
                        <th>MODAL PRICE</th>
                        <th>MAX PRICE</th>
                        <th>ARRIVAL DATE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayResults.map((item, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td className="mandi-name">
                            🏪 {item.Market || item.Mandi || "N/A"}
                          </td>
                          <td>{item.District || "N/A"}</td>
                          <td>{item.Commodity || "N/A"}</td>
                          <td>₹{item["Min Price"]}</td>
                          <td className="modal-price">₹{item["Modal Price"]}</td>
                          <td>₹{item["Max Price"]}</td>
                          <td className="arrival-date-cell">
                            <span className={item["Arrival Date"] === latestArrivalDate ? "date-today-tag" : ""}>
                              {item["Arrival Date"] || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ================= SECTION 1: UNIFIED MARKETING SOLUTIONS (WITH IMAGES & BUTTONS) ================= */}
          <section className="figma-section solutions-section" id="solutions">
            <div className="section-container">
              <div className="section-split-header">
                <div className="split-left">
                  <span className="figma-pill-label">
                    CORE MARKETING PILLARS
                  </span>
                  <h2>
                    Next-Gen Solutions For<br />
                    <span>Agricultural Marketing</span>
                  </h2>
                </div>
                <div className="split-right">
                  <p>
                    Transforming agricultural marketing with real-time price
                    surveillance, demand tracking, and automated market arbitrage.
                    Our analytics platform equips Indian farmers, traders, and
                    marketing federations to eliminate price opacity and
                    maximize trading revenue across regional APMCs.
                  </p>
                </div>
              </div>

              {/* 3 Core Feature Cards Grid (Images & Buttons) */}
              <div className="solutions-cards-grid">
                {/* Card 01: Crop Surveillance */}
                <div className="solution-feature-card">
                  <div className="solution-card-img-wrap">
                    <img
                      src="/assets/crop_rows_card.jpg"
                      alt="Crop Surveillance"
                    />
                    <span className="card-badge-pill">Surveillance</span>
                  </div>
                  <div className="solution-card-body">
                    <div className="solution-card-top">
                      <span className="card-step-num">01</span>
                      <h4>Crop Surveillance</h4>
                    </div>
                    <p>
                      Comprehensive commodity arrival surveillance across all 36
                      States and Union Territories. Monitor real-time supply
                      inflows, seasonal demand spikes, and variety-level price
                      volatility to time dispatches for peak rates.
                    </p>
                    <div className="card-features-list">
                      <span>✓ 36 States &amp; UTs Live Inflow Tracking</span>
                      <span>✓ Variety-wise Daily Volatility Alerts</span>
                    </div>
                    <button
                      type="button"
                      className="card-action-btn primary"
                      onClick={() => setActiveTab("analytics")}
                    >
                      📊 Launch Market Surveillance →
                    </button>
                  </div>
                </div>

                {/* Card 02: Farming Precision */}
                <div className="solution-feature-card">
                  <div className="solution-card-img-wrap">
                    <img
                      src="/assets/tractor_hero.jpg"
                      alt="Farming Precision"
                    />
                    <span className="card-badge-pill">Pricing Precision</span>
                  </div>
                  <div className="solution-card-body">
                    <div className="solution-card-top">
                      <span className="card-step-num">02</span>
                      <h4>Farming Precision</h4>
                    </div>
                    <p>
                      Precision pricing and market timing intelligence. Analyze
                      daily modal rates, benchmark regional APMCs, and target the
                      highest-paying market destinations to optimize net revenue per
                      quintal for farmers.
                    </p>
                    <div className="card-features-list">
                      <span>✓ Top-Paying Regional Mandi Finder</span>
                      <span>✓ Modal Premium Benchmark Index</span>
                    </div>
                    <button
                      type="button"
                      className="card-action-btn secondary"
                      onClick={scrollToSearch}
                    >
                      🔍 Search Live Mandi Rates →
                    </button>
                  </div>
                </div>

                {/* Card 03: Automated Arbitrage */}
                <div className="solution-feature-card">
                  <div className="solution-card-img-wrap">
                    <img
                      src="/assets/terrace_card.jpg"
                      alt="Automated Arbitrage"
                    />
                    <span className="card-badge-pill">Arbitrage Engine</span>
                  </div>
                  <div className="solution-card-body">
                    <div className="solution-card-top">
                      <span className="card-step-num">03</span>
                      <h4>Automated Farming</h4>
                    </div>
                    <p>
                      Automated market arbitrage and commercial decision engines.
                      Algorithmically scans hundreds of regional mandis to identify
                      profitable price differentials and recommended selling
                      routes to bypass intermediary margins.
                    </p>
                    <div className="card-features-list">
                      <span>✓ Dynamic Inter-Mandi Spread Scoring</span>
                      <span>✓ Direct-to-APMC Route Recommendation</span>
                    </div>
                    <a
                      href="#market-pulse"
                      className="card-action-link"
                    >
                      ⚡ Calculate Profit Arbitrage ↓
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 2: MARKETING PROMO BANNER (FIGMA DESIGN) ================= */}
          <section className="figma-promo-banner-section">
            <div className="promo-banner-container">
              <div className="promo-banner-card">
                {/* Kept plantation_banner.jpg as requested */}
                <img
                  src="/assets/plantation_banner.jpg"
                  alt="Agricultural Marketing Network"
                  className="promo-bg-img"
                />
                <div className="promo-card-overlay"></div>
                <div className="promo-card-content">
                  <span className="promo-tag">
                    AGRICULTURAL MARKETING NETWORK
                  </span>
                  <h2>
                    Collaborate And Lead In<br />
                    Agricultural Marketing<br />
                    And Price Discovery
                  </h2>
                  <p>
                    Connect with over 120,000 agricultural marketing
                    professionals, commodity traders, and commercial growers
                    leveraging real-time market surveillance to eliminate
                    intermediary margins and optimize trade execution.
                  </p>
                  <div className="promo-actions">
                    <button
                      type="button"
                      className="promo-btn-primary"
                      onClick={() => setActiveTab("analytics")}
                    >
                      📊 Explore Market Analytics →
                    </button>
                    <button
                      type="button"
                      className="promo-btn-secondary"
                      onClick={scrollToSearch}
                    >
                      Search Mandi Prices
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 3 (NEW): PAN-INDIA COMMODITY PULSE & FARMER PROFIT CALCULATOR ================= */}
          <section className="figma-section market-pulse-section" id="market-pulse">
            <div className="section-container">
              <div className="section-centered-header">
                <span className="figma-pill-label">
                  COMMODITY PULSE &amp; FARMER ECONOMICS
                </span>
                <h2>Pan-India Commodity Market Pulse &amp; Arbitrage Calculator</h2>
                <p>
                  Track daily benchmark rates across India's premier agricultural
                  trading hubs and simulate your net profit gain by routing produce
                  to the highest-paying APMC mandis.
                </p>
              </div>

              {/* INTERACTIVE ARBITRAGE SIMULATOR */}
              <div className="arbitrage-calculator-card">
                <div className="calc-header-row">
                  <span className="calc-badge">⚡ INTERACTIVE PROFIT SIMULATOR</span>
                  <h3>Calculate Your Mandi Arbitrage Realization</h3>
                  <p>
                    Simulate how much additional revenue you can capture per harvest
                    consignment by routing directly to top-paying regional APMC mandis
                    instead of settling for village-level intermediary prices.
                  </p>
                </div>

                <div className="calc-body-grid">
                  {/* Left Column: Interactive Controls */}
                  <div className="calc-inputs-col">
                    <div className="calc-field-group">
                      <label>Select Commodity / Crop:</label>
                      <div className="calc-commodity-chips">
                        {pulseData.map((crop) => (
                          <button
                            key={crop.id}
                            type="button"
                            className={`crop-chip ${calcCrop === crop.id ? "active" : ""}`}
                            onClick={() => setCalcCrop(crop.id)}
                          >
                            <span>{crop.icon}</span>
                            <span>{crop.name.split(" ")[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="calc-field-group">
                      <div className="slider-label-row">
                        <label>Consignment Volume (Quintals):</label>
                        <span className="slider-val-badge">
                          {calcVolume} Quintals ({calcVolume * 100} kg)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="5"
                        value={calcVolume}
                        onChange={(e) => setCalcVolume(Number(e.target.value))}
                        className="calc-range-slider"
                      />
                      <div className="volume-presets-row">
                        {[25, 50, 100, 200, 500].map((v) => (
                          <button
                            key={v}
                            type="button"
                            className={`preset-btn ${calcVolume === v ? "active" : ""}`}
                            onClick={() => setCalcVolume(v)}
                          >
                            {v} Qtl
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Realization Summary */}
                  <div className="calc-results-col">
                    <div className="results-summary-card">
                      <div className="calc-benchmark-tag">
                        📍 Benchmark Hub: <strong>{activeCalcCrop.mandi}</strong> ({activeCalcCrop.state})
                      </div>

                      <div className="calc-comparison-row">
                        <div className="comp-item">
                          <span className="comp-label">Local Village Rate</span>
                          <span className="comp-rate">₹{activeCalcCrop.localRate.toLocaleString("en-IN")}/Qtl</span>
                          <span className="comp-total">Est: ₹{calcLocalTotal.toLocaleString("en-IN")}</span>
                        </div>

                        <div className="comp-arrow">➔</div>

                        <div className="comp-item">
                          <span className="comp-label">Top APMC Destination</span>
                          <span className="comp-rate">₹{activeCalcCrop.topRate.toLocaleString("en-IN")}/Qtl</span>
                          <span className="comp-total highlight">Est: ₹{calcTopTotal.toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      {/* Net Arbitrage Gain Box */}
                      <div className="arbitrage-gain-box">
                        <div className="gain-text-wrap">
                          <span className="gain-label">NET FARMER GAIN WITH MANDI-MITRA</span>
                          <span className="gain-amount">+₹{calcGain.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="gain-percent-badge">+{calcGainPercent}% More Income</div>
                      </div>

                      <p className="gain-explanation">
                        By bypassing local intermediaries and dispatching to <strong>{activeCalcCrop.mandi}</strong>,
                        you capture an extra <strong>₹{(activeCalcCrop.topRate - activeCalcCrop.localRate).toLocaleString("en-IN")}</strong> per quintal on {activeCalcCrop.name}.
                      </p>

                      <div className="calc-actions">
                        <button
                          type="button"
                          className="calc-search-btn"
                          onClick={() => {
                            setState(activeCalcCrop.state);
                            const cropName = activeCalcCrop.name.split(" ")[0];
                            setCommodity(cropName);
                            fetchMandiData(activeCalcCrop.state, cropName, "", true);
                          }}
                        >
                          🔍 Search Live {activeCalcCrop.name.split(" ")[0]} Rates
                        </button>
                        <button
                          type="button"
                          className="calc-analytics-btn"
                          onClick={() => setActiveTab("analytics")}
                        >
                          📊 View Commodity Analytics
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* COMMODITY MARKET PULSE GRID */}
              <div className="pulse-grid-header">
                <h3>📈 Today's Commodity Market Pulse</h3>
                <p>Real-time modal rates and price momentum from major agricultural trade hubs across India (14/09/2026)</p>
              </div>

              <div className="commodity-pulse-grid">
                {pulseData.map((crop) => (
                  <div key={crop.id} className="pulse-card">
                    <div className="pulse-card-top">
                      <div className="crop-title-group">
                        <span className="crop-icon">{crop.icon}</span>
                        <div>
                          <h4>{crop.name}</h4>
                          <span className="crop-variety">{crop.variety}</span>
                        </div>
                      </div>
                      <span className={`trend-tag ${crop.trend}`}>
                        {crop.change24h}
                      </span>
                    </div>

                    <div className="pulse-card-mid">
                      <div className="pulse-stat">
                        <span className="stat-name">Top Mandi</span>
                        <span className="stat-val">{crop.mandi}</span>
                      </div>
                      <div className="pulse-stat">
                        <span className="stat-name">Modal Price</span>
                        <span className="stat-val price">
                          ₹{crop.topRate.toLocaleString("en-IN")}
                          <small>/Qtl</small>
                        </span>
                      </div>
                    </div>

                    <div className="pulse-card-foot">
                      <span className="spread-text">
                        Arbitrage Spread: <strong>+₹{(crop.topRate - crop.localRate).toLocaleString("en-IN")}/Qtl</strong>
                      </span>
                      <button
                        type="button"
                        className="pulse-action-btn"
                        onClick={() => {
                          setState(crop.state);
                          const cropName = crop.name.split(" ")[0];
                          setCommodity(cropName);
                          fetchMandiData(crop.state, cropName, "", true);
                        }}
                      >
                        Check Rates →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ================= SECTION 4: CTA BANNER (FIGMA DESIGN - MEADOW CTA KEPT) ================= */}
          <section className="figma-cta-banner-section">
            <div className="cta-banner-container">
              <div className="cta-banner-card">
                {/* Kept meadow_cta.jpg as requested */}
                <img
                  src="/assets/meadow_cta.jpg"
                  alt="Agricultural Marketing Community"
                  className="cta-bg-img"
                />
                <div className="cta-overlay"></div>
                <div className="cta-content">
                  <h2>
                    Join the Agricultural<br />Marketing Revolution Today!
                  </h2>
                  <p>
                    Empower your agricultural trade decisions with transparent
                    market surveillance, automated arbitrage analytics, and
                    verified AGMARK pricing.
                  </p>
                  <div className="cta-input-bar">
                    <input
                      type="text"
                      placeholder="Enter a state or commodity to start analyzing..."
                      readOnly
                      onClick={scrollToSearch}
                    />
                    <button
                      type="button"
                      onClick={scrollToSearch}
                      className="cta-submit-btn"
                    >
                      Get Started
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 5: ABOUT (COMMERCIAL AGRI-MARKETING) ================= */}
          <section className="figma-section about-section" id="about">
            <div className="section-container">
              <div className="about-grid">
                <div className="about-text-col">
                  <span className="figma-pill-label">
                    ABOUT MANDI-MITRA
                  </span>
                  <h2>
                    Eliminating Market Asymmetry in Indian Agricultural Marketing
                  </h2>
                  <p>
                    Mandi-Mitra is a dedicated agricultural marketing analytics
                    platform connecting commercial growers, commodity traders,
                    and agricultural enterprises with official AGMARK daily market
                    data.
                  </p>
                  <p>
                    By transforming raw mandi arrival returns into actionable
                    price intelligence, historical trend analysis, and automated
                    arbitrage metrics, we empower market participants to negotiate
                    from a position of data-backed strength.
                  </p>

                  <div className="about-feature-bullets">
                    <div className="bullet-item">
                      <span className="bullet-check">✓</span>
                      <div>
                        <strong>Commercial Price Precision:</strong> Real-time
                        variety-level price discovery across regional APMCs.
                      </div>
                    </div>
                    <div className="bullet-item">
                      <span className="bullet-check">✓</span>
                      <div>
                        <strong>Pan-India Market Surveillance:</strong> Complete
                        coverage across 36 States & UTs with live arrival sync.
                      </div>
                    </div>
                    <div className="bullet-item">
                      <span className="bullet-check">✓</span>
                      <div>
                        <strong>Automated Market Arbitrage:</strong> Algorithmic
                        scoring of highest-return selling destinations.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="about-card-col">
                  <div className="about-stat-card">
                    <div className="about-stat-icon">📊</div>
                    <h3>Built for Agricultural Marketing</h3>
                    <p>
                      High-performance analytical engine designed to provide
                      transparent price discovery and market surveillance across
                      India's vast APMC network.
                    </p>
                    <div className="about-tags">
                      <span>Market Surveillance</span>
                      <span>Price Arbitrage</span>
                      <span>Farming Precision</span>
                      <span>Automated Commerce</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= FOOTER (FIGMA DESIGN) ================= */}
          <footer className="figma-footer" id="contact">
            <div className="footer-container">
              <div className="footer-top-row">
                <div className="footer-brand-col">
                  <div
                    className="figma-logo-footer"
                    onClick={handleLogoClick}
                    style={{ cursor: "pointer" }}
                    title="Mandi-Mitra Home (Reload)"
                  >
                    <span className="logo-leaf">🌱</span>
                    <span>
                      Mandi<strong>Mitra</strong>
                    </span>
                  </div>
                  <p>
                    Official AGMARK agricultural market intelligence and price
                    discovery platform for India.
                  </p>
                  <div className="social-links-row">
                    <a
                      href="https://www.linkedin.com/in/aaryan-k-ba3985246/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn"
                      title="LinkedIn"
                    >
                      In
                    </a>
                    <a
                      href="https://github.com/9aaryanCyberH"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn"
                      title="GitHub"
                    >
                      Gh
                    </a>
                    <a
                      href="https://drive.google.com/file/d/1BrrYb8FwXAVyU6mplO27FitPqQi9Lv7F/view?usp=sharing"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-btn"
                      title="Resume"
                    >
                      Cv
                    </a>
                  </div>
                </div>

                <div className="footer-links-col">
                  <h4>MARKETING PLATFORM</h4>
                  <a href="#home" onClick={() => setActiveTab("home")}>
                    Home
                  </a>
                  <a
                    href="#search-card-container"
                    onClick={scrollToSearch}
                  >
                    Price Discovery Search
                  </a>
                  <a
                    href="#solutions"
                    onClick={() => setActiveTab("home")}
                  >
                    Marketing Solutions
                  </a>
                  <button
                    type="button"
                    className="footer-link-btn"
                    onClick={() => setActiveTab("analytics")}
                  >
                    Market Analytics Dashboard
                  </button>
                </div>

                <div className="footer-links-col">
                  <h4>CAPABILITIES</h4>
                  <a href="#solutions">Farming Precision</a>
                  <a href="#solutions">Crop Surveillance</a>
                  <a href="#market-pulse">Commodity Pulse &amp; Arbitrage Calculator</a>
                  <a
                    href="https://data.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Official AGMARK Data
                  </a>
                </div>

                <div className="footer-links-col contact-col">
                  <h4>GET IN TOUCH!</h4>
                  <p className="contact-sub">
                    Inquiries regarding agricultural market data, analytics API, or
                    partnerships:
                  </p>
                  <div className="contact-info-list">
                    <p>
                      <strong>Developer:</strong> Aaryan Kumar
                    </p>
                    <p>
                      <strong>Platform:</strong> Mandi-Mitra
                    </p>
                    <p>
                      <strong>Specialization:</strong> Agri-Marketing & Data
                      Analytics
                    </p>
                  </div>
                </div>
              </div>

              <div className="footer-bottom-row">
                <p>
                  © 2026 Mandi-Mitra · Built & Developed by Aaryan Kumar. Educational & Academic Project.
                </p>
                <div className="footer-legal-links">
                  <span>Educational Use License</span>
                  <span>•</span>
                  <span>Terms of Service</span>
                  <span>•</span>
                  <span>AGMARK Open Data Disclaimer</span>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;