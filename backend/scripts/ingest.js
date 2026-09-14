import { ingestionManager } from "../src/ingestion/ingestion.service.js";
import { prisma } from "../src/config/database.js";
import { logger } from "../src/utils/logger.js";

async function main() {
  console.log("🌾 Mandi-Mitra — Manual AGMARK Ingestion Trigger");
  console.log("==================================================");

  // Parse simple CLI flags
  const args = process.argv.slice(2);
  let limit = 500;
  let offset = 0;
  const filters = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--offset" && args[i + 1]) {
      offset = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--state" && args[i + 1]) {
      filters.State = args[i + 1];
      i++;
    } else if (args[i] === "--commodity" && args[i + 1]) {
      filters.Commodity = args[i + 1];
      i++;
    }
  }

  try {
    const result = await ingestionManager.runIngestion({
      source: "AGMARK",
      limit,
      offset,
      filters,
      triggeredBy: "MANUAL"
    });

    console.log("\n==================================================");
    console.log("✅ AGMARK Ingestion Summary:");
    console.log(`- Status:           ${result.status}`);
    console.log(`- Records Fetched:  ${result.recordsFetched}`);
    console.log(`- Records Inserted: ${result.recordsInserted}`);
    console.log(`- Records Updated:  ${result.recordsUpdated}`);
    console.log(`- Records Rejected: ${result.recordsRejected}`);
    console.log(`- Duration:         ${result.durationMs} ms`);
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Ingestion script failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
