import { lazy } from "react";
import { AppRouter } from "./app/router/AppRouter";
import { CMP_MAP, DATE_PRESETS, DEPT_OPTIONS, NATIONALITY_OPTIONS, REPORTS_TREE, ROLE_OPTIONS, uuid } from "./app/constants";
import { Icon } from "./components/common/Icon";
import { Login } from "./features/auth/Login";
import { useAuthSession } from "./features/auth/useAuthSession";
import { SUPABASE_CONFIG_ERROR } from "./lib/supabase";
import { CC_CSS } from "./styles/commandCentreCss";

const POS = lazy(async () => ({ default: (await import("./features/pos/POS")).POS }));
const PartnersPortal = lazy(async () => ({ default: (await import("./features/partner-portal/PartnersPortal")).PartnersPortal }));
const MarketingCommandCentre = lazy(async () => ({ default: (await import("./features/marketing/MarketingCommandCentre")).MarketingCommandCentre }));
const TechnicalDirectorCC = lazy(async () => ({ default: (await import("./features/technical-director/TechnicalDirectorCC")).TechnicalDirectorCC }));
const CFOCommandCentre = lazy(async () => ({ default: (await import("./features/cfo/CFOCommandCentre")).CFOCommandCentre }));

const SupplyChainCommandCentre = lazy(async () => {
  const [{ SupplyChainCommandCentre }, { SCErrorBoundary }] = await Promise.all([
    import("./features/supply-chain/SupplyChainCommandCentre"),
    import("./features/supply-chain/SCErrorBoundary"),
  ]);

  return {
    default: function SupplyChainScreen(props) {
      return (
        <SCErrorBoundary>
          <SupplyChainCommandCentre {...props} />
        </SCErrorBoundary>
      );
    },
  };
});

const FinanceCommandCentre = lazy(async () => {
  const [
    { FinanceCommandCentre },
    { CalendarPicker },
    { HRInjectShiftModal },
  ] = await Promise.all([
    import("./features/finance/FinanceCommandCentre"),
    import("./components/common/CalendarPicker"),
    import("./features/hr/HRInjectShiftModal"),
  ]);

  return {
    default: function FinanceScreen(props) {
      return (
        <FinanceCommandCentre
          {...props}
          deps={{ DATE_PRESETS, CalendarPicker, HRInjectShiftModal }}
        />
      );
    },
  };
});

const RestaurantManagerCC = lazy(async () => {
  const [
    { RestaurantManagerCC },
    helpers,
    modals,
    ui,
    styles,
  ] = await Promise.all([
    import("./features/restaurant-manager/RestaurantManagerCC"),
    import("./features/restaurant-manager/helpers"),
    import("./features/restaurant-manager/RMModals"),
    import("./features/restaurant-manager/RMUI"),
    import("./features/restaurant-manager/styles"),
  ]);

  return {
    default: function RestaurantManagerScreen(props) {
      return (
        <RestaurantManagerCC
          {...props}
          deps={{
            RM_CSS: styles.RM_CSS,
            RMOnboardModal: modals.RMOnboardModal,
            RMOffboardModal: modals.RMOffboardModal,
            RMGrnModal: modals.RMGrnModal,
            Icon,
            rmGetMonday: helpers.rmGetMonday,
            rmToISO: helpers.rmToISO,
            rmWeekLabel: helpers.rmWeekLabel,
            RMCard: ui.RMCard,
            RMSectionLabel: ui.RMSectionLabel,
            RMStatusBadge: ui.RMStatusBadge,
            RM_DAYS: helpers.RM_DAYS,
            ROLE_OPTIONS,
            DEPT_OPTIONS,
            RM_EMP_TYPES: helpers.RM_EMP_TYPES,
            RM_OFFBOARD_REASONS: helpers.RM_OFFBOARD_REASONS,
            RMField: ui.RMField,
          }}
        />
      );
    },
  };
});

