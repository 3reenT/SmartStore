import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const AppContext = createContext(null);
const STORAGE_KEY = "smartstore-app-state";

function slugifyStoreName(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createStoreDefaults(store = {}) {
  const slug = slugifyStoreName(store.name || store.slug || "smart-store");

  return {
    entityType: "store",
    id: store.id || `store-${Date.now()}`,
    sellerId: store.sellerId || "",
    name: store.name || "",
    city: store.city || "",
    category: store.category || "",
    description: store.description || "",
    subscription:
      store.subscription === "Starter"
        ? "Free"
        : store.subscription === "Growth"
          ? "Pro"
          : store.subscription === "Scale"
            ? "Premium"
            : store.subscription || "Free",
    status: store.status || "pending",
    monthlyRevenue: Number(store.monthlyRevenue || 0),
    ownerName: store.ownerName || "",
    ownerEmail: store.ownerEmail || "",
    contactEmail: store.contactEmail || "",
    contactPhone: store.contactPhone || "",
    address: store.address || "",
    maintenanceMode: Boolean(store.maintenanceMode),
    slug,
    storeUrl:
      store.storeUrl || `https://smartstore.ps/${slug || `store-${Date.now()}`}`,
    logo: store.logo && store.logo !== "/logo.png" ? store.logo : "",
    banner: store.banner || "",
    galleryImages: Array.isArray(store.galleryImages) ? store.galleryImages.filter(Boolean) : [],
    sectionLogos:
      store.sectionLogos && typeof store.sectionLogos === "object"
        ? Object.fromEntries(
            Object.entries(store.sectionLogos).filter(([, value]) => Boolean(value)),
          )
        : {},
    theme: store.theme || "Modern",
    primaryColor: store.primaryColor || "#18c79c",
    notifications: {
      emailOrders: true,
      lowStockAlerts: true,
      customerMessages: true,
      pushNotifications: false,
      ...(store.notifications || {}),
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: "30 minutes",
      apiAccessEnabled: true,
      ...(store.security || {}),
    },
    billing: {
      currentPlan: "Professional",
      nextBillingDate: "March 15, 2026",
      paymentMethod: "**** **** **** 4242",
      ...(store.billing || {}),
    },
    socialLinks: {
      tiktok: "",
      facebook: "",
      instagram: "",
      ...(store.socialLinks || {}),
    },
  };
}

function normalizeProduct(product) {
  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean)
    : product.image
      ? [product.image]
      : [];
  const sizeOptions = Array.isArray(product.sizeOptions)
    ? product.sizeOptions.filter(Boolean)
    : [];
  const colorOptions = Array.isArray(product.colorOptions)
    ? product.colorOptions.filter(Boolean)
    : [];
  const sizeInventory =
    product.sizeInventory && typeof product.sizeInventory === "object"
      ? Object.fromEntries(
          Object.entries(product.sizeInventory)
            .filter(([key]) => key)
            .map(([key, value]) => [key, Math.max(0, Number(value || 0))]),
        )
      : {};
  const colorInventory =
    product.colorInventory && typeof product.colorInventory === "object"
      ? Object.fromEntries(
          Object.entries(product.colorInventory)
            .filter(([key]) => key)
            .map(([key, value]) => [key, Math.max(0, Number(value || 0))]),
        )
      : {};
  const variantInventory =
    product.variantInventory && typeof product.variantInventory === "object"
      ? Object.fromEntries(
          Object.entries(product.variantInventory)
            .filter(([key]) => key)
            .map(([key, value]) => [key, Math.max(0, Number(value || 0))]),
        )
      : {};
  const colorImageMap =
    product.colorImageMap && typeof product.colorImageMap === "object"
      ? Object.fromEntries(
          Object.entries(product.colorImageMap).filter(
            ([key, value]) => key && value,
          ),
        )
      : {};
  const derivedSizeOptions = Object.keys(variantInventory)
    .map((key) => key.split("|")[0] || "")
    .filter(Boolean);
  const derivedColorOptions = Object.keys(variantInventory)
    .map((key) => key.split("|")[1] || "")
    .filter(Boolean);
  const normalizedSizeOptions = Array.from(
    new Set([...sizeOptions, ...Object.keys(sizeInventory), ...derivedSizeOptions]),
  );
  const normalizedColorOptions = Array.from(
    new Set([...colorOptions, ...Object.keys(colorInventory), ...derivedColorOptions]),
  );
  const hasSizes = Boolean(
    product.hasSizes || normalizedSizeOptions.length || Object.keys(sizeInventory).length,
  );
  const hasColors = Boolean(
    product.hasColors || normalizedColorOptions.length || Object.keys(colorInventory).length,
  );
  const computedStock = Object.keys(variantInventory).length
    ? Object.values(variantInventory).reduce((sum, value) => sum + Number(value || 0), 0)
    : Object.keys(sizeInventory).length
      ? Object.values(sizeInventory).reduce((sum, value) => sum + Number(value || 0), 0)
      : Object.keys(colorInventory).length
        ? Object.values(colorInventory).reduce((sum, value) => sum + Number(value || 0), 0)
        : Number(product.stock || 0);

  return {
    id: product.id || `product-${Date.now()}`,
    storeId: product.storeId || "",
    name: product.name || "",
    category: product.category || "",
    price: Number(product.price || 0),
    originalPrice: Number(product.originalPrice || 0),
    status: product.status || "active",
    sales: Number(product.sales || 0),
    isNew: Boolean(product.isNew),
    description: product.description || "",
    image: product.image || images[0] || "",
    images,
    hasSizes,
    hasColors,
    sizeMode: product.sizeMode === "numeric" ? "numeric" : "alpha",
    sizeOptions: normalizedSizeOptions,
    colorOptions: normalizedColorOptions,
    sizeInventory,
    colorInventory,
    variantInventory,
    colorImageMap,
    stock: computedStock,
  };
}

