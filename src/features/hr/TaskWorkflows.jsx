import { useEffect, useState } from "react";

export function HrTaskModal({ task, locMap, onClose, deps }) {
  const { Icon, resolveLocName, tLabel, pColor, pLabel, fmtFull } = deps;
  const locName = resolveLocName(task, locMap || {});

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "28px 32px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid var(--divider)", paddingBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--ink)", lineHeight: 1.3 }}>{tLabel(task.task_type_code)}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <span className={`badge badge-${task.status === "OVERDUE" ? "r" : task.status === "OPEN" ? "o" : "x"}`}>{task.status}</span>
              {+task.priority >= 4 && <span style={{ fontSize: 11, color: pColor(task.priority), fontWeight: 700, background: "var(--warn-bg)", padding: "2px 9px", borderRadius: 100 }}>{pLabel(task.priority)}</span>}
              <span className={`badge badge-${task.assigned_to_employee ? "b" : "x"}`}>{task.assigned_to_employee ? "Claimed" : "Unclaimed"}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ padding: "24px 32px 32px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { l: "Type", v: tLabel(task.task_type_code) },
              { l: "Assigned Role", v: (task.assigned_role || "-").replace(/_/g, " ") },
              { l: "Status", v: task.status },
              { l: "Priority", v: pLabel(+task.priority) },
              { l: "Created", v: fmtFull(task.created_at) },
              { l: "Due", v: fmtFull(task.due_at) },
              { l: "Location", v: locName },
              { l: "Entity", v: task.entity_type ? task.entity_type.replace(/_/g, " ") : "-" },
            ].map((r) => (
              <div key={r.l}>
                <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{r.l}</div>
                <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{r.v || "-"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function HrTimesheetModal({ task, onClose, onDone, deps }) {
  const { SB, Avatar, Icon } = deps;
  const [shift, setShift] = useState(null);
  const [emp, setEmp] = useState(null);
  const [sched, setSched] = useState(null);
  const [overrideOut, setOverrideOut] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pad = (n) => String(n).padStart(2, "0");
  const toLocal = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const fmtTs = (ts) => (ts ? new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-");
  const hoursOpen = shift ? ((Date.now() - new Date(shift.checked_in_at).getTime()) / 3600000).toFixed(1) : null;

  useEffect(() => {
    if (!task) return;
    const load = async () => {
      const { data: sc } = await SB.from("shift_checkins")
        .select("id,employee_id,location_id,checked_in_at,checked_out_at,is_frozen,frozen_reason,gross_earnings,hr_override_checkout,hr_override_note,scheduled_start_at")
        .eq("id", task.entity_id)
        .maybeSingle();
      if (sc) {
        setShift(sc);
        setOverrideOut(toLocal(sc.hr_override_checkout || sc.checked_out_at || ""));
        const { data: e } = await SB.from("employees").select("first_name,last_name,email,salary_per_hour").eq("id", sc.employee_id).maybeSingle();
        if (e) setEmp(e);
        const dayOfWeek = new Date(sc.checked_in_at).getDay();
        const pgDow = dayOfWeek === 0 ? 7 : dayOfWeek;
        const { data: lines } = await SB.from("shift_schedule_lines").select("shift_start,shift_end").eq("employee_id", sc.employee_id).eq("day_of_week", pgDow).eq("is_day_off", false).limit(1);
        if (lines && lines.length > 0 && lines[0].shift_end) {
          const cin = new Date(sc.checked_in_at);
          const [hh, mm] = lines[0].shift_end.split(":");
          const suggested = new Date(cin);
          suggested.setHours(+hh, +mm, 0, 0);
          if (suggested <= cin) suggested.setDate(suggested.getDate() + 1);
          setSched({ display: lines[0].shift_end, isoLocal: `${suggested.getFullYear()}-${pad(suggested.getMonth() + 1)}-${pad(suggested.getDate())}T${pad(suggested.getHours())}:${pad(suggested.getMinutes())}` });
          if (!sc.hr_override_checkout && !sc.checked_out_at) setOverrideOut(`${suggested.getFullYear()}-${pad(suggested.getMonth() + 1)}-${pad(suggested.getDate())}T${pad(suggested.getHours())}:${pad(suggested.getMinutes())}`);
        }
      }
    };
    load();
  }, [task]);

  const isResolved = shift && (shift.checked_out_at || shift.hr_override_checkout);
  const doOverride = async () => {
    if (!overrideOut || !overrideReason.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const { error } = await SB.rpc("hr_override_checkout", { p_checkin_id: task.entity_id, p_checkout_time: new Date(overrideOut).toISOString(), p_note: overrideReason });
      if (error) throw error;
      await SB.from("tasks").update({ status: "DONE", completed_at: new Date().toISOString() }).eq("id", task.id);
      if (onDone) onDone();
      onClose();
    } catch (e) {
      setErr(e.message || "Override failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "26px 30px 18px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: "var(--ink)" }}>Timesheet Review</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>Shift exceeded 10h without checkout - HR action required</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ padding: "20px 30px", maxHeight: "65vh", overflowY: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--faint)", borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
            <Avatar name={emp?.first_name || "?"} size={36} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "Loading..."}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{emp?.email || ""}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px", marginBottom: 20 }}>
            {[{ l: "Checked in", v: fmtTs(shift?.checked_in_at) }, { l: "Hours open", v: hoursOpen ? `${hoursOpen}h` : shift ? "-" : "Loading..." }, { l: "Frozen", v: shift?.is_frozen ? shift.frozen_reason || "Yes" : "No" }, { l: "Earnings cap", v: shift?.gross_earnings != null ? `${parseFloat(shift.gross_earnings).toLocaleString()} ALL` : "-" }].map((r) => (
              <div key={r.l} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{r.l}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{r.v}</div>
              </div>
            ))}
          </div>
          {sched && !isResolved && <button onClick={() => setOverrideOut(sched.isoLocal)} style={{ fontSize: 11, fontWeight: 600, color: "var(--acc)", background: "rgba(29,107,243,.1)", border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", marginBottom: 12 }}>Use scheduled end: {sched.display}</button>}
          {!isResolved && (
            <>
              <input type="datetime-local" value={overrideOut} onChange={(e) => setOverrideOut(e.target.value)} style={{ width: "100%", background: "var(--faint)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--ink)", outline: "none", marginBottom: 12 }} />
              <textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Reason" style={{ width: "100%", minHeight: 72, background: "var(--faint)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", fontSize: 13, color: "var(--ink)", resize: "vertical", outline: "none", fontFamily: "inherit", marginBottom: 12 }} />
              {err && <div style={{ padding: "8px 12px", background: "var(--neg-bg)", borderRadius: 7, fontSize: 12, color: "var(--neg)", marginBottom: 12 }}>{err}</div>}
            </>
          )}
        </div>
        <div style={{ padding: "0 30px 24px", borderTop: "1px solid var(--divider)", paddingTop: 18, display: "flex", gap: 8 }}>
          {!isResolved && <button onClick={doOverride} disabled={!overrideOut || !overrideReason.trim() || busy} style={{ flex: 1, height: 44, background: !overrideOut || !overrideReason.trim() || busy ? "var(--divider)" : "#f97316", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: !overrideOut || !overrideReason.trim() || busy ? "not-allowed" : "pointer" }}>{busy ? "Applying..." : "Apply Override & Close Task"}</button>}
          <button onClick={onClose} style={{ height: 44, padding: "0 20px", background: "var(--faint)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--muted)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{isResolved ? "Close" : "Cancel"}</button>
        </div>
      </div>
    </div>
  );
}

export function HrOffboardModal({ task, onClose, session, onDone, deps }) {
  const { SB, Avatar, Icon } = deps;
  const [req, setReq] = useState(null);
  const [emp, setEmp] = useState(null);
  const [requester, setRequester] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const REASON_LABELS = { RESIGNATION: "Resignation", TERMINATION: "Termination", PROBATION_FAIL: "Probation Failure", CONTRACT_END: "Contract End", REDUNDANCY: "Redundancy", RETIREMENT: "Retirement", OTHER: "Other" };

  useEffect(() => {
    if (!task) return;
    const loadReq = async () => {
      const { data: r } = await SB.from("employee_offboarding_requests").select("*").eq("id", task.entity_id).maybeSingle();
      if (r) {
        setReq(r);
        const [{ data: e }, { data: rb }] = await Promise.all([SB.from("employees").select("first_name,last_name,email").eq("id", r.employee_id).maybeSingle(), SB.from("employees").select("first_name,last_name").eq("id", r.requested_by).maybeSingle()]);
        if (e) setEmp(e);
        if (rb) setRequester(rb);
      }
    };
    loadReq();
  }, [task]);

  const act = async (decision) => {
    setBusy(true);
    setErr("");
    try {
      const now = new Date().toISOString();
      const newStatus = decision === "APPROVE" ? "APPROVED_PENDING_EXECUTION" : "REJECTED";
      if (req) await SB.from("employee_offboarding_requests").update({ status: newStatus, hr_reviewed_by: session?.id, hr_reviewed_at: now, hr_decision_note: note || null }).eq("id", req.id);
      await SB.from("tasks").update({ status: "IN_PROGRESS", claimed_at: now, assigned_to_employee: session?.id }).eq("id", task.id);
      if (onDone) onDone();
      onClose();
    } catch (e) {
      setErr(e.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  const isActioned = req && ["APPROVED_PENDING_EXECUTION", "REJECTED", "EXECUTED"].includes(req.status);
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "28px 32px 20px", borderBottom: "1px solid var(--divider)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "var(--ink)", lineHeight: 1.2 }}>Offboarding Request</div>
            {req && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, fontFamily: "monospace" }}>{req.request_code}</div>}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ padding: "24px 32px", maxHeight: "60vh", overflowY: "auto" }}>
          <div style={{ background: "var(--faint)", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar name={emp?.first_name || "?"} size={36} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{emp ? `${emp.first_name} ${emp.last_name}` : "Loading..."}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 1 }}>{emp?.email || ""}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            {[{ l: "Reason", v: req ? REASON_LABELS[req.reason_code] || req.reason_code : "-" }, { l: "Submitted by", v: requester ? `${requester.first_name} ${requester.last_name}` : "-" }, { l: "Effective date", v: req?.effective_date }, { l: "Last working day", v: req?.last_working_day || "-" }].map((r) => (
              <div key={r.l} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{r.l}</div>
                <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{r.v || "-"}</div>
              </div>
            ))}
          </div>
          {!isActioned && <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Decision note" style={{ width: "100%", minHeight: 72, background: "var(--faint)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "var(--ink)", resize: "vertical", outline: "none", fontFamily: "inherit" }} />}
          {err && <div style={{ padding: "8px 12px", background: "var(--neg-bg)", borderRadius: 7, fontSize: 12, color: "var(--neg)", marginTop: 12 }}>{err}</div>}
        </div>
        {!isActioned ? (
          <div style={{ padding: "0 32px 28px", display: "flex", gap: 10, borderTop: "1px solid var(--divider)", paddingTop: 20 }}>
            <button onClick={() => act("APPROVE")} disabled={busy} style={{ flex: 1, height: 44, background: "var(--pos)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Approve</button>
            <button onClick={() => act("REJECT")} disabled={busy} style={{ flex: 1, height: 44, background: "var(--neg-bg)", border: "1px solid var(--neg)", borderRadius: 10, color: "var(--neg)", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Reject</button>
          </div>
        ) : (
          <div style={{ padding: "0 32px 28px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--divider)", paddingTop: 20 }}>
            <button onClick={onClose} style={{ height: 40, padding: "0 20px", background: "var(--faint)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--muted)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

function HOM_FG({ label, k, type, opts, req: required, span, form, set }) {
  return (
    <div style={span ? { gridColumn: "1/-1" } : {}}>
      <label className="form-label">{label}{required && <span style={{ color: "var(--neg)", marginLeft: 2 }}>*</span>}</label>
      {opts ? (
        <select className="form-input" value={form[k] || ""} onChange={(e) => set(k, e.target.value)}>
          <option value="">Select...</option>
          {opts.map((o) => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input className="form-input" type={type || "text"} value={form[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder={label} />
      )}
    </div>
  );
}

export function HrOnboardModal({ task, onClose, roles: rolesProp, locations: locationsProp, session, onDone, deps }) {
  const { SB, Icon } = deps;
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [declineNote, setDeclineNote] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  const [localRoles, setLocalRoles] = useState(rolesProp || []);
  const [localLocations, setLocalLocations] = useState(locationsProp || []);
  const [dataReady, setDataReady] = useState(false);
  const roles = localRoles;
  const locations = localLocations;
  const [form, setForm] = useState({ title: "Mr", first_name: "", last_name: "", email: "", phone_prefix: "+355", phone_number: "", date_of_birth: "", gender: "", nationality: "", marital_status: "", birthplace: "", address: "", role_code: "", home_location_id: "", job_title: "", department: "", employment_type: "FULL_TIME", hire_date: "", probation_end_date: "", recruitment_source: "", uniform_count: "0", rate_type: "HOURLY", salary_per_hour: "", salary_currency: "ALL", national_id_number: "", tax_id_number: "", iban: "", emergency_contact_name: "", emergency_contact_phone: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([SB.from("roles").select("id,code,name").order("name"), SB.from("locations").select("id,name").eq("brand_id", session?.brand_id)]).then(([rolesRes, locsRes]) => {
      if (rolesRes.data?.length > 0) setLocalRoles(rolesRes.data);
      if (locsRes.data?.length > 0) setLocalLocations(locsRes.data);
      setDataReady(true);
    });
  }, [task?.entity_id]);

  const stepValid = () => {
    if (step === 1) return form.first_name && form.last_name && form.email;
    if (step === 2) return form.role_code && form.home_location_id && form.hire_date && form.employment_type;
    if (step === 3) return form.salary_per_hour && parseFloat(form.salary_per_hour) > 0;
    return true;
  };

  const handleApprove = async () => {
    setBusy(true);
    setErr("");
    try {
      await SB.rpc("register_employee", { p_first_name: form.first_name, p_last_name: form.last_name, p_email: form.email, p_title: form.title, p_role_code: form.role_code, p_location_id: form.home_location_id, p_job_title: form.job_title || null, p_department: form.department || null, p_employment_type: form.employment_type, p_hire_date: form.hire_date || null, p_probation_end_date: form.probation_end_date || null, p_phone_prefix: form.phone_prefix, p_phone_number: form.phone_number || null, p_date_of_birth: form.date_of_birth || null, p_gender: form.gender || null, p_nationality: form.nationality || null, p_birthplace: form.birthplace || null, p_marital_status: form.marital_status || null, p_address: form.address || null, p_national_id_number: form.national_id_number || null, p_tax_id_number: form.tax_id_number || null, p_iban: form.iban || null, p_emergency_contact_name: form.emergency_contact_name || null, p_emergency_contact_phone: form.emergency_contact_phone || null, p_recruitment_source: form.recruitment_source || null, p_uniform_count: parseInt(form.uniform_count) || 0, p_salary_per_hour: parseFloat(form.salary_per_hour), p_salary_currency: form.salary_currency, p_rate_type: form.rate_type });
      if (onDone) onDone();
      onClose();
    } catch (e) {
      setErr(e.message || "Registration failed");
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    if (!declineNote.trim()) {
      setErr("Please enter a reason for declining.");
      return;
    }
    setBusy(true);
    setErr("");
    if (onDone) onDone();
    onClose();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 620, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid var(--divider)", flexShrink: 0, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: "var(--ink)" }}>New Hire Registration</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex" }}><Icon name="close" size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
          {err && <div style={{ padding: "10px 14px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 8, fontSize: 12.5, color: "var(--neg)", marginBottom: 14 }}>{err}</div>}
          {!dataReady ? <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)", fontSize: 13 }}>Loading...</div> : showDecline ? <textarea className="form-input" rows={3} value={declineNote} onChange={(e) => setDeclineNote(e.target.value)} placeholder="Explain why this request is being declined..." style={{ resize: "vertical" }} /> : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {step === 1 && <>
                <HOM_FG form={form} set={set} label="First name" k="first_name" req />
                <HOM_FG form={form} set={set} label="Last name" k="last_name" req />
                <HOM_FG form={form} set={set} label="Email" k="email" type="email" req span />
                <HOM_FG form={form} set={set} label="Phone number" k="phone_number" span />
              </>}
              {step === 2 && <>
                <HOM_FG form={form} set={set} label="Role" k="role_code" req opts={(roles || []).map((r) => ({ v: r.code, l: r.name }))} />
                <HOM_FG form={form} set={set} label="Location" k="home_location_id" req opts={(locations || []).map((l) => ({ v: l.id, l: l.name }))} />
                <HOM_FG form={form} set={set} label="Employment type" k="employment_type" req opts={["FULL_TIME", "PART_TIME", "CASUAL", "CONTRACT"]} />
                <HOM_FG form={form} set={set} label="Hire date" k="hire_date" type="date" req />
              </>}
              {step === 3 && <>
                <HOM_FG form={form} set={set} label="Rate type" k="rate_type" opts={["HOURLY", "DAILY", "MONTHLY"]} />
                <HOM_FG form={form} set={set} label="Currency" k="salary_currency" opts={["ALL", "EUR", "USD"]} />
                <HOM_FG form={form} set={set} label="Salary amount" k="salary_per_hour" type="number" req span />
              </>}
              {step === 4 && <>
                <HOM_FG form={form} set={set} label="National ID number" k="national_id_number" span />
                <HOM_FG form={form} set={set} label="Tax ID" k="tax_id_number" />
                <HOM_FG form={form} set={set} label="IBAN" k="iban" />
              </>}
              {step === 5 && <>
                <HOM_FG form={form} set={set} label="Emergency contact name" k="emergency_contact_name" />
                <HOM_FG form={form} set={set} label="Emergency contact phone" k="emergency_contact_phone" />
              </>}
            </div>
          )}
        </div>
        <div style={{ padding: "16px 28px", borderTop: "1px solid var(--divider)", display: "flex", justifyContent: "space-between", gap: 8 }}>
          {!showDecline ? <>
            <button onClick={() => setShowDecline(true)} style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid var(--border)", background: "none", fontSize: 13, color: "var(--neg)", cursor: "pointer", fontWeight: 500 }}>Decline request</button>
            <div style={{ display: "flex", gap: 8 }}>
              {step > 1 && <button onClick={() => setStep((s) => s - 1)} style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid var(--border)", background: "none", fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>Back</button>}
              {step < 5 ? <button onClick={() => { if (stepValid()) setStep((s) => s + 1); else setErr("Please fill required fields."); }} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "var(--acc)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Continue</button> : <button onClick={handleApprove} disabled={busy || !stepValid()} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: busy ? "var(--muted)" : "#16a34a", color: "#fff", fontSize: 13, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>{busy ? "Registering..." : "Approve & Register"}</button>}
            </div>
          </> : <>
            <button onClick={() => { setShowDecline(false); setErr(""); }} style={{ padding: "9px 16px", borderRadius: 9, border: "1px solid var(--border)", background: "none", fontSize: 13, color: "var(--ink)", cursor: "pointer" }}>Back</button>
            <button onClick={handleDecline} disabled={busy} style={{ padding: "9px 20px", borderRadius: 9, border: "none", background: "var(--neg)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: busy ? "not-allowed" : "pointer" }}>{busy ? "Declining..." : "Confirm Decline"}</button>
          </>}
        </div>
      </div>
    </div>
  );
}
