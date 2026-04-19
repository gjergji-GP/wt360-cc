import { LeadershipHeader } from "./components/Header";
import { LeadershipHomePage } from "./components/HomePage";
import { LeadershipInboxPage } from "./components/InboxPage";
import { LeadershipPeoplePage } from "./components/PeoplePage";
import { LeadershipReportsPage } from "./components/ReportsPage";
import { LeadershipTasksPage } from "./components/TasksPage";
import { LeadershipTowerPage } from "./components/TowerPage";
import { LeadershipSidebar } from "./components/Sidebar";

export function createLeadershipComponents({
  Icon,
  Avatar,
  CalendarPicker,
  EmployeeModal,
  TaskModal,
  HROnboardModal,
  HROffboardModal,
  HRTimesheetModal,
  NewPartnerModal,
  CH,
  AreaChart,
  SparkLine,
  ScoreRing,
  KpiRow,
  HealthBar,
  AttendancePage,
  REPORTS_TREE,
  DATE_PRESETS,
  CMP_MAP,
  tLabel,
  fmtFull,
  sk,
  hc,
  resolveLocName,
  pColor,
  pLabel,
  fmtAgo,
}) {
  return {
    Sidebar: (sidebarProps) => (
      <LeadershipSidebar
        {...sidebarProps}
        reportsTree={REPORTS_TREE}
      />
    ),
    Header: (headerProps) => (
      <LeadershipHeader
        {...headerProps}
        components={{
          Icon,
          Avatar,
          CalendarPicker,
        }}
        helpers={{
          tLabel,
          datePresets: DATE_PRESETS,
          cmpMap: CMP_MAP,
          fmtFull,
        }}
      />
    ),
    HomePage: (homeProps) => (
      <LeadershipHomePage
        {...homeProps}
        components={{
          EmployeeModal,
          TaskModal,
          HROnboardModal,
          CH,
          AreaChart,
          Icon,
          SparkLine,
          ScoreRing,
          KpiRow,
          HealthBar,
          Avatar,
        }}
        helpers={{
          sk,
          cmpMap: CMP_MAP,
          hc,
          resolveLocName,
          tLabel,
        }}
      />
    ),
    TowerPage: (towerProps) => (
      <LeadershipTowerPage
        {...towerProps}
        components={{
          TaskModal,
          HROnboardModal,
        }}
        helpers={{
          tLabel,
          resolveLocName,
          pColor,
          pLabel,
          fmtAgo,
        }}
      />
    ),
    TasksPage: (tasksProps) => (
      <LeadershipTasksPage
        {...tasksProps}
        components={{
          TaskModal,
          HROnboardModal,
          HROffboardModal,
          HRTimesheetModal,
        }}
        helpers={{
          tLabel,
          pColor,
          pLabel,
          fmtAgo,
        }}
      />
    ),
    InboxPage: (inboxProps) => (
      <LeadershipInboxPage
        {...inboxProps}
        helpers={{
          fmtAgo,
        }}
      />
    ),
    PeoplePage: (peopleProps) => (
      <LeadershipPeoplePage
        {...peopleProps}
        components={{
          EmployeeModal,
          NewPartnerModal,
          Avatar,
          Icon,
        }}
        helpers={{
          hc,
          fmtFull,
        }}
      />
    ),
    ReportsPage: (reportsProps) => (
      <LeadershipReportsPage
        {...reportsProps}
        components={{
          Icon,
        }}
        helpers={{
          reportsTree: REPORTS_TREE,
        }}
      />
    ),
    AttendancePage,
    Icon,
  };
}
