import { useCallback, useRef, useState } from "react";
import { Icon } from "../../components/common/Icon";
import { DEPT_OPTIONS, NATIONALITY_OPTIONS, ROLE_OPTIONS, uuid } from "../../app/constants";
import { SB } from "../../lib/supabase";

function NPM_FG({label,k,type,opts,placeholder,required,form,set}) {
  return (
    <div>
      <label className="form-label">{label}{required&&<span style={{color:"var(--neg)",marginLeft:2}}>*</span>}</label>
      {opts?(
        <select className="form-input" value={form[k]||""} onChange={e=>set(k,e.target.value)}>
          <option value="">Selectâ€¦</option>
          {opts.map(o=>typeof o==="string"?<option key={o} value={o}>{o}</option>:<option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ):(
        <input className="form-input" type={type||"text"} value={form[k]||""} onChange={e=>set(k,e.target.value)} placeholder={placeholder||label}/>
      )}
    </div>
  );
}
function NPM_FS({label}) {
  return (
    <div style={{gridColumn:"1/-1",fontSize:11,fontWeight:700,color:"var(--sub)",textTransform:"uppercase",letterSpacing:"0.08em",paddingTop:20,paddingBottom:12,borderTop:"1px solid var(--divider)",marginTop:4}}>
      {label}
    </div>
  );
}

/* â”€â”€â”€ NEW PARTNER MODAL â€” complete rewrite with all PRD requirements â”€â”€â”€â”€â”€â”€â”€ */
const _NPM_EMPTY={
  first_name:"",last_name:"",date_of_birth:"",national_id_number:"",birthplace:"",
  address:"",gender:"",nationality:"",marital_status:"",
  recruitment_source:"",department:"",employment_type:"",
  role_code:"",home_location_id:"",brand_id:"",
  phone_prefix:"+355",phone_number:"",email:"",password:"",
  uniform_count:"",
  rate_type:"HOURLY",rate_amount:"",salary_currency:"ALL",
};
export function NewPartnerModal({onClose,session,locations,brands}) {
  const [form,setForm]=useState(()=>({..._NPM_EMPTY,brand_id:session?.brand_id||""}));
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const [step,setStep]=useState("form");
  const [savedName,setSavedName]=useState("");
  const [healthFile,setHealthFile]=useState(null);
  const [forensicFile,setForensicFile]=useState(null);
  const healthRef=useRef(null);
  const forensicRef=useRef(null);

  const set=useCallback((k,v)=>setForm(f=>({...f,[k]:v})),[]);

  const ACCEPTED_FORMATS="PDF, JPG, PNG (max 10MB)";

  const validate=()=>{
    if(!form.first_name) return "First name is required.";
    if(!form.last_name) return "Last name is required.";
    if(!form.role_code) return "Role is required.";
    if(!form.department) return "Department is required.";
    if(!form.email) return "Email is required.";
    if(!form.password) return "Password is required.";
    if(form.password.length<6) return "Password must be at least 6 characters.";
    if(!form.phone_number) return "Phone number is required.";
    if(!form.nationality) return "Nationality is required.";
    if(!form.home_location_id) return "Location is required.";
    if(!form.rate_amount||parseFloat(form.rate_amount)<=0) return "A valid pay rate is required.";
    return null;
  };

  const submit=async()=>{
    const validErr=validate();
    if(validErr){setErr(validErr);return;}
    setSaving(true);setErr("");
    try {
      // 1. role_code is stored directly in form â€” no DB lookup needed
      const resolved_role_code = form.role_code || "POS_STAFF";
      const uuidV=uuid; // module-level helper
      const fullName=`${form.first_name} ${form.last_name}`.trim();

      // 2. Create auth user with password via edge function
      const authRes=await fetch(
        "https://knquzjqxhduyxxljuede.supabase.co/functions/v1/create-auth-user",
        {method:"POST",
         headers:{"Content-Type":"application/json","x-admin-secret":"wt360-admin"},
         body:JSON.stringify({email:form.email.toLowerCase().trim(),password:form.password,full_name:fullName})}
      );
      const authData=await authRes.json();
      if(!authData.ok) throw new Error(authData.error||"Failed to create login account");
      const auth_user_id=authData.user_id;

      // 3. Register employee via RPC (SECURITY DEFINER â€” stamps auth_user_id atomically)
      const{error:empErr}=await SB.rpc("register_employee",{
        p_first_name:form.first_name,
        p_last_name:form.last_name,
        p_email:form.email.toLowerCase().trim(),
        p_role_code:resolved_role_code,
        p_location_id:uuidV(form.home_location_id)||null,
        p_employment_type:form.employment_type||"FULL_TIME",
        p_hire_date:form.hire_date||null,
        p_probation_end_date:form.probation_end_date||null,
        p_phone_prefix:form.phone_prefix||"+355",
        p_phone_number:form.phone_number||null,
        p_date_of_birth:form.date_of_birth||null,
        p_gender:form.gender||null,
        p_nationality:form.nationality||null,
        p_birthplace:form.birthplace||null,
        p_marital_status:form.marital_status||null,
        p_address:form.address||null,
        p_national_id_number:form.national_id_number||null,
        p_department:form.department||null,
        p_recruitment_source:form.recruitment_source||null,
        p_uniform_count:form.uniform_count?parseInt(form.uniform_count):0,
        p_salary_per_hour:form.rate_amount?parseFloat(form.rate_amount):null,
        p_salary_currency:form.salary_currency||"ALL",
        p_auth_user_id:auth_user_id||null,
        p_rate_type:form.rate_type||"HOURLY",
      });
      if(empErr) throw new Error(empErr.message);

      setSavedName(form.first_name);
      setSaving(false);
      setStep("done");
    } catch(e) {
      setErr(e.message);
      setSaving(false);
    }
  };

  if(step==="done") return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"40px 36px",textAlign:"center"}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"var(--pos-bg)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
            <Icon name="check" size={28} color="var(--pos)"/>
          </div>
          <div style={{fontWeight:800,fontSize:22,color:"var(--ink)",marginBottom:8}}>Partner Registered</div>
          <div style={{fontSize:14,color:"var(--sub)",lineHeight:1.6,marginBottom:24}}>
            <strong>{savedName}</strong> has been saved and can now log in to the Partners Portal with their email and password.
          </div>
          <button onClick={onClose} style={{padding:"11px 32px",borderRadius:10,border:"none",background:"var(--acc)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>Done</button>
        </div>
      </div>
    </div>
  );

  // NPM_FG and NPM_FS are defined outside this component â€” stable references, no focus loss.

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" onClick={e=>e.stopPropagation()}>
        <div style={{padding:"28px 32px 0",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid var(--divider)",paddingBottom:20}}>
          <div>
            <div style={{fontWeight:800,fontSize:18,color:"var(--ink)"}}>New Partner</div>
            <div style={{fontSize:12.5,color:"var(--muted)",marginTop:2}}>Register partner and create their login immediately</div>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"var(--muted)",display:"flex"}}><Icon name="close" size={18}/></button>
        </div>
        <div style={{padding:"24px 32px 32px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <NPM_FS label="Identity"/>
            <NPM_FG label="First Name" k="first_name" required form={form} set={set}/>
            <NPM_FG label="Last Name" k="last_name" required form={form} set={set}/>
            <NPM_FG label="Date of Birth" k="date_of_birth" type="date" form={form} set={set}/>
            <NPM_FG label="ID Number" k="national_id_number" placeholder="National ID" form={form} set={set}/>
            <NPM_FG label="Birthplace" k="birthplace" form={form} set={set}/>
            <NPM_FG label="Gender" k="gender" opts={["MALE","FEMALE","OTHER","PREFER_NOT_TO_SAY"]} form={form} set={set}/>
            <NPM_FG label="Nationality" k="nationality" opts={NATIONALITY_OPTIONS} required form={form} set={set}/>
            <NPM_FG label="Marital Status" k="marital_status" opts={["SINGLE","MARRIED","DIVORCED","WIDOWED","OTHER"]} form={form} set={set}/>
            <div style={{gridColumn:"1/-1"}}>
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={e=>set("address",e.target.value)} placeholder="Full address"/>
            </div>

            <NPM_FS label="Role & Access"/>
            <div style={{gridColumn:"1/-1",background:"var(--acc-bg)",borderRadius:10,padding:"12px 16px",fontSize:13,color:"var(--acc)",lineHeight:1.6}}>
              <strong>ðŸ”‘ Immediate access</strong> â€” set email and password below. The employee can log in to the Partners Portal straight away.
            </div>
            <NPM_FG label="Email" k="email" type="email" required form={form} set={set}/>
            <div>
              <label className="form-label">Password <span style={{color:"var(--neg)"}}>*</span></label>
              <input className="form-input" type="password" value={form.password} onChange={e=>set("password",e.target.value)} placeholder="Min 6 characters" autoComplete="new-password"/>
              {form.password&&form.password.length>0&&form.password.length<6&&(
                <div style={{fontSize:11.5,color:"var(--neg)",marginTop:4}}>At least 6 characters required</div>
              )}
            </div>
            <div>
              <label className="form-label">Role <span style={{color:"var(--neg)"}}>*</span></label>
              <select className="form-input" value={form.role_code} onChange={e=>set("role_code",e.target.value)}>
                <option value="">Select roleâ€¦</option>
                {ROLE_OPTIONS.map(r=><option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Department <span style={{color:"var(--neg)"}}>*</span></label>
              <select className="form-input" value={form.department} onChange={e=>set("department",e.target.value)}>
                <option value="">Select departmentâ€¦</option>
                {DEPT_OPTIONS.map(d=><option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Location <span style={{color:"var(--neg)"}}>*</span></label>
              <select className="form-input" value={form.home_location_id} onChange={e=>set("home_location_id",e.target.value)}>
                <option value="">Select locationâ€¦</option>
                {(locations||[]).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Brand</label>
              <select className="form-input" value={form.brand_id} onChange={e=>set("brand_id",e.target.value)}>
                <option value="">â€”</option>
                {(brands||[]).map(b=><option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>)}
              </select>
            </div>

            <NPM_FS label="Contact"/>
            <div>
              <label className="form-label">Phone <span style={{color:"var(--neg)"}}>*</span></label>
              <div style={{display:"flex",gap:8}}>
                <input className="form-input" style={{width:80}} value={form.phone_prefix} onChange={e=>set("phone_prefix",e.target.value)} placeholder="+355"/>
                <input className="form-input" style={{flex:1}} value={form.phone_number} onChange={e=>set("phone_number",e.target.value)} placeholder="Mobile number"/>
              </div>
            </div>
            <div/>

            <NPM_FS label="Recruitment & Employment"/>
            <NPM_FG label="Recruitment Source" k="recruitment_source" opts={["Referral","Walk-in","Social Media","Job Board","Agency","Other"]} form={form} set={set}/>
            <NPM_FG label="Employment Type" k="employment_type" opts={["FULL_TIME","PART_TIME","FREELANCE"]} form={form} set={set}/>

            <NPM_FS label="Compensation"/>
            <div>
              <label className="form-label">Pay Structure <span style={{color:"var(--neg)"}}>*</span></label>
              <select className="form-input" value={form.rate_type} onChange={e=>set("rate_type",e.target.value)}>
                <option value="HOURLY">Hourly Rate</option>
                <option value="DAILY">Daily Rate</option>
                <option value="MONTHLY">Fixed Monthly Salary</option>
              </select>
            </div>
            <div>
              <label className="form-label">
                {form.rate_type==="HOURLY"?"Rate / Hour":form.rate_type==="DAILY"?"Rate / Day":"Monthly Salary"}
                {" "}<span style={{color:"var(--neg)"}}>*</span>
              </label>
              <div style={{display:"flex",gap:8}}>
                <input
                  className="form-input"
                  style={{flex:1}}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rate_amount}
                  onChange={e=>set("rate_amount",e.target.value)}
                  placeholder={form.rate_type==="HOURLY"?"e.g. 500":form.rate_type==="DAILY"?"e.g. 3000":"e.g. 60000"}
                />
                <select className="form-input" style={{width:80}} value={form.salary_currency} onChange={e=>set("salary_currency",e.target.value)}>
                  <option value="ALL">ALL</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div style={{fontSize:11.5,color:"var(--muted)",marginTop:4}}>
                {form.rate_type==="HOURLY"&&"Used to calculate shift earnings on check-in/out."}
                {form.rate_type==="DAILY"&&"Used to calculate daily attendance cost."}
                {form.rate_type==="MONTHLY"&&"Fixed monthly gross â€” not tied to shift hours."}
              </div>
            </div>

            <NPM_FS label="Operational"/>
            <NPM_FG label="Number of Uniforms" k="uniform_count" type="number" placeholder="e.g. 2" form={form} set={set}/>
            <div/>

            <NPM_FS label="Compliance Documents"/>
            {/* Health Booklet */}
            <div>
              <label className="form-label">Health Booklet</label>
              <input type="file" ref={healthRef} style={{display:"none"}} accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setHealthFile(e.target.files[0]||null)}/>
              <div style={{border:`1px dashed ${healthFile?"var(--pos)":"var(--border)"}`,borderRadius:9,padding:"18px",textAlign:"center",cursor:"pointer",background:healthFile?"var(--pos-bg)":"transparent",transition:"all .15s"}} onClick={()=>healthRef.current?.click()}>
                <Icon name="upload" size={16} color={healthFile?"var(--pos)":"var(--muted)"}/>
                <div style={{marginTop:6,fontSize:13,color:healthFile?"var(--pos)":"var(--muted)",fontWeight:healthFile?600:400}}>
                  {healthFile?healthFile.name:"Upload file"}
                </div>
                <div style={{marginTop:4,fontSize:11,color:"var(--muted)"}}>{ACCEPTED_FORMATS}</div>
              </div>
            </div>
            {/* Forensic Report */}
            <div>
              <label className="form-label">Forensic Report</label>
              <input type="file" ref={forensicRef} style={{display:"none"}} accept=".pdf,.jpg,.jpeg,.png" onChange={e=>setForensicFile(e.target.files[0]||null)}/>
              <div style={{border:`1px dashed ${forensicFile?"var(--pos)":"var(--border)"}`,borderRadius:9,padding:"18px",textAlign:"center",cursor:"pointer",background:forensicFile?"var(--pos-bg)":"transparent",transition:"all .15s"}} onClick={()=>forensicRef.current?.click()}>
                <Icon name="shield" size={16} color={forensicFile?"var(--pos)":"var(--muted)"}/>
                <div style={{marginTop:6,fontSize:13,color:forensicFile?"var(--pos)":"var(--muted)",fontWeight:forensicFile?600:400}}>
                  {forensicFile?forensicFile.name:"Upload file"}
                </div>
                <div style={{marginTop:4,fontSize:11,color:"var(--muted)"}}>{ACCEPTED_FORMATS}</div>
              </div>
            </div>
          </div>

          {err&&<div style={{fontSize:12.5,color:"var(--neg)",padding:"10px 14px",background:"var(--neg-bg)",borderRadius:8,marginTop:16}}>{err}</div>}

          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:28}}>
            <button onClick={onClose} style={{padding:"10px 22px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",fontSize:14,cursor:"pointer",color:"var(--sub)"}}>Cancel</button>
            <button onClick={submit} disabled={saving} style={{padding:"10px 24px",borderRadius:10,border:"none",background:"var(--acc)",color:"#fff",fontSize:14,fontWeight:600,cursor:saving?"not-allowed":"pointer",opacity:saving?.6:1}}>
              {saving?"Registeringâ€¦":"Register Partner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* â”€â”€â”€ CC HOME PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* â”€â”€â”€ TOWER PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* â”€â”€â”€ TASKS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* â”€â”€â”€ INBOX PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* â”€â”€â”€ PEOPLE PAGE â€” fixed Active toggle, offboard button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/* â”€â”€â”€ REPORTS PAGE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */




/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   PART 3 â€” FINANCE MANAGER COMMAND CENTRE (injected)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€â”€ ALERT STRIP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
