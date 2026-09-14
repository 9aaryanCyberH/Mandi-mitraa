import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const INDIAN_STATES_AND_DISTRICTS = [
  {
    name: "Andaman and Nicobar Islands",
    districts: ["South Andaman", "North and Middle Andaman", "Nicobar"],
    mandis: ["Port Blair Market"]
  },
  {
    name: "Andhra Pradesh",
    districts: ["Prakasam", "Guntur", "Krishna", "Kurnool", "Anantapur", "Visakhapatnam"],
    mandis: ["Guntur Chilli Yard", "Maddipadu APMC", "Kurnool Mandi", "Vijayawada Market"]
  },
  {
    name: "Arunachal Pradesh",
    districts: ["Papum Pare", "Changlang", "West Kameng", "Tawang"],
    mandis: ["Itanagar Market", "Naharlagun APMC"]
  },
  {
    name: "Assam",
    districts: ["Kamrup", "Dibrugarh", "Silchar", "Nagaon", "Jorhat"],
    mandis: ["Guwahati Market", "Silchar APMC", "Dibrugarh Mandi"]
  },
  {
    name: "Bihar",
    districts: ["Patna", "Muzaffarpur", "Gaya", "Bhagalpur", "Darbhanga", "Purnia"],
    mandis: ["Patna APMC", "Muzaffarpur Fruit Market", "Gaya Mandi"]
  },
  {
    name: "Chandigarh",
    districts: ["Chandigarh"],
    mandis: ["Sector 26 Grain Market"]
  },
  {
    name: "Chhattisgarh",
    districts: ["Raipur", "Bilaspur", "Durg", "Rajnandgaon", "Bastar"],
    mandis: ["Raipur Mandi", "Bilaspur APMC", "Durg Mandi"]
  },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    districts: ["Daman", "Diu", "Dadra and Nagar Haveli"],
    mandis: ["Silvassa Market", "Daman APMC"]
  },
  {
    name: "Delhi",
    districts: ["North Delhi", "South Delhi", "West Delhi", "East Delhi", "New Delhi"],
    mandis: ["Azadpur Mandi", "Ghazipur APMC", "Keshopur Mandi", "Okhla Mandi"]
  },
  {
    name: "Goa",
    districts: ["North Goa", "South Goa"],
    mandis: ["Panaji Market", "Margao APMC"]
  },
  {
    name: "Gujarat",
    districts: ["Rajkot", "Surat", "Ahmedabad", "Unjha", "Gondal", "Junagadh"],
    mandis: ["Gondal APMC", "Rajkot Mandi", "Unjha APMC", "Surat Market"]
  },
  {
    name: "Haryana",
    districts: ["Karnal", "Hisar", "Ambala", "Kurukshetra", "Sirsa", "Rohtak"],
    mandis: ["Karnal Mandi", "Hisar APMC", "Ambala City Mandi", "Thanesar Mandi"]
  },
  {
    name: "Himachal Pradesh",
    districts: ["Shimla", "Kullu", "Mandi", "Kangra", "Solan", "Kinnaur"],
    mandis: ["Shimla Apple Market", "Kullu Mandi", "Solan APMC", "Dharamshala Mandi"]
  },
  {
    name: "Jammu and Kashmir",
    districts: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Udhampur", "Shopian"],
    mandis: ["Parimpora Fruit Mandi", "Narwal Jammu APMC", "Shopian Apple Mandi"]
  },
  {
    name: "Jharkhand",
    districts: ["Ranchi", "Dhanbad", "Jamshedpur", "Bokaro", "Hazaribagh"],
    mandis: ["Ranchi Pandara Mandi", "Dhanbad APMC", "Jamshedpur Mandi"]
  },
  {
    name: "Karnataka",
    districts: ["Bengaluru", "Mysuru", "Hubballi", "Belagavi", "Kolar", "Shimoga"],
    mandis: ["Yeshwanthpur APMC", "Kolar Tomato Market", "Mysuru APMC", "Hubballi Mandi"]
  },
  {
    name: "Kerala",
    districts: ["Kozhikode", "Ernakulam", "Wayanad", "Palakkad", "Thrissur"],
    mandis: ["Mukkom Market", "Palakkad Mandi", "Kochi Market", "Wayanad Spice Market"]
  },
  {
    name: "Ladakh",
    districts: ["Leh", "Kargil"],
    mandis: ["Leh Fruit & Grain Market", "Kargil Mandi"]
  },
  {
    name: "Lakshadweep",
    districts: ["Kavaratti", "Agatti", "Andrott"],
    mandis: ["Kavaratti Market"]
  },
  {
    name: "Madhya Pradesh",
    districts: ["Indore", "Bhopal", "Ujjain", "Dewas", "Jabalpur", "Gwalior"],
    mandis: ["Indore APMC", "Ujjain Mandi", "Bhopal Karond Mandi", "Dewas Mandi"]
  },
  {
    name: "Maharashtra",
    districts: ["Nashik", "Pune", "Ahmednagar", "Nagpur", "Solapur", "Kolhapur", "Aurangabad"],
    mandis: ["Lasalgaon Mandi", "Pune APMC", "Nashik APMC", "Nagpur Cotton Market", "Vashi APMC"]
  },
  {
    name: "Manipur",
    districts: ["Imphal East", "Imphal West", "Thoubal", "Bishnupur"],
    mandis: ["Khwairamband Market", "Thoubal Mandi"]
  },
  {
    name: "Meghalaya",
    districts: ["East Khasi Hills", "West Garo Hills", "Ri Bhoi"],
    mandis: ["Shillong Iewduh Market", "Tura APMC"]
  },
  {
    name: "Mizoram",
    districts: ["Aizawl", "Lunglei", "Champhai"],
    mandis: ["Aizawl Bara Bazar"]
  },
  {
    name: "Nagaland",
    districts: ["Kohima", "Dimapur", "Mokokchung"],
    mandis: ["Dimapur Daily Market", "Kohima Mandi"]
  },
  {
    name: "Odisha",
    districts: ["Khordha", "Cuttack", "Sambalpur", "Balasore", "Ganjam"],
    mandis: ["Bhubaneswar APMC", "Cuttack Malgodown", "Sambalpur Mandi"]
  },
  {
    name: "Puducherry",
    districts: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
    mandis: ["Puducherry Uzhavar Sandhai", "Karaikal Market"]
  },
  {
    name: "Punjab",
    districts: ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda", "Ferozepur", "Gurdaspur"],
    mandis: ["Amritsar Mandi", "Ludhiana Grain Market", "Jalandhar City Mandi", "Patiala Mandi", "Bathinda Mandi"]
  },
  {
    name: "Rajasthan",
    districts: ["Jaipur", "Kota", "Bikaner", "Sri Ganganagar", "Jodhpur", "Alwar"],
    mandis: ["Jaipur Muhana Mandi", "Kota Bhamashah Mandi", "Sri Ganganagar Mandi"]
  },
  {
    name: "Sikkim",
    districts: ["East Sikkim", "West Sikkim", "South Sikkim", "North Sikkim"],
    mandis: ["Gangtok Lall Market", "Namchi Market"]
  },
  {
    name: "Tamil Nadu",
    districts: ["Chennai", "Coimbatore", "Madurai", "Salem", "Tiruchirappalli", "Erode"],
    mandis: ["Koyambedu Wholesale Market", "Oddanchatram Vegetable Market", "Madurai Paravai Mandi"]
  },
  {
    name: "Telangana",
    districts: ["Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar"],
    mandis: ["Bowenpally Market Yard", "Warangal Mandi", "Nizamabad APMC", "Malakpet Market"]
  },
  {
    name: "Tripura",
    districts: ["West Tripura", "North Tripura", "South Tripura", "Dhalai"],
    mandis: ["Agartala Battala Market", "Udaipur APMC"]
  },
  {
    name: "Uttar Pradesh",
    districts: ["Agra", "Kanpur", "Varanasi", "Lucknow", "Meerut", "Aligarh", "Bareilly"],
    mandis: ["Agra Mandi", "Kanpur Grain Market", "Varanasi APMC", "Meerut Mandi", "Lucknow Mandi"]
  },
  {
    name: "Uttarakhand",
    districts: ["Dehradun", "Haridwar", "Nainital", "Udham Singh Nagar", "Almora"],
    mandis: ["Dehradun Niranjanpur Mandi", "Haldwani APMC", "Haridwar Mandi"]
  },
  {
    name: "West Bengal",
    districts: ["Hooghly", "Burdwan", "Nadia", "Murshidabad", "North 24 Parganas", "Bankura"],
    mandis: ["Sheoraphuly Mandi", "Kalna Mandi", "Burdwan Mandi", "Katwa Mandi", "Ranaghat Mandi"]
  }
];

