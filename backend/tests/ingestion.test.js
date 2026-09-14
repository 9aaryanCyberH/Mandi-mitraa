import { describe, it, expect } from "vitest";
import { parseAgmarkRecord } from "../src/ingestion/agmark/agmark.parser.js";
import {
  parsePrice,
  parseArrivalDate,
  normalizeAgmarkRecord,
  formatToLegacyDate
} from "../src/ingestion/agmark/agmark.normalizer.js";

describe("AGMARK Normalizer & Parser Unit Tests", () => {
  it("should extract raw fields from both lowercase and PascalCase data.gov.in schemas", () => {
    const rawPascal = {
      State: "Punjab",
      District: "Amritsar",
      Market: "Amritsar Mandi",
      Commodity: "Apple",
      Arrival_Date: "14/09/2026",
      Min_Price: "4000",
      Modal_Price: "4500",
      Max_Price: "5000"
    };

    const parsedPascal = parseAgmarkRecord(rawPascal);
    expect(parsedPascal.rawState).toBe("Punjab");
    expect(parsedPascal.rawMarket).toBe("Amritsar Mandi");

    const rawLower = {
      state: "Punjab",
      district: "Amritsar",
      market: "Amritsar Mandi",
      commodity: "Apple",
      arrival_date: "14/09/2026",
      min_price: 4000,
      modal_price: 4500,
      max_price: 5000
    };

    const parsedLower = parseAgmarkRecord(rawLower);
    expect(parsedLower.rawState).toBe("Punjab");
    expect(parsedLower.rawMarket).toBe("Amritsar Mandi");
  });

  it("should clean currency symbols, commas, and whitespace into numbers", () => {
    expect(parsePrice(" ₹ 2,450 ")).toBe(2450);
    expect(parsePrice("Rs. 1,800.50")).toBe(1800.5);
    expect(parsePrice(3200)).toBe(3200);
    expect(parsePrice("0")).toBeNull();
    expect(parsePrice("-500")).toBeNull();
    expect(parsePrice("invalid")).toBeNull();
    expect(parsePrice(null)).toBeNull();
  });

  it("should parse arrival dates in multiple formats to standardized midnight Date", () => {
    const d1 = parseArrivalDate("14/09/2026");
    expect(d1).toBeInstanceOf(Date);
    expect(formatToLegacyDate(d1)).toBe("14/09/2026");

    const d2 = parseArrivalDate("2026-09-14");
    expect(d2).toBeInstanceOf(Date);
    expect(formatToLegacyDate(d2)).toBe("14/09/2026");
  });

  it("should normalize valid raw record and reject malformed ones", () => {
    const validRaw = {
      rawState: "  keralam ",
      rawDistrict: "KOZHIKODE",
      rawMarket: "mukkom market",
      rawCommodity: "apple",
      rawArrivalDate: "14/09/2026",
      rawMinPrice: " ₹ 16,500 ",
      rawModalPrice: "17,000",
      rawMaxPrice: "17500"
    };

    const result = normalizeAgmarkRecord(validRaw);
    expect(result.valid).toBe(true);
    expect(result.data.stateName).toBe("Kerala");
    expect(result.data.districtName).toBe("Kozhikode");
    expect(result.data.mandiName).toBe("Mukkom Market");
    expect(result.data.commodityName).toBe("Apple");
    expect(result.data.modalPrice).toBe(17000);

    // Missing state
    const invalidState = normalizeAgmarkRecord({ ...validRaw, rawState: "" });
    expect(invalidState.valid).toBe(false);

    // Missing prices
    const invalidPrice = normalizeAgmarkRecord({
      ...validRaw,
      rawMinPrice: "0",
      rawModalPrice: "",
      rawMaxPrice: null
    });
    expect(invalidPrice.valid).toBe(false);
  });
});
