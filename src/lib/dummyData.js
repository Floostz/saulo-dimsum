export const dummyProducts = [
    {
        name: "Dimsum Ayam (6 pcs)",
        category: "Dimsum",
        price: 18000,
        costPrice: 9000,
        stock: 45,
        unit: "porsi",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "Dimsum Udang (6 pcs)",
        category: "Dimsum",
        price: 22000,
        costPrice: 12000,
        stock: 32,
        unit: "porsi",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "Siomay Sapi (4 pcs)",
        category: "Siomay",
        price: 16000,
        costPrice: 8000,
        stock: 28,
        unit: "porsi",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "Hakau Udang (4 pcs)",
        category: "Hakau",
        price: 20000,
        costPrice: 11000,
        stock: 20,
        unit: "porsi",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "Cheong Fun Udang",
        category: "Cheong Fun",
        price: 22000,
        costPrice: 12000,
        stock: 15,
        unit: "porsi",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "Tahu Isi Ayam (3 pcs)",
        category: "Goreng",
        price: 12000,
        costPrice: 5500,
        stock: 40,
        unit: "porsi",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "Lumpia Udang (3 pcs)",
        category: "Goreng",
        price: 15000,
        costPrice: 7000,
        stock: 25,
        unit: "porsi",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "Es Teh Manis",
        category: "Minuman",
        price: 5000,
        costPrice: 1500,
        stock: 100,
        unit: "cup",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "Es Jeruk Peras",
        category: "Minuman",
        price: 8000,
        costPrice: 3000,
        stock: 80,
        unit: "cup",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        name: "Paket Combo A (Dimsum+Siomay+Minuman)",
        category: "Paket",
        price: 35000,
        costPrice: 20000,
        stock: 50,
        unit: "paket",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];
export const dummyStocks = [
    { name: "Tepung Terigu", unit: "kg", currentStock: 25, minStock: 10, costPerUnit: 12000, updatedAt: new Date() },
    { name: "Daging Ayam Cincang", unit: "kg", currentStock: 8, minStock: 5, costPerUnit: 35000, updatedAt: new Date() },
    { name: "Udang Segar", unit: "kg", currentStock: 4, minStock: 5, costPerUnit: 75000, updatedAt: new Date() },
    { name: "Daging Sapi Cincang", unit: "kg", currentStock: 6, minStock: 4, costPerUnit: 90000, updatedAt: new Date() },
    { name: "Kulit Lumpia", unit: "pcs", currentStock: 200, minStock: 100, costPerUnit: 150, updatedAt: new Date() },
    { name: "Kecap Asin", unit: "botol", currentStock: 3, minStock: 5, costPerUnit: 15000, updatedAt: new Date() },
    { name: "Minyak Goreng", unit: "liter", currentStock: 10, minStock: 8, costPerUnit: 18000, updatedAt: new Date() },
    { name: "Gula Pasir", unit: "kg", currentStock: 5, minStock: 3, costPerUnit: 14000, updatedAt: new Date() },
];
export const dummyExpenseCategories = [
    "Bahan Baku",
    "Operasional",
    "Gaji Karyawan",
    "Sewa Tempat",
    "Utilitas (Listrik/Air)",
    "Peralatan",
    "Kemasan",
    "Lain-lain",
];
export const dummyProductCategories = [
    "Dimsum",
    "Siomay",
    "Hakau",
    "Cheong Fun",
    "Goreng",
    "Minuman",
    "Paket",
];
// Generate last 7 days of sales data
export const generateDailySalesData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            date: d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
            income: Math.floor(Math.random() * 400000) + 200000,
            expense: Math.floor(Math.random() * 100000) + 50000,
        });
    }
    return days;
};
export const generateMonthlyData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    return months.slice(0, new Date().getMonth() + 1).map((m) => ({
        month: m,
        income: Math.floor(Math.random() * 12000000) + 6000000,
        expense: Math.floor(Math.random() * 4000000) + 2000000,
    }));
};
