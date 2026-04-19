export const RM_EMP_TYPES = [
  { v: "FULL_TIME", l: "Full-time" },
  { v: "PART_TIME", l: "Part-time" },
  { v: "CONTRACT", l: "Contract" },
  { v: "CASUAL", l: "Casual" },
];

export const RM_OFFBOARD_REASONS = [
  { v: "RESIGNED", l: "Resigned" },
  { v: "TERMINATED", l: "Terminated" },
  { v: "END_OF_CONTRACT", l: "End of Contract" },
  { v: "PROBATION_FAIL", l: "Probation Failed" },
  { v: "MUTUAL_AGREEMENT", l: "Mutual Agreement" },
  { v: "OTHER", l: "Other" },
];

export const RM_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function rmGetMonday(date = new Date()) {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - (day === 0 ? 6 : day - 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function rmFmtDate(date) {
  return date?.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) || "-";
}

export function rmWeekLabel(monday) {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return `${rmFmtDate(monday)} - ${rmFmtDate(sunday)}`;
}

export function rmToISO(date) {
  return date.toISOString().split("T")[0];
}

export function getRmOperationalRoles(roleOptions) {
  return roleOptions.filter((role) =>
    !["HR_MANAGER", "FINANCE_MANAGER", "SUPPLY_CHAIN_LEAD", "TECHNICAL_DIRECTOR", "PARTNER_PORTAL"].includes(role.code)
  );
}