function normalizeOrder(order) {
  return {
    id: order.id || `ORD-${Date.now()}`,
    storeId: order.storeId || "",
    storeName: order.storeName || "",
    customerName: order.customerName || "",
    itemsCount: Number(order.itemsCount || 1),
    total: Number(order.total || 0),
    status: order.status || "pending",
    paymentStatus: order.paymentStatus || "pending",
    deliveryStatus: order.deliveryStatus || "awaiting pickup",
    createdAt: order.createdAt || "2026-04-05",
  };
}

function normalizeCustomerState(customerState = {}) {
  if ("favorites" in customerState || "cart" in customerState) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(customerState || {})
      .filter(([, value]) => value && typeof value === "object")
      .map(([storeId, value]) => [
        storeId,
        {
          favorites: Array.isArray(value.favorites) ? value.favorites : [],
          cart: Array.isArray(value.cart)
            ? value.cart.map((item) => ({
                productId: item.productId || "",
                quantity: Number(item.quantity || 1),
                size: item.size || "",
                color: item.color || "",
              }))
            : [],
        },
      ]),
  );
}

function normalizeCustomerWorkspace(workspace = {}) {
  return {
    favorites: Array.isArray(workspace.favorites) ? workspace.favorites : [],
    cart: Array.isArray(workspace.cart)
      ? workspace.cart.map((item) => ({
          productId: item.productId || "",
          quantity: Number(item.quantity || 1),
          size: item.size || "",
          color: item.color || "",
        }))
      : [],
  };
}

function getProductSelectionStock(product, selection = {}) {
  const size = selection.size || "";
  const color = selection.color || "";

  if (product.hasSizes && product.hasColors) {
    return Number(product.variantInventory?.[`${size}|${color}`] || 0);
  }

  if (product.hasSizes) {
    return Number(product.sizeInventory?.[size] || 0);
  }

  if (product.hasColors) {
    return Number(product.colorInventory?.[color] || 0);
  }

  return Number(product.stock || 0);
}

function mergeById(baseItems, incomingItems, normalizer) {
  const merged = new Map();

  baseItems.forEach((item) => {
    const normalized = normalizer(item);
    merged.set(normalized.id, normalized);
  });

  incomingItems.forEach((item) => {
    const normalized = normalizer(item);
    merged.set(normalized.id, normalized);
  });

  return [...merged.values()];
}

const FORCED_DEMO_STORE_IDS = new Set(["store-6", "store-7"]);
const FORCED_DEMO_PRODUCT_IDS = new Set([
  "product-6",
  "product-7",
  "product-8",
  "product-9",
]);

function mergeWithForcedDemoItems(baseItems, incomingItems, normalizer, forcedIds) {
  const merged = new Map();

  incomingItems.forEach((item) => {
    const normalized = normalizer(item);
    merged.set(normalized.id, normalized);
  });

  baseItems.forEach((item) => {
    const normalized = normalizer(item);

    if (!merged.has(normalized.id) || forcedIds.has(normalized.id)) {
      merged.set(normalized.id, normalized);
    }
  });

  return [...merged.values()];
}