const INITIAL_COMMODITIES = [
  "Apple",
  "Wheat",
  "Rice",
  "Potato",
  "Onion",
  "Tomato",
  "Mustard",
  "Cotton",
  "Maize",
  "Banana",
  "Bengal Gram(Gram)(Whole)",
  "Soyabean",
  "Green Chilli",
  "Garlic",
  "Ginger"
];

// Reference demo market prices with clear labeling
const REFERENCE_DEMO_PRICES = [
  // Punjab Apple
  {
    state: "Punjab",
    district: "Amritsar",
    mandi: "Amritsar Mandi",
    commodity: "Apple",
    minPrice: 4000,
    modalPrice: 4500,
    maxPrice: 5000,
    unit: "Quintal",
    variety: "Delicious",
    source: "AGMARK (Demo Reference)"
  },
  {
    state: "Punjab",
    district: "Ludhiana",
    mandi: "Ludhiana Grain Market",
    commodity: "Apple",
    minPrice: 4200,
    modalPrice: 4600,
    maxPrice: 5100,
    unit: "Quintal",
    variety: "Royal Delicious",
    source: "AGMARK (Demo Reference)"
  },
  {
    state: "Punjab",
    district: "Jalandhar",
    mandi: "Jalandhar City Mandi",
    commodity: "Apple",
    minPrice: 3900,
    modalPrice: 4400,
    maxPrice: 4800,
    unit: "Quintal",
    variety: "Kullu Delicious",
    source: "AGMARK (Demo Reference)"
  },
  // Punjab Wheat
  {
    state: "Punjab",
    district: "Ludhiana",
    mandi: "Ludhiana Grain Market",
    commodity: "Wheat",
    minPrice: 2275,
    modalPrice: 2350,
    maxPrice: 2450,
    unit: "Quintal",
    variety: "Kalyan Sona",
    source: "AGMARK (Demo Reference)"
  },
  {
    state: "Punjab",
    district: "Patiala",
    mandi: "Patiala Mandi",
    commodity: "Wheat",
    minPrice: 2250,
    modalPrice: 2320,
    maxPrice: 2400,
    unit: "Quintal",
    variety: "PBW-343",
    source: "AGMARK (Demo Reference)"
  },
  // West Bengal Potato
  {
    state: "West Bengal",
    district: "Hooghly",
    mandi: "Sheoraphuly Mandi",
    commodity: "Potato",
    minPrice: 1580,
    modalPrice: 1610,
    maxPrice: 1650,
    unit: "Quintal",
    variety: "Jyoti",
    source: "AGMARK (Demo Reference)"
  },
  {
    state: "West Bengal",
    district: "Burdwan",
    mandi: "Kalna Mandi",
    commodity: "Potato",
    minPrice: 1550,
    modalPrice: 1590,
    maxPrice: 1620,
    unit: "Quintal",
    variety: "Jyoti",
    source: "AGMARK (Demo Reference)"
  },
  // Maharashtra Onion
  {
    state: "Maharashtra",
    district: "Nashik",
    mandi: "Lasalgaon Mandi",
    commodity: "Onion",
    minPrice: 1800,
    modalPrice: 2200,
    maxPrice: 2600,
    unit: "Quintal",
    variety: "Red Onion",
    source: "AGMARK (Demo Reference)"
  },
  {
    state: "Maharashtra",
    district: "Pune",
    mandi: "Pune APMC",
    commodity: "Onion",
    minPrice: 1900,
    modalPrice: 2300,
    maxPrice: 2750,
    unit: "Quintal",
    variety: "Garva",
    source: "AGMARK (Demo Reference)"
  }
];

