export const SC_CATEGORIES = [
  { value: "0845e8f7-0978-495e-985c-c48eb680ba57", label: "Bread Powder" },
  { value: "b9d52d4e-cc05-4ce1-be2f-587f9c126ac9", label: "Carbohydrates" },
  { value: "3e9c3147-cbcd-445f-a768-de56267b48c5", label: "Cereal" },
  { value: "a74743ff-e98d-4ad6-994d-544dcf96d4fd", label: "Dairy" },
  { value: "c7cb7c48-e5a3-42b8-88be-f50d2bef95e6", label: "Dressings" },
  { value: "0750c886-c0cb-403b-a8a5-06170d79db6a", label: "Egg" },
  { value: "d4e81f0e-39df-479c-8cdb-2fa23f470f08", label: "Flour" },
  { value: "4d427e75-caab-42c5-8b38-54e5899da4a8", label: "Fruits" },
  { value: "949e0d1c-66f9-450a-8378-2ddff7279713", label: "Grains" },
  { value: "07aad2b4-a82d-4619-9111-8bd79c33894b", label: "Meat" },
  { value: "3a38b3ba-bcbb-4c5e-abb1-3e0f5ecd5497", label: "Nuts" },
  { value: "9b21de72-7757-4a44-87e1-6cf078947e8e", label: "Oil" },
  { value: "0af3f9dc-bf50-47bc-9470-83df04df20fe", label: "Sauce" },
  { value: "088f20a9-4a21-4b01-a1e7-78572b396ac2", label: "Seeds" },
  { value: "8072c19f-4ac7-4ef2-a60a-e084b46b49b8", label: "Syrup" },
  { value: "fdfedb64-923c-4362-b6cd-26eb9a1cf4e9", label: "Tofu" },
  { value: "f47bd85c-5032-4f21-9ab5-8d077e42aa74", label: "Vegan Milk" },
  { value: "c94e71a8-62ec-47b8-b4bc-fa215c2e2f18", label: "Vegetables" },
  { value: "183b2619-f317-4414-a678-de0ffc6172e0", label: "Yeast" },
  { value: "9ee39426-6f41-42e8-95a1-18eee695f8a7", label: "Condiment" },
  { value: "e6427828-51da-4470-b595-36ba1a886541", label: "Pickles" },
];

export const SC_UOMS = ["KG", "G", "L", "ML", "UNIT", "CASE", "BOX", "BAG", "LITRE", "PIECE"].map((u) => ({ value: u, label: u }));
export const SC_STORAGE = [
  { value: "AMBIENT", label: "Ambient" },
  { value: "DRY_STORAGE", label: "Dry Storage" },
  { value: "REFRIGERATED", label: "Refrigerated" },
  { value: "FROZEN", label: "Frozen" },
];

export const MPR_EMPTY = {
  sku_code: "",
  product_name: "",
  category_id: "",
  group_search: "",
  group_id: "",
  group_name: "",
  group_code: "",
  purchase_uom: "",
  inventory_uom: "",
  purchase_to_inventory_factor: "1",
  baseline_price: "",
  price_tolerance_pct: "5",
  storage_type: "",
  shelf_life_days: "",
  vendor_item_name: "",
  vendor_item_code: "",
  vendor_uom: "",
};

export const VENDOR_EMPTY = {
  vendor_name: "",
  vendor_code: "",
  vat_number: "",
  tax_id: "",
  contact_person: "",
  phone: "",
  email: "",
  address: "",
  payment_terms_days: "30",
  category: "FOOD_SUPPLIER",
};

export const SC_VENDOR_CATEGORIES = [
  { value: "FOOD_SUPPLIER", label: "Food Supplier" },
  { value: "MEAT_POULTRY", label: "Meat & Poultry" },
  { value: "VEGETABLES_FRUITS", label: "Vegetables & Fruits" },
  { value: "DAIRY_EGGS", label: "Dairy & Eggs" },
  { value: "DRY_GOODS_SPICES", label: "Dry Goods & Spices" },
  { value: "BEVERAGES", label: "Beverages" },
  { value: "PACKAGING_SUPPLIES", label: "Packaging Supplies" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "CLEANING", label: "Cleaning & Hygiene" },
  { value: "EQUIPMENT", label: "Equipment & Services" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OTHER", label: "Other" },
];

export const SC_CODES = [
  "SC_ALLOCATE_DELIVERY",
  "QUARANTINE_REVIEW",
  "RECEIVE_DELIVERY",
  "SC_REVIEW_RECEIVING",
  "SC_REVIEW_COUNT",
  "WATCHDOG_SC_ALLOCATION_STALE",
  "WATCHDOG_DELIVERY_OVERDUE",
  "INVOICE_STALE_PARTIAL",
  "PROD_VARIANCE_REVIEW",
  "WATCHDOG_LOW_STOCK",
  "WATCHDOG_NEG_STOCK",
  "WATCHDOG_QUARANTINE_STALE",
  "WATCHDOG_AWAITING_DELIVERY_OVERDUE",
];

export const SC_REPORTS = [
  {
    sec: "Pipeline",
    items: [
      "COGS Pipeline Status",
      "Open Quarantines",
      "Discrepancy Resolution Log",
    ],
  },
  {
    sec: "Operations",
    items: [
      "Waste Value by Location",
    ],
  },
];