const seedData = {
  language: "en",
  users: [
    {
      id: "admin-1",
      name: "SmartStore Admin",
      email: "admin@smartstore.ps",
      password: "admin123",
      role: "admin",
      status: "active",
    },
    {
      id: "seller-1",
      name: "Lina Khalil",
      email: "lina@smartstore.ps",
      password: "seller123",
      role: "seller",
      status: "active",
    },
    {
      id: "customer-1",
      name: "Omar Nassar",
      email: "omar@smartstore.ps",
      password: "customer123",
      role: "customer",
      status: "active",
    },
  ],
  stores: [
    createStoreDefaults({
      id: "store-1",
      sellerId: "seller-1",
      name: "TechStore",
      city: "Ramallah",
      category: "Electronics",
      description: "Premium electronics and gadgets for tech enthusiasts.",
      subscription: "Pro",
      status: "approved",
      monthlyRevenue: 12450,
      ownerName: "Lina Khalil",
      contactEmail: "contact@techstore.com",
      contactPhone: "+970 599 123 456",
      address: "Ramallah, Palestine",
      primaryColor: "#18c79c",
      banner: "",
    }),
    createStoreDefaults({
      id: "store-5",
      sellerId: "seller-1",
      name: "Home Store",
      city: "Nablus",
      category: "Home & Garden",
      description: "Home and garden essentials with a simple modern look.",
      subscription: "Free",
      status: "approved",
      monthlyRevenue: 8920,
      ownerName: "Lina Khalil",
      contactEmail: "hello@homestore.ps",
      contactPhone: "+970 598 222 333",
      address: "Nablus, Palestine",
      primaryColor: "#4f7cff",
    }),
    createStoreDefaults({
      id: "store-6",
      sellerId: "seller-1",
      name: "Urban Wear Studio",
      city: "Ramallah",
      category: "Clothing",
      description: "Modern clothing essentials with a curated streetwear look.",
      subscription: "Pro",
      status: "approved",
      monthlyRevenue: 10350,
      ownerName: "Lina Khalil",
      contactEmail: "hello@urbanwear.ps",
      contactPhone: "+970 597 111 444",
      address: "Ramallah, Palestine",
      primaryColor: "#ef4444",
    }),
    createStoreDefaults({
      id: "store-7",
      sellerId: "seller-1",
      name: "Stride Shoes",
      city: "Bethlehem",
      category: "Shoes",
      description: "Sneakers and everyday footwear with clean product presentation.",
      subscription: "Pro",
      status: "approved",
      monthlyRevenue: 11840,
      ownerName: "Lina Khalil",
      contactEmail: "support@strideshoes.ps",
      contactPhone: "+970 598 333 444",
      address: "Bethlehem, Palestine",
      primaryColor: "#0f766e",
    }),
    createStoreDefaults({
      id: "store-2",
      sellerId: "seller-2",
      name: "Jerusalem Home Picks",
      city: "Jerusalem",
      category: "Home",
      description: "Pending store review.",
      subscription: "Free",
      status: "pending",
      monthlyRevenue: 0,
      ownerName: "Nour Saleh",
      contactEmail: "contact@homepicks.ps",
      contactPhone: "+970 594 222 111",
      address: "Jerusalem, Palestine",
    }),
    createStoreDefaults({
      id: "store-3",
      sellerId: "seller-3",
      name: "Beauty Corner",
      city: "Ramallah",
      category: "Beauty",
      description: "Premium beauty and cosmetics collections.",
      subscription: "Premium",
      status: "approved",
      monthlyRevenue: 18400,
      ownerName: "Nour Saleh",
      contactEmail: "hi@beautycorner.ps",
      contactPhone: "+970 592 111 222",
      address: "Ramallah, Palestine",
    }),
    createStoreDefaults({
      id: "store-4",
      sellerId: "seller-4",
      name: "Home Essentials",
      city: "Hebron",
      category: "Home & Kitchen",
      description: "Kitchen and household essentials.",
      subscription: "Pro",
      status: "approved",
      monthlyRevenue: 9600,
      ownerName: "Rami Khalil",
      contactEmail: "contact@homeessentials.ps",
      contactPhone: "+970 595 777 888",
      address: "Hebron, Palestine",
    }),
  ],
  products: [
    normalizeProduct({
      id: "product-1",
      storeId: "store-1",
      name: "Lenovo IdeaPad 5",
      category: "Laptops",
      price: 799,
      originalPrice: 899,
      stock: 8,
      status: "active",
      sales: 18,
      isNew: true,
      description:
        "Slim everyday laptop with dependable performance and long battery life.",
    }),
    normalizeProduct({
      id: "product-2",
      storeId: "store-1",
      name: "Wireless Mouse MX",
      category: "Accessories",
      price: 35,
      originalPrice: 49,
      stock: 4,
      status: "active",
      sales: 42,
      description: "Comfortable wireless mouse with precise tracking.",
    }),
    normalizeProduct({
      id: "product-3",
      storeId: "store-1",
      name: "USB-C Dock 8-in-1",
      category: "Accessories",
      price: 69,
      originalPrice: 0,
      stock: 2,
      status: "active",
      sales: 15,
      isNew: true,
      description: "Compact multi-port dock for modern laptops.",
    }),
    normalizeProduct({
      id: "product-4",
      storeId: "store-5",
      name: "Oak Wall Shelf",
      category: "Furniture",
      price: 59,
      originalPrice: 79,
      stock: 12,
      status: "active",
      sales: 16,
      description: "Minimal floating wall shelf for organized interiors.",
    }),
    normalizeProduct({
      id: "product-5",
      storeId: "store-5",
      name: "Ceramic Plant Pot",
      category: "Decor",
      price: 24,
      originalPrice: 0,
      stock: 5,
      status: "active",
      sales: 22,
      isNew: true,
      description: "Soft matte ceramic pot for indoor plants and shelves.",
    }),
    normalizeProduct({
      id: "product-6",
      storeId: "store-6",
      name: "Classic Cotton T-Shirt",
      category: "Clothing",
      price: 24,
      originalPrice: 28,
      status: "active",
      sales: 24,
      isNew: true,
      description: "Comfortable everyday t-shirt with a clean modern fit.",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      images: [
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=900&q=80",
      ],
      hasSizes: true,
      hasColors: true,
      sizeMode: "alpha",
      sizeOptions: ["S", "M", "L", "XL"],
      colorOptions: ["White", "Black", "Red"],
      variantInventory: {
        "S|White": 2,
        "M|White": 3,
        "L|White": 2,
        "XL|White": 1,
        "S|Black": 1,
        "M|Black": 2,
        "L|Black": 2,
        "XL|Black": 1,
        "S|Red": 1,
        "M|Red": 2,
        "L|Red": 1,
        "XL|Red": 1,
      },
      colorImageMap: {
        White: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
        Black: "https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80",
        Red: "https://images.unsplash.com/photo-1583743814966-8936f37f4678?auto=format&fit=crop&w=900&q=80",
      },
    }),
    normalizeProduct({
      id: "product-7",
      storeId: "store-6",
      name: "Oversized Beige Hoodie",
      category: "Clothing",
      price: 49,
      originalPrice: 59,
      status: "active",
      sales: 17,
      description: "Soft oversized hoodie for casual daily wear.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
      images: [
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
      ],
      hasSizes: true,
      hasColors: true,
      sizeMode: "alpha",
      sizeOptions: ["M", "L", "XL"],
      colorOptions: ["Beige", "Yellow"],
      variantInventory: {
        "M|Beige": 2,
        "L|Beige": 2,
        "XL|Beige": 1,
        "M|Yellow": 1,
        "L|Yellow": 1,
        "XL|Yellow": 1,
      },
      colorImageMap: {
        Beige: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80",
        Yellow: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
      },
    }),
    normalizeProduct({
      id: "product-8",
      storeId: "store-7",
      name: "Street Runner 2.0",
      category: "Shoes",
      price: 79,
      originalPrice: 99,
      status: "active",
      sales: 21,
      isNew: true,
      description: "Lightweight urban sneakers built for comfort and daily movement.",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      images: [
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80",
      ],
      hasSizes: true,
      hasColors: true,
      sizeMode: "numeric",
      sizeOptions: ["40", "41", "42", "43", "44"],
      colorOptions: ["Red", "Black"],
      variantInventory: {
        "40|Red": 1,
        "41|Red": 1,
        "42|Red": 2,
        "43|Red": 1,
        "44|Red": 1,
        "40|Black": 1,
        "41|Black": 1,
        "42|Black": 1,
        "43|Black": 1,
        "44|Black": 1,
      },
      colorImageMap: {
        Red: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
        Black: "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80",
      },
    }),
    normalizeProduct({
      id: "product-9",
      storeId: "store-7",
      name: "Minimal Leather Loafers",
      category: "Shoes",
      price: 95,
      originalPrice: 120,
      status: "active",
      sales: 13,
      description: "Clean loafers suitable for work and smart casual outfits.",
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80",
      images: [
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80",
        "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80",
      ],
      hasSizes: true,
      hasColors: true,
      sizeMode: "numeric",
      sizeOptions: ["41", "42", "43", "44"],
      colorOptions: ["Brown", "Black"],
      variantInventory: {
        "41|Brown": 1,
        "42|Brown": 2,
        "43|Brown": 1,
        "44|Brown": 1,
        "41|Black": 1,
        "42|Black": 1,
        "43|Black": 1,
        "44|Black": 0,
      },
      colorImageMap: {
        Brown: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80",
        Black: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=900&q=80",
      },
    }),
  ],
  orders: [
    normalizeOrder({
      id: "ORD-1001",
      storeId: "store-1",
      storeName: "TechStore",
      customerName: "Omar Nassar",
      itemsCount: 2,
      total: 320,
      status: "processing",
      paymentStatus: "paid",
      deliveryStatus: "ready",
      createdAt: "2026-04-02",
    }),
    normalizeOrder({
      id: "ORD-1002",
      storeId: "store-1",
      storeName: "TechStore",
      customerName: "Maya Khalil",
      itemsCount: 1,
      total: 149,
      status: "delivered",
      paymentStatus: "paid",
      deliveryStatus: "delivered",
      createdAt: "2026-04-01",
    }),
    normalizeOrder({
      id: "ORD-1003",
      storeId: "store-1",
      storeName: "TechStore",
      customerName: "Raneem Saleh",
      itemsCount: 3,
      total: 209,
      status: "pending",
      paymentStatus: "pending",
      deliveryStatus: "awaiting pickup",
      createdAt: "2026-04-05",
    }),
    normalizeOrder({
      id: "ORD-1004",
      storeId: "store-5",
      storeName: "Home Store",
      customerName: "Alaa Jaber",
      itemsCount: 2,
      total: 88,
      status: "processing",
      paymentStatus: "paid",
      deliveryStatus: "ready",
      createdAt: "2026-04-03",
    }),
    normalizeOrder({
      id: "ORD-1005",
      storeId: "store-5",
      storeName: "Home Store",
      customerName: "Nadine Salem",
      itemsCount: 1,
      total: 46,
      status: "delivered",
      paymentStatus: "paid",
      deliveryStatus: "delivered",
      createdAt: "2026-04-01",
    }),
  ],
  storePreferences: {
    "store-1": { lowStockThreshold: 5 },
    "store-5": { lowStockThreshold: 4 },
    "store-6": { lowStockThreshold: 3 },
    "store-7": { lowStockThreshold: 3 },
  },
  sellerWorkspace: {
    "seller-1": {
      activeStoreId: "store-1",
    },
  },
  customerState: {
    "customer-1": {},
  },
  storeCustomerSessions: {},
  settings: {
    platformName: "SmartStore",
    supportEmail: "support@smartstore.ps",
    defaultLanguage: "English",
  },
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return seedData;
    }

    const parsed = JSON.parse(raw);

    return {
      ...seedData,
      ...parsed,
      stores: mergeWithForcedDemoItems(
        seedData.stores,
        (parsed.stores || []).filter((store) => store && typeof store === "object"),
        createStoreDefaults,
        FORCED_DEMO_STORE_IDS,
      ),
      products: mergeWithForcedDemoItems(
        seedData.products,
        (parsed.products || []).filter((product) => product && typeof product === "object"),
        normalizeProduct,
        FORCED_DEMO_PRODUCT_IDS,
      ),
      orders: mergeById(
        seedData.orders,
        (parsed.orders || []).filter((order) => order && typeof order === "object"),
        normalizeOrder,
      ),
      storePreferences: {
        ...seedData.storePreferences,
        ...(parsed.storePreferences || {}),
      },
      sellerWorkspace: {
        ...seedData.sellerWorkspace,
        ...(parsed.sellerWorkspace || {}),
      },
      customerState: Object.fromEntries(
        Object.entries({
          ...seedData.customerState,
          ...(parsed.customerState || {}),
        }).map(([key, value]) => [key, normalizeCustomerState(value)]),
      ),
      storeCustomerSessions: {
        ...seedData.storeCustomerSessions,
        ...(parsed.storeCustomerSessions || {}),
      },
      settings: {
        ...seedData.settings,
        ...(parsed.settings || {}),
      },
    };
  } catch {
    return seedData;
  }
}