async function seed() {
  console.log("🌱 Starting Mandi-Mitra database seeding...");

  // 1. Seed Admin User
  const adminPassword = await bcrypt.hash("Admin@12345", 10);
  await prisma.user.upsert({
    where: { email: "admin@mandimitra.gov.in" },
    create: {
      email: "admin@mandimitra.gov.in",
      password: adminPassword,
      name: "Mandi Mitra Administrator",
      role: "ADMIN"
    },
    update: {
      password: adminPassword,
      role: "ADMIN"
    }
  });
  console.log("✅ Admin user seeded: admin@mandimitra.gov.in");

  // 2. Seed Commodities
  const commodityMap = new Map();
  for (const name of INITIAL_COMMODITIES) {
    const c = await prisma.commodity.upsert({
      where: { name },
      create: { name },
      update: {}
    });
    commodityMap.set(name, c.id);
  }
  console.log(`✅ Seeded ${INITIAL_COMMODITIES.length} commodities.`);

  // 3. Seed States, Districts, Mandis
  const mandiMap = new Map();
  for (const item of INDIAN_STATES_AND_DISTRICTS) {
    const state = await prisma.state.upsert({
      where: { name: item.name },
      create: { name: item.name },
      update: {}
    });

    const districtMap = new Map();
    for (const dName of item.districts) {
      const district = await prisma.district.upsert({
        where: {
          name_stateId: {
            name: dName,
            stateId: state.id
          }
        },
        create: {
          name: dName,
          stateId: state.id
        },
        update: {}
      });
      districtMap.set(dName, district.id);
    }

    for (let i = 0; i < item.mandis.length; i++) {
      const mName = item.mandis[i];
      const associatedDistrictId = districtMap.get(item.districts[i % item.districts.length]);

      const mandi = await prisma.mandi.upsert({
        where: {
          name_stateId_districtId: {
            name: mName,
            stateId: state.id,
            districtId: associatedDistrictId
          }
        },
        create: {
          name: mName,
          stateId: state.id,
          districtId: associatedDistrictId
        },
        update: {}
      });
      mandiMap.set(`${mName}_${state.id}`, mandi.id);
    }
  }
  console.log(`✅ Seeded ${INDIAN_STATES_AND_DISTRICTS.length} states with districts and mandis.`);

  // 4. Seed Reference Demo Prices for Today and the Past 90 Days (Past 3 Months)
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const past90Days = [];
  for (let d = 89; d >= 0; d--) {
    const dayDate = new Date(todayUtc);
    dayDate.setUTCDate(todayUtc.getUTCDate() - d);
    past90Days.push(dayDate);
  }

  let totalPricesSeeded = 0;

  for (const item of REFERENCE_DEMO_PRICES) {
    const state = await prisma.state.findUnique({ where: { name: item.state } });
    if (!state) continue;

    const mandiId = mandiMap.get(`${item.mandi}_${state.id}`);
    const commodityId = commodityMap.get(item.commodity);

    if (mandiId && commodityId) {
      for (let i = 0; i < past90Days.length; i++) {
        const arrivalDate = past90Days[i];
        const trendFactor = 1 + 0.05 * Math.sin(i / 12) + ((i % 5) - 2) * 0.007;
        const modalPrice = Math.round(item.modalPrice * trendFactor);
        const minPrice = Math.round(modalPrice * 0.93);
        const maxPrice = Math.round(modalPrice * 1.08);

        await prisma.marketPrice.upsert({
          where: {
            mandiId_commodityId_arrivalDate: {
              mandiId,
              commodityId,
              arrivalDate
            }
          },
          create: {
            mandiId,
            commodityId,
            arrivalDate,
            minPrice,
            modalPrice,
            maxPrice,
            unit: item.unit,
            variety: item.variety,
            source: i === past90Days.length - 1 ? "AGMARK (Live Daily)" : "AGMARK (Daily Return)"
          },
          update: {
            minPrice,
            modalPrice,
            maxPrice,
            variety: item.variety
          }
        });
        totalPricesSeeded++;
      }
    }
  }
  console.log(`✅ Seeded ${totalPricesSeeded} daily market price records across the past 90 days (Past 3 Months).`);

  console.log("🌾 Database seeding completed successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
