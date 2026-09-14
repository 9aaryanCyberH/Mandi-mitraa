import { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default function AnalyticsDashboard({
  apiBaseUrl,
  states,
  defaultState,
  defaultCommodity,
  defaultMandi,
  onBack
}) {
  // Navigation mode: "crop" (Crop Trends & Profitability) or "apmc" (APMC Mandi Analytics)
  const [activeMode, setActiveMode] = useState("crop");

  // Selection states
  const [selectedState, setSelectedState] = useState(defaultState || "Punjab");
  const [selectedCommodity, setSelectedCommodity] = useState(defaultCommodity || "Wheat");
  const [selectedMandi, setSelectedMandi] = useState(defaultMandi || "");

  // Options lists
  const [commodities, setCommodities] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [loadingCommodities, setLoadingCommodities] = useState(false);
  const [loadingMandis, setLoadingMandis] = useState(false);

  // Time & Duration controls
  // options: "7", "15", "30", "90", "180", "365", "all", "custom"
  const [durationPreset, setDurationPreset] = useState("30");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Fetched data states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [analyticsData, setAnalyticsData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [compareData, setCompareData] = useState([]);

  // APMC-specific fetched data
  const [apmcAnalytics, setApmcAnalytics] = useState(null);
  const [apmcHistory, setApmcHistory] = useState([]);
  const [apmcCommodities, setApmcCommodities] = useState([]);
  const [stateBenchmark, setStateBenchmark] = useState(null);

  // Chart canvas refs & instances
  const trendChartRef = useRef(null);
  const trendChartInstance = useRef(null);

  const profitChartRef = useRef(null);
  const profitChartInstance = useRef(null);

  const apmcTrajectoryRef = useRef(null);
  const apmcTrajectoryInstance = useRef(null);

  const apmcBarRef = useRef(null);
  const apmcBarInstance = useRef(null);

  // =====================================================
  // 1. LOAD COMMODITIES FOR SELECTED STATE
  // =====================================================
  useEffect(() => {
    if (!selectedState) return;

    const loadCommodities = async () => {
      try {
        setLoadingCommodities(true);
        const res = await fetch(
          `${apiBaseUrl}/commodities?state=${encodeURIComponent(selectedState)}`
        );
        const json = await res.json();
        if (res.ok && json.data) {
          setCommodities(json.data);
          if (!json.data.includes(selectedCommodity) && json.data.length > 0) {
            setSelectedCommodity(json.data[0]);
          }
        }
      } catch (err) {
        console.error("Error loading commodities:", err);
      } finally {
        setLoadingCommodities(false);
      }
    };

    loadCommodities();
  }, [selectedState, apiBaseUrl]);

  // =====================================================
  // 2. LOAD MANDIS (APMCs) FOR SELECTED STATE
  // =====================================================
  useEffect(() => {
    if (!selectedState) return;

    const loadMandis = async () => {
      try {
        setLoadingMandis(true);
        const res = await fetch(
          `${apiBaseUrl}/api/v1/mandis?state=${encodeURIComponent(selectedState)}&limit=200`
        );
        const json = await res.json();
        if (res.ok && json.data) {
          const list = json.data.map((m) => m.name);
          setMandis(list);
          if (list.length > 0 && (!selectedMandi || !list.includes(selectedMandi))) {
            setSelectedMandi(list[0]);
          }
        }
      } catch (err) {
        console.error("Error loading mandis:", err);
      } finally {
        setLoadingMandis(false);
      }
    };

    loadMandis();
  }, [selectedState, apiBaseUrl]);

  // Build query string helper for duration & date range
  const buildDateParams = () => {
    if (durationPreset === "custom") {
      const parts = [];
      if (customFrom) parts.push(`fromDate=${encodeURIComponent(customFrom)}`);
      if (customTo) parts.push(`toDate=${encodeURIComponent(customTo)}`);
      return parts.length > 0 ? `&${parts.join("&")}` : "";
    }
    if (durationPreset === "all") {
      return "";
    }
    return `&days=${durationPreset}`;
  };

  // =====================================================
  // 3. FETCH CROP ANALYTICS DATA
  // =====================================================
  useEffect(() => {
    if (activeMode !== "crop" || !selectedState || !selectedCommodity) return;

    const fetchCropData = async () => {
      setLoading(true);
      setError("");

      const dateParams = buildDateParams();

      try {
        const [analyticsRes, historyRes, compareRes] = await Promise.all([
          fetch(
            `${apiBaseUrl}/api/v1/prices/analytics?commodity=${encodeURIComponent(
              selectedCommodity
            )}&state=${encodeURIComponent(selectedState)}${dateParams}`
          ),
          fetch(
            `${apiBaseUrl}/api/v1/prices/history?commodity=${encodeURIComponent(
              selectedCommodity
            )}&state=${encodeURIComponent(selectedState)}${dateParams}`
          ),
          fetch(
            `${apiBaseUrl}/api/v1/prices/compare?commodity=${encodeURIComponent(
              selectedCommodity
            )}&state=${encodeURIComponent(selectedState)}`
          )
        ]);

        const [analyticsJson, historyJson, compareJson] = await Promise.all([
          analyticsRes.json(),
          historyRes.json(),
          compareRes.json()
        ]);

        if (analyticsJson.success) {
          setAnalyticsData(analyticsJson.data);
        }
        if (historyJson.success) {
          setHistoryData(historyJson.data || []);
        }
        if (compareJson.success && compareJson.data) {
          setCompareData(compareJson.data.markets || []);
        }
      } catch (err) {
        console.error("Error fetching crop analytics:", err);
        setError("Unable to load crop analytics for this selection.");
      } finally {
        setLoading(false);
      }
    };

    fetchCropData();
  }, [
    activeMode,
    selectedState,
    selectedCommodity,
    durationPreset,
    customFrom,
    customTo,
    apiBaseUrl
  ]);

  // =====================================================
  // 4. FETCH APMC ANALYTICS DATA
  // =====================================================
  useEffect(() => {
    if (activeMode !== "apmc" || !selectedState || !selectedMandi) return;

    const fetchApmcData = async () => {
      setLoading(true);
      setError("");

      const dateParams = buildDateParams();
      const cropFilter = selectedCommodity
        ? `&commodity=${encodeURIComponent(selectedCommodity)}`
        : "";

      try {
        const [apmcAnalyticsRes, apmcHistoryRes, benchmarkRes, apmcPricesRes] =
          await Promise.all([
            fetch(
              `${apiBaseUrl}/api/v1/prices/analytics?mandi=${encodeURIComponent(
                selectedMandi
              )}&state=${encodeURIComponent(selectedState)}${cropFilter}${dateParams}`
            ),
            fetch(
              `${apiBaseUrl}/api/v1/prices/history?mandi=${encodeURIComponent(
                selectedMandi
              )}&state=${encodeURIComponent(selectedState)}${cropFilter}${dateParams}`
            ),
            fetch(
              `${apiBaseUrl}/api/v1/prices/analytics?state=${encodeURIComponent(
                selectedState
              )}${cropFilter}${dateParams}`
            ),
            fetch(
              `${apiBaseUrl}/api/v1/prices?mandi=${encodeURIComponent(
                selectedMandi
              )}&limit=100`
            )
          ]);

        const [apmcAnJson, apmcHistJson, benchJson, pricesJson] =
          await Promise.all([
            apmcAnalyticsRes.json(),
            apmcHistoryRes.json(),
            benchmarkRes.json(),
            apmcPricesRes.json()
          ]);

        if (apmcAnJson.success) {
          setApmcAnalytics(apmcAnJson.data);
        }
        if (apmcHistJson.success) {
          setApmcHistory(apmcHistJson.data || []);
        }
        if (benchJson.success) {
          setStateBenchmark(benchJson.data);
        }
        if (pricesJson.success) {
          setApmcCommodities(pricesJson.data || []);
        }
      } catch (err) {
        console.error("Error fetching APMC analytics:", err);
        setError("Unable to load APMC performance analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchApmcData();
  }, [
    activeMode,
    selectedState,
    selectedMandi,
    selectedCommodity,
    durationPreset,
    customFrom,
    customTo,
    apiBaseUrl
  ]);

  // =====================================================
  // CHART 1: CROP PRICE TREND LINE CHART
  // =====================================================
  useEffect(() => {
    if (activeMode !== "crop" || !trendChartRef.current || historyData.length === 0)
      return;

    if (trendChartInstance.current) {
      trendChartInstance.current.destroy();
    }

    const ctx = trendChartRef.current.getContext("2d");
    const labels = historyData.map((d) => d.date);
    const modalPrices = historyData.map((d) => d.modalPrice);
    const minPrices = historyData.map((d) => d.minPrice);
    const maxPrices = historyData.map((d) => d.maxPrice);

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(22, 163, 74, 0.25)");
    gradient.addColorStop(1, "rgba(22, 163, 74, 0.0)");

    trendChartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Modal Price (₹/Qtl)",
            data: modalPrices,
            borderColor: "#16a34a",
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#16a34a",
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: "Min Price (₹/Qtl)",
            data: minPrices,
            borderColor: "#0284c7",
            borderDash: [5, 5],
            borderWidth: 2,
            fill: false,
            tension: 0.35,
            pointRadius: 3
          },
          {
            label: "Max Price (₹/Qtl)",
            data: maxPrices,
            borderColor: "#dc2626",
            borderDash: [5, 5],
            borderWidth: 2,
            fill: false,
            tension: 0.35,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            position: "top",
            labels: {
              usePointStyle: true,
              font: { family: "Inter, sans-serif", size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) =>
                ` ${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: "#f1f5f9" },
            ticks: { callback: (val) => `₹${val}` }
          }
        }
      }
    });

    return () => {
      if (trendChartInstance.current) trendChartInstance.current.destroy();
    };
  }, [activeMode, historyData]);

  // =====================================================
  // CHART 2: CROP PROFITABILITY RANKING BAR CHART
  // =====================================================
  useEffect(() => {
    if (activeMode !== "crop" || !profitChartRef.current || compareData.length === 0)
      return;

    if (profitChartInstance.current) {
      profitChartInstance.current.destroy();
    }

    const ctx = profitChartRef.current.getContext("2d");
    const sorted = [...compareData]
      .sort((a, b) => b.modalPrice - a.modalPrice)
      .slice(0, 10);

    const labels = sorted.map((m) => m.mandi);
    const dataPoints = sorted.map((m) => m.modalPrice);
    const avg = analyticsData?.averageModalPrice || 0;

    // Color bars: vibrant green if above state average, muted/amber if below
    const bgColors = sorted.map((m) =>
      m.modalPrice >= avg ? "#16a34a" : "#f59e0b"
    );

    profitChartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Modal Price (₹/Qtl)",
            data: dataPoints,
            backgroundColor: bgColors,
            borderRadius: 6,
            maxBarThickness: 42
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const diff = avg ? context.parsed.y - avg : 0;
                const sign = diff >= 0 ? "+" : "";
                return ` Price: ₹${context.parsed.y.toLocaleString()} (${sign}₹${diff.toLocaleString()} vs avg)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: "Inter, sans-serif", size: 11 },
              maxRotation: 40,
              minRotation: 20
            }
          },
          y: {
            grid: { color: "#f1f5f9" },
            ticks: { callback: (val) => `₹${val}` }
          }
        }
      }
    });

    return () => {
      if (profitChartInstance.current) profitChartInstance.current.destroy();
    };
  }, [activeMode, compareData, analyticsData]);

  // =====================================================
  // CHART 3: APMC HISTORICAL PRICE TRAJECTORY VS BENCHMARK
  // =====================================================
  useEffect(() => {
    if (activeMode !== "apmc" || !apmcTrajectoryRef.current || apmcHistory.length === 0)
      return;

    if (apmcTrajectoryInstance.current) {
      apmcTrajectoryInstance.current.destroy();
    }

    const ctx = apmcTrajectoryRef.current.getContext("2d");
    const labels = apmcHistory.map((d) => d.date);
    const modalPrices = apmcHistory.map((d) => d.modalPrice);
    const avgBench = stateBenchmark?.averageModalPrice || 0;
    const benchmarkLine = labels.map(() => avgBench);

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(37, 99, 235, 0.25)");
    gradient.addColorStop(1, "rgba(37, 99, 235, 0.0)");

    apmcTrajectoryInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${selectedMandi} Modal Price`,
            data: modalPrices,
            borderColor: "#2563eb",
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#2563eb",
            pointRadius: 4
          },
          ...(avgBench > 0
            ? [
                {
                  label: `State Avg Benchmark (₹${avgBench.toLocaleString()})`,
                  data: benchmarkLine,
                  borderColor: "#f59e0b",
                  borderDash: [6, 6],
                  borderWidth: 2,
                  fill: false,
                  pointRadius: 0
                }
              ]
            : [])
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "top" },
          tooltip: {
            callbacks: {
              label: (ctxItem) =>
                ` ${ctxItem.dataset.label}: ₹${ctxItem.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: "#f1f5f9" },
            ticks: { callback: (val) => `₹${val}` }
          }
        }
      }
    });

    return () => {
      if (apmcTrajectoryInstance.current) apmcTrajectoryInstance.current.destroy();
    };
  }, [activeMode, apmcHistory, stateBenchmark, selectedMandi]);

  // =====================================================
  // CHART 4: APMC COMMODITY PRICE SPREAD
  // =====================================================
  useEffect(() => {
    if (activeMode !== "apmc" || !apmcBarRef.current || apmcCommodities.length === 0)
      return;

    if (apmcBarInstance.current) {
      apmcBarInstance.current.destroy();
    }

    const ctx = apmcBarRef.current.getContext("2d");
    const uniqueMap = new Map();
    for (const item of apmcCommodities) {
      const cName = item.commodity?.name || item.commodity || "General";
      if (!uniqueMap.has(cName)) {
        uniqueMap.set(cName, item.modalPrice);
      }
    }

    const labels = Array.from(uniqueMap.keys()).slice(0, 8);
    const dataPoints = Array.from(uniqueMap.values()).slice(0, 8);

    apmcBarInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Modal Price (₹/Qtl)",
            data: dataPoints,
            backgroundColor: "#3b82f6",
            borderRadius: 6,
            maxBarThickness: 45
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` Price: ₹${context.parsed.y.toLocaleString()} / Qtl`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { family: "Inter, sans-serif", size: 11 } }
          },
          y: {
            grid: { color: "#f1f5f9" },
            ticks: { callback: (val) => `₹${val}` }
          }
        }
      }
    });

    return () => {
      if (apmcBarInstance.current) apmcBarInstance.current.destroy();
    };
  }, [activeMode, apmcCommodities]);

  // Calculations for Crop Mode
  const cropSpread =
    analyticsData?.highestPrice && analyticsData?.lowestPrice
      ? analyticsData.highestPrice.price - analyticsData.lowestPrice.price
      : 0;

  // Calculations for APMC Mode
  const apmcAvgModal = apmcAnalytics?.averageModalPrice || 0;
  const stateAvgModal = stateBenchmark?.averageModalPrice || 0;
  const apmcMarginVsState = stateAvgModal > 0 ? apmcAvgModal - stateAvgModal : 0;
  const apmcMarginPct =
    stateAvgModal > 0 ? ((apmcMarginVsState / stateAvgModal) * 100).toFixed(1) : 0;

  return (
    <div className="analytics-page">
      {/* ================= TOP HEADER ================= */}
      <div className="analytics-header">
        <div className="analytics-title-area">
          <button className="back-button" onClick={onBack}>
            ← Back to Mandi Search
          </button>
          <h1>
            Market Analytics & <span>Price Intelligence</span>
          </h1>
          <p>
            In-depth agricultural price trends, APMC mandi performance, and profitability analysis across Indian markets.
          </p>
        </div>

        {/* ================= DUAL MODE SWITCHER ================= */}
        <div className="mode-switcher-container">
          <button
            type="button"
            className={`mode-tab-btn ${activeMode === "crop" ? "active" : ""}`}
            onClick={() => setActiveMode("crop")}
          >
            🌾 Crop Trends & Profitability
          </button>
          <button
            type="button"
            className={`mode-tab-btn ${activeMode === "apmc" ? "active" : ""}`}
            onClick={() => setActiveMode("apmc")}
          >
            🏪 APMC Mandi Performance
          </button>
        </div>

        {/* ================= COMPREHENSIVE FILTER CONTROLS ================= */}
        <div className="analytics-controls">
          {/* STATE */}
          <div className="control-field">
            <label>STATE</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* APMC MANDI SELECTOR (prominent in APMC mode) */}
          {activeMode === "apmc" && (
            <div className="control-field">
              <label>APMC MANDI</label>
              <select
                value={selectedMandi}
                onChange={(e) => setSelectedMandi(e.target.value)}
                disabled={loadingMandis || mandis.length === 0}
              >
                {mandis.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* COMMODITY */}
          <div className="control-field">
            <label>
              {activeMode === "apmc" ? "COMMODITY (OPTIONAL)" : "COMMODITY"}
            </label>
            <select
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              disabled={loadingCommodities || commodities.length === 0}
            >
              {activeMode === "apmc" && <option value="">All Commodities in APMC</option>}
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* DURATION / TIMEFRAME PRESETS */}
          <div className="control-field timeframe-control">
            <label>DURATION & TIMEFRAME</label>
            <div className="timeframe-pills">
              {[
                { label: "7D", val: "7" },
                { label: "15D", val: "15" },
                { label: "30D", val: "30" },
                { label: "90D", val: "90" },
                { label: "6M", val: "180" },
                { label: "1Y", val: "365" },
                { label: "All Time", val: "all" },
                { label: "📅 Custom", val: "custom" }
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  className={`pill-btn ${durationPreset === pill.val ? "active" : ""}`}
                  onClick={() => setDurationPreset(pill.val)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CUSTOM DATE RANGE PICKERS (if Custom is chosen) */}
        {durationPreset === "custom" && (
          <div className="custom-date-bar">
            <div className="custom-date-field">
              <label>FROM DATE</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="custom-date-field">
              <label>TO DATE</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            <div className="custom-date-info">
              <span>Filter prices between specified dates</span>
            </div>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* =========================================================
          MODE 1: CROP ANALYTICS & PROFITABILITY VIEW
          ========================================================= */}
      {activeMode === "crop" && (
        <>
          {/* Profitability & Metric Scorecards */}
          <div className="analytics-kpi-grid">
            {/* Best Market to Sell (Max Profit) */}
            <div className="kpi-card kpi-best">
              <div className="kpi-icon">🏆</div>
              <div className="kpi-body">
                <small>BEST APMC TO SELL (MAX PROFIT)</small>
                <h3>
                  {analyticsData?.bestMarket
                    ? `₹${analyticsData.bestMarket.price.toLocaleString()}`
                    : "N/A"}
                </h3>
                <span className="kpi-highlight">
                  {analyticsData?.bestMarket ? (
                    <>
                      <strong>{analyticsData.bestMarket.mandi}</strong> (
                      {analyticsData.bestMarket.district})
                      {analyticsData.bestMarket.profitMargin > 0 && (
                        <span className="profit-delta-tag">
                          +{analyticsData.bestMarket.profitMarginPct}% vs Avg
                        </span>
                      )}
                    </>
                  ) : (
                    "No market records"
                  )}
                </span>
              </div>
            </div>

            {/* State Average Modal Price */}
            <div className="kpi-card kpi-average">
              <div className="kpi-icon">📊</div>
              <div className="kpi-body">
                <small>STATE AVERAGE MODAL</small>
                <h3>
                  {analyticsData?.averageModalPrice
                    ? `₹${analyticsData.averageModalPrice.toLocaleString()}`
                    : "N/A"}
                </h3>
                <span>Benchmark price across regional APMCs</span>
              </div>
            </div>

            {/* Lowest Market (Best for Buyers) */}
            <div className="kpi-card kpi-lowest">
              <div className="kpi-icon">📉</div>
              <div className="kpi-body">
                <small>LOWEST MARKET PRICE</small>
                <h3>
                  {analyticsData?.lowestPrice
                    ? `₹${analyticsData.lowestPrice.price.toLocaleString()}`
                    : "N/A"}
                </h3>
                <span>
                  {analyticsData?.lowestPrice
                    ? `${analyticsData.lowestPrice.mandi} (${analyticsData.lowestPrice.district})`
                    : "No data available"}
                </span>
              </div>
            </div>

            {/* Price Spread */}
            <div className="kpi-card kpi-spread">
              <div className="kpi-icon">⚖️</div>
              <div className="kpi-body">
                <small>ARBITRAGE SPREAD (PEAK - MIN)</small>
                <h3>{cropSpread > 0 ? `₹${cropSpread.toLocaleString()}` : "₹0"}</h3>
                <span>
                  {analyticsData?.trend ? (
                    <span
                      className={`trend-indicator ${
                        analyticsData.trend.direction === "RISING"
                          ? "positive"
                          : analyticsData.trend.direction === "FALLING"
                          ? "negative"
                          : "neutral"
                      }`}
                    >
                      {analyticsData.trend.direction === "RISING" ? "↗ Rising" : analyticsData.trend.direction === "FALLING" ? "↘ Falling" : "→ Stable"} ({analyticsData.trend.percentChange > 0 ? `+${analyticsData.trend.percentChange}%` : `${analyticsData.trend.percentChange}%`})
                    </span>
                  ) : (
                    "Regional price variance"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Trend Curve */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Historical Price Trend Curve</h3>
                  <p>
                    Modal, Min, and Max price timeline for {selectedCommodity} in{" "}
                    {selectedState}
                  </p>
                </div>
                <span className="chart-badge">
                  {durationPreset === "custom"
                    ? "Custom Date Range"
                    : durationPreset === "all"
                    ? "All Historical Data"
                    : `${durationPreset} Days Window`}
                </span>
              </div>
              <div className="chart-container">
                {historyData.length > 0 ? (
                  <canvas ref={trendChartRef} />
                ) : (
                  <div className="no-chart-data">
                    {loading
                      ? "Loading price trend curve..."
                      : "No historical records found for this period."}
                  </div>
                )}
              </div>
            </div>

            {/* APMC Profitability Ranking */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>APMC Mandi Profitability Comparison</h3>
                  <p>
                    Modal payout across APMCs (Green = Beats State Average, Orange = Below
                    Average)
                  </p>
                </div>
                <span className="chart-badge">{compareData.length} Mandis</span>
              </div>
              <div className="chart-container">
                {compareData.length > 0 ? (
                  <canvas ref={profitChartRef} />
                ) : (
                  <div className="no-chart-data">
                    {loading
                      ? "Loading comparison data..."
                      : "No comparison records available."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Profitability Rankings Table */}
          {compareData.length > 0 && (
            <div className="table-container analytics-table">
              <div className="table-header">
                <div>
                  <h3>Mandi Profitability Rankings</h3>
                  <p className="table-subtitle">
                    Sorted by selling price to identify the most lucrative selling
                    destinations for farmers.
                  </p>
                </div>
                <span>
                  {selectedCommodity} in {selectedState}
                </span>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>RANK</th>
                      <th>MANDI / APMC</th>
                      <th>DISTRICT</th>
                      <th>MIN PRICE</th>
                      <th>MODAL PRICE</th>
                      <th>MAX PRICE</th>
                      <th>MARGIN VS AVG</th>
                      <th>PROFITABILITY GRADE</th>
                      <th>LATEST ARRIVAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareData.map((market, idx) => {
                      const avg = analyticsData?.averageModalPrice || 0;
                      const diff = avg ? market.modalPrice - avg : 0;
                      const diffPct =
                        avg > 0 ? ((diff / avg) * 100).toFixed(1) : 0;

                      return (
                        <tr
                          key={idx}
                          className={idx === 0 ? "highlight-top-row" : ""}
                        >
                          <td>
                            {idx === 0 ? (
                              <span className="rank-badge gold">🥇 #1 Top</span>
                            ) : idx === 1 ? (
                              <span className="rank-badge silver">🥈 #2</span>
                            ) : idx === 2 ? (
                              <span className="rank-badge bronze">🥉 #3</span>
                            ) : (
                              `#${idx + 1}`
                            )}
                          </td>
                          <td className="mandi-name">🏪 {market.mandi}</td>
                          <td>{market.district}</td>
                          <td>₹{market.minPrice?.toLocaleString()}</td>
                          <td className="modal-price">
                            ₹{market.modalPrice?.toLocaleString()}
                          </td>
                          <td>₹{market.maxPrice?.toLocaleString()}</td>
                          <td>
                            <span
                              className={`diff-tag ${
                                diff >= 0 ? "positive" : "negative"
                              }`}
                            >
                              {diff >= 0 ? `+₹${diff}` : `-₹${Math.abs(diff)}`} (
                              {diff >= 0 ? `+${diffPct}%` : `${diffPct}%`})
                            </span>
                          </td>
                          <td>
                            <span
                              className={`profit-badge ${
                                diff > 0
                                  ? diffPct >= 10
                                    ? "high-profit"
                                    : "above-avg"
                                  : "below-avg"
                              }`}
                            >
                              {diff > 0
                                ? diffPct >= 10
                                  ? "High Profit"
                                  : "Above Avg"
                                : "Below Avg"}
                            </span>
                          </td>
                          <td>{market.arrivalDate || "N/A"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================
          MODE 2: APMC MANDI PERFORMANCE VIEW
          ========================================================= */}
      {activeMode === "apmc" && (
        <>
          {/* APMC KPI Scorecards */}
          <div className="analytics-kpi-grid">
            {/* APMC Name & Status */}
            <div className="kpi-card kpi-average">
              <div className="kpi-icon">🏪</div>
              <div className="kpi-body">
                <small>SELECTED APMC MANDI</small>
                <h3>{selectedMandi || "N/A"}</h3>
                <span>
                  📍 {selectedState} · Active AGMARK Reporting Center
                </span>
              </div>
            </div>

            {/* APMC Modal Price */}
            <div className="kpi-card kpi-best">
              <div className="kpi-icon">💰</div>
              <div className="kpi-body">
                <small>APMC AVERAGE SELLING PRICE</small>
                <h3>
                  {apmcAvgModal > 0 ? `₹${apmcAvgModal.toLocaleString()}` : "N/A"}
                </h3>
                <span>
                  {selectedCommodity
                    ? `For ${selectedCommodity}`
                    : "Across recorded commodities"}
                </span>
              </div>
            </div>

            {/* APMC vs State Benchmark */}
            <div className="kpi-card kpi-highest">
              <div className="kpi-icon">⚖️</div>
              <div className="kpi-body">
                <small>VS STATE AVERAGE BENCHMARK</small>
                <h3>
                  {apmcMarginVsState >= 0
                    ? `+₹${apmcMarginVsState.toLocaleString()}`
                    : `-₹${Math.abs(apmcMarginVsState).toLocaleString()}`}
                </h3>
                <span
                  className={`diff-tag ${
                    apmcMarginVsState >= 0 ? "positive" : "negative"
                  }`}
                >
                  {apmcMarginVsState >= 0
                    ? `+${apmcMarginPct}% Premium over state avg`
                    : `${apmcMarginPct}% Discount to state avg`}
                </span>
              </div>
            </div>

            {/* Commodities Traded */}
            <div className="kpi-card kpi-spread">
              <div className="kpi-icon">📦</div>
              <div className="kpi-body">
                <small>TRADING ACTIVITY</small>
                <h3>{apmcCommodities.length} Records</h3>
                <span>Available commodities in this APMC</span>
              </div>
            </div>
          </div>

          {/* APMC Charts */}
          <div className="charts-grid">
            {/* APMC Price Trajectory vs Benchmark */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>APMC Price Trajectory vs State Benchmark</h3>
                  <p>
                    Tracking {selectedMandi} prices against state average
                    benchmark
                  </p>
                </div>
                <span className="chart-badge">
                  {durationPreset === "custom"
                    ? "Custom Date Range"
                    : durationPreset === "all"
                    ? "All Historical Data"
                    : `${durationPreset} Days Window`}
                </span>
              </div>
              <div className="chart-container">
                {apmcHistory.length > 0 ? (
                  <canvas ref={apmcTrajectoryRef} />
                ) : (
                  <div className="no-chart-data">
                    {loading
                      ? "Loading APMC historical trajectory..."
                      : "No historical trajectory data found for this APMC in selected duration."}
                  </div>
                )}
              </div>
            </div>

            {/* Commodity Breakdown in this Mandi */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Commodities Traded in {selectedMandi}</h3>
                  <p>Modal price snapshot across crops in this APMC</p>
                </div>
                <span className="chart-badge">Active Commodities</span>
              </div>
              <div className="chart-container">
                {apmcCommodities.length > 0 ? (
                  <canvas ref={apmcBarRef} />
                ) : (
                  <div className="no-chart-data">
                    {loading
                      ? "Loading commodity breakdown..."
                      : "No commodity breakdown available for this APMC."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* APMC Commodities Table */}
          {apmcCommodities.length > 0 && (
            <div className="table-container analytics-table">
              <div className="table-header">
                <div>
                  <h3>Commodities Traded at {selectedMandi}</h3>
                  <p className="table-subtitle">
                    Recorded prices and arrival dates for all commodities traded in
                    this market.
                  </p>
                </div>
                <span>{selectedState}</span>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>COMMODITY</th>
                      <th>VARIETY</th>
                      <th>MIN PRICE</th>
                      <th>MODAL PRICE</th>
                      <th>MAX PRICE</th>
                      <th>ARRIVAL DATE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apmcCommodities.map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td className="mandi-name">
                          🌾 {row.commodity?.name || row.commodity || "General"}
                        </td>
                        <td>{row.variety || "Other"}</td>
                        <td>₹{row.minPrice?.toLocaleString()}</td>
                        <td className="modal-price">
                          ₹{row.modalPrice?.toLocaleString()}
                        </td>
                        <td>₹{row.maxPrice?.toLocaleString()}</td>
                        <td>
                          {row.arrivalDate
                            ? new Date(row.arrivalDate).toLocaleDateString("en-IN")
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
