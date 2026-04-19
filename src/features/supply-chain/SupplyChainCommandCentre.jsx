import { useCallback, useEffect, useState } from "react";
import { SB } from "../../lib/supabase";
import { MprSelectInput, MprTextInput } from "./components/MprFields";
import { SCAllocPage } from "./components/SCAllocPage";
import { SCAllocDetail } from "./components/SCAllocDetail";
import { SCDiscrepancyLog } from "./components/SCDiscrepancyLog";
import { SCDiscDetail } from "./components/SCDiscDetail";
import { SCHome } from "./components/SCHome";
import { SCIcon } from "./components/SCIcon";
import { SCQuarPriceLineCard } from "./components/SCQuarPriceLineCard";
import { SCQuarDetail } from "./components/SCQuarDetail";
import { SCQuarPriceDetail, SCQuarUnknownDetail } from "./components/SCQuarantineDetails";
import { SCQuarPage } from "./components/SCQuarPage";
import { SCRecvPage } from "./components/SCRecvPage";
import { SCReceivingReview } from "./components/SCReceivingReview";
import { SCReportsPage } from "./components/SCReportsPage";
import { SCSidebar } from "./components/SCSidebar";
import { SCStatusBar } from "./components/SCStatusBar";
import { SCHeader } from "./components/SCHeader";
import { SCTasksPage } from "./components/SCTasksPage";
import { SCAllocOverview, SCEmpty, SCKpi, SCMasterData, SCPipeline, SCQuarPressure, SCRecvFollowUp, SPH, SCWastePanel } from "./components/SupportWidgets";
import { SC_CODES, MPR_EMPTY, SC_CATEGORIES, SC_STORAGE, SC_UOMS, SC_VENDOR_CATEGORIES, VENDOR_EMPTY } from "./config";
import { DISC_COLOR, DISC_TYPE_LABEL, RES_TYPE_LABEL, STATUS_COLOR } from "./discrepancyConfig";
import { scAge, scAmt, scHrs } from "./helpers";
import { SC_CSS } from "./styles";

