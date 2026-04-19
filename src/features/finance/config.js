export const FIN_CATEGORIES = [
  {
    code: "COGS",
    name: "Cost of Goods Sold",
    posts_inventory: true,
    subs: [
      "Food & Beverage",
      "Packaging & Disposables",
      "Condiments & Additionals",
      "Central Kitchen Supplies",
    ],
  },
  {
    code: "OPEX",
    name: "Operational Expenses",
    posts_inventory: false,
    subs: [
      "Cleaning & Hygiene",
      "Small Equipment & Tools",
      "Uniforms & Workwear",
      "Printing & Stationery",
      "Fuel & Transportation",
    ],
  },
  {
    code: "UTIL",
    name: "Utilities & Bills",
    posts_inventory: false,
    subs: [
      "Electricity",
      "Water & Sewage",
      "Gas",
      "Internet & Telecommunications",
      "Waste Management",
    ],
  },
  {
    code: "RENT",
    name: "Rent & Occupancy",
    posts_inventory: false,
    subs: [
      "Rent",
      "Building Maintenance",
      "Security Services",
      "Parking & Common Areas",
    ],
  },
  {
    code: "CAPEX",
    name: "Investment & CapEx",
    posts_inventory: false,
    subs: [
      "Kitchen Equipment",
      "Furniture & Fixtures",
      "Technology & Hardware",
      "Renovation & Fit-Out",
      "Vehicles",
    ],
  },
  {
    code: "PROF",
    name: "Professional Services",
    posts_inventory: false,
    subs: [
      "Accounting & Audit",
      "Legal Services",
      "Consulting",
      "Marketing & Advertising",
      "Recruitment",
    ],
  },
  {
    code: "PAYROLL",
    name: "Payroll & HR",
    posts_inventory: false,
    subs: [
      "Gross Salaries",
      "Social Contributions",
      "Health Insurance",
      "Training & Development",
    ],
  },
  {
    code: "BANK",
    name: "Bank & Finance Charges",
    posts_inventory: false,
    subs: [
      "Transaction Fees",
      "Loan Interest",
      "Currency Exchange",
      "Late Payment Penalties",
    ],
  },
  {
    code: "TAX",
    name: "Taxes & Government Fees",
    posts_inventory: false,
    subs: [
      "VAT Payments",
      "Municipal Taxes",
      "Licensing & Permits",
      "Customs & Import Duties",
    ],
  },
  {
    code: "OTHER",
    name: "Other & Exceptional",
    posts_inventory: false,
    subs: [
      "One-Off Exceptional",
      "Donations & Sponsorships",
      "Miscellaneous",
    ],
  },
];

export const FC_REPORTS = [
  { section: "Activity", items: ["Invoice Activity", "Payment Status Overview"] },
  { section: "Exceptions", items: ["Overdue & Due Soon", "Rejection Register"] },
  { section: "Pipeline", items: ["COGS Handoff Log"] },
];
