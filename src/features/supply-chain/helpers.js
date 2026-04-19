export const scAmt = (value) =>
  value == null || value === "" ? "-" : `${(+value).toLocaleString("en-US", { maximumFractionDigits: 0 })} ALL`;

export const scDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export const scTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : "-";

export const scHrs = (value) => (value ? Math.round((Date.now() - new Date(value)) / 3600000) : null);

export const scAge = (value) => {
  if (!value) return "-";
  const hours = scHrs(value);
  if (hours < 1) return "<1h";
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
};

export const ageCls = (hours) => (hours == null ? "sp-x" : hours > 48 ? "sp-r" : hours > 24 ? "sp-o" : "sp-x");

export const sevCls = (severity) =>
  ({ HIGH: "sev-h", MEDIUM: "sev-m", WARNING: "sev-l", LOW: "sev-l" }[severity] || "sev-l");

export const trigTag = (trigger) =>
  ({ UNKNOWN_SKU: "st-unk", PRICE_DEVIATION: "st-price", UOM_MISMATCH: "st-uom", VENDOR_MISMATCH: "st-vendor" }[
    trigger
  ] || "st-unk");

export const trigLbl = (trigger) =>
  ({
    UNKNOWN_SKU: "Unknown SKU",
    PRICE_DEVIATION: "Price Deviation",
    UOM_MISMATCH: "UOM Mismatch",
    VENDOR_MISMATCH: "Vendor Mismatch",
  }[trigger] ||
  trigger?.replace(/_/g, " ") ||
  "-");

export const scPColor = (priority) => (priority >= 4 ? "var(--sc-neg)" : priority >= 3 ? "var(--sc-warn)" : "var(--sc-sub)");

export const taskLbl = (code) =>
  ({
    SC_ALLOCATE_DELIVERY: "Allocate Delivery",
    QUARANTINE_REVIEW: "Quarantine Review",
    RECEIVE_DELIVERY: "Receive Delivery",
    SC_REVIEW_RECEIVING: "Review Receiving",
    SC_REVIEW_COUNT: "Review Count",
    WATCHDOG_SC_ALLOCATION_STALE: "Stale Allocation",
    WATCHDOG_DELIVERY_OVERDUE: "Delivery Overdue",
    INVOICE_STALE_PARTIAL: "Stale Partial",
    PROD_VARIANCE_REVIEW: "Variance Review",
    WATCHDOG_LOW_STOCK: "Low Stock",
    WATCHDOG_NEG_STOCK: "Negative Stock",
    WATCHDOG_QUARANTINE_STALE: "Stale Quarantine",
    WATCHDOG_AWAITING_DELIVERY_OVERDUE: "Awaiting Delivery Overdue",
  }[code] ||
  code?.replace(/_/g, " ") ||
  "-");