function createAiDescription({ name, category, language }) {
  if (language === "ar") {
    return `${name} من فئة ${category} يقدم قيمة عملية واضحة للعميل مع جودة مناسبة للاستخدام اليومي، ويساعد المتجر على عرض المنتج بشكل احترافي وسريع.`;
  }

  return `${name} is a ${category.toLowerCase()} product built for practical everyday use, with a clear value proposition and polished positioning for a stronger store presentation.`;
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    document.documentElement.lang = state.language;
    document.documentElement.dir = state.language === "ar" ? "rtl" : "ltr";
  }, [state.language]);

  const getStoreCustomer = (storeId) => {
    const customerId = state.storeCustomerSessions[storeId];

    if (!customerId) {
      return null;
    }

    return state.users.find((user) => user.id === customerId && user.role === "customer") || null;
  };

  const getStoreCustomerWorkspace = (storeId) => {
    const customer = getStoreCustomer(storeId);

    if (!customer) {
      return normalizeCustomerWorkspace();
    }

    return normalizeCustomerWorkspace(state.customerState[customer.id]?.[storeId]);
  };

  const login = (email, password, options = {}) => {
    const user = state.users.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password,
    );

    if (!user) {
      return { success: false, message: "Invalid email or password." };
    }

    if (user.status === "pending") {
      return {
        success: false,
        message: "Your seller account is waiting for admin approval.",
      };
    }

    if (user.status !== "active") {
      return { success: false, message: "This account is not active." };
    }

    if (user.role === "customer") {
      const targetStoreId = options.storeId;

      if (!targetStoreId) {
        return {
          success: false,
          message: "Customer accounts must sign in from a store page.",
        };
      }

      setState((current) => ({
        ...current,
        storeCustomerSessions: {
          ...current.storeCustomerSessions,
          [targetStoreId]: user.id,
        },
      }));

      return { success: true, user };
    }

    setCurrentUser(user);
    return { success: true, user };
  };

  const logout = (options = {}) => {
    if (options.storeId) {
      setState((current) => {
        const nextSessions = { ...current.storeCustomerSessions };
        delete nextSessions[options.storeId];

        return {
          ...current,
          storeCustomerSessions: nextSessions,
        };
      });
      return;
    }

    setCurrentUser(null);
  };

  const toggleFavorite = (storeId, productId) => {
    const customer = getStoreCustomer(storeId);

    if (!customer) {
      return;
    }

    setState((current) => {
      const customerScopes = normalizeCustomerState(current.customerState[customer.id]);
      const customerWorkspace = normalizeCustomerWorkspace(customerScopes[storeId]);
      const exists = customerWorkspace.favorites.includes(productId);

      return {
        ...current,
        customerState: {
          ...current.customerState,
          [customer.id]: {
            ...customerScopes,
            [storeId]: {
              ...customerWorkspace,
              favorites: exists
                ? customerWorkspace.favorites.filter((id) => id !== productId)
                : [...customerWorkspace.favorites, productId],
            },
          },
        },
      };
    });
  };

  const addToCart = (storeId, productId, quantity = 1, selection = {}) => {
    const customer = getStoreCustomer(storeId);

    if (!customer) {
      return { success: false, message: "Login required." };
    }

    const product = state.products.find(
      (item) => item.id === productId && item.storeId === storeId,
    );

    if (!product) {
      return { success: false, message: "Product not found." };
    }

    if (product.hasSizes && !selection.size) {
      return { success: false, message: "Size selection required." };
    }

    if (product.hasColors && !selection.color) {
      return { success: false, message: "Color selection required." };
    }

    if (getProductSelectionStock(product, selection) < Number(quantity || 1)) {
      return { success: false, message: "Not enough stock." };
    }

    setState((current) => {
      const customerScopes = normalizeCustomerState(current.customerState[customer.id]);
      const customerWorkspace = normalizeCustomerWorkspace(customerScopes[storeId]);
      const existingItem = customerWorkspace.cart.find(
        (item) =>
          item.productId === productId &&
          item.size === (selection.size || "") &&
          item.color === (selection.color || ""),
      );

      return {
        ...current,
        customerState: {
          ...current.customerState,
          [customer.id]: {
            ...customerScopes,
            [storeId]: {
              ...customerWorkspace,
              cart: existingItem
                ? customerWorkspace.cart.map((item) =>
                    item === existingItem
                      ? {
                          ...item,
                          quantity: item.quantity + Math.max(1, Number(quantity || 1)),
                        }
                      : item,
                  )
                : [
                    ...customerWorkspace.cart,
                    {
                      productId,
                      quantity: Math.max(1, Number(quantity || 1)),
                      size: selection.size || "",
                      color: selection.color || "",
                    },
                  ],
            },
          },
        },
      };
    });

    return { success: true };
  };

  const updateCartQuantity = (storeId, productId, quantity, selection = {}) => {
    const customer = getStoreCustomer(storeId);

    if (!customer) {
      return;
    }

    const normalizedQuantity = Math.max(1, Number(quantity || 1));

    setState((current) => {
      const customerScopes = normalizeCustomerState(current.customerState[customer.id]);
      const customerWorkspace = normalizeCustomerWorkspace(customerScopes[storeId]);

      return {
        ...current,
        customerState: {
          ...current.customerState,
          [customer.id]: {
            ...customerScopes,
            [storeId]: {
              ...customerWorkspace,
              cart: customerWorkspace.cart.map((item) =>
                item.productId === productId &&
                item.size === (selection.size || "") &&
                item.color === (selection.color || "")
                  ? { ...item, quantity: normalizedQuantity }
                  : item,
              ),
            },
          },
        },
      };
    });
  };

  const removeFromCart = (storeId, productId, selection = {}) => {
    const customer = getStoreCustomer(storeId);

    if (!customer) {
      return;
    }

    setState((current) => {
      const customerScopes = normalizeCustomerState(current.customerState[customer.id]);
      const customerWorkspace = normalizeCustomerWorkspace(customerScopes[storeId]);

      return {
        ...current,
        customerState: {
          ...current.customerState,
          [customer.id]: {
            ...customerScopes,
            [storeId]: {
              ...customerWorkspace,
              cart: customerWorkspace.cart.filter(
                (item) =>
                  !(
                    item.productId === productId &&
                    item.size === (selection.size || "") &&
                    item.color === (selection.color || "")
                  ),
              ),
            },
          },
        },
      };
    });
  };

  const checkoutProducts = (storeId, items) => {
    const customer = getStoreCustomer(storeId);

    if (!customer || !items.length) {
      return { success: false };
    }

    setState((current) => {
      const nextOrders = [...current.orders];
      const nextProducts = current.products.map((product) => ({ ...product }));
      const groupedByStore = new Map();

      items.forEach((item) => {
        const product = nextProducts.find((entry) => entry.id === item.productId);
        if (!product) {
          return;
        }

        const quantity = Number(item.quantity || 1);
        const selection = {
          size: item.size || "",
          color: item.color || "",
        };
        const availableStock = getProductSelectionStock(product, selection);

        if (!availableStock) {
          return;
        }

        const appliedQuantity = Math.min(quantity, availableStock);
        const store = current.stores.find((entry) => entry.id === product.storeId);
        const group = groupedByStore.get(product.storeId) || {
          storeId: product.storeId,
          storeName: store?.name || "",
          itemsCount: 0,
          total: 0,
        };

        group.itemsCount += appliedQuantity;
        group.total += product.price * appliedQuantity;
        groupedByStore.set(product.storeId, group);

        if (product.hasSizes && product.hasColors) {
          const key = `${selection.size}|${selection.color}`;
          product.variantInventory = {
            ...product.variantInventory,
            [key]: Math.max(
              0,
              Number(product.variantInventory?.[key] || 0) - appliedQuantity,
            ),
          };
        } else if (product.hasSizes) {
          product.sizeInventory = {
            ...product.sizeInventory,
            [selection.size]: Math.max(
              0,
              Number(product.sizeInventory?.[selection.size] || 0) - appliedQuantity,
            ),
          };
        } else if (product.hasColors) {
          product.colorInventory = {
            ...product.colorInventory,
            [selection.color]: Math.max(
              0,
              Number(product.colorInventory?.[selection.color] || 0) - appliedQuantity,
            ),
          };
        } else {
          product.stock = Math.max(0, product.stock - appliedQuantity);
        }

        product.stock = normalizeProduct(product).stock;
        product.sales += appliedQuantity;
      });

      groupedByStore.forEach((group) => {
        nextOrders.unshift(
          normalizeOrder({
            id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            storeId: group.storeId,
            storeName: group.storeName,
            customerName: customer.name,
            itemsCount: group.itemsCount,
            total: group.total,
            status: "processing",
            paymentStatus: "paid",
            deliveryStatus: "ready",
            createdAt: "2026-04-05",
          }),
        );
      });

      const customerScopes = normalizeCustomerState(current.customerState[customer.id]);
      const customerWorkspace = normalizeCustomerWorkspace(customerScopes[storeId]);
      const purchasedIds = new Set(
        items.map(
          (item) =>
            `${item.productId}::${item.size || ""}::${item.color || ""}`,
        ),
      );

      return {
        ...current,
        products: nextProducts,
        orders: nextOrders,
        customerState: {
          ...current.customerState,
          [customer.id]: {
            ...customerScopes,
            [storeId]: {
              ...customerWorkspace,
              cart: customerWorkspace.cart.filter(
                (item) =>
                  !purchasedIds.has(
                    `${item.productId}::${item.size || ""}::${item.color || ""}`,
                  ),
              ),
            },
          },
        },
      };
    });

    return { success: true };
  };

  const buyNow = (storeId, productId, quantity = 1, selection = {}) =>
    checkoutProducts(storeId, [
      {
        productId,
        quantity: Number(quantity || 1),
        size: selection.size || "",
        color: selection.color || "",
      },
    ]);

  const addUser = (payload) => {
    setState((current) => ({
      ...current,
      users: [
        ...current.users,
        {
          id: `user-${Date.now()}`,
          status: "active",
          ...payload,
        },
      ],
    }));
  };

  const registerCustomer = ({ name, email, password, storeId }) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !password || !name) {
      return { success: false, message: "Missing required fields." };
    }

    if (!storeId) {
      return { success: false, message: "Customer accounts must be created from a store page." };
    }

    const existingUser = state.users.some(
      (user) => user.email.toLowerCase() === normalizedEmail,
    );

    if (existingUser) {
      return { success: false, message: "This email is already registered." };
    }

    const userId = `customer-${Date.now()}`;
    const nextUser = {
      id: userId,
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: "customer",
      status: "active",
    };

    setState((current) => ({
      ...current,
      users: [...current.users, nextUser],
      customerState: {
        ...current.customerState,
        [userId]: {},
      },
      storeCustomerSessions: {
        ...current.storeCustomerSessions,
        [storeId]: userId,
      },
    }));

    return { success: true, user: nextUser };
  };

  const continueWithStoreProvider = ({ provider, storeId, email, name }) => {
    if (!storeId) {
      return { success: false, message: "Customer accounts must be created from a store page." };
    }

    const normalizedProvider = String(provider || "").toLowerCase();
    const providerLabel =
      normalizedProvider === "google"
        ? "Google"
        : normalizedProvider === "apple"
          ? "Apple"
          : "Phone";
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const generatedEmail = normalizedEmail || `${normalizedProvider}-${storeId}@smartstore.demo`;
    const generatedPassword = `${normalizedProvider}-store-access`;

    if (
      normalizedProvider === "google" &&
      normalizedEmail &&
      !normalizedEmail.endsWith("@gmail.com")
    ) {
      return { success: false, message: "Google sign-in requires a Gmail address." };
    }

    const existingUser =
      state.users.find((user) => user.email.toLowerCase() === generatedEmail) || null;

    if (existingUser) {
      setState((current) => ({
        ...current,
        storeCustomerSessions: {
          ...current.storeCustomerSessions,
          [storeId]: existingUser.id,
        },
      }));

      return { success: true, user: existingUser };
    }

    return registerCustomer({
      name: String(name || `${providerLabel} Customer`).trim(),
      email: generatedEmail,
      password: generatedPassword,
      storeId,
    });
  };

  const registerSellerRequest = (payload) => {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existingUser = state.users.some(
      (user) => user.email.toLowerCase() === normalizedEmail,
    );

    if (existingUser) {
      return { success: false, message: "This email is already registered." };
    }

    const sellerId = `seller-${Date.now()}`;

    setState((current) => {
      const storeId = `store-${Date.now() + 1}`;

      return {
        ...current,
        users: [
          ...current.users,
          {
            id: sellerId,
            name: payload.ownerName,
            email: normalizedEmail,
            password: payload.password,
            role: "seller",
            status: "pending",
          },
        ],
        stores: [
          ...current.stores,
          createStoreDefaults({
            id: storeId,
            sellerId,
            ownerName: payload.ownerName,
            ownerEmail: normalizedEmail,
            name: payload.storeName,
            category: payload.category,
            city: payload.city,
            description: payload.description,
            contactEmail: payload.contactEmail,
            contactPhone: payload.contactPhone,
            address: payload.address,
            status: "pending",
            subscription: "Free",
            monthlyRevenue: 0,
          }),
        ],
        storePreferences: {
          ...current.storePreferences,
          [storeId]: {
            lowStockThreshold: 5,
          },
        },
      };
    });

    return { success: true };
  };

  const toggleUserStatus = (userId) => {
    setState((current) => ({
      ...current,
      users: current.users.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: user.status === "active" ? "suspended" : "active",
            }
          : user,
      ),
    }));
  };

  const addStore = (payload) => {
    const newStoreId = `store-${Date.now()}`;

    setState((current) => {
      const createdStore = createStoreDefaults({
        id: newStoreId,
        monthlyRevenue: 0,
        status: "pending",
        ...payload,
      });

      return {
        ...current,
        stores: [...current.stores, createdStore],
        storePreferences: {
          ...current.storePreferences,
          [newStoreId]: {
            lowStockThreshold: 5,
          },
        },
        sellerWorkspace: payload.sellerId
          ? {
              ...current.sellerWorkspace,
              [payload.sellerId]: {
                activeStoreId: newStoreId,
              },
            }
          : current.sellerWorkspace,
      };
    });

    return newStoreId;
  };

  const updateStore = (storeId, payload) => {
    setState((current) => ({
      ...current,
      stores: current.stores.map((store) =>
        store.id === storeId ? createStoreDefaults({ ...store, ...payload }) : store,
      ),
    }));
  };

  const updateStoreStatus = (storeId, status) => {
    setState((current) => {
      const targetStore = current.stores.find((item) => item.id === storeId);
      const targetUser = current.users.find((user) => user.id === targetStore?.sellerId);

      if (!targetStore || !targetUser) {
        return current;
      }

      const updatedStores = current.stores.map((store) =>
        store.id === storeId ? { ...store, status } : store,
      );

      const sellerStores = updatedStores.filter(
        (store) => store.sellerId === targetStore.sellerId,
      );
      const hasApprovedStore = sellerStores.some((store) => store.status === "approved");
      const hasPendingStore = sellerStores.some((store) => store.status === "pending");

      return {
        ...current,
        stores: updatedStores,
        users: current.users.map((user) => {
          if (user.id !== targetStore.sellerId) {
            return user;
          }

          return {
            ...user,
            status:
              status === "approved" || hasApprovedStore || targetUser.status === "active"
                ? "active"
                : hasPendingStore
                  ? "pending"
                  : "suspended",
          };
        }),
      };
    });
  };

  const setActiveSellerStore = (sellerId, storeId) => {
    setState((current) => ({
      ...current,
      sellerWorkspace: {
        ...current.sellerWorkspace,
        [sellerId]: {
          activeStoreId: storeId,
        },
      },
    }));
  };

  const addProduct = (payload) => {
    setState((current) => ({
      ...current,
      products: [
        ...current.products,
        normalizeProduct({
          id: `product-${Date.now()}`,
          sales: 0,
          ...payload,
        }),
      ],
    }));
  };

  const updateProduct = (productId, payload) => {
    setState((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId
          ? normalizeProduct({ ...product, ...payload })
          : product,
      ),
    }));
  };

  const deleteProduct = (productId) => {
    setState((current) => ({
      ...current,
      products: current.products.filter((product) => product.id !== productId),
    }));
  };

  const generateProductDescription = ({ name, category }) =>
    createAiDescription({
      name: name || "This product",
      category: category || "General",
      language: state.language,
    });

  const updateOrderStatus = (orderId, status) => {
    setState((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              deliveryStatus:
                status === "delivered"
                  ? "delivered"
                  : status === "processing"
                    ? "ready"
                    : order.deliveryStatus,
            }
          : order,
      ),
    }));
  };

  const saveStorePreferences = (storeId, payload) => {
    setState((current) => ({
      ...current,
      storePreferences: {
        ...current.storePreferences,
        [storeId]: {
          lowStockThreshold: 5,
          ...current.storePreferences[storeId],
          ...payload,
        },
      },
    }));
  };

  const restockProduct = (productId, quantity) => {
    const amount = Number(quantity || 0);

    setState((current) => ({
      ...current,
      products: current.products.map((product) =>
        product.id === productId
          ? { ...product, stock: product.stock + amount }
          : product,
      ),
    }));
  };

  const saveSettings = (payload) => {
    setState((current) => ({
      ...current,
      settings: payload,
    }));
  };

  const setLanguage = (language) => {
    setState((current) => ({
      ...current,
      language,
      settings: {
        ...current.settings,
        defaultLanguage: language === "ar" ? "Arabic" : "English",
      },
    }));
  };

  const resetAppData = () => {
    setState(seedData);
    setCurrentUser((current) => {
      if (current?.role === "admin") {
        return seedData.users.find((user) => user.role === "admin") || null;
      }

      if (current?.role === "seller") {
        return seedData.users.find((user) => user.role === "seller") || null;
      }

      return null;
    });
  };

  const value = useMemo(
    () => ({
      users: state.users,
      stores: state.stores,
      products: state.products,
      orders: state.orders,
      storePreferences: state.storePreferences,
      sellerWorkspace: state.sellerWorkspace,
      customerState: state.customerState,
      storeCustomerSessions: state.storeCustomerSessions,
      settings: state.settings,
      language: state.language,
      currentUser,
      getStoreCustomer,
      getStoreCustomerWorkspace,
      login,
      logout,
      registerCustomer,
      continueWithStoreProvider,
      addUser,
      registerSellerRequest,
      toggleUserStatus,
      addStore,
      updateStore,
      updateStoreStatus,
      setActiveSellerStore,
      toggleFavorite,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      checkoutProducts,
      buyNow,
      addProduct,
      updateProduct,
      deleteProduct,
      generateProductDescription,
      updateOrderStatus,
      saveStorePreferences,
      restockProduct,
      saveSettings,
      setLanguage,
      resetAppData,
    }),
    [state, currentUser],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within AppProvider.");
  }

  return context;
}