export function SupplyChainCommandCentre({ session, onSignOut }) {
  const SI = SCIcon;
  const [page, setPage] = useState("sc-home");
  const [exp, setExp] = useState(true);
  const [datePreset, setDP] = useState("Last 7 days");
  const [search, setSearch] = useState("");
  const [activeReport, setAR] = useState(null);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);
  const [activeBrand, setActiveBrand] = useState(session?.brand_id || null);
  const [tasks, setTasks] = useState([]);
  const [quarantines, setQuar] = useState([]);
  const [procTasks, setPT] = useState([]);
  const [recvTasks, setRT] = useState([]);
  const [tickets, setTix] = useState([]);
  const [reviewTasks, setReviewTasks] = useState([]);
  const [selReview, setSelReview] = useState(null);
  const [waste, setWaste] = useState([]);
  const [invoices, setInv] = useState([]);
  const [vpm, setVpm] = useState([]);
  const [seenTasks, setSeenTasks] = useState(null);
  const [seenAlloc, setSeenAlloc] = useState(null);

  useEffect(() => {
    SB.from("brand_configs").select("brand_id,brand_name").then(({ data }) => {
      if (data) setBrands(data.map((brand) => ({ id: brand.brand_id, name: brand.brand_name })));
    });
  }, []);

  const getRange = useCallback((preset) => {
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(now);
    to.setHours(23, 59, 59, 999);
    if (preset === "Today") return { from, to };
    if (preset === "Yesterday") {
      from.setDate(from.getDate() - 1);
      to.setDate(to.getDate() - 1);
      return { from, to };
    }
    if (preset === "Last 7 days") {
      from.setDate(from.getDate() - 6);
      return { from, to };
    }
    from.setDate(from.getDate() - 29);
    return { from, to };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const brandId = activeBrand || session?.brand_id;
    const { from, to } = getRange(datePreset);
    const fromISO = from.toISOString();
    const toISO = to.toISOString();
    const fromDate = fromISO.split("T")[0];
    const toDate = toISO.split("T")[0];

    const [taskRes, quarRes, procRes, recvRes, ticketRes, wasteRes, invoiceRes, mappingRes, doneAllocRes] = await Promise.all([
      SB.from("tasks").select("*").in("task_type_code", SC_CODES).in("status", ["OPEN", "IN_PROGRESS", "CLAIMED", "OVERDUE"]).order("created_at", { ascending: false }).limit(200),
      SB.from("quarantine_tickets").select("*, quarantine_lines(*), fiscal_invoices(id,vendor_name_raw,ebills_fic), vendors(id,vendor_name,name)").in("status", ["OPEN", "CLOSED"]).order("created_at", { ascending: false }).limit(200),
      SB.from("procurement_tasks").select("*").order("created_at", { ascending: false }).limit(100),
      SB.from("tasks").select("*").eq("task_type_code", "RECEIVE_DELIVERY").in("status", ["OPEN", "CLAIMED", "OVERDUE"]).order("created_at", { ascending: false }).limit(100),
      SB.from("receiving_tickets").select("*,fiscal_invoices(vendor_name_raw),locations(name)").gte("received_at", fromISO).lte("received_at", toISO).order("received_at", { ascending: false }).limit(200),
      SB.from("waste_logs").select("*").gte("waste_date", fromDate).lte("waste_date", toDate).limit(500),
      SB.from("fiscal_invoices").select("id,status,source,invoice_date,classified_at,vendor_name_raw,brand_id").eq("brand_id", brandId).gte("invoice_date", fromDate).order("invoice_date", { ascending: false }).limit(500),
      SB.from("vendor_product_mappings").select("id,is_provisional,mapped_at,created_at").limit(500),
      SB.from("tasks").select("*").eq("task_type_code", "SC_ALLOCATE_DELIVERY").eq("status", "DONE").order("created_at", { ascending: false }).limit(200),
    ]);

    const fiVendorMap = {};
    (invoiceRes.data || []).forEach((invoice) => {
      fiVendorMap[invoice.id] = invoice.vendor_name_raw;
    });

    const enrichTasks = (list) =>
      (list || []).map((task) => {
        const fiId = task.payload?.fiscal_invoice_id || task.entity_id;
        return fiVendorMap[fiId] ? { ...task, vendor_name: fiVendorMap[fiId] } : task;
      });

    if (taskRes.data) setTasks(enrichTasks(taskRes.data));
    if (quarRes.data) setQuar(quarRes.data.map((ticket) => ({ ...ticket, vendor_name_raw: ticket.fiscal_invoices?.vendor_name_raw || ticket.vendor_name_raw || null })));
    if (procRes.data) setPT(procRes.data);
    if (recvRes.data) setRT(recvRes.data);
    if (ticketRes.data) setTix(ticketRes.data.map((ticket) => ({ ...ticket, vendor_name: ticket.fiscal_invoices?.vendor_name_raw || "-", location_name: ticket.locations?.name || ticket.location_name || "-" })));

    const { data: reviewData } = await SB.from("tasks").select("*").eq("task_type_code", "SC_REVIEW_RECEIVING").in("status", ["OPEN", "IN_PROGRESS", "OVERDUE"]).order("created_at", { ascending: false }).limit(100);
    if (reviewData) setReviewTasks(reviewData);
    if (wasteRes.data) setWaste(wasteRes.data);
    if (invoiceRes.data) setInv(invoiceRes.data);
    if (mappingRes.data) setVpm(mappingRes.data);

    if (doneAllocRes.data) {
      const doneFiIds = doneAllocRes.data.map((task) => task.payload?.fiscal_invoice_id || task.entity_id).filter((id) => id && !fiVendorMap[id]);
      if (doneFiIds.length > 0) {
        const { data: extraInvoices } = await SB.from("fiscal_invoices").select("id,vendor_name_raw").in("id", doneFiIds);
        (extraInvoices || []).forEach((invoice) => {
          fiVendorMap[invoice.id] = invoice.vendor_name_raw;
        });
      }
      setTasks((prev) => [...prev, ...enrichTasks(doneAllocRes.data)]);
    }

    setLoading(false);
  }, [activeBrand, datePreset, getRange, session?.brand_id]);

  useEffect(() => {
    load();
  }, [load]);

  const openAlloc = tasks.filter((task) => task.task_type_code === "SC_ALLOCATE_DELIVERY" && task.status !== "DONE").length;
  const openTasks = tasks.filter((task) => task.task_type_code !== "SC_ALLOCATE_DELIVERY" && task.status !== "DONE").length;
  const openQuar = quarantines.filter((ticket) => ticket.status === "OPEN").length;
  const blocked = new Set(quarantines.filter((ticket) => ticket.status === "OPEN" && ticket.fiscal_invoice_id).map((ticket) => ticket.fiscal_invoice_id)).size;
  const awaitRecv = recvTasks.length;
  const overdueSLA = 0;
  const wasteAmt = waste.reduce((sum, row) => sum + (+(row.total_cost) || 0), 0);
  const allActive = [...tasks, ...quarantines.filter((ticket) => ticket.status === "OPEN")];
  const oldest = allActive.reduce((acc, item) => (!acc || new Date(item.created_at) < new Date(acc.created_at) ? item : acc), null);

  const pipe = {
    unclassified: invoices.filter((invoice) => invoice.status === "PENDING").length,
    awaitSC: openAlloc,
    inQuar: blocked,
    verified: invoices.filter((invoice) => invoice.status === "APPROVED_FOR_PAYMENT").length,
    allocated: procTasks.filter((task) => task.pre_allocation_done_at).length,
    awaitRecv,
    received: tickets.length,
    oldest: oldest?.created_at,
    oldestHrs: oldest ? scHrs(oldest.created_at) : null,
    throughput: invoices.length,
    avgH: null,
  };

  const homeData = {
    kpis: { openAlloc, openQuar, highSev: 0, medSev: 0, blocked, awaitRecv, overdueSLA, wasteAmt },
    pipe,
    quarantines,
    procTasks,
    recvTasks,
    waste,
    vpm,
  };

  const taskBadge = seenTasks === null ? openTasks : Math.max(0, openTasks - seenTasks);
  const allocBadge = seenAlloc === null ? openAlloc : Math.max(0, openAlloc - seenAlloc);

  const handleSetPage = (nextPage) => {
    if (nextPage === "sc-tasks") setSeenTasks(openTasks);
    if (nextPage === "sc-alloc") setSeenAlloc(openAlloc);
    setPage(nextPage);
  };

  const sidebarWidth = exp ? "232px" : "58px";

  useEffect(() => {
    document.documentElement.style.setProperty("--sc-overlay-left", sidebarWidth);
    return () => document.documentElement.style.removeProperty("--sc-overlay-left");
  }, [sidebarWidth]);

  return (
    <div className="sc-root" style={{ "--sc-overlay-left": sidebarWidth }}>
      <style>{SC_CSS}</style>
      <SCSidebar page={page} setPage={handleSetPage} exp={exp} setExp={setExp} session={session} openAlloc={allocBadge} openQuar={openQuar} overdueSLA={overdueSLA} onSignOut={onSignOut} taskBadge={taskBadge} activeReport={activeReport} setActiveReport={setAR} />
      <div style={{ marginLeft: sidebarWidth, flex: 1, display: "flex", flexDirection: "column", transition: "margin-left .2s cubic-bezier(.4,0,.2,1)" }}>
        <SCHeader page={page} session={session} datePreset={datePreset} onDateChange={setDP} search={search} setSearch={setSearch} brands={brands} activeBrand={activeBrand} onBrandChange={setActiveBrand} />
        <SCStatusBar openQuar={openQuar} overdueSLA={overdueSLA} blocked={blocked} onRefresh={load} />
        <div className="sc-main">
          <div className="sc-page">
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
                <div style={{ textAlign: "center" }}>
                  <SI n="pkg" s={32} c="var(--sc-muted)" />
                  <div style={{ marginTop: 12, fontSize: 13, color: "var(--sc-muted)" }}>Loading SC data...</div>
                </div>
              </div>
            ) : (
              <>
                {page === "sc-home" && <SCHome d={homeData} setPage={setPage} deps={{ scAmt, SCKpi, SCPipeline, SCQuarPressure, SCAllocOverview, SCRecvFollowUp, SCMasterData, SCWastePanel }} />}
                {page === "sc-tasks" && <SCTasksPage tasks={tasks} search={search} exp={exp} onReload={load} deps={{ SCEmpty, SCAllocDetail: (props) => <SCAllocDetail {...props} deps={{ SB }} /> }} />}
                {page === "sc-quar" && <SCQuarPage quarantines={quarantines} search={search} onReload={load} deps={{ SCEmpty, SCQuarDetail: (props) => <SCQuarDetail {...props} deps={{ SCQuarUnknownDetail: (detailProps) => <SCQuarUnknownDetail {...detailProps} deps={{ SB, SI, scAge, scAmt, _MprTextInput: MprTextInput, _MprSelectInput: MprSelectInput, _MPR_EMPTY: MPR_EMPTY, _VENDOR_EMPTY: VENDOR_EMPTY, SC_VENDOR_CATEGORIES, SC_CATEGORIES, SC_UOMS, SC_STORAGE }} />, SCQuarPriceDetail: (detailProps) => <SCQuarPriceDetail {...detailProps} deps={{ SI, scAge, scAmt, SCQuarPriceLineCard: (lineProps) => <SCQuarPriceLineCard {...lineProps} deps={{ SB, scAmt }} /> }} /> }} /> }} />}
                {page === "sc-alloc" && <SCAllocPage tasks={tasks} search={search} onReload={load} deps={{ SCEmpty, SCAllocDetail: (props) => <SCAllocDetail {...props} deps={{ SB }} />, SPH }} />}
                {page === "sc-recv" && <SCRecvPage tickets={tickets} recvTasks={recvTasks} reviewTasks={reviewTasks} onReload={load} search={search} onOpenReview={setSelReview} deps={{ SCEmpty }} />}
                {page === "sc-reports" && <SCReportsPage activeReport={activeReport} data={{ quarantines, waste, procTasks, invoices, tickets, session }} deps={{ SCDiscrepancyLog: (props) => <SCDiscrepancyLog {...props} deps={{ SB, SCDiscDetail, DISC_TYPE_LABEL, RES_TYPE_LABEL, STATUS_COLOR, DISC_COLOR }} />, scAmt }} />}
                {page === "sc-notif" && <div className="sc-fu" style={{ maxWidth: 640 }}><div className="sc-panel sc-empty"><SI n="bell" s={28} c="var(--sc-muted)" /><div style={{ marginTop: 12, fontSize: 13 }}>No SC notifications</div></div></div>}
              </>
            )}
          </div>
        </div>
      </div>
      {selReview && <SCReceivingReview task={selReview.task} readOnly={selReview.readOnly} deps={{ SB }} onClose={() => setSelReview(null)} onResolved={() => { setSelReview(null); load(); }} />}
    </div>
  );
}
