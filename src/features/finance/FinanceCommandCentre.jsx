import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/common/Icon";
import { fmtFull } from "../../lib/leadershipHelpers";
import { SB } from "../../lib/supabase";
import { AlertStrip } from "./components/AlertStrip";
import { AttendancePage } from "./components/AttendancePage";
import { ClassifyModal } from "./components/ClassifyModal";
import { DaysBadge, SourceBadge, StatusPill, TicketBadge } from "./components/FinanceBadges";
import { FCHomePage } from "./components/FCHomePage";
import { FCInboxPage } from "./components/FCInboxPage";
import { FCLedgerPage } from "./components/FCLedgerPage";
import { FCReportsPage } from "./components/FCReportsPage";
import { FinanceHeader } from "./components/FinanceHeader";
import { FinanceSidebar } from "./components/FinanceSidebar";
import { InvoiceDetailPanel } from "./components/InvoiceDetailPanel";
import { NewInvoiceModal } from "./components/NewInvoiceModal";
import { fmtCurrency } from "./formatters";

export function FinanceCommandCentre({ session, onSignOut, deps }) {
  const { DATE_PRESETS, CalendarPicker, HRInjectShiftModal } = deps;
  const [page, setPage] = useState("fc-home");
  const [exp, setExp] = useState(true);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [activeReport, setActiveReport] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [ebills, setEbills] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [detailInv, setDetailInv] = useState(null);
  const [classifyInv, setClassifyInv] = useState(null);
  const [newInvOpen, setNewInvOpen] = useState(false);
  const [datePreset, setDatePreset] = useState("Last 30 days");
  const sidebarWidth = exp ? "var(--sbw)" : "var(--sbw-col)";

  const getFCDateRange = (preset) => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    if (preset === "Today") return { from: start, to: end };
    if (preset === "Yesterday") {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
      return { from: start, to: end };
    }
    if (preset === "Last 7 days") {
      start.setDate(start.getDate() - 6);
      return { from: start, to: end };
    }
    start.setDate(start.getDate() - 29);
    return { from: start, to: end };
  };

  const loadData = useCallback(async () => {
    const brandId = session?.brand_id;
    const [invoiceRes, ebillsRes, taskRes] = await Promise.all([
      SB.from("fiscal_invoices").select("*").eq("brand_id", brandId).order("received_at", { ascending: false }).limit(1000),
      SB.from("ebills_purchase_invoices").select("*").order("issue_date_time", { ascending: false }).limit(500),
      SB.from("tasks").select("*").eq("brand_id", brandId).in("status", ["OPEN", "IN_PROGRESS", "OVERDUE"]).limit(50),
    ]);
    if (invoiceRes.data) setInvoices(invoiceRes.data);
    if (ebillsRes.data) setEbills(ebillsRes.data);
    if (taskRes.data) setTasks(taskRes.data);
  }, [session?.brand_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const pendingCount = invoices.filter((invoice) => invoice.source === "EBILLS" && invoice.status === "PENDING").length;
  const flagCount = tasks.filter((task) =>
    ["FINANCE_POST_INVOICE", "INVOICE_PAYMENT_DUE", "WATCHDOG_ESCALATION"].includes(task.task_type_code),
  ).length;
  const { from: fcFrom, to: fcTo } = getFCDateRange(datePreset);
  const dateFilteredInvoices = invoices.filter((invoice) => {
    const date = new Date(invoice.invoice_date || invoice.received_at || invoice.created_at || 0);
    return date >= fcFrom && date <= fcTo;
  });
  const dateFilteredEbills = ebills.filter((invoice) => {
    const date = new Date(invoice.issue_date_time || 0);
    return date >= fcFrom && date <= fcTo;
  });
  const overdue = dateFilteredInvoices.filter(
    (invoice) => invoice.status === "APPROVED_FOR_PAYMENT" && invoice.pay_deadline && new Date(invoice.pay_deadline) < new Date(),
  );
  const awaitingPay = dateFilteredInvoices.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT");
  const overdueAmt = overdue.reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0);
  const awaitingAmt = awaitingPay.reduce((sum, invoice) => sum + (+(invoice.tot_price || invoice.total_amount) || 0), 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <FinanceSidebar
        page={page}
        setPage={setPage}
        exp={exp}
        setExp={setExp}
        reportsOpen={reportsOpen}
        setReportsOpen={setReportsOpen}
        activeReport={activeReport}
        setActiveReport={(report) => {
          setActiveReport(report);
          setPage("fc-reports");
        }}
        session={session}
        pendingCount={pendingCount}
        flagCount={flagCount}
        notifCount={0}
        onSignOut={onSignOut}
      />
      <div
        style={{
          marginLeft: sidebarWidth,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          transition: "margin-left .20s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <FinanceHeader page={page} session={session} onNewInvoice={() => setNewInvOpen(true)} datePreset={datePreset} onDateChange={setDatePreset} />
        <AlertStrip
          pending={pendingCount}
          overdue={overdue.length}
          overdueAmt={overdueAmt}
          awaitingPay={awaitingPay.length}
          awaitingAmt={awaitingAmt}
          quarantine={0}
          flags={flagCount}
          onNav={setPage}
        />
        <div className="main-content">
          <div className="page-max">
            {page === "fc-home" && (
              <FCHomePage
                invoices={dateFilteredInvoices}
                ebills={dateFilteredEbills}
                tasks={tasks}
                setPage={setPage}
                session={session}
                onRefresh={loadData}
                pendingEbills={invoices.filter((invoice) => invoice.source === "EBILLS" && invoice.status === "PENDING")}
                deps={{ fmtCurrency, fmtFull, DaysBadge, SourceBadge, TicketBadge }}
              />
            )}
            {page === "fc-inbox" && (
              <FCInboxPage
                ebills={ebills}
                invoices={invoices}
                onClassify={setClassifyInv}
                onDetail={setDetailInv}
                deps={{ TicketBadge, fmtFull, DaysBadge, fmtCurrency, SourceBadge, StatusPill }}
              />
            )}
            {page === "fc-ledger" && (
              <FCLedgerPage
                invoices={invoices}
                onDetail={setDetailInv}
                deps={{ fmtCurrency, TicketBadge, SourceBadge, fmtFull, DaysBadge, StatusPill }}
              />
            )}
            {page === "fc-reports" && (
              <FCReportsPage
                activeReport={activeReport}
                invoices={invoices}
                ebills={ebills}
                deps={{ TicketBadge, SourceBadge, StatusPill, fmtFull, fmtCurrency, DaysBadge }}
              />
            )}
            {page === "fc-tasks" && (
              <div className="fade-up">
                <div className="card" style={{ overflow: "hidden" }}>
                  <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--divider)", fontWeight: 700, fontSize: 13.5 }}>
                    Finance Action Queue
                  </div>
                  {tasks.filter((task) =>
                    ["FINANCE_POST_INVOICE", "INVOICE_PAYMENT_DUE", "WATCHDOG_ESCALATION"].includes(task.task_type_code),
                  ).length === 0 ? (
                    <div style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
                      <Icon name="check" size={32} color="var(--pos)" />
                      <div style={{ marginTop: 12, fontWeight: 600, color: "var(--pos)" }}>All clear</div>
                    </div>
                  ) : (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Priority</th>
                          <th>Due</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks
                          .filter((task) =>
                            ["FINANCE_POST_INVOICE", "INVOICE_PAYMENT_DUE", "WATCHDOG_ESCALATION"].includes(task.task_type_code),
                          )
                          .map((task) => (
                            <tr key={task.id} className="rh">
                              <td style={{ fontSize: 12.5, color: "var(--sub)", fontWeight: 500 }}>
                                {task.task_type_code?.replace(/_/g, " ")}
                              </td>
                              <td style={{ fontSize: 12.5 }}>{task.title || task.description || "-"}</td>
                              <td>
                                <span
                                  style={{
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    color: task.priority >= 4 ? "var(--neg)" : task.priority >= 3 ? "var(--warn)" : "var(--sub)",
                                  }}
                                >
                                  {task.priority ? `P${task.priority}` : "-"}
                                </span>
                              </td>
                              <td>
                                <DaysBadge dueDate={task.due_at} />
                              </td>
                              <td>
                                <span className={`badge ${task.status === "OVERDUE" ? "badge-r" : task.status === "IN_PROGRESS" ? "badge-b" : "badge-o"}`}>
                                  {task.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            {page === "fc-notif" && (
              <div className="fade-up" style={{ maxWidth: 640 }}>
                <div className="card" style={{ padding: "48px", textAlign: "center", color: "var(--muted)" }}>
                  <Icon name="bell" size={32} color="var(--muted)" />
                  <div style={{ marginTop: 12 }}>No finance notifications.</div>
                </div>
              </div>
            )}
            {page === "fc-attendance" && (
              <AttendancePage
                session={session}
                locations={[]}
                brands={[]}
                employees={[]}
                allLocations={[]}
                deps={{ DATE_PRESETS, CalendarPicker, HRInjectShiftModal }}
              />
            )}
          </div>
        </div>
      </div>
      {detailInv && <InvoiceDetailPanel invoice={detailInv} onClose={() => setDetailInv(null)} />}
      {classifyInv && (
        <ClassifyModal
          invoice={classifyInv}
          onClose={() => setClassifyInv(null)}
          onClassified={() => {
            setClassifyInv(null);
            loadData();
          }}
        />
      )}
      {newInvOpen && (
        <NewInvoiceModal
          onClose={() => setNewInvOpen(false)}
          onSaved={() => {
            setNewInvOpen(false);
            loadData();
            setPage("fc-ledger");
          }}
          session={session}
        />
      )}
    </div>
  );
}
