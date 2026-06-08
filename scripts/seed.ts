// scripts/seed.ts
// Run with: npx tsx scripts/seed.ts
// Make sure to set FIREBASE_CONFIG env or update below

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, addDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  // Paste your Firebase config here
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const seedProducts = [
  { name: "Dimsum Ayam (6 pcs)", category: "Dimsum", price: 18000, costPrice: 9000, stock: 45, unit: "porsi", isActive: true },
  { name: "Dimsum Udang (6 pcs)", category: "Dimsum", price: 22000, costPrice: 12000, stock: 32, unit: "porsi", isActive: true },
  { name: "Siomay Sapi (4 pcs)", category: "Siomay", price: 16000, costPrice: 8000, stock: 28, unit: "porsi", isActive: true },
  { name: "Hakau Udang (4 pcs)", category: "Hakau", price: 20000, costPrice: 11000, stock: 20, unit: "porsi", isActive: true },
  { name: "Cheong Fun Udang", category: "Cheong Fun", price: 22000, costPrice: 12000, stock: 15, unit: "porsi", isActive: true },
  { name: "Tahu Isi Ayam (3 pcs)", category: "Goreng", price: 12000, costPrice: 5500, stock: 40, unit: "porsi", isActive: true },
  { name: "Lumpia Udang (3 pcs)", category: "Goreng", price: 15000, costPrice: 7000, stock: 25, unit: "porsi", isActive: true },
  { name: "Es Teh Manis", category: "Minuman", price: 5000, costPrice: 1500, stock: 100, unit: "cup", isActive: true },
  { name: "Es Jeruk Peras", category: "Minuman", price: 8000, costPrice: 3000, stock: 80, unit: "cup", isActive: true },
  { name: "Paket Combo A", category: "Paket", price: 35000, costPrice: 20000, stock: 50, unit: "paket", isActive: true },
];

const seedStocks = [
  { name: "Tepung Terigu", unit: "kg", currentStock: 25, minStock: 10, costPerUnit: 12000 },
  { name: "Daging Ayam Cincang", unit: "kg", currentStock: 8, minStock: 5, costPerUnit: 35000 },
  { name: "Udang Segar", unit: "kg", currentStock: 4, minStock: 5, costPerUnit: 75000 },
  { name: "Daging Sapi Cincang", unit: "kg", currentStock: 6, minStock: 4, costPerUnit: 90000 },
  { name: "Kulit Lumpia", unit: "pcs", currentStock: 200, minStock: 100, costPerUnit: 150 },
  { name: "Kecap Asin", unit: "botol", currentStock: 3, minStock: 5, costPerUnit: 15000 },
  { name: "Minyak Goreng", unit: "liter", currentStock: 10, minStock: 8, costPerUnit: 18000 },
];

async function seed() {
  console.log("Starting seed...");

  // Create admin user
  try {
    const cred = await createUserWithEmailAndPassword(auth, "admin@saulo.com", "admin123");
    await setDoc(doc(db, "users", cred.user.uid), {
      email: "admin@saulo.com",
      displayName: "Administrator",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
    });
    console.log("Admin user created:", cred.user.uid);
  } catch (e) {
    console.log("Admin user may already exist, skipping...");
  }

  // Create kasir user
  try {
    const cred2 = await createUserWithEmailAndPassword(auth, "kasir@saulo.com", "kasir123");
    await setDoc(doc(db, "users", cred2.user.uid), {
      email: "kasir@saulo.com",
      displayName: "Fawwaz Kasir",
      role: "kasir",
      isActive: true,
      createdAt: new Date(),
    });
    console.log("Kasir user created:", cred2.user.uid);
  } catch (e) {
    console.log("Kasir user may already exist, skipping...");
  }

  // Seed products
  for (const p of seedProducts) {
    await addDoc(collection(db, "products"), { ...p, createdAt: new Date(), updatedAt: new Date() });
  }
  console.log(`${seedProducts.length} products seeded`);

  // Seed stocks
  for (const s of seedStocks) {
    await addDoc(collection(db, "stocks"), { ...s, updatedAt: new Date() });
  }
  console.log(`${seedStocks.length} stock items seeded`);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(console.error);
