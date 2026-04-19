import { Suspense } from "react";
import { POS_ROLES, isLeadershipRole } from "./roleRoutes";

function LoadingScreen({ ccCss }) {
  return (
    <>
      <style>{ccCss}</style>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "baseline", gap: 3, marginBottom: 20 }}>
            <span style={{ fontWeight: 800, fontSize: 22, color: "#ffffff", letterSpacing: "-0.03em" }}>
              WT360
            </span>
            <span style={{ color: "#22c55e", fontSize: 10 }}>o</span>
          </div>
          <div>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        </div>
      </div>
    </>
  );
}

function PosAccessDenied({ ccCss, roleCode }) {
  return (
    <>
      <style>{ccCss}</style>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>X</div>
          <div style={{ fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 8 }}>
            POS access not permitted
          </div>
          <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24 }}>
            Role <strong style={{ color: "#fff" }}>{roleCode}</strong> does not have POS terminal access.
          </div>
          <a
            href="/"
            style={{
              background: "var(--acc)",
              color: "#fff",
              padding: "10px 24px",
              borderRadius: 8,
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </>
  );
}

export function AppRouter({
  authUser,
  session,
  loading,
  onLogin,
  onSignOut,
  ccCss,
  components,
}) {
  const {
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
  } = components;

  if (loading) {
    return <LoadingScreen ccCss={ccCss} />;
  }

  if (!authUser || !session) {
    return (
      <>
        <style>{ccCss}</style>
        <Login onLogin={onLogin} />
      </>
    );
  }

  const roleCode = session.role_code || "";
  const path = window.location.pathname;

  let screen;

  if (path === "/pos") {
    screen = POS_ROLES.includes(roleCode)
      ? <POS onSignOut={onSignOut} />
      : <PosAccessDenied ccCss={ccCss} roleCode={roleCode} />;
  } else if (roleCode === "TECHNICAL_DIRECTOR") {
    screen = <TechnicalDirectorCC session={session} onSignOut={onSignOut} />;
  } else if (roleCode === "MARKETING_MANAGER") {
    screen = <MarketingCommandCentre session={session} onSignOut={onSignOut} />;
  } else if (roleCode === "CFO") {
    screen = <CFOCommandCentre session={session} onSignOut={onSignOut} />;
  } else if (roleCode === "SUPPLY_CHAIN_MANAGER") {
    screen = <SupplyChainCommandCentre session={session} onSignOut={onSignOut} />;
  } else if (roleCode === "FINANCE_MANAGER") {
    screen = (
      <>
        <style>{ccCss}</style>
        <FinanceCommandCentre session={session} onSignOut={onSignOut} />
      </>
    );
  } else if (roleCode === "RESTAURANT_MANAGER") {
    screen = <RestaurantManagerCC session={session} onSignOut={onSignOut} />;
  } else if (isLeadershipRole(roleCode)) {
    screen = (
      <>
        <style>{ccCss}</style>
        <CommandCentre session={session} onSignOut={onSignOut} />
      </>
    );
  } else {
    screen = <PartnersPortal session={session} onSignOut={onSignOut} />;
  }

  return (
    <Suspense fallback={<LoadingScreen ccCss={ccCss} />}>
      {screen}
    </Suspense>
  );
}
