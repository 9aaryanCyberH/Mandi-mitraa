/**
 * Maps known state aliases to standardized Indian state names
 */
const STATE_CANONICAL_MAP = {
  keralam: "Kerala",
  "nct of delhi": "Delhi",
  "state of delhi": "Delhi",
  telengana: "Telangana",
  orissa: "Odisha",
  chhatisgarh: "Chhattisgarh",
  "pondicherry": "Puducherry",
  "andaman and nicobar islands": "Andaman and Nicobar",
  "jammu and kashmir": "Jammu and Kashmir"
};

/**
 * Capitalizes names properly (e.g. "PUNJAB" -> "Punjab", "bengal gram" -> "Bengal Gram")
 */
export function titleCase(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(?:^|\s|\/|\(|\-)[a-z]/g, (match) => match.toUpperCase());
}

/**
 * Cleans string input
 */
export function cleanString(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().replace(/\s+/g, " ");
  return str.length > 0 ? str : null;
}

/**
 * Normalizes state name to canonical form
 */
export function normalizeStateName(rawState) {
  const cleaned = cleanString(rawState);
  if (!cleaned) return null;
  const lower = cleaned.toLowerCase();
  if (STATE_CANONICAL_MAP[lower]) {
    return STATE_CANONICAL_MAP[lower];
  }
  return titleCase(cleaned);
}

/**
 * Parses numeric price from string with currency symbols, commas, and whitespace
 * e.g. " ₹ 2,450 " -> 2450
 */
export function parsePrice(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") {
    return Number.isFinite(val) && val > 0 ? val : null;
  }

  const cleaned = String(val)
    .replace(/[₹\s,]|Rs\.?/gi, "")
    .trim();

  if (!cleaned) return null;

  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/**
 * Parses dates into a standardized midnight UTC Date object
 * Handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
 */
export function parseArrivalDate(val) {
  if (!val) return null;
  const str = String(val).trim();

  // Pattern: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Pattern: YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const date = new Date(Date.UTC(year, month, day));
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Fallback Date.parse
  const fallback = new Date(str);
  if (!isNaN(fallback.getTime())) {
    return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate()));
  }

  return null;
}

/**
 * Formats a Date object as DD/MM/YYYY for legacy frontend compatibility
 */
export function formatToLegacyDate(date) {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "";
  }
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Normalizes and validates a parsed raw record
 * @param {Object} parsed - output from parseAgmarkRecord
 * @returns {{ valid: boolean, data?: Object, reason?: string }}
 */
export function normalizeAgmarkRecord(parsed) {
  if (!parsed) {
    return { valid: false, reason: "Empty or invalid record object" };
  }

  const stateName = normalizeStateName(parsed.rawState);
  if (!stateName) {
    return { valid: false, reason: "Missing or invalid state name" };
  }

  const districtName = titleCase(cleanString(parsed.rawDistrict)) || "Default District";
  const mandiName = titleCase(cleanString(parsed.rawMarket));
  if (!mandiName) {
    return { valid: false, reason: "Missing or invalid mandi/market name" };
  }

  const commodityName = titleCase(cleanString(parsed.rawCommodity));
  if (!commodityName) {
    return { valid: false, reason: "Missing or invalid commodity name" };
  }

  const arrivalDate = parseArrivalDate(parsed.rawArrivalDate);
  if (!arrivalDate) {
    return { valid: false, reason: `Invalid arrival date: ${parsed.rawArrivalDate}` };
  }

  const modalPrice = parsePrice(parsed.rawModalPrice);
  const minPrice = parsePrice(parsed.rawMinPrice) || modalPrice;
  const maxPrice = parsePrice(parsed.rawMaxPrice) || modalPrice;

  if (!modalPrice && !minPrice && !maxPrice) {
    return { valid: false, reason: "Missing valid positive price data" };
  }

  const finalModal = modalPrice || minPrice || maxPrice;
  const finalMin = minPrice || finalModal;
  const finalMax = maxPrice || finalModal;

  return {
    valid: true,
    data: {
      stateName,
      districtName,
      mandiName,
      commodityName,
      variety: cleanString(parsed.rawVariety),
      grade: cleanString(parsed.rawGrade),
      commodityCode: cleanString(parsed.rawCommodityCode),
      arrivalDate,
      minPrice: Math.min(finalMin, finalModal, finalMax),
      modalPrice: finalModal,
      maxPrice: Math.max(finalMin, finalModal, finalMax),
      unit: "Quintal",
      source: "AGMARK"
    }
  };
}
