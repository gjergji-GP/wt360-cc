import { useState } from "react";
import { Icon } from "../../components/common/Icon";
import { SB } from "../../lib/supabase";

export function HRInjectShiftModal({session,employees,locations,onClose,onDone}) {
  const allEmps  = employees||[];
  const allLocs  = locations||[];

  const [empSearch,setEmpSearch]   = useState('');
  const [empFilter,setEmpFilter]   = useState('');
  const [empSugOpen,setEmpSugOpen] = useState(false);
  const [locFilter,setLocFilter]   = useState(session?.home_location_id||'');
  const [checkIn,setCheckIn]       = useState('');
  const [checkOut,setCheckOut]     = useState('');
  const [reason,setReason]         = useState('');
  const [busy,setBusy]             = useState(false);
  const [err,setErr]               = useState('');
  const [result,setResult]         = useState(null);

  const pad = n => String(n).padStart(2,'0');
  const toLocal = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  // Quick-fill: set check-in and check-out to a past day at scheduled hours
  const fillDay = (daysAgo, startH=10, endH=18) => {
    const d = new Date();
    d.setDate(d.getDate()-daysAgo);
    const cin = new Date(d); cin.setHours(startH,0,0,0);
    const cout = new Date(d); cout.setHours(endH,0,0,0);
    setCheckIn(toLocal(cin));
    setCheckOut(toLocal(cout));
  };

  const durH = checkIn&&checkOut
    ? ((new Date(checkOut)-new Date(checkIn))/3600000).toFixed(1)
    : null;
  const durValid = durH&&parseFloat(durH)>0&&parseFloat(durH)<=16;

  const selectedEmp = empFilter ? allEmps.find(e=>(e.employee_id||e.id)===empFilter) : null;
  const suggestions = empSearch.trim().length>0
    ? allEmps.filter(e=>(e.full_name||'').toLowerCase().includes(empSearch.toLowerCase())).slice(0,8)
    : [];

  const doInject = async () => {
    if(!empFilter||!checkIn||!checkOut||!reason.trim()) return;
    setBusy(true); setErr('');
    try {
      const {data,error} = await SB.rpc('hr_inject_shift',{
        p_employee_id:    empFilter,
        p_checked_in_at:  new Date(checkIn).toISOString(),
        p_checked_out_at: new Date(checkOut).toISOString(),
        p_reason:         reason,
        p_location_id:    locFilter||null,
      });
      if(error) throw error;
      setResult(data);
    } catch(e){ setErr(e.message||'Injection failed.'); }
    finally{ setBusy(false); }
  };

  if(result) return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:420,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:36,marginBottom:12}}>âœ“</div>
        <div style={{fontWeight:800,fontSize:17,color:'var(--ink)',marginBottom:6}}>Shift injected</div>
        <div style={{fontSize:13,color:'var(--muted)',marginBottom:20}}>
          {selectedEmp?.full_name} Â· {parseFloat(result.duration_hours).toFixed(1)}h Â· {parseFloat(result.gross_earnings).toLocaleString()} ALL
        </div>
        <div style={{fontSize:12,color:'var(--muted)',marginBottom:24,padding:'10px 14px',background:'var(--faint)',borderRadius:8}}>
          A correction task has been created for CFO review.
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{setResult(null);setCheckIn('');setCheckOut('');setReason('');}}
            style={{flex:1,height:40,background:'var(--faint)',border:'1px solid var(--border)',borderRadius:9,color:'var(--ink)',fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Inject another
          </button>
          <button onClick={()=>{if(onDone)onDone();onClose();}}
            style={{flex:1,height:40,background:'var(--acc)',border:'none',borderRadius:9,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal-box" style={{maxWidth:500}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:'24px 28px 18px',borderBottom:'1px solid var(--divider)',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
          <div>
            <div style={{fontWeight:800,fontSize:17,color:'var(--ink)'}}>Inject Shift Record</div>
            <div style={{fontSize:12,color:'var(--muted)',marginTop:3}}>Manually record a working day where no check-in exists</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',display:'flex'}}><Icon name="close" size={18}/></button>
        </div>

        <div style={{padding:'20px 28px 24px'}}>

          {/* Employee picker */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Employee <span style={{color:'var(--neg)'}}>*</span></div>
            <div style={{position:'relative'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',background:'var(--faint)',border:`1.5px solid ${empFilter?'var(--acc)':'var(--border)'}`,borderRadius:9}}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input value={empSearch} onChange={e=>{setEmpSearch(e.target.value);setEmpSugOpen(true);if(!e.target.value){setEmpFilter('');}}}
                  onFocus={()=>setEmpSugOpen(true)} onBlur={()=>setTimeout(()=>setEmpSugOpen(false),150)}
                  placeholder={selectedEmp?selectedEmp.full_name:'Search employeeâ€¦'}
                  style={{background:'transparent',border:'none',outline:'none',fontSize:13,fontWeight:empFilter?600:400,color:empFilter?'var(--acc)':'var(--ink)',flex:1}}/>
                {empFilter&&<button onClick={()=>{setEmpFilter('');setEmpSearch('');}} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',display:'flex',padding:0}}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>}
              </div>
              {empSugOpen&&suggestions.length>0&&(
                <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,.10)',zIndex:500,overflow:'hidden'}}>
                  {suggestions.map((e,i)=>{
                    const eid=e.employee_id||e.id;
                    return <div key={eid} onMouseDown={()=>{setEmpFilter(eid);setEmpSearch(e.full_name||'');setEmpSugOpen(false);
                        if(e.location_id||e.home_location_id) setLocFilter(e.location_id||e.home_location_id);}}
                      style={{padding:'9px 14px',cursor:'pointer',fontSize:13,color:'var(--ink)',display:'flex',alignItems:'center',gap:9,
                        background:i===0?'var(--acc-bg)':'transparent',transition:'background .1s'}}
                      onMouseEnter={ev=>ev.currentTarget.style.background='var(--bg2)'}
                      onMouseLeave={ev=>ev.currentTarget.style.background=i===0?'var(--acc-bg)':'transparent'}>
                      <div style={{width:24,height:24,borderRadius:'50%',background:'var(--acc-bg)',color:'var(--acc)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>
                        {(e.full_name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontWeight:500}}>{e.full_name}</div>
                        <div style={{fontSize:11,color:'var(--muted)'}}>{e.role_name||''} Â· {e.location_name||''}</div>
                      </div>
                    </div>;
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Location</div>
            <select value={locFilter} onChange={e=>setLocFilter(e.target.value)}
              style={{width:'100%',background:'var(--faint)',border:'1.5px solid var(--border)',borderRadius:9,padding:'9px 12px',fontSize:13,color:'var(--ink)',outline:'none'}}>
              <option value=''>Employee home location</option>
              {allLocs.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          {/* Quick-fill buttons */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Quick fill (10:00â€“18:00)</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {[
                {label:'Today',     days:0},
                {label:'Yesterday', days:1},
                {label:'2 days ago',days:2},
                {label:'3 days ago',days:3},
                {label:'4 days ago',days:4},
                {label:'5 days ago',days:5},
                {label:'6 days ago',days:6},
              ].map(q=>(
                <button key={q.days} onClick={()=>fillDay(q.days)}
                  style={{padding:'4px 10px',fontSize:11,fontWeight:500,borderRadius:6,border:'1px solid var(--border)',background:'var(--faint)',color:'var(--sub)',cursor:'pointer',transition:'all .12s'}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--acc)';e.currentTarget.style.color='var(--acc)';}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--sub)';}}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Times */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Check-in <span style={{color:'var(--neg)'}}>*</span></div>
              <input type="datetime-local" value={checkIn} onChange={e=>setCheckIn(e.target.value)}
                style={{width:'100%',background:'var(--faint)',border:'1.5px solid var(--border)',borderRadius:9,padding:'9px 12px',fontSize:13,color:'var(--ink)',outline:'none'}}/>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Check-out <span style={{color:'var(--neg)'}}>*</span></div>
              <input type="datetime-local" value={checkOut} onChange={e=>setCheckOut(e.target.value)}
                style={{width:'100%',background:'var(--faint)',border:'1.5px solid var(--border)',borderRadius:9,padding:'9px 12px',fontSize:13,color:'var(--ink)',outline:'none'}}/>
            </div>
          </div>

          {/* Duration preview */}
          {durH&&(
            <div style={{marginBottom:14,padding:'9px 14px',background:durValid?'var(--pos-bg)':'var(--neg-bg)',border:`1px solid ${durValid?'rgba(34,197,94,.25)':'rgba(239,68,68,.25)'}`,borderRadius:8,fontSize:13,color:durValid?'var(--pos)':'var(--neg)',fontWeight:500}}>
              {durValid ? `Duration: ${durH}h` : parseFloat(durH)<=0 ? 'Check-out must be after check-in' : 'Duration exceeds 16 hours â€” verify the times'}
            </div>
          )}

          {/* Reason */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Reason <span style={{color:'var(--neg)'}}>*</span></div>
            <textarea value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="e.g. Employee confirmed they worked this day â€” no check-in due to app issue"
              style={{width:'100%',minHeight:72,background:'var(--faint)',border:'1.5px solid var(--border)',borderRadius:9,padding:'9px 12px',fontSize:13,color:'var(--ink)',resize:'vertical',outline:'none',fontFamily:'inherit'}}/>
          </div>

          {err&&<div style={{padding:'8px 12px',background:'var(--neg-bg)',borderRadius:7,fontSize:12,color:'var(--neg)',marginBottom:12}}>{err}</div>}

          <div style={{display:'flex',gap:8}}>
            <button onClick={doInject}
              disabled={!empFilter||!checkIn||!checkOut||!reason.trim()||!durValid||busy}
              style={{flex:1,height:44,background:(!empFilter||!checkIn||!checkOut||!reason.trim()||!durValid||busy)?'var(--divider)':'var(--acc)',border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:700,cursor:(!empFilter||!checkIn||!checkOut||!reason.trim()||!durValid||busy)?'not-allowed':'pointer',transition:'background .15s'}}>
              {busy?'Injectingâ€¦':'Inject Shift Record'}
            </button>
            <button onClick={onClose}
              style={{height:44,padding:'0 18px',background:'var(--faint)',border:'1px solid var(--border)',borderRadius:10,color:'var(--muted)',fontSize:13,fontWeight:500,cursor:'pointer'}}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€â”€ HR TIMESHEET MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* â”€â”€â”€ NEW PARTNER FORM HELPERS â€” defined OUTSIDE modal to prevent remount on re-render â”€â”€â”€ */
