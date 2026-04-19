import { useEffect, useState } from "react";

export function SCQuarUnknownDetail({ ticket, onClose, onResolved, deps }) {
  const {
    SB,
    SI,
    scAge,
    scAmt,
    _MprTextInput,
    _MprSelectInput,
    _MPR_EMPTY,
    _VENDOR_EMPTY,
    SC_VENDOR_CATEGORIES,
    SC_CATEGORIES,
    SC_UOMS,
    SC_STORAGE,
  } = deps;

  const lines = ticket.quarantine_lines || [];
  const _autoCode = (name) => (name || "").toUpperCase().replace(/[^A-Z0-9 ]/g, "").split(" ").filter(Boolean).map((w) => w.slice(0, 3)).join("").slice(0, 8);
  const _initName = ticket.vendor_name_raw || "";
  const _initNipt = ticket.seller_nipt || "";
  const _initForm = {
    ..._VENDOR_EMPTY,
    vendor_name: _initName,
    vendor_code: _autoCode(_initName),
    vat_number: _initNipt,
    tax_id: _initNipt,
  };

  const [vendorId, setVendorId] = useState(ticket.vendor_id || null);
  const [vendorName, setVendorName] = useState(_initName);
  const [sellerNipt, setSellerNipt] = useState("");
  const [niptLoading, setNiptLoading] = useState(false);
  const [vendorMode, setVendorMode] = useState(null);
  const [vForm, setVForm] = useState(_initForm);
  const [vBusy, setVBusy] = useState(false);
  const [vErr, setVErr] = useState("");
  const [vOk, setVOk] = useState(false);

  const [selLine, setSelLine] = useState(null);
  const [mprMode, setMprMode] = useState(null);
  const [form, setForm] = useState(_MPR_EMPTY);
  const [groupResults, setGroupResults] = useState([]);
  const [groupBusy, setGroupBusy] = useState(false);
  const [mprBusy, setMprBusy] = useState(false);
  const [mprErr, setMprErr] = useState("");
  const [mprOk, setMprOk] = useState(false);

  const vendorMissing = !vendorId;

  useEffect(() => {
    if (!ticket.fiscal_invoice_id) return;
    SB.from("fiscal_invoices")
      .select("ebills_fic, vendor_name_raw, vendor_id, vendors(id, vendor_name, name)")
      .eq("id", ticket.fiscal_invoice_id)
      .single()
      .then(({ data: fi }) => {
        if (fi?.vendor_id) {
          const vn = fi.vendors?.vendor_name || fi.vendors?.name || fi.vendor_name_raw || "";
          setVendorId(fi.vendor_id);
          setVendorName(vn);
        } else {
          SB.from("quarantine_tickets")
            .select("vendor_id, vendors(id, vendor_name, name)")
            .eq("id", ticket.id)
            .single()
            .then(({ data: qt }) => {
              if (qt?.vendor_id) {
                const vn = qt.vendors?.vendor_name || qt.vendors?.name || "";
                setVendorId(qt.vendor_id);
                setVendorName(vn);
              }
            });
        }
        if (!fi?.ebills_fic) return;
        setNiptLoading(true);
        SB.from("ebills_purchase_invoices")
          .select("seller_name, seller_nipt, seller_country")
          .eq("fic", fi.ebills_fic)
          .single()
          .then(({ data: epi }) => {
            setNiptLoading(false);
            if (!epi) return;
            const nipt = epi.seller_nipt || "";
            setSellerNipt(nipt);
            setVForm((f) => ({
              ...f,
              vendor_name: f.vendor_name || fi.vendor_name_raw || epi.seller_name || "",
              vendor_code: f.vendor_code || _autoCode(fi.vendor_name_raw || epi.seller_name || ""),
              vat_number: f.vat_number || nipt,
              tax_id: f.tax_id || nipt,
            }));
          });
      });
  }, [SB, ticket.fiscal_invoice_id, ticket.id]);

  useEffect(() => {
    if (!sellerNipt) return;
    setVForm((f) => ({
      ...f,
      vat_number: f.vat_number || sellerNipt,
      tax_id: f.tax_id || sellerNipt,
    }));
  }, [sellerNipt]);

  const setV = (k, v) => setVForm((f) => ({ ...f, [k]: v }));
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitVendor = async () => {
    if (!vForm.vendor_name.trim()) {
      setVErr("Vendor name is required.");
      return;
    }
    if (niptLoading) {
      setVErr("NIPT still loading from eBills - wait a moment.");
      return;
    }
    if (!vForm.vat_number.trim()) {
      setVErr("VAT / NIPT is required.");
      return;
    }
    setVBusy(true);
    setVErr("");
    try {
      const { data: v, error: vE } = await SB.from("vendors").insert({
        name: vForm.vendor_name.trim(),
        vendor_name: vForm.vendor_name.trim(),
        vendor_code: vForm.vendor_code.trim() || null,
        vat_number: vForm.vat_number.trim(),
        tax_id: vForm.tax_id.trim() || vForm.vat_number.trim(),
        contact_person: vForm.contact_person.trim() || null,
        phone: vForm.phone.trim() || null,
        email: vForm.email.trim() || null,
        address: vForm.address.trim() || null,
        payment_terms_days: parseInt(vForm.payment_terms_days) || 30,
        category: vForm.category || null,
        status: "ACTIVE",
      }).select("id,name").single();
      if (vE) throw vE;
      await SB.from("quarantine_tickets").update({ vendor_id: v.id }).eq("id", ticket.id);
      await SB.from("fiscal_invoices").update({ vendor_id: v.id }).eq("id", ticket.fiscal_invoice_id);
      setVendorId(v.id);
      setVendorName(v.name);
      setVOk(true);
      setTimeout(() => {
        setVendorMode(null);
        setVOk(false);
      }, 1200);
    } catch (e) {
      setVErr(e.message || "Error registering vendor");
      setVBusy(false);
    }
  };

  const openMpr = async (line) => {
    setSelLine(line);
    setMprMode("create");
    setMprErr("");
    setMprOk(false);
    setForm({
      ..._MPR_EMPTY,
      sku_code: "",
      product_name: line.product_name_raw || "",
      baseline_price: line.unit_price || "",
      purchase_uom: line.uom || "",
      inventory_uom: line.uom || "",
      vendor_item_name: line.product_name_raw || "",
      vendor_item_code: line.vendor_item_code || "",
      vendor_uom: line.uom || "",
    });
    const { data } = await SB.rpc("generate_sku_code", { p_name: null });
    if (data) set("sku_code", data);
  };

  const searchGroups = async (q) => {
    if (!q || q.length < 2) {
      setGroupResults([]);
      return;
    }
    setGroupBusy(true);
    const { data } = await SB.from("product_groups").select("id,group_name,group_code").ilike("group_name", `%${q}%`).limit(10);
    setGroupResults(data || []);
    setGroupBusy(false);
  };

  const selectGroup = (g) => {
    set("group_id", g.id);
    set("group_name", g.group_name);
    set("group_code", g.group_code);
    set("group_search", g.group_name);
    setGroupResults([]);
  };

  const validate = () => {
    if (!form.sku_code.trim()) return "SKU Code is required.";
    if (!form.product_name.trim()) return "Product Name is required.";
    if (!form.category_id) return "Category is required.";
    if (!form.group_id) return "Group is required - search and select one.";
    if (!form.purchase_uom) return "Purchase UOM is required.";
    if (!form.inventory_uom) return "Inventory UOM is required.";
    if (!form.purchase_to_inventory_factor || isNaN(+form.purchase_to_inventory_factor)) return "Conversion factor required.";
    if (!form.baseline_price || isNaN(+form.baseline_price)) return "Baseline price required.";
    if (!form.storage_type) return "Storage type is required.";
    return null;
  };

  const submitMpr = async () => {
    const err = validate();
    if (err) {
      setMprErr(err);
      return;
    }
    setMprBusy(true);
    setMprErr("");
    try {
      const { data: mp, error: mpErr } = await SB.from("master_products").insert({
        sku_code: form.sku_code.trim(),
        product_name: form.product_name.trim(),
        category_id: form.category_id,
        group_id: form.group_id,
        purchase_uom: form.purchase_uom,
        inventory_uom: form.inventory_uom,
        purchase_to_inventory_factor: parseFloat(form.purchase_to_inventory_factor),
        baseline_price: parseFloat(form.baseline_price),
        last_purchase_price: parseFloat(form.baseline_price),
        price_tolerance_pct: parseFloat(form.price_tolerance_pct) || 5,
        storage_type: form.storage_type,
        shelf_life_value: form.shelf_life_days ? parseInt(form.shelf_life_days) : null,
        shelf_life_unit: form.shelf_life_days ? "DAYS" : null,
        primary_vendor_id: vendorId || null,
        status: "ACTIVE",
        is_new_sku: true,
      }).select("id").single();
      if (mpErr) throw mpErr;

      let nipt = sellerNipt || "";
      if (!nipt && ticket.fiscal_invoice_id) {
        const { data: fi2 } = await SB.from("fiscal_invoices").select("ebills_fic").eq("id", ticket.fiscal_invoice_id).single();
        if (fi2?.ebills_fic) {
          const { data: epi2 } = await SB.from("ebills_purchase_invoices").select("seller_nipt").eq("fic", fi2.ebills_fic).single();
          nipt = epi2?.seller_nipt || "";
        }
      }
      const { error: vpmErr } = await SB.from("vendor_product_mappings").insert({
        master_product_id: mp.id,
        vendor_id: vendorId || null,
        seller_nipt: nipt || null,
        vendor_item_name: form.vendor_item_name || selLine.product_name_raw || "",
        vendor_item_code: form.vendor_item_code || null,
        vendor_uom: form.vendor_uom || form.purchase_uom,
        conversion_factor: parseFloat(form.purchase_to_inventory_factor),
        baseline_price: parseFloat(form.baseline_price),
        is_provisional: true,
        match_confidence: "NEW_MPR_CREATED",
        match_count: 1,
      });
      if (vpmErr) throw new Error(`VPM registration failed: ${vpmErr.message}`);

      await SB.from("quarantine_lines").update({
        status: "APPROVED_UPDATE",
        product_id: mp.id,
        resolution_note: "NEW_MPR_SKU_REGISTERED",
        resolved_at: new Date().toISOString(),
      }).eq("id", selLine.id);

      if (selLine.ebills_line_id) {
        await SB.from("ebills_invoice_lines").update({
          master_product_id: mp.id,
          mapping_status: "RESOLVED",
        }).eq("id", selLine.ebills_line_id);
      }

      const remaining = lines.filter((l) => l.id !== selLine.id && l.status === "PENDING");
      if (remaining.length === 0) {
        await SB.from("quarantine_tickets").update({ status: "CLOSED", closed_at: new Date().toISOString() }).eq("id", ticket.id);
      }

      setMprOk(true);
      setTimeout(() => {
        setMprMode(null);
        setMprOk(false);
        setSelLine(null);
        onResolved();
      }, 1500);
    } catch (e) {
      setMprErr(e.message || "Error registering SKU");
      setMprBusy(false);
    }
  };

  const sec = (title) => (
    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10, marginTop: 16, paddingBottom: 6, borderBottom: "1px solid var(--sc-divider)" }}>{title}</div>
  );

  return (
    <div className="sc-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sc-dp" style={{ width: "100%", maxWidth: 780 }}>
        <div className="sc-dp-hdr">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span className="sc-tag st-unk">Unknown SKU</span>
              {vendorMissing && <span className="sc-tag st-price">Unregistered Vendor</span>}
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--sc-muted)" }}>{ticket.ticket_number}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--sc-ink)" }}>{vendorName || "Unknown Vendor"}</div>
            {sellerNipt && <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 2, fontFamily: "monospace" }}>NIPT: {sellerNipt}</div>}
          </div>
          <button className="sc-dp-close" onClick={onClose}><SI n="x" s={15} c="var(--sc-ink)" /></button>
        </div>
        <div className="sc-dp-body">
          <div className="sc-g3" style={{ marginBottom: 20 }}>
            {[
              { l: "Ticket #", v: ticket.ticket_number },
              { l: "Status", v: ticket.status },
              { l: "Lines", v: `${ticket.total_lines || lines.length} blocked` },
              { l: "Age", v: scAge(ticket.created_at) },
              { l: "Invoice", v: ticket.fiscal_invoice_id?.slice(-8) || "-" },
              { l: "Vendor", v: vendorId ? vendorName : "Not registered" },
            ].map((x, i) => (
              <div key={i} className="sc-ib">
                <div className="sc-ib-l">{x.l}</div>
                <div className="sc-ib-v" style={!vendorId && x.l === "Vendor" ? { color: "var(--sc-warn)", fontWeight: 700 } : {}}>{x.v || "-"}</div>
              </div>
            ))}
          </div>

          {vendorMissing && vendorMode === null && (
            <div style={{ padding: "14px 16px", background: "rgba(234,179,8,.08)", border: "1px solid rgba(234,179,8,.3)", borderRadius: 10, marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sc-warn)", marginBottom: 3 }}>Vendor not in your registry</div>
                <div style={{ fontSize: 12, color: "var(--sc-sub)" }}>
                  Register <strong>{vendorName || "this vendor"}</strong> before creating SKUs.
                </div>
              </div>
              <button className="sc-btn sc-btn-p" style={{ whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => setVendorMode("register")}>Register Vendor</button>
            </div>
          )}

          {vendorMode === "register" && (
            <div style={{ background: "var(--sc-card)", border: "1px solid rgba(234,179,8,.35)", borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--sc-ink)", marginBottom: 2 }}>Register Vendor</div>
              <div style={{ fontSize: 11, color: "var(--sc-muted)", marginBottom: 12 }}>Pre-filled from eBills invoice - confirm and complete before saving.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
                <_MprTextInput label="Vendor Name *" value={vForm.vendor_name} onChange={(e) => setV("vendor_name", e.target.value)} hint="Legal trading name" />
                <_MprTextInput label="Vendor Code" value={vForm.vendor_code} onChange={(e) => setV("vendor_code", e.target.value)} hint="Internal short code (optional)" mono />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
                <_MprTextInput label="VAT / NIPT *" value={vForm.vat_number} onChange={(e) => setV("vat_number", e.target.value)} hint={niptLoading ? "Fetching from eBills..." : "Pre-filled from eBills"} mono />
                <_MprSelectInput label="Category" value={vForm.category} onChange={(e) => setV("category", e.target.value)} options={SC_VENDOR_CATEGORIES} />
              </div>
              {vErr && <div style={{ padding: "8px 12px", background: "rgba(196,29,29,.07)", borderRadius: 7, fontSize: 12, color: "var(--sc-neg)", marginBottom: 10, marginTop: 8 }}>{vErr}</div>}
              {vOk && <div style={{ padding: "8px 12px", background: "var(--sc-pos-bg)", borderRadius: 7, fontSize: 12, color: "var(--sc-pos)", fontWeight: 600, marginBottom: 10, marginTop: 8 }}>Vendor registered. You can now create SKUs.</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="sc-btn sc-btn-p" disabled={vBusy} onClick={submitVendor}>{vBusy ? "Saving..." : "Save Vendor"}</button>
                <button className="sc-btn sc-btn-n" onClick={() => setVendorMode(null)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
            Blocked Lines ({lines.length})
          </div>
          {lines.length === 0 ? <div style={{ padding: "14px", color: "var(--sc-muted)", fontSize: 13 }}>No lines loaded.</div> : (
            <div style={{ border: "1px solid var(--sc-border)", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
              {lines.map((line, i) => (
                <div key={line.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < lines.length - 1 ? "1px solid var(--sc-divider)" : "", background: selLine?.id === line.id ? "rgba(59,130,246,.06)" : "" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sc-ink)" }}>{line.product_name_raw || "Unknown Item"}</div>
                    <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 2 }}>Qty: {line.quantity || "-"} {line.uom || ""} | Price: {line.unit_price ? scAmt(line.unit_price) : "-"}</div>
                  </div>
                  <span className={`sp ${line.status === "APPROVED_UPDATE" ? "sp-g" : "sp-o"}`}>{line.status === "APPROVED_UPDATE" ? "Resolved" : "Pending"}</span>
                  {line.status === "PENDING" && (
                    <button className="sc-btn sc-btn-p sc-btn-sm" disabled={vendorMissing} title={vendorMissing ? "Register vendor first" : "Create new SKU"} onClick={() => !vendorMissing && openMpr(line)}>
                      Create New SKU
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {mprMode === "create" && selLine && (
            <div style={{ background: "var(--sc-card)", border: "1px solid var(--sc-border)", borderRadius: 12, padding: "18px 20px", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--sc-ink)", marginBottom: 2 }}>New SKU Registration</div>
              <div style={{ fontSize: 11, color: "var(--sc-muted)", marginBottom: 4 }}>
                Vendor item: <strong style={{ color: "var(--sc-sub)" }}>{selLine.product_name_raw}</strong>
                {vendorId && <span style={{ marginLeft: 8, color: "var(--sc-pos)" }}>| Vendor: {vendorName}</span>}
              </div>
              {sec("Identity")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sc-sub)", marginBottom: 4 }}>SKU Code</div>
                  <div style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, fontFamily: "monospace", background: "var(--hover)", color: "var(--text)", letterSpacing: ".04em", minHeight: 32, display: "flex", alignItems: "center" }}>
                    {form.sku_code || <span style={{ color: "var(--muted)" }}>Generating...</span>}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 3 }}>System-assigned - cannot be edited</div>
                </div>
                <_MprTextInput label="Product Name *" value={form.product_name} onChange={(e) => set("product_name", e.target.value)} hint="Your system's canonical name (not vendor's)" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
                <_MprSelectInput label="Category *" value={form.category_id} onChange={(e) => set("category_id", e.target.value)} options={SC_CATEGORIES} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sc-sub)", marginBottom: 4 }}>Group *</div>
                  <div style={{ position: "relative" }}>
                    <input value={form.group_search} placeholder="Search groups..." onChange={(e) => { set("group_search", e.target.value); set("group_id", ""); set("group_name", ""); set("group_code", ""); searchGroups(e.target.value); }} style={{ width: "100%", background: "var(--sc-bg)", border: "1px solid var(--sc-border)", borderRadius: 7, padding: "7px 10px", fontSize: 13, color: "var(--sc-ink)", outline: "none", boxSizing: "border-box" }} />
                    {groupBusy && <div style={{ position: "absolute", right: 10, top: 8, fontSize: 11, color: "var(--sc-muted)" }}>...</div>}
                    {groupResults.length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "var(--sc-card)", border: "1px solid var(--sc-border)", borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.12)", overflow: "hidden", marginTop: 2 }}>
                        {groupResults.map((g) => (
                          <div key={g.id} onClick={() => selectGroup(g)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 13, color: "var(--sc-ink)", borderBottom: "1px solid var(--sc-divider)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--sc-hover)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = ""; }}>
                            <span style={{ fontWeight: 600 }}>{g.group_name}</span>
                            <span style={{ fontSize: 11, color: "var(--sc-muted)", marginLeft: 8, fontFamily: "monospace" }}>{g.group_code}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {form.group_id && <div style={{ fontSize: 10, color: "var(--sc-pos)", marginTop: 3 }}>{form.group_name} ({form.group_code})</div>}
                  {!form.group_id && <div style={{ fontSize: 10, color: "var(--sc-muted)", marginTop: 3 }}>Type to search existing groups</div>}
                </div>
              </div>
              {sec("Units & Conversion")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 4 }}>
                <_MprSelectInput label="Purchase UOM *" value={form.purchase_uom} onChange={(e) => set("purchase_uom", e.target.value)} options={SC_UOMS} hint="How vendor invoices it" />
                <_MprSelectInput label="Inventory UOM *" value={form.inventory_uom} onChange={(e) => set("inventory_uom", e.target.value)} options={SC_UOMS} hint="How you track it internally" />
                <_MprTextInput label="Conversion Factor *" value={form.purchase_to_inventory_factor} onChange={(e) => set("purchase_to_inventory_factor", e.target.value)} type="number" hint="e.g. 1 case = 12 units -> 12" />
              </div>
              {sec("Pricing")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
                <_MprTextInput label="Baseline Price (ALL) *" value={form.baseline_price} onChange={(e) => set("baseline_price", e.target.value)} type="number" hint="Auto-filled from invoice - confirm or adjust" />
                <_MprTextInput label="Price Tolerance %" value={form.price_tolerance_pct} onChange={(e) => set("price_tolerance_pct", e.target.value)} type="number" hint="Default 5% - deviation above this triggers quarantine" />
              </div>
              {sec("Storage & Shelf Life")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 4 }}>
                <_MprSelectInput label="Storage Type *" value={form.storage_type} onChange={(e) => set("storage_type", e.target.value)} options={SC_STORAGE} />
                <_MprTextInput label="Shelf Life (days)" value={form.shelf_life_days} onChange={(e) => set("shelf_life_days", e.target.value)} type="number" hint="Optional - used for FEFO inventory logic" />
              </div>
              {sec("Vendor Reference (from invoice)")}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 4 }}>
                <_MprTextInput label="Vendor Item Name" value={form.vendor_item_name} readOnly hint="As it appeared on the eBills invoice" />
                <_MprTextInput label="Vendor Item Code" value={form.vendor_item_code} onChange={(e) => set("vendor_item_code", e.target.value)} mono hint="From eBills line" />
                <_MprSelectInput label="Vendor UOM" value={form.vendor_uom} onChange={(e) => set("vendor_uom", e.target.value)} options={SC_UOMS} hint="UOM on vendor invoice" />
              </div>
              {mprErr && <div style={{ padding: "8px 12px", background: "rgba(196,29,29,.07)", borderRadius: 7, fontSize: 12, color: "var(--sc-neg)", marginBottom: 10, marginTop: 8 }}>{mprErr}</div>}
              {mprOk && <div style={{ padding: "8px 12px", background: "var(--sc-pos-bg)", borderRadius: 7, fontSize: 12, color: "var(--sc-pos)", fontWeight: 600, marginBottom: 10, marginTop: 8 }}>SKU registered and vendor mapping created.</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="sc-btn sc-btn-p" disabled={mprBusy} onClick={submitMpr}>{mprBusy ? "Registering..." : "Register SKU & Create Mapping"}</button>
                <button className="sc-btn sc-btn-n" onClick={() => { setMprMode(null); setSelLine(null); }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ padding: "10px 14px", background: "rgba(196,29,29,.05)", border: "1px solid rgba(196,29,29,.12)", borderRadius: 9, display: "flex", gap: 8, alignItems: "center" }}>
            <SI n="lock" s={13} c="var(--sc-neg)" />
            <span style={{ fontSize: 12, color: "var(--sc-neg)", fontWeight: 500 }}>Invoice allocation locked until all lines are registered in MPR.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SCQuarPriceDetail({ ticket, onClose, onResolved, deps }) {
  const { SI, scAge, SCQuarPriceLineCard } = deps;
  const lines = ticket.quarantine_lines || [];
  const [selLine, setSelLine] = useState(null);

  const handleResolved = () => {
    setSelLine(null);
    onResolved();
  };

  return (
    <div className="sc-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sc-dp" style={{ width: "100%", maxWidth: 700 }}>
        <div className="sc-dp-hdr">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span className="sc-tag st-price">Price Deviation</span>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--sc-muted)" }}>{ticket.ticket_number}</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--sc-ink)" }}>{ticket.vendor_name_raw || "Unknown Vendor"}</div>
          </div>
          <button className="sc-dp-close" onClick={onClose}><SI n="x" s={15} c="var(--sc-ink)" /></button>
        </div>
        <div className="sc-dp-body">
          <div className="sc-g3" style={{ marginBottom: 20 }}>
            {[
              { l: "Ticket #", v: ticket.ticket_number },
              { l: "Status", v: ticket.status },
              { l: "Lines", v: `${ticket.total_lines || lines.length} flagged` },
              { l: "Age", v: scAge(ticket.created_at) },
              { l: "Invoice", v: ticket.fiscal_invoice_id?.slice(-8) || "-" },
              { l: "Created", v: ticket.created_at ? new Date(ticket.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-" },
            ].map((x, i) => (
              <div key={i} className="sc-ib"><div className="sc-ib-l">{x.l}</div><div className="sc-ib-v">{x.v || "-"}</div></div>
            ))}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--sc-muted)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 10 }}>
            Flagged Lines ({lines.length}) - click a row to review
          </div>
          {lines.length === 0 ? <div style={{ padding: "14px", color: "var(--sc-muted)", fontSize: 13 }}>No lines loaded.</div> : (
            <div style={{ border: "1px solid var(--sc-border)", borderRadius: 10, overflow: "hidden", marginBottom: 4 }}>
              {lines.map((line, i) => {
                const devPct = line.deviation_pct != null ? +line.deviation_pct : null;
                const isSelected = selLine?.id === line.id;
                const isResolved = line.status !== "PENDING";
                return (
                  <div key={line.id}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: i < lines.length - 1 ? "1px solid var(--sc-divider)" : "", cursor: isResolved ? "default" : "pointer", background: isSelected ? "rgba(59,130,246,.07)" : "", transition: "background .08s" }} onMouseEnter={(e) => { if (!isResolved && !isSelected) e.currentTarget.style.background = "rgba(15,17,23,.03)"; }} onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = ""; }} onClick={() => { if (!isResolved) setSelLine(isSelected ? null : line); }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--sc-ink)" }}>{line.product_name_raw || "Unknown Item"}</div>
                        <div style={{ fontSize: 11, color: "var(--sc-muted)", marginTop: 2 }}>
                          Baseline: {line.baseline_price ? deps.scAmt(line.baseline_price) : "-"} | Invoice: {line.unit_price ? deps.scAmt(line.unit_price) : "-"}
                        </div>
                      </div>
                      {devPct != null && <span style={{ fontSize: 13, fontWeight: 800, color: Math.abs(devPct) > 20 ? "var(--sc-neg)" : "var(--sc-warn)", fontFamily: "monospace", flexShrink: 0 }}>{devPct > 0 ? "+" : ""}{devPct.toFixed(1)}%</span>}
                      <span className={`sp ${isResolved ? "sp-g" : "sp-o"}`}>{isResolved ? "Resolved" : "Pending"}</span>
                      {!isResolved && <SI n="arr" s={11} c="var(--sc-muted)" style={{ transform: isSelected ? "rotate(90deg)" : "rotate(0deg)", transition: "transform .15s" }} />}
                    </div>
                    {isSelected && (
                      <div style={{ padding: "0 16px 16px" }}>
                        <SCQuarPriceLineCard line={line} onClose={() => setSelLine(null)} onResolved={handleResolved} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(196,29,29,.05)", border: "1px solid rgba(196,29,29,.12)", borderRadius: 9, display: "flex", gap: 8, alignItems: "center" }}>
            <SI n="lock" s={13} c="var(--sc-neg)" />
            <span style={{ fontSize: 12, color: "var(--sc-neg)", fontWeight: 500 }}>Invoice allocation locked until all price deviations are resolved.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
