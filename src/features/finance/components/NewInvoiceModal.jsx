import { useEffect, useRef, useState } from "react";
import { Icon } from "../../../components/common/Icon";
import { SB } from "../../../lib/supabase";
import { FIN_CATEGORIES } from "../config";
import { fmtCurrency } from "../formatters";

function NIM_FGM({label,req,children}) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11.5,fontWeight:700,color:"var(--sub)",marginBottom:5,letterSpacing:"0.01em"}}>
        {label}{req&&<span style={{color:"var(--neg)",marginLeft:2}}>*</span>}
      </div>
      {children}
    </div>
  );
}
function NIM_FIM({value,onChange,placeholder,type="text",disabled}) {
  return (
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type} disabled={disabled}
      style={{width:"100%",background:disabled?"var(--bg)":"var(--app)",border:"1px solid var(--border)",borderRadius:9,padding:"10px 13px",fontSize:13,color:disabled?"var(--muted)":"var(--ink)",outline:"none",transition:"border-color .15s",fontFamily:"var(--f)"}}
      onFocus={e=>e.target.style.borderColor="var(--acc)"}
      onBlur={e=>e.target.style.borderColor="var(--border)"}/>
  );
}
function NIM_VendorSearch({value,onChange,brandId}) {
  const [query,setQuery]=useState("");
  const [results,setResults]=useState([]);
  const [open,setOpen]=useState(false);
  const [selName,setSelName]=useState("");
  const ref=useRef();
  useEffect(()=>{
    if(query.length<1){setResults([]);return;}
    const t=setTimeout(async()=>{
      const{data}=await SB.from("vendors").select("id,name,tax_id,status").ilike("name",`%${query}%`).neq("status","DELETED").limit(8);
      setResults(data||[]);
    },200);
    return()=>clearTimeout(t);
  },[query]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  return (
    <div ref={ref} style={{position:"relative"}}>
      <input value={selName||query} onChange={e=>{setQuery(e.target.value);setSelName("");onChange("","");setOpen(true);}}
        placeholder="Search vendor name…"
        style={{width:"100%",background:"var(--app)",border:"1px solid var(--border)",borderRadius:9,padding:"10px 13px",fontSize:13,color:"var(--ink)",outline:"none",fontFamily:"var(--f)"}}
        onFocus={e=>{e.target.style.borderColor="var(--acc)";setOpen(true);}}
        onBlur={e=>e.target.style.borderColor="var(--border)"}/>
      {open&&results.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,boxShadow:"0 8px 28px rgba(0,0,0,.12)",zIndex:20,overflow:"hidden"}}>
          {results.map(v=>(
            <div key={v.id} onMouseDown={()=>{onChange(v.id,v.name);setSelName(v.name);setQuery("");setOpen(false);}}
              style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid var(--divider)",display:"flex",alignItems:"center",justifyContent:"space-between"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--faint)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{fontWeight:600,fontSize:13,color:"var(--ink)"}}>{v.name}</div>
              {v.tax_id&&<div style={{fontSize:11,color:"var(--muted)",fontFamily:"monospace"}}>{v.tax_id}</div>}
            </div>
          ))}
        </div>
      )}
      {selName&&<div style={{marginTop:4,fontSize:11,color:"var(--pos)",fontWeight:600}}>✓ {selName} selected</div>}
    </div>
  );
}
function NIM_ProductSearch({line,idx,onUpdate}) {
  const [query,setQuery]=useState(line.search||"");
  const [results,setResults]=useState([]);
  const [open,setOpen]=useState(false);
  const ref=useRef();
  useEffect(()=>{
    if(query.length<2){setResults([]);return;}
    const t=setTimeout(async()=>{
      const{data}=await SB.from("master_products").select("id,sku_code,product_name,purchase_uom,last_purchase_price,group_id").ilike("product_name",`%${query}%`).eq("status","ACTIVE").limit(8);
      setResults(data||[]);
    },220);
    return()=>clearTimeout(t);
  },[query]);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[]);
  return (
    <div ref={ref} style={{position:"relative",marginBottom:8}}>
      <input value={query} onChange={e=>{setQuery(e.target.value);setOpen(true);onUpdate(idx,"search",e.target.value);}}
        placeholder="Search product from MPR…"
        style={{width:"100%",background:"var(--card)",border:"1px solid var(--border)",borderRadius:9,padding:"9px 13px",fontSize:12.5,color:"var(--ink)",outline:"none",fontFamily:"var(--f)"}}
        onFocus={e=>{e.target.style.borderColor="var(--acc)";setOpen(true);}}
        onBlur={e=>e.target.style.borderColor="var(--border)"}/>
      {open&&results.length>0&&(
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,boxShadow:"0 8px 28px rgba(0,0,0,.12)",zIndex:20,overflow:"hidden"}}>
          {results.map(p=>(
            <div key={p.id} onMouseDown={()=>{
              onUpdate(idx,"search",p.product_name);
              onUpdate(idx,"group_name",p.product_name);
              onUpdate(idx,"sku_code",p.sku_code||"");
              onUpdate(idx,"uom",p.purchase_uom||"");
              onUpdate(idx,"unit_price",p.last_purchase_price||"");
              setQuery(p.product_name);setOpen(false);
            }}
              style={{padding:"9px 14px",cursor:"pointer",borderBottom:"1px solid var(--divider)"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--faint)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{fontWeight:600,fontSize:12.5,color:"var(--ink)"}}>{p.product_name}</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:1,display:"flex",gap:8}}>
                <span>{p.sku_code}</span>
                {p.purchase_uom&&<span>· {p.purchase_uom}</span>}
                {p.last_purchase_price&&<span>· {fmtCurrency(p.last_purchase_price,true)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function NewInvoiceModal({onClose,onSaved,session}) {
  const [step,setStep]=useState(1);
  const [catCode,setCatCode]=useState("");
  const [subCat,setSubCat]=useState("");
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState("");
  const [form,setForm]=useState({vendor_id:"",vendor_name:"",description:"",total_price:"",due_date:"",invoice_status:"UNPAID",lines:[]});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const selCat = FIN_CATEGORIES.find(c=>c.code===catCode);
  const isCOGS = selCat?.posts_inventory===true;

  const addLine = ()=>setForm(p=>({...p,lines:[...p.lines,{_id:Date.now()+Math.random(),search:"",sku_code:"",group_name:"",uom:"",qty:"",unit_price:""}]}));
  const updLine = (i,k,v)=>setForm(p=>{const l=[...p.lines];l[i]={...l[i],[k]:v};return{...p,lines:l};});
  const remLine = (i)=>setForm(p=>({...p,lines:p.lines.filter((_,j)=>j!==i)}));

  const handleSave = async()=>{
    setBusy(true);setErr("");
    try{
      const now=new Date().toISOString();
      const payload={
        brand_id:session.brand_id,
        source:"MANUAL",
        status:"APPROVED_FOR_PAYMENT",
        fiscal_ref:`MANUAL-${Date.now()}`,
        vendor_name_raw:form.vendor_name||"Manual Entry",
        vendor_id:form.vendor_id||null,
        invoice_date:now.slice(0,10),
        total_amount:+form.total_price||0,
        due_date:form.due_date||null,
        currency:"ALL",
        classified_at:new Date().toISOString(),
        expense_category_code:catCode||null,
        expense_subcategory:subCat||null,
        payload_raw:{manual:true,description:form.description,lines:form.lines},
      };
      const{data,error}=await SB.from("fiscal_invoices").insert(payload).select().single();
      if(error) throw error;
      onSaved(data);
    }catch(e){setErr(e.message||"Save failed");}
    setBusy(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:900,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}} onClick={onClose}>
      <div style={{width:540,height:"100vh",background:"var(--card)",overflowY:"auto",boxShadow:"-12px 0 48px rgba(0,0,0,.18)"}} onClick={e=>e.stopPropagation()} className="fade-up">
        <div style={{padding:"22px 26px",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"var(--card)",zIndex:10}}>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"var(--ink)",letterSpacing:"-0.015em"}}>New Manual Invoice</div>
            <div style={{fontSize:11.5,color:"var(--muted)",marginTop:3,fontWeight:500}}>
              {step===1?"Step 1 — Choose expense category":selCat?`${selCat.name}${subCat?" · "+subCat:""}`:""  }
            </div>
          </div>
          <button onClick={onClose} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:9,width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="close" size={14} color="var(--sub)"/></button>
        </div>
        <div style={{padding:"26px"}}>
          {step===1&&(
            <>
              <div style={{fontSize:12.5,color:"var(--sub)",marginBottom:20,lineHeight:1.6,fontWeight:500}}>Select the category of this expense. This determines the invoice form and workflow.</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {FIN_CATEGORIES.map(cat=>(
                  <div key={cat.code} onClick={()=>{setCatCode(c=>c===cat.code?"":cat.code);setSubCat("");}}
                    style={{padding:"13px 16px",border:`1px solid ${catCode===cat.code?"var(--acc)":"var(--border)"}`,borderRadius:11,cursor:"pointer",background:catCode===cat.code?"var(--acc-bg)":"var(--card)",transition:"all .12s",boxShadow:catCode===cat.code?"0 0 0 3px rgba(21,88,214,0.08)":"none"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div style={{fontWeight:700,fontSize:13,color:catCode===cat.code?"var(--acc)":"var(--ink)",letterSpacing:"-0.01em"}}>{cat.name}</div>
                      {cat.posts_inventory&&<span style={{fontSize:10,fontWeight:700,color:"var(--acc)",background:"var(--acc-bg)",padding:"2px 8px",borderRadius:100,letterSpacing:"0.05em",border:"1px solid rgba(21,88,214,0.15)"}}>COGS</span>}
                    </div>
                    {catCode===cat.code&&(
                      <div style={{marginTop:11,display:"flex",flexWrap:"wrap",gap:6}}>
                        {cat.subs.map(s=>(
                          <span key={s} onClick={e=>{e.stopPropagation();setSubCat(sv=>sv===s?"":s);}}
                            style={{padding:"5px 12px",borderRadius:100,border:`1px solid ${subCat===s?"var(--acc)":"var(--border)"}`,fontSize:11.5,fontWeight:subCat===s?700:400,color:subCat===s?"var(--acc)":"var(--sub)",cursor:"pointer",background:subCat===s?"var(--acc-bg)":"transparent",transition:"all .1s"}}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={()=>{if(catCode)setStep(2);}} disabled={!catCode}
                style={{width:"100%",marginTop:20,padding:"12px",borderRadius:10,border:"none",background:catCode?"var(--acc)":"var(--divider)",color:catCode?"#fff":"var(--muted)",fontWeight:700,fontSize:14,cursor:catCode?"pointer":"default",transition:"background .15s",letterSpacing:"-0.01em"}}>
                Continue →
              </button>
              {catCode&&!subCat&&<div style={{textAlign:"center",fontSize:11.5,color:"var(--muted)",marginTop:8}}>Subcategory optional — continue or select one above</div>}
            </>
          )}
          {step===2&&(
            <>
              <NIM_FGM label="Vendor" req>
                <NIM_VendorSearch value={form.vendor_id} onChange={(id,name)=>{set("vendor_id",id);set("vendor_name",name);}} brandId={session.brand_id}/>
              </NIM_FGM>
              {!isCOGS&&<NIM_FGM label="Description" req><textarea value={form.description} onChange={e=>set("description",e.target.value)} placeholder="What is this payment for? Be specific." rows={3}
                style={{width:"100%",background:"var(--app)",border:"1px solid var(--border)",borderRadius:9,padding:"10px 13px",fontSize:13,color:"var(--ink)",outline:"none",resize:"vertical",fontFamily:"var(--f)"}}
                onFocus={e=>e.target.style.borderColor="var(--acc)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/></NIM_FGM>}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <NIM_FGM label="Total Price" req><NIM_FIM value={form.total_price} onChange={v=>set("total_price",v)} placeholder="0.00" type="number"/></NIM_FGM>
                <NIM_FGM label="Due Date"><NIM_FIM value={form.due_date} onChange={v=>set("due_date",v)} type="date"/></NIM_FGM>
              </div>
              {isCOGS&&(
                <>
                  <NIM_FGM label="Invoice Status" req>
                    <select value={form.invoice_status} onChange={e=>set("invoice_status",e.target.value)}
                      style={{width:"100%",background:"var(--app)",border:"1px solid var(--border)",borderRadius:9,padding:"10px 13px",fontSize:13,color:"var(--ink)",outline:"none",fontFamily:"var(--f)"}}>
                      <option value="UNPAID">Unpaid</option>
                      <option value="PAID">Already Paid</option>
                    </select>
                  </NIM_FGM>
                  <div style={{marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div style={{fontSize:11.5,fontWeight:700,color:"var(--ink)",letterSpacing:"0.01em"}}>Product Lines <span style={{color:"var(--neg)"}}>*</span></div>
                      <button onClick={addLine} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:8,border:"1px solid var(--acc)",background:"var(--acc-bg)",color:"var(--acc)",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                        <Icon name="plus" size={12} color="var(--acc)"/>Add Line
                      </button>
                    </div>
                    {form.lines.length===0&&(
                      <div style={{padding:"20px",border:"1px dashed var(--border)",borderRadius:10,textAlign:"center",color:"var(--muted)",fontSize:12.5}}>
                        Add at least one product line. Search directly from the MPR.
                      </div>
                    )}
                    {form.lines.map((line,i)=>(
                      <div key={line._id||i} style={{background:"var(--bg)",borderRadius:11,padding:"13px",marginBottom:8,border:"1px solid var(--divider)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <span style={{fontSize:11.5,fontWeight:700,color:"var(--sub)",letterSpacing:"0.01em"}}>Line {i+1}</span>
                          <button onClick={()=>remLine(i)} style={{background:"var(--neg-bg)",border:"none",borderRadius:6,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}><Icon name="close" size={11} color="var(--neg)"/></button>
                        </div>
                        <NIM_ProductSearch line={line} idx={i} onUpdate={updLine}/>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                          <div>
                            <div style={{fontSize:10.5,color:"var(--muted)",marginBottom:3,fontWeight:600}}>SKU (auto-fill)</div>
                            <input value={line.sku_code||""} readOnly placeholder="—"
                              style={{width:"100%",background:"var(--divider)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",fontSize:12,color:"var(--muted)",outline:"none"}}/>
                          </div>
                          <div>
                            <div style={{fontSize:10.5,color:"var(--muted)",marginBottom:3,fontWeight:600}}>UOM (auto-fill)</div>
                            <input value={line.uom||""} readOnly placeholder="—"
                              style={{width:"100%",background:"var(--divider)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",fontSize:12,color:"var(--muted)",outline:"none"}}/>
                          </div>
                        </div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                          <div>
                            <div style={{fontSize:10.5,color:"var(--muted)",marginBottom:3,fontWeight:600}}>Quantity *</div>
                            <input value={line.qty} onChange={e=>updLine(i,"qty",e.target.value)} type="number" placeholder="0"
                              style={{width:"100%",background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",fontSize:12,color:"var(--ink)",outline:"none",fontFamily:"var(--f)"}}
                              onFocus={e=>e.target.style.borderColor="var(--acc)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                          </div>
                          <div>
                            <div style={{fontSize:10.5,color:"var(--muted)",marginBottom:3,fontWeight:600}}>Unit Price *</div>
                            <input value={line.unit_price} onChange={e=>updLine(i,"unit_price",e.target.value)} type="number" placeholder="0.00"
                              style={{width:"100%",background:"var(--card)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",fontSize:12,color:"var(--ink)",outline:"none",fontFamily:"var(--f)"}}
                              onFocus={e=>e.target.style.borderColor="var(--acc)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                          </div>
                          <div>
                            <div style={{fontSize:10.5,color:"var(--muted)",marginBottom:3,fontWeight:600}}>Line Total</div>
                            <input value={line.qty&&line.unit_price?fmtCurrency(+line.qty*+line.unit_price):"—"} readOnly
                              style={{width:"100%",background:"var(--divider)",border:"1px solid var(--border)",borderRadius:8,padding:"7px 12px",fontSize:12,color:"var(--muted)",outline:"none"}}/>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {err&&<div style={{padding:"10px 14px",background:"var(--neg-bg)",borderRadius:9,fontSize:12.5,color:"var(--neg)",marginBottom:12}}>{err}</div>}
              <div style={{display:"flex",gap:10,marginTop:8}}>
                <button onClick={()=>setStep(1)} style={{padding:"10px 20px",borderRadius:10,border:"1px solid var(--border)",background:"transparent",fontSize:13,color:"var(--sub)",cursor:"pointer"}}>← Back</button>
                <button onClick={handleSave} disabled={busy||!form.vendor_id||!form.total_price||(isCOGS&&form.lines.length===0)||(!isCOGS&&!form.description)}
                  style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:"var(--acc)",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer",opacity:busy?0.7:1,letterSpacing:"-0.01em",boxShadow:"0 2px 8px rgba(21,88,214,0.22)"}}>
                  {busy?"Saving…":"Save Invoice"}
                </button>
              </div>
              <div style={{marginTop:10,padding:"10px 14px",background:"var(--faint)",borderRadius:9,fontSize:11.5,color:"var(--muted)",lineHeight:1.6}}>
                <strong style={{color:"var(--ink)"}}>On save:</strong> Ticket ID generated · Registered in Finance Ledger{isCOGS?" · SC task created":""}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── CLASSIFY MODAL ─────────────────────────────────────────────────────── */
