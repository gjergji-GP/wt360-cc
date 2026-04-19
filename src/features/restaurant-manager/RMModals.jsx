import { useEffect, useRef, useState } from "react";
import { SB } from "../../lib/supabase";
import { getRmOperationalRoles } from "./helpers";

export function RMOnboardModal({ session, onClose, onDone, deps }) {
  const { ROLE_OPTIONS, DEPT_OPTIONS, RM_EMP_TYPES, RMField, RMSectionLabel } = deps;
  const operationalRoles = getRmOperationalRoles(ROLE_OPTIONS);
  const [form, setForm] = useState({
    candidate_first_name: "",
    candidate_last_name: "",
    candidate_phone: "",
    candidate_email: "",
    requested_role_code: "",
    requested_department: "",
    employment_type: "",
    proposed_start_date: "",
    request_note: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    if (!form.candidate_first_name.trim()) return setErr("First name is required.");
    if (!form.candidate_last_name.trim()) return setErr("Last name is required.");
    if (!form.requested_role_code) return setErr("Role is required.");
    if (!form.employment_type) return setErr("Employment type is required.");
    setBusy(true);
    setErr("");
    try {
      const { data: request, error: requestError } = await SB.from("employee_onboarding_requests").insert({
        brand_id: session.brand_id,
        location_id: session.home_location_id,
        requested_by: session.id,
        requested_role_code: form.requested_role_code,
        requested_department: form.requested_department || null,
        employment_type: form.employment_type,
        candidate_first_name: form.candidate_first_name.trim(),
        candidate_last_name: form.candidate_last_name.trim(),
        candidate_phone: form.candidate_phone || null,
        candidate_email: form.candidate_email || null,
        proposed_start_date: form.proposed_start_date || null,
        request_note: form.request_note || null,
        status: "SUBMITTED",
      }).select("id,request_code").single();
      if (requestError) throw requestError;
      await SB.from("tasks").insert({
        task_type_code: "HR_ONBOARD_REQUEST",
        entity_type: "ONBOARDING_REQUEST",
        entity_id: request.id,
        brand_id: session.brand_id,
        location_id: session.home_location_id,
        assigned_role: "HR_MANAGER",
        status: "OPEN",
        priority: 2,
      });
      onDone(request.request_code);
    } catch (error) {
      setErr(error.message || "Failed to submit request.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rm-modal-bg">
      <div className="rm-modal" onClick={(event) => event.stopPropagation()}>
        <div className="rm-modal-hdr">
          <div>
            <div className="rm-modal-title">Request New Hire</div>
            <div style={{ fontSize: 11, color: "var(--wt-muted)", marginTop: 2 }}>HR will review and complete the full employee record.</div>
          </div>
          <button onClick={onClose} className="rm-close">x</button>
        </div>

        <RMSectionLabel text="Candidate" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <RMField label="First Name" value={form.candidate_first_name} onChange={(event) => set("candidate_first_name", event.target.value)} required />
          <RMField label="Last Name" value={form.candidate_last_name} onChange={(event) => set("candidate_last_name", event.target.value)} required />
          <RMField label="Phone" value={form.candidate_phone} onChange={(event) => set("candidate_phone", event.target.value)} />
          <RMField label="Email" value={form.candidate_email} onChange={(event) => set("candidate_email", event.target.value)} type="email" />
        </div>

        <RMSectionLabel text="Position" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <RMField label="Role" value={form.requested_role_code} onChange={(event) => set("requested_role_code", event.target.value)} as="select" required options={operationalRoles.map((role) => ({ v: role.code, l: role.label }))} />
          <RMField label="Department" value={form.requested_department} onChange={(event) => set("requested_department", event.target.value)} as="select" options={DEPT_OPTIONS.map((department) => ({ v: department, l: department }))} />
          <RMField label="Employment Type" value={form.employment_type} onChange={(event) => set("employment_type", event.target.value)} as="select" required options={RM_EMP_TYPES} />
          <RMField label="Proposed Start Date" value={form.proposed_start_date} onChange={(event) => set("proposed_start_date", event.target.value)} type="date" />
        </div>

        <RMSectionLabel text="Notes" />
        <RMField label="Request Note" value={form.request_note} onChange={(event) => set("request_note", event.target.value)} as="textarea" hint="Context for HR - reason for hire, urgency, any specifics." style={{ marginBottom: 16 }} />

        {err && <div style={{ padding: "8px 12px", background: "var(--wt-neg-bg)", borderRadius: 7, fontSize: 12, color: "var(--wt-neg)", marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={submit} disabled={busy} className="rm-btn-p full">
            {busy ? "Submitting..." : "Submit Request"}
          </button>
          <button onClick={onClose} className="rm-btn-sec">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function RMOffboardModal({ session, employee, onClose, onDone, deps }) {
  const { RM_OFFBOARD_REASONS, RMField, RMSectionLabel } = deps;
  const [form, setForm] = useState({
    reason_code: "",
    reason_note: "",
    effective_date: "",
    last_working_day: "",
    revoke_access_immediately: false,
    uniform_return_pending: false,
    equipment_return_pending: false,
    finance_followup_required: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggle = (key) => setForm((prev) => ({ ...prev, [key]: !prev[key] }));

  const submit = async () => {
    if (!form.reason_code) return setErr("Reason is required.");
    if (!form.effective_date) return setErr("Effective date is required.");
    setBusy(true);
    setErr("");
    try {
      const { data: request, error: requestError } = await SB.from("employee_offboarding_requests").insert({
        brand_id: session.brand_id,
        location_id: session.home_location_id,
        employee_id: employee.id,
        requested_by: session.id,
        reason_code: form.reason_code,
        reason_note: form.reason_note || null,
        effective_date: form.effective_date,
        last_working_day: form.last_working_day || null,
        revoke_access_immediately: form.revoke_access_immediately,
        uniform_return_pending: form.uniform_return_pending,
        equipment_return_pending: form.equipment_return_pending,
        finance_followup_required: form.finance_followup_required,
        status: "SUBMITTED",
      }).select("id,request_code").single();
      if (requestError) throw requestError;
      await SB.from("tasks").insert({
        task_type_code: "HR_OFFBOARD_REQUEST",
        entity_type: "OFFBOARDING_REQUEST",
        entity_id: request.id,
        brand_id: session.brand_id,
        location_id: session.home_location_id,
        status: "OPEN",
        priority: 2,
      });
      onDone(request.request_code);
    } catch (error) {
      setErr(error.message || "Failed to submit.");
    } finally {
      setBusy(false);
    }
  };

  const Check = ({ label, fieldKey }) => (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--wt-ink)", cursor: "pointer" }}>
      <input type="checkbox" checked={form[fieldKey]} onChange={() => toggle(fieldKey)} style={{ width: 14, height: 14 }} />
      {label}
    </label>
  );

  return (
    <div className="rm-modal-bg">
      <div className="rm-modal" onClick={(event) => event.stopPropagation()}>
        <div className="rm-modal-hdr">
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--wt-ink)" }}>Start Offboarding</div>
            <div style={{ fontSize: 11, color: "var(--wt-muted)", marginTop: 2 }}>{employee.full_name} - HR will review and execute.</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--wt-muted)" }}>x</button>
        </div>

        <RMSectionLabel text="Reason" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          <RMField label="Reason" value={form.reason_code} onChange={(event) => set("reason_code", event.target.value)} as="select" required options={RM_OFFBOARD_REASONS} />
          <RMField label="Effective Date" value={form.effective_date} onChange={(event) => set("effective_date", event.target.value)} type="date" required />
          <RMField label="Last Working Day" value={form.last_working_day} onChange={(event) => set("last_working_day", event.target.value)} type="date" />
        </div>
        <RMField label="Notes" value={form.reason_note} onChange={(event) => set("reason_note", event.target.value)} as="textarea" style={{ marginBottom: 16 }} />

        <RMSectionLabel text="Checklist" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20, padding: "12px 14px", background: "var(--wt-bg)", borderRadius: 8 }}>
          <Check label="Revoke system access immediately" fieldKey="revoke_access_immediately" />
          <Check label="Uniform return pending" fieldKey="uniform_return_pending" />
          <Check label="Equipment return pending" fieldKey="equipment_return_pending" />
          <Check label="Finance follow-up required" fieldKey="finance_followup_required" />
        </div>

        {err && <div style={{ padding: "8px 12px", background: "var(--wt-neg-bg)", borderRadius: 7, fontSize: 12, color: "var(--wt-neg)", marginBottom: 12 }}>{err}</div>}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={submit} disabled={busy} className="rm-btn-d-full">
            {busy ? "Submitting..." : "Submit Offboarding Request"}
          </button>
          <button onClick={onClose} className="rm-btn-sec" style={{ marginTop: 6 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export function RMGrnModal({ session, onClose, onDone, deps }) {
  const { Icon } = deps;
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    SB.from("product_groups").select("id,group_code,group_name,inventory_uom").order("group_name").then(({ data }) => setGroups(data || []));
    setTimeout(() => inputRef.current && inputRef.current.focus(), 150);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setFiltered([]);
      return;
    }
    const lower = query.toLowerCase();
    setFiltered(groups.filter((group) => group.group_name.toLowerCase().includes(lower) || group.group_code.toLowerCase().includes(lower)).slice(0, 8));
  }, [groups, query]);

  const addGroup = (group) => {
    if (rows.find((row) => row.gid === group.id)) return;
    setRows((prev) => [...prev, { gid: group.id, gname: group.group_name, uom: group.inventory_uom || "unit", qty: "", lot: "", exp: "" }]);
    setQuery("");
    setFiltered([]);
  };
  const updateRow = (index, key, value) => setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  const deleteRow = (index) => setRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index));

  const canSubmit = rows.length > 0 && rows.every((row) => row.qty && +row.qty > 0);

  const handleSubmit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setErr("");
    try {
      const payload = rows.map((row) => ({
        group_name: row.gname,
        received_qty: +row.qty,
        uom: row.uom,
        lot_number: row.lot || null,
        expiry_date: row.exp || null,
      }));
      const { error } = await SB.rpc("submit_grn", {
        p_location_id: session.home_location_id,
        p_note: note || null,
        p_lines: payload,
      });
      if (error) throw error;
      setSubmitted(true);
      setTimeout(() => onDone(), 1400);
    } catch (error) {
      setErr(error.message || "Submit failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 680, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "88vh" }} onClick={(event) => event.stopPropagation()}>
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--wt-border)", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: "var(--wt-ink)" }}>Goods Received Note</div>
              <div style={{ fontSize: 12, color: "var(--wt-muted)", marginTop: 2 }}>{session.location_name} - Invoice pending</div>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--wt-muted)" }}><Icon name="close" size={17} /></button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 24px" }}>
          <div style={{ marginBottom: 16, position: "relative" }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--wt-muted)", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Search product group</label>
            <input ref={inputRef} className="form-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type group name or code..." autoComplete="off" />
            {filtered.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 2px)", left: 0, right: 0, zIndex: 60, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 9, boxShadow: "0 8px 24px rgba(0,0,0,.12)", overflow: "hidden" }}>
                {filtered.map((group) => (
                  <div key={group.id} onClick={() => addGroup(group)} style={{ padding: "9px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid var(--divider)" }}>
                    <span style={{ fontWeight: 500, color: "var(--ink)" }}>{group.group_name}</span>
                    <span style={{ fontSize: 11, color: "var(--sub)", fontFamily: "monospace" }}>{group.group_code}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {rows.length === 0 ? (
            <div style={{ padding: "28px 0", textAlign: "center", color: "var(--wt-muted)", fontSize: 13, borderRadius: 8, border: "1px dashed var(--wt-border)" }}>Search and add product groups above</div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 100px 110px 28px", gap: 6, padding: "0 4px 6px", borderBottom: "1px solid var(--wt-border)", marginBottom: 6 }}>
                {["Product", "Qty", "UOM", "Lot No.", "Expiry", ""].map((header) => (
                  <div key={header} style={{ fontSize: 10, fontWeight: 700, color: "var(--wt-muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>{header}</div>
                ))}
              </div>
              {rows.map((row, index) => (
                <div key={row.gid} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 100px 110px 28px", gap: 6, alignItems: "center", marginBottom: 6, padding: "7px 8px", background: "var(--wt-bg)", borderRadius: 8, border: "1px solid var(--wt-border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--wt-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.gname}</div>
                  <input className="form-input" type="number" min="0" step="any" value={row.qty} onChange={(event) => updateRow(index, "qty", event.target.value)} placeholder="0" style={{ padding: "5px 6px", fontSize: 13, textAlign: "right" }} />
                  <input className="form-input" value={row.uom} onChange={(event) => updateRow(index, "uom", event.target.value)} style={{ padding: "5px 6px", fontSize: 12 }} />
                  <input className="form-input" value={row.lot} onChange={(event) => updateRow(index, "lot", event.target.value)} placeholder="optional" style={{ padding: "5px 6px", fontSize: 12 }} />
                  <input className="form-input" type="date" value={row.exp} onChange={(event) => updateRow(index, "exp", event.target.value)} style={{ padding: "5px 6px", fontSize: 12 }} />
                  <button onClick={() => deleteRow(index)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--wt-neg)", padding: 2, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={12} /></button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--wt-muted)", textTransform: "uppercase", letterSpacing: ".06em", display: "block", marginBottom: 6 }}>Note <span style={{ fontWeight: 400 }}>(optional)</span></label>
            <textarea className="form-input" rows={2} value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Delivery arrived early, invoice to follow" style={{ resize: "none", fontSize: 13 }} />
          </div>

          {err && <div style={{ marginTop: 12, fontSize: 12.5, color: "var(--wt-neg)", padding: "8px 12px", background: "var(--wt-neg-bg)", borderRadius: 7 }}>{err}</div>}
        </div>

        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--wt-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--wt-bg)", flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: "var(--wt-muted)" }}>{rows.length} group{rows.length !== 1 ? "s" : ""} - SC notified on submit</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid var(--wt-border)", background: "none", fontSize: 13, color: "var(--wt-muted)", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSubmit} disabled={!canSubmit || busy || submitted} style={{ padding: "8px 20px", borderRadius: 9, border: "none", background: submitted ? "var(--wt-pos)" : canSubmit ? "var(--wt-ink)" : "var(--wt-muted)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: canSubmit && !busy && !submitted ? "pointer" : "not-allowed", transition: "background .2s" }}>
              {submitted ? "Submitted" : busy ? "Submitting..." : "Submit GRN"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
