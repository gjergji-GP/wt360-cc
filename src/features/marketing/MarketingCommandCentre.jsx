import { useEffect, useState } from "react";
import { Icon } from "../../components/common/Icon";
import { SB } from "../../lib/supabase";
import { SbItem, StagePill, ActivationPill, WtBtn, WtCard, WtEmpty, WtField, WtInput, WtKpi, WtModal, WtPageHeader, WtSelect, WtTextarea, WtToast } from "../mlc/shared";
import { useMLCData } from "../mlc/useMLCData";
import { WT } from "../mlc/tokens";

export function MarketingCommandCentre({ session, onSignOut }) {
  const brandId = session?.brand_id || "a2911ac0-bcac-42c4-b39b-fed6813d321e";
  const empId = session?.employee_id;
  const [page, setPage] = useState("overview");
  const [exp, setExp] = useState(true);
  const { products, loading, reload } = useMLCData(brandId);
  const [locations, setLocations] = useState([]);
  const [showNewBrief, setShowNewBrief] = useState(false);
  const [activateModal, setActivateModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newBriefForm, setNewBriefForm] = useState({
    name: "",
    internal_code: "",
    product_type: "FINAL",
    category_code: "BOWL",
    working_title: "",
    positioning: "",
    strategic_rationale: "",
    target_selling_price: "",
    target_margin_floor_pct: "40",
    channel_intent: ["DINE_IN"],
  });
  const [actForm, setActForm] = useState({ locationIds: [], channelTypes: ["DINE_IN"], liveAt: "" });

  useEffect(() => {
    SB.from("locations").select("id,name,code").eq("brand_id", brandId).then(({ data }) => setLocations(data || []));
    setActForm((f) => ({ ...f, liveAt: new Date().toISOString().slice(0, 16) }));
  }, [brandId]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const draftBriefs = products.filter((p) => p.menu_product_lifecycle?.lifecycle_stage === "BRIEF_DRAFT");
  const submittedBriefs = products.filter((p) => p.menu_product_lifecycle?.lifecycle_stage === "BRIEF_SUBMITTED");
  const needsAction = products.filter((p) => ["BRIEF_REVISION_REQUESTED", "FINANCE_REJECTED"].includes(p.menu_product_lifecycle?.lifecycle_stage));
  const approvedReady = products.filter((p) => p.menu_product_lifecycle?.lifecycle_stage === "APPROVED_READY");
  const liveProducts = products.filter((p) => p.menu_product_activations?.some((a) => a.activation_status === "LIVE"));
  const inactiveProducts = products.filter((p) => p.menu_product_activations?.some((a) => a.activation_status === "INACTIVE") && !p.menu_product_activations?.some((a) => a.activation_status === "LIVE"));
  const deferred = products.filter((p) => p.menu_product_lifecycle?.lifecycle_stage === "DEFERRED");

  const createBrief = async () => {
    if (!newBriefForm.name || !newBriefForm.internal_code || !newBriefForm.working_title) {
      showToast("Complete the required brief fields", "error");
      return;
    }
    setCreating(true);
    try {
      const { data: prod, error: pe } = await SB.from("menu_products").insert({
        brand_id: brandId,
        name: newBriefForm.name,
        internal_code: newBriefForm.internal_code,
        product_type: newBriefForm.product_type,
        category_code: newBriefForm.category_code,
        status: "ACTIVE",
      }).select().single();
      if (pe) throw pe;
      const { error: be } = await SB.from("product_briefs").insert({
        product_id: prod.id,
        brief_status: "DRAFT",
        working_title: newBriefForm.working_title,
        positioning: newBriefForm.positioning,
        strategic_rationale: newBriefForm.strategic_rationale,
        target_selling_price: parseFloat(newBriefForm.target_selling_price || 0),
        target_margin_floor_pct: parseFloat(newBriefForm.target_margin_floor_pct || 0),
        channel_intent: newBriefForm.channel_intent,
      });
      if (be) throw be;
      setShowNewBrief(false);
      showToast("Brief created");
      reload();
    } catch (e) {
      showToast(e.message, "error");
    }
    setCreating(false);
  };

  const submitBrief = async (briefId) => {
    try {
      const { error } = await SB.rpc("mlc_submit_brief", { p_brief_id: briefId, p_actor_id: empId });
      if (error) throw error;
      showToast("Brief submitted to Technical Director");
      reload();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const scheduleActivation = async () => {
    if (!activateModal) return;
    try {
      const { error } = await SB.rpc("mlc_schedule_activation", {
        p_product_id: activateModal.id,
        p_location_ids: actForm.locationIds,
        p_channel_types: actForm.channelTypes,
        p_live_at: actForm.liveAt,
        p_actor_id: empId,
      });
      if (error) throw error;
      setActivateModal(null);
      showToast("Activation scheduled");
      reload();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const requestReactivation = async (productId) => {
    try {
      const { error } = await SB.rpc("mlc_request_reactivation", { p_product_id: productId, p_actor_id: empId });
      if (error) throw error;
      showToast("Reactivation requested");
      reload();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const deactivate = async (productId) => {
    try {
      const { error } = await SB.rpc("mlc_deactivate", { p_product_id: productId, p_reason_code: "STRATEGY", p_actor_id: empId });
      if (error) throw error;
      showToast("Product deactivated");
      reload();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const NAV = [
    { id: "overview", iconName: "dashboard", label: "Overview" },
    { id: "briefs", iconName: "file", label: "Briefs", badge: draftBriefs.length + submittedBriefs.length + needsAction.length || null },
    { id: "ready", iconName: "checkcircle", label: "Approved", badge: approvedReady.length || null },
    { id: "live", iconName: "radio", label: "Live", badge: liveProducts.length || null },
    { id: "inactive", iconName: "calendar", label: "Inactive", badge: inactiveProducts.length || null },
    { id: "deferred", iconName: "pause", label: "Deferred", badge: deferred.length || null },
  ];

  const briefCards = (items, empty) =>
    items.length === 0 ? (
      <WtCard><WtEmpty icon="file" title={empty} subtitle="No products in this state right now" /></WtCard>
    ) : (
      items.map((p) => {
        const brief = p.product_briefs?.sort((a, b) => (b.brief_no || 0) - (a.brief_no || 0))[0];
        const lc = p.menu_product_lifecycle;
        return (
          <WtCard key={p.id} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: WT.textStrong, marginBottom: 8 }}>
                  {p.name}
                  <span style={{ fontSize: 11, fontWeight: 400, color: WT.textTertiary, marginLeft: 8 }}>{p.internal_code}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <StagePill stage={lc?.lifecycle_stage} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                  <WtField label="Target Price" value={brief?.target_selling_price ? `${brief.target_selling_price} ALL` : "-"} />
                  <WtField label="Margin Floor" value={brief?.target_margin_floor_pct ? `${brief.target_margin_floor_pct}%` : "-"} />
                  <WtField label="Channels" value={brief?.channel_intent?.join(", ") || "-"} />
                </div>
              </div>
              {brief?.id && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexShrink: 0 }}>
                  {lc?.lifecycle_stage === "BRIEF_DRAFT" && <WtBtn size="sm" onClick={() => submitBrief(brief.id)}>Submit</WtBtn>}
                  {lc?.lifecycle_stage === "BRIEF_REVISION_REQUESTED" && <WtBtn size="sm" onClick={() => submitBrief(brief.id)}>Resubmit</WtBtn>}
                </div>
              )}
            </div>
          </WtCard>
        );
      })
    );

  const sidebar = (
    <div style={{ width: exp ? 232 : 64, minHeight: "100vh", background: WT.shellDark, display: "flex", flexDirection: "column", transition: "width 0.18s", flexShrink: 0, borderRight: `1px solid ${WT.shellBorder}` }}>
      <div style={{ padding: "18px 14px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${WT.shellBorder}`, cursor: "pointer", justifyContent: exp ? "flex-start" : "center" }} onClick={() => setExp((e) => !e)}>
        <div style={{ width: 28, height: 28, borderRadius: WT.rSm, background: WT.blue600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 12, fontFamily: WT.font }}>W</span>
        </div>
        {exp && <span style={{ fontWeight: 800, fontSize: 14, color: WT.textOnDark, fontFamily: WT.font }}>WT360 Marketing</span>}
      </div>
      <nav style={{ flex: 1, padding: "8px 8px", overflowY: "auto" }}>
        {NAV.map((item) => <SbItem key={item.id} {...item} active={page === item.id} exp={exp} onClick={() => setPage(item.id)} />)}
      </nav>
      <div style={{ padding: "8px 8px", borderTop: `1px solid ${WT.shellBorder}` }}>
        <SbItem label="Sign out" iconName="logout" active={false} exp={exp} onClick={onSignOut} />
      </div>
    </div>
  );

  const overviewPage = (
    <div style={{ padding: "28px 32px", fontFamily: WT.font }}>
      <WtPageHeader title="Marketing Command Centre" subtitle={`${session?.employee_name || "Marketing"} · product launch and lifecycle desk`} action={<WtBtn onClick={() => setShowNewBrief(true)}><Icon name="plus" size={15} /> New Brief</WtBtn>} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        <WtKpi label="Draft Briefs" value={draftBriefs.length} sub="Being prepared" />
        <WtKpi label="Awaiting TD" value={submittedBriefs.length} sub="Submitted to technical" />
        <WtKpi label="Needs Action" value={needsAction.length} color={needsAction.length > 0 ? WT.warning600 : WT.textStrong} sub="Returned or rejected" />
        <WtKpi label="Ready to Launch" value={approvedReady.length} color={approvedReady.length > 0 ? WT.success600 : WT.textStrong} sub="Awaiting activation" />
      </div>
      <WtCard style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: WT.textStrong, marginBottom: 12 }}>Launch Queue</div>
        {approvedReady.length === 0 ? <WtEmpty icon="checkcircle" title="No products ready to launch" subtitle="CFO-approved products appear here." /> : approvedReady.slice(0, 5).map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${WT.divider}` }}>
            <div>
              <div style={{ fontWeight: 600, color: WT.textStrong }}>{p.name}</div>
              <div style={{ fontSize: 12, color: WT.textSecondary }}>{p.internal_code}</div>
            </div>
            <WtBtn size="sm" onClick={() => setActivateModal(p)}>Schedule Activation</WtBtn>
          </div>
        ))}
      </WtCard>
      <WtCard>
        <div style={{ fontWeight: 700, fontSize: 15, color: WT.textStrong, marginBottom: 12 }}>Live Portfolio</div>
        {liveProducts.length === 0 ? <WtEmpty icon="radio" title="No live products" subtitle="Schedule approved products to activate them." /> : liveProducts.slice(0, 6).map((p) => (
          <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${WT.divider}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ActivationPill status="LIVE" />
              <span style={{ fontWeight: 600, color: WT.textStrong }}>{p.name}</span>
            </div>
            <WtBtn size="sm" variant="secondary" onClick={() => deactivate(p.id)}>Deactivate</WtBtn>
          </div>
        ))}
      </WtCard>
    </div>
  );

  const pages = {
    overview: overviewPage,
    briefs: <div style={{ padding: "28px 32px", fontFamily: WT.font }}><WtPageHeader title="Briefs" subtitle="Drafts, submissions, and action-required briefs" action={<WtBtn onClick={() => setShowNewBrief(true)}><Icon name="plus" size={15} /> New Brief</WtBtn>} />{briefCards([...draftBriefs, ...submittedBriefs, ...needsAction], "No active briefs")}</div>,
    ready: <div style={{ padding: "28px 32px", fontFamily: WT.font }}><WtPageHeader title="Approved & Ready" subtitle="Products approved for launch" />{approvedReady.length === 0 ? <WtCard><WtEmpty icon="checkcircle" title="Queue is clear" subtitle="Products appear here after finance approval." /></WtCard> : approvedReady.map((p) => <WtCard key={p.id} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontWeight: 700, color: WT.textStrong }}>{p.name}</div><div style={{ fontSize: 12, color: WT.textSecondary }}>{p.internal_code}</div></div><WtBtn onClick={() => setActivateModal(p)}>Schedule Activation</WtBtn></div></WtCard>)}</div>,
    live: <div style={{ padding: "28px 32px", fontFamily: WT.font }}><WtPageHeader title="Live Portfolio" subtitle="Currently active menu products" />{liveProducts.length === 0 ? <WtCard><WtEmpty icon="radio" title="No live products" subtitle="Schedule approved products to activate them." /></WtCard> : liveProducts.map((p) => <WtCard key={p.id} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><ActivationPill status="LIVE" /><span style={{ fontWeight: 700, color: WT.textStrong }}>{p.name}</span></div><WtBtn size="sm" variant="secondary" onClick={() => deactivate(p.id)}>Deactivate</WtBtn></div></WtCard>)}</div>,
    inactive: <div style={{ padding: "28px 32px", fontFamily: WT.font }}><WtPageHeader title="Seasonal / Inactive" subtitle="Products eligible for reactivation" />{inactiveProducts.length === 0 ? <WtCard><WtEmpty icon="calendar" title="No inactive products" subtitle="Deactivated products appear here." /></WtCard> : inactiveProducts.map((p) => <WtCard key={p.id} style={{ marginBottom: 12 }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ fontWeight: 700, color: WT.textStrong }}>{p.name}</div><div style={{ fontSize: 12, color: WT.textSecondary }}>{p.internal_code}</div></div><WtBtn size="sm" onClick={() => requestReactivation(p.id)}>Request Reactivation</WtBtn></div></WtCard>)}</div>,
    deferred: <div style={{ padding: "28px 32px", fontFamily: WT.font }}><WtPageHeader title="Deferred Products" subtitle="Products on hold after finance review" />{deferred.length === 0 ? <WtCard><WtEmpty icon="pause" title="No deferred products" subtitle="Deferred products appear here." /></WtCard> : deferred.map((p) => <WtCard key={p.id} style={{ marginBottom: 12 }}><div style={{ fontWeight: 700, color: WT.textStrong }}>{p.name}</div><div style={{ marginTop: 8 }}><StagePill stage="DEFERRED" /></div></WtCard>)}</div>,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: WT.bgApp }}>
      {sidebar}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? <div style={{ padding: 40, fontFamily: WT.font, color: WT.textSecondary }}>Loading marketing data...</div> : pages[page] || overviewPage}
      </div>

      <WtModal open={showNewBrief} onClose={() => setShowNewBrief(false)} title="New Product Brief" width={680}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <WtInput label="Product Name *" value={newBriefForm.name} onChange={(e) => setNewBriefForm((f) => ({ ...f, name: e.target.value }))} />
          <WtInput label="Internal Code *" value={newBriefForm.internal_code} onChange={(e) => setNewBriefForm((f) => ({ ...f, internal_code: e.target.value }))} />
          <WtSelect label="Product Type" value={newBriefForm.product_type} onChange={(e) => setNewBriefForm((f) => ({ ...f, product_type: e.target.value }))}>
            <option value="FINAL">Final Product</option>
            <option value="SEMI_FINISHED">Semi-Finished</option>
          </WtSelect>
          <WtInput label="Category" value={newBriefForm.category_code} onChange={(e) => setNewBriefForm((f) => ({ ...f, category_code: e.target.value }))} />
          <WtInput label="Working Title *" value={newBriefForm.working_title} onChange={(e) => setNewBriefForm((f) => ({ ...f, working_title: e.target.value }))} style={{ gridColumn: "1 / -1" }} />
          <WtTextarea label="Positioning" value={newBriefForm.positioning} onChange={(e) => setNewBriefForm((f) => ({ ...f, positioning: e.target.value }))} style={{ gridColumn: "1 / -1" }} />
          <WtTextarea label="Strategic Rationale" value={newBriefForm.strategic_rationale} onChange={(e) => setNewBriefForm((f) => ({ ...f, strategic_rationale: e.target.value }))} style={{ gridColumn: "1 / -1" }} />
          <WtInput label="Target Price (ALL)" type="number" value={newBriefForm.target_selling_price} onChange={(e) => setNewBriefForm((f) => ({ ...f, target_selling_price: e.target.value }))} />
          <WtInput label="Margin Floor %" type="number" value={newBriefForm.target_margin_floor_pct} onChange={(e) => setNewBriefForm((f) => ({ ...f, target_margin_floor_pct: e.target.value }))} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <WtBtn variant="secondary" onClick={() => setShowNewBrief(false)}>Cancel</WtBtn>
          <WtBtn onClick={createBrief} disabled={creating}>{creating ? "Creating..." : "Create Brief"}</WtBtn>
        </div>
      </WtModal>

      <WtModal open={!!activateModal} onClose={() => setActivateModal(null)} title="Schedule Activation" width={560}>
        <div style={{ display: "grid", gap: 16 }}>
          <WtInput label="Go Live At" type="datetime-local" value={actForm.liveAt} onChange={(e) => setActForm((f) => ({ ...f, liveAt: e.target.value }))} />
          <WtSelect label="Location" value={actForm.locationIds[0] || ""} onChange={(e) => setActForm((f) => ({ ...f, locationIds: e.target.value ? [e.target.value] : [] }))}>
            <option value="">Select location</option>
            {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </WtSelect>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <WtBtn variant="secondary" onClick={() => setActivateModal(null)}>Cancel</WtBtn>
          <WtBtn onClick={scheduleActivation}>Schedule</WtBtn>
        </div>
      </WtModal>

      <WtToast toast={toast} />
    </div>
  );
}