const CommandCentre = lazy(async () => {
  const [
    { LeadershipCommandCentreEntry },
    metrics,
    { hc },
    { Avatar },
    { CalendarPicker },
    { ConfirmDeleteModal },
    { HrEmployeeModal },
    taskWorkflows,
    { NewPartnerModal },
    { AttendancePage },
    helpers,
    { SB },
  ] = await Promise.all([
    import("./features/leadership/CommandCentreEntry"),
    import("./components/charts/metrics"),
    import("./components/charts/healthColor"),
    import("./components/common/Avatar"),
    import("./components/common/CalendarPicker"),
    import("./components/common/ConfirmDeleteModal"),
    import("./features/hr/EmployeeModal"),
    import("./features/hr/TaskWorkflows"),
    import("./features/leadership/NewPartnerModal"),
    import("./features/finance/components/AttendancePage"),
    import("./lib/leadershipHelpers"),
    import("./lib/supabase"),
  ]);
  const { HrOffboardModal, HrOnboardModal, HrTaskModal, HrTimesheetModal } = taskWorkflows;

  return {
    default: function LeadershipScreen(props) {
      return (
        <LeadershipCommandCentreEntry
          {...props}
          dependencies={{
            Icon,
            Avatar,
            CalendarPicker,
            EmployeeModal: (modalProps) => (
              <HrEmployeeModal
                {...modalProps}
                deps={{
                  SB,
                  uuid,
                  NATIONALITY_OPTIONS,
                  DEPT_OPTIONS,
                  ConfirmDeleteModal,
                  Avatar,
                  Icon,
                  fmtFull: helpers.fmtFull,
                  fmtAgo: helpers.fmtAgo,
                  tLabel: helpers.tLabel,
                }}
              />
            ),
            TaskModal: (modalProps) => (
              <HrTaskModal
                {...modalProps}
                deps={{
                  Icon,
                  resolveLocName: helpers.resolveLocName,
                  tLabel: helpers.tLabel,
                  pColor: helpers.pColor,
                  pLabel: helpers.pLabel,
                  fmtFull: helpers.fmtFull,
                }}
              />
            ),
            HROnboardModal: (modalProps) => (
              <HrOnboardModal
                {...modalProps}
                deps={{
                  SB,
                  Icon,
                }}
              />
            ),
            HROffboardModal: (modalProps) => (
              <HrOffboardModal
                {...modalProps}
                deps={{
                  SB,
                  Avatar,
                  Icon,
                }}
              />
            ),
            HRTimesheetModal: (modalProps) => (
              <HrTimesheetModal
                {...modalProps}
                deps={{
                  SB,
                  Avatar,
                  Icon,
                }}
              />
            ),
            NewPartnerModal,
            CH: metrics.CH,
            AreaChart: metrics.AreaChart,
            SparkLine: metrics.SparkLine,
            ScoreRing: metrics.ScoreRing,
            KpiRow: metrics.KpiRow,
            HealthBar: metrics.HealthBar,
            AttendancePage,
            REPORTS_TREE,
            DATE_PRESETS,
            CMP_MAP,
            tLabel: helpers.tLabel,
            fmtFull: helpers.fmtFull,
            sk: helpers.sk,
            hc,
            resolveLocName: helpers.resolveLocName,
            pColor: helpers.pColor,
            pLabel: helpers.pLabel,
            fmtAgo: helpers.fmtAgo,
          }}
        />
      );
    },
  };
});

function ConfigErrorScreen() {
  return (
    <>
      <style>{CC_CSS}</style>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          background: "var(--bg)",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 720,
            padding: 28,
            borderRadius: 18,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 10 }}>
            CONFIGURATION REQUIRED
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", marginBottom: 12, letterSpacing: "-0.03em" }}>
            Supabase environment variables are missing
          </div>
          <div style={{ fontSize: 14, color: "var(--sub)", lineHeight: 1.6, marginBottom: 20 }}>
            The app cannot start without a valid Supabase project URL and anon key. Add them to a local <code>.env</code> file in the project root, then restart the dev server.
          </div>
          <div
            style={{
              background: "var(--faint)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 16,
              fontFamily: "monospace",
              fontSize: 13,
              whiteSpace: "pre-wrap",
              color: "var(--ink)",
              marginBottom: 20,
            }}
          >
            {`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {SUPABASE_CONFIG_ERROR}
          </div>
        </div>
      </div>
    </>
  );
}

function AppContent() {
  const { authUser, session, loading, handleLogin, handleSignOut } = useAuthSession();

  return (
    <AppRouter
      authUser={authUser}
      session={session}
      loading={loading}
      onLogin={handleLogin}
      onSignOut={handleSignOut}
      ccCss={CC_CSS}
      components={{
        Login,
        POS,
        CommandCentre,
        PartnersPortal,
        RestaurantManagerCC,
        FinanceCommandCentre,
        SupplyChainCommandCentre,
        MarketingCommandCentre,
        TechnicalDirectorCC,
        CFOCommandCentre,
      }}
    />
  );
}

export default function App() {
  if (SUPABASE_CONFIG_ERROR) {
    return <ConfigErrorScreen />;
  }

  return <AppContent />;
}
