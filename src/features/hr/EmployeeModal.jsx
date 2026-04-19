import { useEffect, useState } from "react";

function EM_EF({ label, k, type, opts, span, form, set }) {
  return (
    <div style={span ? { gridColumn: "1/-1" } : {}}>
      <label className="form-label">{label}</label>
      {opts ? (
        <select className="form-input" value={form[k] || ""} onChange={(e) => set(k, e.target.value)}>
          <option value="">-</option>
          {opts.map((o) =>
            typeof o === "string" ? (
              <option key={o} value={o}>
                {o}
              </option>
            ) : (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ),
          )}
        </select>
      ) : (
        <input
          className="form-input"
          type={type || "text"}
          value={form[k] || ""}
          onChange={(e) => {
            const v = (type || "text") === "checkbox" ? e.target.checked : e.target.value;
            set(k, v);
          }}
        />
      )}
    </div>
  );
}

function EM_SH({ label }) {
  return (
    <div
      style={{
        gridColumn: "1/-1",
        fontSize: 11,
        fontWeight: 700,
        color: "var(--sub)",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        paddingTop: 16,
        paddingBottom: 10,
        borderTop: "1px solid var(--divider)",
        marginTop: 4,
      }}
    >
      {label}
    </div>
  );
}

export function HrEmployeeModal({ emp, tasks, onClose, onSaved, onDeleted, roles, locations, deps }) {
  const {
    SB,
    uuid,
    NATIONALITY_OPTIONS,
    DEPT_OPTIONS,
    ConfirmDeleteModal,
    Avatar,
    Icon,
    fmtFull,
    fmtAgo,
    tLabel,
  } = deps;

  const empId = emp.employee_id || emp.id;
  const empTasks = tasks.filter((t) => t.entity_id === empId);
  const [mode, setMode] = useState("view");
  const [showDel, setShowDel] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [showSetPwd, setShowSetPwd] = useState(false);
  const [pwdVal, setPwdVal] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdDone, setPwdDone] = useState(false);
  const [pwdErr, setPwdErr] = useState("");
  const [empDocs, setEmpDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [docError, setDocError] = useState("");
  const DOC_TYPES = [
    { code: "ID_PHOTO", label: "ID Photo", required: true },
    { code: "HEALTH_BOOKLET", label: "Health Booklet", required: true },
    { code: "FORENSIC_REPORT", label: "Forensic Report", required: true },
    { code: "CONTRACT", label: "Contract", required: false },
    { code: "OTHER", label: "Other Document", required: false },
  ];

  useEffect(() => {
    let cancelled = false;
    const loadDocs = async () => {
      setDocsLoading(true);
      const { data } = await SB.from("employee_documents").select("*").eq("employee_id", empId).order("uploaded_at", { ascending: false });
      if (!cancelled) {
        setEmpDocs(data || []);
        setDocsLoading(false);
      }
    };
    loadDocs();
    return () => {
      cancelled = true;
    };
  }, [SB, empId]);

  const uploadDoc = async (docType, file) => {
    if (!file) return;
    setUploadingDoc(docType);
    setDocError("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${empId}/${docType}_${Date.now()}.${ext}`;
      const { error: upErr } = await SB.storage.from("employee-documents").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { error: dbErr } = await SB.from("employee_documents").insert({
        employee_id: empId,
        brand_id: emp.brand_id || "a2911ac0-bcac-42c4-b39b-fed6813d321e",
        doc_type: docType,
        doc_label: DOC_TYPES.find((d) => d.code === docType)?.label || docType,
        storage_path: path,
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        uploaded_by: null,
      });
      if (dbErr) throw dbErr;
      const { data } = await SB.from("employee_documents").select("*").eq("employee_id", empId).order("uploaded_at", { ascending: false });
      setEmpDocs(data || []);
    } catch (e) {
      setDocError(e.message || "Upload failed");
    }
    setUploadingDoc(null);
  };

  const deleteDoc = async (docId, storagePath) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    await SB.storage.from("employee-documents").remove([storagePath]);
    await SB.from("employee_documents").delete().eq("id", docId);
    const { data } = await SB.from("employee_documents").select("*").eq("employee_id", empId).order("uploaded_at", { ascending: false });
    setEmpDocs(data || []);
  };

  const getDocUrl = async (storagePath) => {
    const { data } = await SB.storage.from("employee-documents").createSignedUrl(storagePath, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const resolvedRoleId = emp.role_id || (roles || []).find((r) => r.code === emp.role_code)?.id || "";
  const [form, setForm] = useState({
    first_name: emp.first_name || "",
    last_name: emp.last_name || "",
    email: emp.email || "",
    phone_prefix: emp.phone_prefix || "+355",
    phone_number: emp.phone_number || "",
    date_of_birth: emp.date_of_birth || "",
    gender: emp.gender || "",
    nationality: emp.nationality || "",
    marital_status: emp.marital_status || "",
    national_id_number: emp.national_id_number || "",
    birthplace: emp.birthplace || "",
    address: emp.address || "",
    department: emp.department || "",
    employment_type: emp.employment_type || "",
    recruitment_source: emp.recruitment_source || "",
    uniform_count: emp.uniform_count ?? "",
    hire_date: emp.hire_date || "",
    probation_end_date: emp.probation_end_date || "",
    iban: emp.iban || "",
    emergency_contact_name: emp.emergency_contact_name || "",
    emergency_contact_phone: emp.emergency_contact_phone || "",
    tax_id_number: emp.tax_id_number || "",
    role_id: resolvedRoleId,
    home_location_id: emp.home_location_id || emp.location_id || "",
    brand_id: emp.brand_id || "",
    is_active: emp.is_active ?? true,
    rate_type: emp.rate_type || "HOURLY",
    rate_amount: emp.rate_amount != null ? String(emp.rate_amount) : "",
    salary_currency: emp.currency || emp.salary_currency || "ALL",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const displayName = `${form.first_name} ${form.last_name}`.trim() || emp.full_name;

  const softDeleteWithOffboarding = async () => {
    setSaving(true);
    setErr("");
    try {
      const { error } = await SB.rpc("update_employee", {
        p_employee_id: empId,
        p_first_name: emp.first_name || "",
        p_last_name: emp.last_name || "",
        p_email: emp.email || null,
        p_phone_prefix: emp.phone_prefix || null,
        p_phone_number: emp.phone_number || null,
        p_date_of_birth: emp.date_of_birth || null,
        p_gender: emp.gender || null,
        p_nationality: emp.nationality || null,
        p_marital_status: emp.marital_status || null,
        p_national_id_number: emp.national_id_number || null,
        p_birthplace: emp.birthplace || null,
        p_address: emp.address || null,
        p_department: emp.department || null,
        p_employment_type: emp.employment_type || null,
        p_recruitment_source: emp.recruitment_source || null,
        p_uniform_count: emp.uniform_count != null ? parseInt(emp.uniform_count) : null,
        p_role_id: (roles || []).find((r) => r.code === emp.role_code)?.id || null,
        p_home_location_id: uuid(emp.home_location_id || emp.location_id) || null,
        p_brand_id: emp.brand_id || null,
        p_is_active: false,
      });
      if (error) throw error;
      const now = new Date().toISOString();
      const due = new Date(Date.now() + 3 * 86400000).toISOString();
      await SB.from("tasks").insert([
        {
          brand_id: emp.brand_id,
          task_type_code: "HR_OFFBOARD_REQUEST",
          assigned_role: "HR_MANAGER",
          entity_type: "EMPLOYEE",
          entity_id: empId,
          status: "OPEN",
          priority: 3,
          notes: `Offboarding: complete HR exit checklist for ${emp.full_name}`,
          created_at: now,
          due_at: due,
        },
        {
          brand_id: emp.brand_id,
          task_type_code: "OFFBOARD_FINANCE",
          assigned_role: "FINANCE_MANAGER",
          entity_type: "EMPLOYEE",
          entity_id: empId,
          status: "OPEN",
          priority: 3,
          notes: `Offboarding: process final payment for ${emp.full_name}`,
          created_at: now,
          due_at: due,
        },
      ]);
      setShowDel(false);
      if (onDeleted) await onDeleted();
      onClose();
    } catch (e) {
      setErr(e.message || "Offboard failed");
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!form.first_name || !form.last_name) {
      setErr("First and last name are required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      const { error } = await SB.rpc("update_employee", {
        p_employee_id: empId,
        p_first_name: form.first_name.trim(),
        p_last_name: form.last_name.trim(),
        p_email: form.email || null,
        p_phone_prefix: form.phone_prefix || null,
        p_phone_number: form.phone_number || null,
        p_date_of_birth: form.date_of_birth || null,
        p_gender: form.gender || null,
        p_nationality: form.nationality || null,
        p_marital_status: form.marital_status || null,
        p_national_id_number: form.national_id_number || null,
        p_birthplace: form.birthplace || null,
        p_address: form.address || null,
        p_department: form.department || null,
        p_employment_type: form.employment_type || null,
        p_recruitment_source: form.recruitment_source || null,
        p_uniform_count: form.uniform_count !== "" ? parseInt(form.uniform_count) : null,
        p_hire_date: form.hire_date || null,
        p_iban: form.iban || null,
        p_emergency_contact_name: form.emergency_contact_name || null,
        p_emergency_contact_phone: form.emergency_contact_phone || null,
        p_tax_id_number: form.tax_id_number || null,
        p_role_id: form.role_id || null,
        p_home_location_id: uuid(form.home_location_id) || null,
        p_brand_id: form.brand_id || null,
        p_is_active: form.is_active,
      });
      if (error) throw new Error(error.message);

      const rateChanged =
        form.rate_amount &&
        !isNaN(parseFloat(form.rate_amount)) &&
        parseFloat(form.rate_amount) > 0 &&
        (String(form.rate_amount) !== String(emp.rate_amount) ||
          form.rate_type !== (emp.rate_type || "HOURLY") ||
          form.salary_currency !== (emp.currency || emp.salary_currency || "ALL"));

      if (rateChanged) {
        const { error: cErr } = await SB.rpc("update_employee_contract", {
          p_employee_id: empId,
          p_rate_type: form.rate_type || "HOURLY",
          p_rate_amount: parseFloat(form.rate_amount),
          p_currency: form.salary_currency || "ALL",
          p_effective_from: new Date().toISOString().slice(0, 10),
        });
        if (cErr) throw new Error(`Contract update failed: ${cErr.message}`);
      }

      if (form._password && form._password.length >= 6) {
        setPwdBusy(true);
        const { data: pd, error: pe } = await SB.functions.invoke("set-employee-password", {
          body: { employee_id: empId, email: emp.email || form.email, full_name: emp.full_name || displayName, password: form._password },
        });
        setPwdBusy(false);
        if (pe || pd?.error) throw new Error(pe?.message || pd?.error || "Password save failed");
        setPwdDone(true);
        set("_password", "");
      } else if (form._password && form._password.length > 0 && form._password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setMode("view");
        if (onSaved) onSaved();
      }, 1200);
    } catch (e) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const sendInvite = async () => {
    setInviting(true);
    setErr("");
    try {
      const { error } = await SB.functions.invoke("send-portal-invite", {
        body: { employee_id: empId, email: emp.email, full_name: emp.full_name || displayName },
      });
      if (error) throw error;
      setInviteSent(true);
    } catch {
      try {
        const { error: iErr } = await SB.from("employee_invitations").insert({
          brand_id: emp.brand_id,
          email: emp.email,
          full_name: emp.full_name || displayName,
          role_id: form.role_id || emp.role_id,
          location_id: form.home_location_id || emp.home_location_id || emp.location_id,
          invited_by: null,
          status: "PENDING",
        });
        if (iErr) throw iErr;
        setInviteSent(true);
      } catch (e2) {
        setErr(`Invite failed: ${e2.message}`);
      }
    } finally {
      setInviting(false);
    }
  };

  const setPassword = async () => {
    if (!pwdVal || pwdVal.length < 6) {
      setPwdErr("Minimum 6 characters.");
      return;
    }
    setPwdBusy(true);
    setPwdErr("");
    try {
      const { data, error } = await SB.functions.invoke("set-employee-password", {
        body: { employee_id: empId, email: emp.email || form.email, full_name: emp.full_name || displayName, password: pwdVal },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPwdDone(true);
      setPwdVal("");
      setTimeout(() => {
        setShowSetPwd(false);
        setPwdDone(false);
      }, 1500);
    } catch (e) {
      setPwdErr(e.message || "Failed");
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
        {showDel && <ConfirmDeleteModal name={displayName} onConfirm={softDeleteWithOffboarding} onCancel={() => setShowDel(false)} />}
        {showSetPwd && (
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "inherit" }}
            onClick={() => setShowSetPwd(false)}
          >
            <div style={{ background: "var(--card)", borderRadius: 14, padding: "28px 28px 24px", width: 340, boxShadow: "0 8px 40px rgba(0,0,0,.18)" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", marginBottom: 4 }}>Set portal password</div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 16 }}>
                For <strong>{displayName}</strong> - {emp.email}
              </div>
              {pwdErr && <div style={{ fontSize: 12, color: "var(--neg)", marginBottom: 10, padding: "7px 10px", background: "var(--neg-bg)", borderRadius: 7 }}>{pwdErr}</div>}
              <input type="password" className="form-input" placeholder="New password (min 6 chars)" value={pwdVal} onChange={(e) => setPwdVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setPassword()} autoFocus style={{ marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowSetPwd(false)} style={{ padding: "8px 16px", borderRadius: 9, border: "1px solid var(--border)", background: "none", fontSize: 13, color: "var(--sub)", cursor: "pointer" }}>Cancel</button>
                <button onClick={setPassword} disabled={pwdBusy || pwdDone} style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: pwdDone ? "var(--pos)" : "var(--acc)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: pwdBusy ? "not-allowed" : "pointer", transition: "background .2s" }}>
                  {pwdDone ? "Done" : pwdBusy ? "Saving..." : "Set password"}
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{ padding: "24px 28px 18px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid var(--divider)" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <Avatar name={form.first_name || emp.full_name} size={48} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "var(--ink)", letterSpacing: "-0.02em" }}>{displayName}</div>
              <div style={{ fontSize: 12.5, color: "var(--sub)", marginTop: 2 }}>
                {(roles || []).find((r) => r.id === form.role_id)?.name || emp.role_name || "-"} - {(locations || []).find((l) => l.id === form.home_location_id)?.name || emp.location_name || "HQ"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
                <span className={`badge badge-${form.is_active ? "g" : "x"}`}>{form.is_active ? "Active" : "Inactive"}</span>
                <span className={`badge badge-${+emp.overall_score < 50 ? "r" : +emp.overall_score < 70 ? "o" : "g"}`}>Work {Math.round(+emp.overall_score || 0)}%</span>
                <span className={`badge badge-${+emp.profile_score < 50 ? "r" : +emp.profile_score < 75 ? "o" : "g"}`}>Profile {Math.round(+emp.profile_score || 0)}%</span>
                {form.employment_type && <span className="badge badge-b">{form.employment_type}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {mode === "view" ? (
              <>
                <button onClick={() => { setShowSetPwd(true); setPwdVal(""); setPwdErr(""); setPwdDone(false); }} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 12.5, fontWeight: 600, color: "var(--sub)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  <span style={{ display: "flex" }}><Icon name="key" size={13} color="var(--sub)" /></span>Set Password
                </button>
                {!emp.auth_user_id && (
                  <button onClick={sendInvite} disabled={inviting || inviteSent} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: `1px solid ${inviteSent ? "var(--pos)" : "var(--border)"}`, background: inviteSent ? "var(--pos-bg)" : "var(--bg)", fontSize: 12.5, fontWeight: 600, color: inviteSent ? "var(--pos)" : "var(--sub)", cursor: inviting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", opacity: inviting ? 0.6 : 1, transition: "all .2s" }}>
                    <Icon name="mail" size={13} color={inviteSent ? "var(--pos)" : "var(--sub)"} />
                    {inviteSent ? "Invite Sent" : inviting ? "Sending..." : "Send Invite"}
                  </button>
                )}
                <button onClick={() => setMode("edit")} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 12.5, fontWeight: 600, color: "var(--sub)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  <Icon name="edit" size={13} color="var(--sub)" />Edit
                </button>
                <button onClick={() => setShowDel(true)} style={{ height: 36, padding: "0 14px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 12.5, fontWeight: 600, color: "var(--neg)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                  <Icon name="trash" size={13} color="var(--neg)" />Offboard
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setMode("view"); setErr(""); }} style={{ padding: "7px 14px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 13, color: "var(--sub)", cursor: "pointer" }}>Cancel</button>
                <button onClick={save} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 9, border: "none", background: saved ? "var(--pos)" : "var(--acc)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", transition: "background .2s" }}>
                  {saved ? "Saved" : saving ? "Saving..." : "Save changes"}
                </button>
              </>
            )}
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", marginLeft: 4 }}>
              <Icon name="close" size={17} />
            </button>
          </div>
        </div>
        <div style={{ padding: "20px 28px 28px", overflowY: "auto", maxHeight: "calc(90vh - 120px)" }}>
          {err && <div style={{ fontSize: 12.5, color: "var(--neg)", padding: "10px 14px", background: "var(--neg-bg)", borderRadius: 8, marginBottom: 16 }}>{err}</div>}
          {mode === "view" ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 10, marginBottom: 12, borderBottom: "1px solid var(--divider)" }}>Identity</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {[
                  { l: "Email", v: emp.email },
                  { l: "Phone", v: emp.phone_number ? (emp.phone_prefix || "") + emp.phone_number : "-" },
                  { l: "Date of Birth", v: fmtFull(emp.date_of_birth) },
                  { l: "Gender", v: emp.gender || "-" },
                  { l: "Nationality", v: emp.nationality || "-" },
                  { l: "Marital Status", v: emp.marital_status || "-" },
                  { l: "Birthplace", v: emp.birthplace || "-" },
                  { l: "National ID", v: emp.national_id_number || "-" },
                  { l: "Address", v: emp.address || "-" },
                ].map((r) => (
                  <div key={r.l} style={r.l === "Address" ? { gridColumn: "1/-1" } : {}}>
                    <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{r.l}</div>
                    <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{r.v || "-"}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 10, marginBottom: 12, borderTop: "1px solid var(--divider)", paddingTop: 16 }}>Employment</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                {[
                  { l: "Hire Date", v: fmtFull(emp.hire_date) },
                  { l: "Role", v: emp.role_name || "-" },
                  { l: "Department", v: emp.department || "-" },
                  { l: "Employment Type", v: emp.employment_type || "-" },
                  { l: "Location", v: emp.location_name || "HQ" },
                  { l: "Uniforms", v: emp.uniform_count ?? 0 },
                ].map((r) => (
                  <div key={r.l}>
                    <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{r.l}</div>
                    <div style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{r.v || "-"}</div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Profile Completeness</div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
                  <div style={{ flex: 1, height: 8, background: "var(--bg)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round(+emp.profile_score || 0)}%`, background: +emp.profile_score >= 75 ? "var(--pos)" : +emp.profile_score >= 40 ? "var(--warning)" : "var(--neg)", borderRadius: 99, transition: "width .4s" }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: +emp.profile_score >= 75 ? "var(--pos)" : +emp.profile_score >= 40 ? "var(--warning)" : "var(--neg)", minWidth: 40, textAlign: "right" }}>{Math.round(+emp.profile_score || 0)}%</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--muted)" }}>{Math.round(+emp.profile_score_raw || 0)}/25 points - 10 profile fields + 3 required documents</div>
              </div>
              <div style={{ borderTop: "1px solid var(--divider)", paddingTop: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Documents</div>
                  {docError && <div style={{ fontSize: 11.5, color: "var(--neg)", fontWeight: 500 }}>{docError}</div>}
                </div>
                {docsLoading ? (
                  <div style={{ fontSize: 13, color: "var(--muted)", padding: "12px 0" }}>Loading...</div>
                ) : (
                  DOC_TYPES.map((dt) => {
                    const existing = empDocs.filter((d) => d.doc_type === dt.code);
                    const hasDoc = existing.length > 0;
                    const uploading = uploadingDoc === dt.code;
                    return (
                      <div key={dt.code} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--divider)" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{dt.label}</span>
                            {dt.required && <span style={{ fontSize: 9, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Required</span>}
                          </div>
                          {existing.map((doc) => (
                            <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <span style={{ fontSize: 11.5, color: "var(--pos)", fontWeight: 500, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>OK {doc.file_name}</span>
                              <button onClick={() => getDocUrl(doc.storage_path)} style={{ fontSize: 11, color: "var(--acc)", background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontWeight: 500 }}>View</button>
                              <button onClick={() => deleteDoc(doc.id, doc.storage_path)} style={{ fontSize: 11, color: "var(--neg)", background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontWeight: 500 }}>Delete</button>
                            </div>
                          ))}
                          {!hasDoc && <div style={{ fontSize: 11.5, color: "var(--neg)", marginTop: 4 }}>{dt.required ? "Missing - required" : "Not uploaded"}</div>}
                        </div>
                        <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 9, border: "1px solid var(--border)", background: "var(--bg)", fontSize: 12, fontWeight: 600, color: "var(--sub)", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.6 : 1, transition: "all .14s", whiteSpace: "nowrap" }}>
                          <Icon name="upload" size={12} color="var(--sub)" />
                          {uploading ? "Uploading..." : hasDoc ? "Replace" : "Upload"}
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" style={{ display: "none" }} disabled={uploading} onChange={(e) => { if (e.target.files[0]) uploadDoc(dt.code, e.target.files[0]); e.target.value = ""; }} />
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
              {empTasks.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.08em", paddingBottom: 10, marginBottom: 12, borderTop: "1px solid var(--divider)", paddingTop: 16 }}>Related Tasks ({empTasks.length})</div>
                  {empTasks.slice(0, 5).map((t) => (
                    <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--divider)" }}>
                      <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{tLabel(t.task_type_code)}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>{fmtAgo(t.due_at)}</span>
                        <span className={`badge badge-${t.status === "OVERDUE" ? "r" : "o"}`}>{t.status}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <EM_SH label="Identity" />
              <EM_EF label="First Name *" k="first_name" form={form} set={set} />
              <EM_EF label="Last Name *" k="last_name" form={form} set={set} />
              <EM_EF label="Date of Birth" k="date_of_birth" type="date" form={form} set={set} />
              <EM_EF label="National ID" k="national_id_number" form={form} set={set} />
              <EM_EF label="Birthplace" k="birthplace" form={form} set={set} />
              <EM_EF label="Gender" k="gender" opts={["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]} form={form} set={set} />
              <EM_EF label="Nationality" k="nationality" opts={NATIONALITY_OPTIONS} form={form} set={set} />
              <EM_EF label="Marital Status" k="marital_status" opts={["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"]} form={form} set={set} />
              <EM_EF label="Address" k="address" span form={form} set={set} />
              <EM_EF label="IBAN" k="iban" span form={form} set={set} />
              <EM_EF label="Tax ID" k="tax_id_number" form={form} set={set} />
              <EM_SH label="Contact & Access" />
              <EM_EF label="Email" k="email" type="email" form={form} set={set} />
              <div />
              <div>
                <label className="form-label">Phone</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="form-input" style={{ width: 72 }} value={form.phone_prefix} onChange={(e) => set("phone_prefix", e.target.value)} placeholder="+355" />
                  <input className="form-input" style={{ flex: 1 }} value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} placeholder="Number" />
                </div>
              </div>
              <div>
                <label className="form-label">Set portal password <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 400 }}>(leave blank to keep current)</span></label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="form-input" type="password" style={{ flex: 1 }} value={form._password || ""} onChange={(e) => set("_password", e.target.value)} placeholder="New password (min 6 chars)" />
                  {pwdDone && <span style={{ display: "flex", alignItems: "center", fontSize: 12, color: "var(--pos)", fontWeight: 600, whiteSpace: "nowrap" }}>Saved</span>}
                </div>
                {pwdErr && <div style={{ fontSize: 11.5, color: "var(--neg)", marginTop: 4 }}>{pwdErr}</div>}
              </div>
              <EM_EF label="Emergency Contact Name" k="emergency_contact_name" form={form} set={set} />
              <EM_EF label="Emergency Contact Phone" k="emergency_contact_phone" form={form} set={set} />
              <EM_SH label="Role & Location" />
              <div>
                <label className="form-label">Role</label>
                <select className="form-input" value={form.role_id} onChange={(e) => set("role_id", e.target.value)}>
                  <option value="">-</option>
                  {(roles || []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Location</label>
                <select className="form-input" value={form.home_location_id} onChange={(e) => set("home_location_id", e.target.value)}>
                  <option value="">-</option>
                  {(locations || []).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <EM_SH label="Employment" />
              <EM_EF label="Hire Date" k="hire_date" type="date" form={form} set={set} />
              <EM_EF label="Probation End Date" k="probation_end_date" type="date" form={form} set={set} />
              <EM_EF label="Department" k="department" opts={DEPT_OPTIONS} form={form} set={set} />
              <EM_EF label="Employment Type" k="employment_type" opts={["FULL_TIME", "PART_TIME", "FREELANCE"]} form={form} set={set} />
              <EM_EF label="Recruitment Source" k="recruitment_source" opts={["Referral", "Walk-in", "Social Media", "Job Board", "Agency", "Other"]} form={form} set={set} />
              <EM_EF label="Uniforms" k="uniform_count" type="number" form={form} set={set} />
              <div>
                <label className="form-label">Status</label>
                <select className="form-input" value={form.is_active ? "active" : "inactive"} onChange={(e) => set("is_active", e.target.value === "active")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <EM_SH label="Compensation" />
              <div>
                <label className="form-label">Pay Structure</label>
                <select className="form-input" value={form.rate_type} onChange={(e) => set("rate_type", e.target.value)}>
                  <option value="HOURLY">Hourly Rate</option>
                  <option value="DAILY">Daily Rate</option>
                  <option value="MONTHLY">Fixed Monthly Salary</option>
                </select>
              </div>
              <div>
                <label className="form-label">{form.rate_type === "HOURLY" ? "Rate / Hour" : form.rate_type === "DAILY" ? "Rate / Day" : "Monthly Salary"}</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="form-input" style={{ flex: 1 }} type="number" min="0" step="0.01" value={form.rate_amount} onChange={(e) => set("rate_amount", e.target.value)} placeholder="0.00" />
                  <select className="form-input" style={{ width: 80 }} value={form.salary_currency} onChange={(e) => set("salary_currency", e.target.value)}>
                    <option value="ALL">ALL</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                {emp.rate_amount && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 4 }}>Current: {emp.rate_type === "HOURLY" ? "Hourly" : emp.rate_type === "DAILY" ? "Daily" : "Monthly"} - {emp.rate_amount} {emp.currency || "ALL"} {" - saving a new rate will close the current contract and open a new one."}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
