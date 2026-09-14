/**
 * Extracts and unifies raw AGMARK record fields from various data.gov.in schemas
 * @param {Object} raw - raw record from external source
 * @returns {Object} raw unified record
 */
export function parseAgmarkRecord(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  // Handle case-insensitive key extraction
  const getField = (...candidates) => {
    for (const key of candidates) {
      if (raw[key] !== undefined && raw[key] !== null) {
        return raw[key];
      }
    }
    return null;
  };

  return {
    rawState: getField("State", "state", "STATE"),
    rawDistrict: getField("District", "district", "DISTRICT"),
    rawMarket: getField("Market", "market", "MARKET", "Mandi", "mandi", "APMC", "apmc"),
    rawCommodity: getField("Commodity", "commodity", "COMMODITY"),
    rawArrivalDate: getField("Arrival_Date", "arrival_date", "Arrival Date", "arrivalDate", "Date", "date"),
    rawMinPrice: getField("Min_Price", "min_price", "Min_x0020_Price", "minPrice", "Min Price"),
    rawModalPrice: getField("Modal_Price", "modal_price", "Modal_x0020_Price", "modalPrice", "Modal Price"),
    rawMaxPrice: getField("Max_Price", "max_price", "Max_x0020_Price", "maxPrice", "Max Price"),
    rawVariety: getField("Variety", "variety", "VARIETY"),
    rawGrade: getField("Grade", "grade", "GRADE"),
    rawCommodityCode: getField("Commodity_Code", "commodity_code", "commodityCode")
  };
}
