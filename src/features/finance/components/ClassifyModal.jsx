import { useEffect, useState } from "react";
import { Icon } from "../../../components/common/Icon";
import { fmtFull } from "../../../lib/leadershipHelpers";
import { SB } from "../../../lib/supabase";
import { FIN_CATEGORIES } from "../config";
import { fmtCurrency } from "../formatters";
import { TicketBadge } from "./FinanceBadges";

export function ClassifyModal({invoice,onClose,onClassified}) {
  const [catCode,setCatCode]=useState("");
  const [subCat,setSubCat]=useState("");
  const [desc,setDesc]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const [dbCats,setDbCats]=useState([]);
  const [lines,setLines]=useState([]);
  const [linesLoading,setLinesLoading]=useState(true);
  const [ignoreMode,setIgnoreMode]=useState(false);
  const [ignoreReason,setIgnoreReason]=useState("");
  const [ignoreBusy,setIgnoreBusy]=useState(false);
  const [paymentMethod,setPaymentMethod]=useState("CREDIT");
  const [alreadyPaid,setAlreadyPaid]=useState(false);
  const selCat=FIN_CATEGORIES.find(c=>c.code===catCode);
  const isCOGS=selCat?.posts_inventory===true;

  useEffect(()=>{
    SB.from("expense_categories").select("id,code,name,posts_inventory").eq("is_active",true)
      .then(({data})=>setDbCats(data||[]));
    const fic = invoice.ebills_fic||invoice.fic;
    setLinesLoading(true);
    if(fic){
      SB.from("ebills_invoice_lines").select("*").eq("fic",fic).order("line_index")
        .then(({data})=>{
          if(data&&data.length>0){setLines(data);setLinesLoading(false);}
          else {
            SB.from("fiscal_invoice_lines").select("*").eq("fiscal_invoice_id",invoice.id)
              .then(({data:d2})=>{setLines(d2||[]);setLinesLoading(false);});
          }
        });
    } else {
      SB.from("fiscal_invoice_lines").select("*").eq("fiscal_invoice_id",invoice.id)
        .then(({data})=>{setLines(data||[]);setLinesLoading(false);});
    }
  },[invoice]);

  const totalWithVat = +(invoice.tot_price||invoice.total_amount)||0;
  const totalVat     = +(invoice.tot_vat_amt||invoice.tax_amount)||0;


  const handle=async()=>{
    if(!catCode||!subCat) return;
    if(!isCOGS&&!desc.trim()){setErr("Description is required for non-COGS invoices.");return;}
    setBusy(true);setErr("");
    try{
      // Map local UI category code → DB expense_category_id
      // COGS F&B → FNB, COGS Packaging → PACK, others by closest match
      const CODE_MAP = {
        "COGS":   subCat.toLowerCase().includes("pack") ? "PACK" : "FNB",
        "UTIL":   "UTIL",
        "RENT":   "RENT",
        "TAX":    "TAX",
        "PROF":   "CONS",
        "OPEX":   "OTHER",
        "CAPEX":  "OTHER",
        "PAYROLL":"LABOR",
        "BANK":   "OTHER",
        "OTHER":  "OTHER",
      };
      const dbCode = CODE_MAP[catCode] || "OTHER";
      const dbCat  = dbCats.find(c=>c.code===dbCode);
      if(!dbCat) throw new Error(`Could not resolve expense category for ${catCode}. Please contact support.`);

      // Call the proper classify_invoice RPC — triggers PO + procurement_task + SC task for COGS
      const{error}=await SB.rpc("classify_invoice",{
        p_fiscal_invoice_id:   invoice.id,
        p_expense_category_id: dbCat.id,
        p_payment_method:      paymentMethod,
        p_already_paid:        alreadyPaid,
        p_notes:               desc||`${catCode} — ${subCat}`,
      });
      if(error) throw error;

      // For non-COGS, also stamp subcategory (not handled by RPC — direct update of non-immutable fields)
      if(!isCOGS){
        await SB.from("fiscal_invoices").update({
          expense_category_code: catCode,
          expense_subcategory:   subCat,
        }).eq("id",invoice.id);
      } else {
        await SB.from("fiscal_invoices").update({
          expense_category_code: catCode,
          expense_subcategory:   subCat,
        }).eq("id",invoice.id);
      }

      onClassified();
    }catch(e){setErr(e.message);}
    setBusy(false);
  };

  const handleIgnore=async()=>{
    if(!ignoreReason){setErr("Please select a reason.");return;}
    setIgnoreBusy(true);setErr("");
    try{
      const {data:{user}}=await SB.auth.getUser();
      const {error}=await SB.from("fiscal_invoices").update({
        status:"IGNORED",
        ignored_at:new Date().toISOString(),
        ignored_by:user?.id||null,
        ignore_reason:ignoreReason,
      }).eq("id",invoice.id);
      if(error) throw error;
      onClassified();
    }catch(e){setErr(e.message);}
    setIgnoreBusy(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:900,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={onClose}>
      <div style={{width:560,maxHeight:"88vh",overflowY:"auto",background:"var(--card)",borderRadius:16,boxShadow:"0 24px 80px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()} className="fade-up">
        <div style={{padding:"24px 28px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
          <div>
            <div style={{fontWeight:700,fontSize:15,color:"var(--ink)"}}>Classify Invoice</div>
            <div style={{fontSize:12,color:"var(--muted)",marginTop:3}}>
              <TicketBadge id={invoice.id}/> &nbsp;{invoice.seller_name||invoice.vendor_name_raw} &nbsp;·&nbsp; <strong>{fmtCurrency(invoice.tot_price||invoice.total_amount)}</strong>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>{setIgnoreMode(m=>!m);setErr("");}}
              style={{padding:"6px 14px",borderRadius:8,border:"1px solid var(--neg)",background:ignoreMode?"var(--neg-bg)":"transparent",fontSize:12,color:"var(--neg)",cursor:"pointer",fontWeight:600,transition:"all .12s"}}>
              Ignore
            </button>
            <button onClick={onClose} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="close" size={14} color="var(--sub)"/></button>
          </div>
        </div>
        <div style={{padding:"24px 28px"}}>
          <div style={{background:"var(--bg)",borderRadius:10,padding:"12px 16px",marginBottom:20,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[
              {l:"Seller",v:invoice.seller_name||"—"},
              {l:"FIC",v:invoice.fic||"—"},
              {l:"Total",v:fmtCurrency(invoice.tot_price||invoice.total_amount)},
              {l:"Issue Date",v:fmtFull(invoice.issue_date_time||invoice.invoice_date)},
              {l:"Due Date",v:fmtFull(invoice.pay_deadline||invoice.due_date)},
              {l:"Invoice Type",v:invoice.type_of_inv||"—"},
            ].map(f=>(
              <div key={f.l}>
                <div style={{fontSize:10.5,color:"var(--muted)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>{f.l}</div>
                <div style={{fontSize:13,color:"var(--ink)",fontWeight:500,marginTop:2}}>{f.v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11.5,color:"var(--muted)",marginBottom:16,padding:"8px 12px",background:"var(--faint)",borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
            <Icon name="shield" size={12} color="var(--muted)"/>
            All eBills fields are read-only. They are government-certified records.
          </div>

          {/* Ignore panel */}
          {ignoreMode&&(
            <div style={{marginBottom:20,padding:"16px 18px",background:"var(--neg-bg)",borderRadius:12,border:"1px solid rgba(196,29,29,.2)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <Icon name="warning" size={14} color="var(--neg)"/>
                <span style={{fontSize:13,fontWeight:700,color:"var(--neg)"}}>Ignore this invoice</span>
              </div>
              <div style={{fontSize:12.5,color:"var(--neg)",marginBottom:14,lineHeight:1.5}}>
                This invoice will be permanently excluded. No ledger entry, no SC task, no payment. Cannot be undone.
              </div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11.5,fontWeight:600,color:"var(--ink)",marginBottom:8}}>Reason <span style={{color:"var(--neg)"}}>*</span></div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {[["NOT_OUR_INVOICE","Not our invoice (submitted under wrong NIPT)"],["DUPLICATE","Duplicate of existing invoice"],["FRAUD","Suspected fraud"],["OTHER","Other reason"]].map(([r,lbl])=>(
                    <label key={r} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                      <input type="radio" name="ignoreReason" value={r} checked={ignoreReason===r} onChange={()=>setIgnoreReason(r)} style={{accentColor:"var(--neg)"}}/>
                      <span style={{fontSize:13,color:"var(--ink)",fontWeight:ignoreReason===r?600:400}}>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>
              {err&&<div style={{padding:"8px 12px",background:"rgba(196,29,29,.1)",borderRadius:7,fontSize:12,color:"var(--neg)",marginBottom:10}}>{err}</div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setIgnoreMode(false);setIgnoreReason("");setErr("");}}
                  style={{padding:"8px 16px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",fontSize:13,color:"var(--sub)",cursor:"pointer"}}>Cancel</button>
                <button onClick={handleIgnore} disabled={ignoreBusy||!ignoreReason}
                  style={{padding:"8px 20px",borderRadius:8,border:"none",background:"var(--neg)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",opacity:ignoreBusy||!ignoreReason?0.5:1}}>
                  {ignoreBusy?"Ignoring…":"Confirm Ignore"}
                </button>
              </div>
            </div>
          )}

          {/* Product lines */}
          {lines.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--ink)",marginBottom:8}}>Product Lines</div>
              <div style={{border:"1px solid var(--border)",borderRadius:10,overflow:"hidden"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"var(--bg)"}}>
                      {["Item","Code","Qty","Unit Price","Total","Status"].map(h=>(
                        <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:"0.05em",borderBottom:"1px solid var(--border)"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l,i)=>(
                      <tr key={l.id} style={{borderBottom:i<lines.length-1?"1px solid var(--divider)":"none",background:i%2===0?"transparent":"var(--faint)"}}>
                        <td style={{padding:"8px 10px",color:"var(--ink)",fontWeight:500}}>{l.item_name||l.vendor_item_name||"—"}</td>
                        <td style={{padding:"8px 10px",color:"var(--muted)",fontFamily:"monospace",fontSize:11}}>{l.item_code||l.sku_code||"—"}</td>
                        <td style={{padding:"8px 10px",color:"var(--sub)"}}>{l.qty??l.quantity??"—"} {l.unit_of_measure||l.uom||""}</td>
                        <td style={{padding:"8px 10px",color:"var(--sub)"}}>{l.unit_price!=null?fmtCurrency(l.unit_price):"—"}</td>
                        <td style={{padding:"8px 10px",color:"var(--ink)",fontWeight:600}}>{l.total_price!=null?fmtCurrency(l.total_price):"—"}</td>
                        <td style={{padding:"8px 10px"}}>
                          <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:100,
                            background:l.mapping_status==="MATCHED"?"var(--pos-bg)":(l.mapping_status||"").includes("QUARANTINE")?"var(--warn-bg)":"var(--faint)",
                            color:l.mapping_status==="MATCHED"?"var(--pos)":(l.mapping_status||"").includes("QUARANTINE")?"var(--warn)":"var(--muted)"}}>
                            {l.mapping_status||"PENDING"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{fontSize:12,fontWeight:700,color:"var(--ink)",marginBottom:10}}>Select Category <span style={{color:"var(--neg)"}}>*</span></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {FIN_CATEGORIES.map(cat=>(
              <div key={cat.code} onClick={()=>{setCatCode(cat.code);setSubCat("");}}
                style={{padding:"10px 14px",border:`1px solid ${catCode===cat.code?"var(--acc)":"var(--border)"}`,borderRadius:10,cursor:"pointer",background:catCode===cat.code?"var(--acc-bg)":"var(--card)",transition:"all .12s",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:12.5,fontWeight:catCode===cat.code?600:400,color:catCode===cat.code?"var(--acc)":"var(--ink)"}}>{cat.name}</span>
                {cat.posts_inventory&&<span style={{fontSize:9,fontWeight:700,color:"var(--acc)",background:"rgba(29,107,243,0.1)",padding:"1px 6px",borderRadius:100}}>COGS</span>}
              </div>
            ))}
          </div>
          {selCat&&(
            <>
              <div style={{fontSize:12,fontWeight:700,color:"var(--ink)",marginBottom:8}}>Subcategory <span style={{color:"var(--neg)"}}>*</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:16}}>
                {selCat.subs.map(s=>(
                  <span key={s} onClick={()=>setSubCat(s)}
                    style={{padding:"6px 13px",borderRadius:100,border:`1px solid ${subCat===s?"var(--acc)":"var(--border)"}`,fontSize:12.5,fontWeight:subCat===s?600:400,color:subCat===s?"var(--acc)":"var(--sub)",cursor:"pointer",background:subCat===s?"var(--acc-bg)":"transparent",transition:"all .1s"}}>
                    {s}
                  </span>
                ))}
              </div>
            </>
          )}
          {catCode&&!isCOGS&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--ink)",marginBottom:8}}>Description <span style={{color:"var(--neg)"}}>*</span></div>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}
                placeholder="What is this invoice for? Be specific — this description will be the only context in the ledger."
                style={{width:"100%",background:"var(--app)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px",fontSize:13,color:"var(--ink)",outline:"none",resize:"vertical",lineHeight:1.5}}
                onFocus={e=>e.target.style.borderColor="var(--acc)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            </div>
          )}
          {/* Payment */}
          {catCode&&(
            <div style={{marginBottom:16,padding:"16px 18px",border:"1px solid var(--border)",borderRadius:12,background:"var(--bg)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--ink)",marginBottom:12}}>Payment</div>
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11.5,fontWeight:600,color:"var(--sub)",marginBottom:8}}>Method</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {[["CASH","Cash"],["BANK_TRANSFER","Bank Transfer"],["CARD","Card"],["CREDIT","Credit / Invoice"]].map(([val,lbl])=>(
                    <span key={val} onClick={()=>{setPaymentMethod(val);if(!["CASH","CARD"].includes(val))setAlreadyPaid(false);}}
                      style={{padding:"6px 13px",borderRadius:100,border:`1px solid ${paymentMethod===val?"var(--acc)":"var(--border)"}`,fontSize:12.5,fontWeight:paymentMethod===val?600:400,color:paymentMethod===val?"var(--acc)":"var(--sub)",cursor:"pointer",background:paymentMethod===val?"var(--acc-bg)":"transparent",transition:"all .1s"}}>
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
              {["CASH","CARD"].includes(paymentMethod)&&(
                <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 12px",background:alreadyPaid?"var(--pos-bg)":"var(--faint)",borderRadius:8,border:`1px solid ${alreadyPaid?"rgba(16,185,129,.25)":"var(--divider)"}`,transition:"all .15s"}}>
                  <input type="checkbox" checked={alreadyPaid} onChange={e=>setAlreadyPaid(e.target.checked)} style={{accentColor:"var(--pos)",width:15,height:15}}/>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:alreadyPaid?"var(--pos)":"var(--ink)"}}>Already paid at point of purchase</div>
                    <div style={{fontSize:11.5,color:"var(--muted)",marginTop:1}}>Payment date will be set to invoice date. No AP flow required.</div>
                  </div>
                </label>
              )}
            </div>
          )}
          {isCOGS&&subCat&&(
            <div style={{padding:"12px 14px",background:"var(--acc-bg)",borderRadius:10,marginBottom:16,display:"flex",alignItems:"center",gap:10,border:"1px solid rgba(29,107,243,0.15)"}}>
              <Icon name="task" size={14} color="var(--acc)"/>
              <span style={{fontSize:12.5,color:"var(--acc)",lineHeight:1.5}}>On approval, an <strong>SC Allocate Delivery</strong> task will be created. Invoice stays in Finance ledger throughout.</span>
            </div>
          )}
          {err&&<div style={{padding:"10px 14px",background:"var(--neg-bg)",borderRadius:8,fontSize:12.5,color:"var(--neg)",marginBottom:12}}>{err}</div>}
          <div style={{display:"flex",gap:10}}>
            <button onClick={onClose} style={{padding:"10px 20px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",fontSize:13,color:"var(--sub)",cursor:"pointer"}}>Cancel</button>
            <button onClick={handle} disabled={busy||!catCode||!subCat||(!isCOGS&&!desc.trim())}
              style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"var(--acc)",color:"#fff",fontWeight:600,fontSize:14,cursor:"pointer",opacity:busy||!catCode||!subCat?0.5:1,transition:"opacity .15s"}}>
              {busy?"Posting…":isCOGS?"Approve & Send to SC →":"Approve for Payment →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}






