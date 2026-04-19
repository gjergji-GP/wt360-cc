export const ROLE_OPTIONS = [
  {code:"BOH_ASSISTANT",label:"BOH Assistant"},
  {code:"BOH_SUPERVISOR",label:"BOH Supervisor"},
  {code:"FOH_OPERATOR",label:"FOH Operator"},
  {code:"FOH_SUPERVISOR",label:"FOH Supervisor"},
  {code:"POS_STAFF",label:"POS Staff"},
  {code:"KITCHEN_OPERATOR",label:"Kitchen Operator"},
  {code:"RESTAURANT_MANAGER",label:"Restaurant Manager"},
  {code:"LOCATION_MANAGER",label:"Location Manager"},
  {code:"CK_MANAGER",label:"Central Kitchen Manager"},
  {code:"OPERATIONAL_LEADER",label:"Operational Leader"},
  {code:"HR_MANAGER",label:"HR Manager"},
  {code:"FINANCE_MANAGER",label:"Finance Assistant"},
  {code:"SUPPLY_CHAIN_MANAGER",label:"Supply Chain Manager"},
  {code:"CFO",label:"CFO"},
  {code:"COO",label:"COO"},
  {code:"SYSTEM_ADMIN",label:"System Admin"},
];

export const DEPT_OPTIONS = ["BOH","FOH","OPERATIONS","MARKETING","HR","FINANCE","CUSTOMER EXPERIENCE"];

export const NATIONALITY_OPTIONS = [
  "Albanian","American","Austrian","Belgian","British","Bulgarian","Canadian","Croatian",
  "Czech","Danish","Dutch","Finnish","French","German","Greek","Hungarian","Irish",
  "Italian","Latvian","Lithuanian","Luxembourgish","Maltese","Norwegian","Polish",
  "Portuguese","Romanian","Serbian","Slovak","Slovenian","Spanish","Swedish","Swiss","Other"
];

export const DATE_PRESETS = ["Today","Yesterday","Last 7 days","Last 30 days","This month","Custom"];
export const uuid = (v) => (v && v !== "null" && v.length > 10) ? v : null;
export const CMP_MAP = {
  "Today":"tasks due or created today","Yesterday":"tasks from yesterday",
  "Last 7 days":"tasks from past 7 days","Last 30 days":"tasks from past 30 days",
  "This month":"tasks this month","Custom":"custom date range"
};
export const REPORTS_TREE = [
  {section:"Executive Summary",items:["Brand Overview","Operational Health Trend","Risk Register Summary","HQ Action Summary","Weekly Leadership Pack"]},
  {section:"Workforce",items:["Headcount Overview","Headcount by Location","Hires & Departures","Turnover Report","Probation Tracker","Expiring Contracts"]},
  {section:"Compliance",items:["Document Compliance Overview","Missing Documents","Expired Documents","Expiring Documents","Compliance by Location","Compliance by Employee"]},
  {section:"Performance",items:["Overall Performance Overview","Score Distribution","Below Threshold Employees","Performance by Location","Rank Tables"]},
  {section:"Attendance & Reliability",items:["Attendance Overview","Punctuality Report","Reliability Report","Shift Completion Report","Absenteeism by Location"]},
  {section:"Mood & Wellbeing",items:["Mood Trend","Rough Mood Streaks","Wellbeing Overview","Response Rates","High-Risk Mood Cases"]},
  {section:"Tasks & Alerts",items:["Open Tasks","Overdue Tasks","Unclaimed Tasks","Due Today","Task Category Breakdown","Alert Feed History","SLA Breach Report"]},
  {section:"Locations",items:["Location Health Ranking","Location Score Trends","Location Compliance","Location Staffing","Location Mood","Location Backlog"]},
  {section:"HQ",items:["HQ Task Backlog","HQ Staff Compliance","HQ Actions by Category","HQ Aging Report"]},
  {section:"People",items:["Employee Directory Analytics","Employee Card Drilldowns","Forensic Flags","Risk Scoring","Inbox Read Rate","Task Completion"]},
];
