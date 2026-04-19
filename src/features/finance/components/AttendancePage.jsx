import { useEffect, useRef, useState } from "react";
import { Icon } from "../../../components/common/Icon";
import { SB } from "../../../lib/supabase";

export function AttendancePage({session,locations,brands,employees,allLocations,deps}) {
  const { DATE_PRESETS, CalendarPicker, HRInjectShiftModal } = deps;

  /* ── formatters ── */
  const fmtTs  = d => d ? new Date(d).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
  const fmtDayFull = ds => { if(!ds||typeof ds!=='string'||!ds.includes('-')) return ''; try{const [y,m,d]=ds.split('-'); return new Date(+y,+m-1,+d).toLocaleDateString('en-GB',{day:'2-digit',month:'short'});}catch{return '';} };

  /* ── state ── */
  const [rows,setRows]         = useState([]);
  const [loading,setLoading]   = useState(true);
  const [err,setErr]           = useState('');
  const [brandFilter,setBrandFilter] = useState('');
  const [locFilter,setLocFilter]     = useState('');
  const [statusFilter,setStatusFilter] = useState('all');
  const [datePreset,setDatePreset]   = useState('Today');
  const [customRange,setCustomRange] = useState({from:'',to:''});
  const [showCal,setShowCal]         = useState(false);
  const calRef = useRef(null);
  const [trendOpen,setTrendOpen]     = useState(false);
  const [heatData]       = useState({});
  const [lateData]       = useState([]);
  const [flagModal,setFlagModal]         = useState(null);
  const [flagNote,setFlagNote] = useState('');
  const [actioning,setActioning] = useState(false);
  const [localEmps,setLocalEmps] = useState([]);
  const [localLocs,setLocalLocs] = useState([]);
  const [editModal,setEditModal]   = useState(null);   // {row, empName}
  const [editIn,setEditIn]         = useState('');
  const [editOut,setEditOut]       = useState('');
  const [editReason,setEditReason] = useState('');
  const [overrideModal,setOverrideModal]       = useState(null);  // {row, empName}
  const [overrideOut,setOverrideOut]           = useState('');
  const [overrideReason,setOverrideReason]     = useState('');
  const [scheduleSuggestion,setScheduleSuggestion] = useState(null);
  const [showInject,setShowInject]             = useState(false);
  const [voidModal,setVoidModal]               = useState(null); // {row, empName}
  const [voidReason,setVoidReason]             = useState('');
  const [exporting,setExporting]   = useState(false);
  // Employee search filter
  const [empSearch,setEmpSearch]   = useState('');
  const [empFilter,setEmpFilter]   = useState('');   // selected employee_id
  const [empSugOpen,setEmpSugOpen] = useState(false);
  const empSearchRef               = useRef(null);

  /* ── date range ── */
  const getRange = () => {
    try {
      const s=new Date(); s.setHours(0,0,0,0);
      const e=new Date(); e.setHours(23,59,59,999);
      const safe={from:s.toISOString(),to:e.toISOString()};
      if(datePreset==='Today')        return safe;
      if(datePreset==='Yesterday')    { s.setDate(s.getDate()-1);e.setDate(e.getDate()-1);return {from:s.toISOString(),to:e.toISOString()}; }
      if(datePreset==='Last 7 days')  { s.setDate(s.getDate()-6);return {from:s.toISOString(),to:e.toISOString()}; }
      if(datePreset==='Last 30 days') { s.setDate(s.getDate()-29);return {from:s.toISOString(),to:e.toISOString()}; }
      if(datePreset==='This Week')    { s.setDate(s.getDate()-6);return {from:s.toISOString(),to:e.toISOString()}; }
      const cr = (customRange!=null&&typeof customRange==='object'&&customRange.from)?customRange:{from:'',to:''};
      if(datePreset==='Custom'&&cr.from) {
        const cf=new Date(cr.from+'T00:00:00');
        const ct=cr.to?new Date(cr.to+'T23:59:59'):e;
        return {from:cf.toISOString(),to:ct.toISOString()};
      }
      return safe;
    } catch {
      const s=new Date(); s.setHours(0,0,0,0);
      const e=new Date(); e.setHours(23,59,59,999);
      return {from:s.toISOString(),to:e.toISOString()};
    }
  };

  /* ── data load ── */
  const load = async () => {
    setLoading(true); setErr('');
    try {
      const {from,to}=getRange();
      let q=SB.from('shift_checkins')
        .select('id,brand_id,employee_id,location_id,checked_in_at,checked_out_at,gross_earnings,hr_override_checkout,hr_override_note,hr_reviewed_at,is_frozen,frozen_reason,frozen_at,scheduled_start_at')
        .gte('checked_in_at',from).lte('checked_in_at',to)
        .order('checked_in_at',{ascending:false}).limit(500);
      if(brandFilter) q=q.eq('brand_id',brandFilter);
      if(locFilter)   q=q.eq('location_id',locFilter);
      if(empFilter)   q=q.eq('employee_id',empFilter);
      const {data,error}=await q;
      if(error) throw error;
      let d=data||[];
      if(statusFilter==='active')       d=d.filter(r=>!r.checked_out_at);
      if(statusFilter==='completed')    d=d.filter(r=>!!r.checked_out_at&&!r.hr_override_checkout);
      if(statusFilter==='override')     d=d.filter(r=>!!r.hr_override_checkout||!!r.hr_override_note);
      if(statusFilter==='needs-review') d=d.filter(r=>r.is_frozen||(r.checked_out_at===null&&((Date.now()-new Date(r.checked_in_at).getTime())/60000)>480));
      setRows(d);
      // Load employee + location lookup maps if not passed as props
      if(!(employees&&employees.length)){
        const {data:ed}=await SB.from('employees').select('id,employee_id,full_name').eq('is_active',true);
        setLocalEmps(ed||[]);
      }
      if(!(allLocations&&allLocations.length)){
        const {data:ld}=await SB.from('locations').select('id,name');
        setLocalLocs(ld||[]);
      }
    } catch(e){ setErr(e.message); }
    setLoading(false);
  };

  // loadTrend — deactivated, pending late_minutes/geo data pipeline
  const loadTrend = async () => { /* deactivated */ };

  const crFrom=(customRange!=null&&typeof customRange==='object'?customRange:{}).from||'';
  const crTo=(customRange!=null&&typeof customRange==='object'?customRange:{}).to||'';
  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  useEffect(()=>{ load(); },[brandFilter,locFilter,empFilter,datePreset,crFrom,crTo,statusFilter]);
  useEffect(()=>{ if(trendOpen) loadTrend(); },[trendOpen]);
  useEffect(()=>{
    const h=e=>{ if(calRef.current&&!calRef.current.contains(e.target)) setShowCal(false); };
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[]);

  /* ── row state ── */
  const rowState = r => {
    if(r.is_frozen) return 'frozen';
    if(r.hr_override_checkout) return 'override';
    if(!r.checked_out_at){ const mins=(Date.now()-new Date(r.checked_in_at).getTime())/60000; return mins>480?'overlong':'active'; }
    return 'normal';
  };
  const ST={
    normal:  {rowBg:'transparent',      badge:{t:'Done',    bg:'rgba(34,197,94,.1)',  c:'#4ade80'}},
    active:  {rowBg:'rgba(251,191,36,.03)',badge:{t:'Active',  bg:'rgba(251,191,36,.12)',c:'#fbbf24'}},
    overlong:{rowBg:'rgba(239,68,68,.04)', badge:{t:'Overlong',bg:'rgba(239,68,68,.12)',c:'#f87171'}},
    override:{rowBg:'rgba(96,165,250,.03)',badge:{t:'Override',bg:'rgba(96,165,250,.12)',c:'#60a5fa'}},
    frozen:  {rowBg:'rgba(148,163,184,.03)',badge:{t:'Frozen',  bg:'rgba(148,163,184,.1)', c:'#94a3b8'}},
  };
  const isInjected = r => !!(r.hr_override_checkout && r.hr_reviewed_at);

  /* ── simple calculations: hours and pay only ── */
  const shiftHours = r => {
    const out = r.hr_override_checkout || r.checked_out_at;
    if(!out) return (Date.now() - new Date(r.checked_in_at).getTime()) / 3600000;
    return (new Date(out).getTime() - new Date(r.checked_in_at).getTime()) / 3600000;
  };
  const shiftPay = r => r.gross_earnings != null ? parseFloat(r.gross_earnings) : null;
  const fmtHrs = h => h != null ? h.toFixed(2)+'h' : '—';
  const fmtPay = p => p != null ? p.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' ALL' : '—';

  /* ── flag action ── */
  const doFlag = async () => {
    if(!flagNote.trim()) return;
    setActioning(true);
    const {error}=await SB.rpc('hr_flag_checkin',{p_checkin_id:flagModal.id,p_note:flagNote});
    setActioning(false);
    if(error){alert(error.message);return;}
    setFlagModal(null);setFlagNote('');load();
  };

  /* ── HR edit checkin/checkout ── */
  const openEdit = (r, empName) => {
    const toLocal = ts => {
      if(!ts) return '';
      const d = new Date(ts);
      const pad = n => String(n).padStart(2,'0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setEditModal({row:r, empName});
    setEditIn(toLocal(r.checked_in_at));
    setEditOut(toLocal(r.hr_override_checkout||r.checked_out_at));
    setEditReason('');
  };
  const doEdit = async () => {
    if(!editIn||!editReason.trim()) return;
    setActioning(true);
    const {error} = await SB.rpc('hr_edit_checkin',{
      p_checkin_id:         editModal.row.id,
      p_new_checked_in_at:  new Date(editIn).toISOString(),
      p_new_checked_out_at: editOut ? new Date(editOut).toISOString() : null,
      p_reason:             editReason,
    });
    setActioning(false);
    if(error){alert('Error: '+error.message);return;}
    setEditModal(null); setEditIn(''); setEditOut(''); setEditReason('');
    load();
  };

  /* ── HR override checkout (for frozen/overlong shifts) ── */
  const openOverride = async (r, empName) => {
    setOverrideModal({row:r, empName});
    setOverrideReason('');
    setScheduleSuggestion(null);
    // Try to find scheduled shift end for this employee on this day
    const dayOfWeek = new Date(r.checked_in_at).getDay(); // 0=Sun
    const pgDow = dayOfWeek === 0 ? 7 : dayOfWeek; // Postgres: Mon=1..Sun=7
    const {data:lines} = await SB.from('shift_schedule_lines')
      .select('shift_start,shift_end')
      .eq('employee_id', r.employee_id)
      .eq('day_of_week', pgDow)
      .eq('is_day_off', false)
      .limit(1);
    if(lines&&lines.length>0&&lines[0].shift_end){
      // Build suggested checkout: same date as check-in + shift_end time
      const cin = new Date(r.checked_in_at);
      const [hh,mm] = lines[0].shift_end.split(':');
      const suggested = new Date(cin);
      suggested.setHours(+hh, +mm, 0, 0);
      // If suggested is before check-in (overnight edge), add 1 day
      if(suggested <= cin) suggested.setDate(suggested.getDate()+1);
      const pad = n => String(n).padStart(2,'0');
      const local = `${suggested.getFullYear()}-${pad(suggested.getMonth()+1)}-${pad(suggested.getDate())}T${pad(suggested.getHours())}:${pad(suggested.getMinutes())}`;
      setScheduleSuggestion({display: lines[0].shift_end, isoLocal: local});
      setOverrideOut(local);
    } else {
      // Default to check-in date + 8 hours as fallback
      const cin = new Date(r.checked_in_at);
      cin.setHours(cin.getHours()+8, 0, 0, 0);
      const pad = n => String(n).padStart(2,'0');
      setOverrideOut(`${cin.getFullYear()}-${pad(cin.getMonth()+1)}-${pad(cin.getDate())}T${pad(cin.getHours())}:${pad(cin.getMinutes())}`);
    }
  };
  const doOverride = async () => {
    if(!overrideOut||!overrideReason.trim()) return;
    setActioning(true);
    const {error} = await SB.rpc('hr_override_checkout',{
      p_checkin_id:    overrideModal.row.id,
      p_checkout_time: new Date(overrideOut).toISOString(),
      p_note:          overrideReason,
    });
    setActioning(false);
    if(error){alert('Error: '+error.message);return;}
    // Mark any open TIMESHEET_REVIEW task for this shift as done
    await SB.from('tasks').update({status:'DONE',completed_at:new Date().toISOString()})
      .eq('entity_id', overrideModal.row.id)
      .eq('task_type_code','TIMESHEET_REVIEW')
      .in('status',['OPEN','IN_PROGRESS']);
    setOverrideModal(null); setOverrideOut(''); setOverrideReason(''); setScheduleSuggestion(null);
    load();
  };

  /* ── Void injected shift ── */
  const doVoid = async () => {
    if(!voidReason.trim()) return;
    setActioning(true);
    const {error} = await SB.rpc('hr_void_injected_shift',{
      p_checkin_id: voidModal.row.id,
      p_reason:     voidReason,
    });
    setActioning(false);
    if(error){alert('Error: '+error.message);return;}
    setVoidModal(null); setVoidReason('');
    load();
  };

  /* ── Export (Custom range only) ── */
  const doExport = async (fmt) => {
    setExporting(true);
    try {
      const _emps=[...(employees||[]),...localEmps];
      const _locs=[...(allLocations||[]),...localLocs];
      const brand = (brands||[]).find(b=>b.id===brandFilter);
      const loc   = _locs.find(l=>l.id===locFilter);
      const totalH = rows.reduce((s,r)=>s+shiftHours(r),0);
      const totalP = rows.reduce((s,r)=>s+(shiftPay(r)||0),0);

      if(fmt==='excel') {
        // Build CSV (opens in Excel)
        const header = ['Employee','Location','Check-in','Check-out','Hours','Earnings (ALL)','Status'];
        const dataRows = rows.map(r=>{
          const st=rowState(r);
          const empN=_emps.find(e=>e.employee_id===r.employee_id||e.id===r.employee_id)?.full_name||'—';
          const locN=_locs.find(l=>l.id===r.location_id)?.name||'—';
          const tout=r.hr_override_checkout||r.checked_out_at;
          return [
            empN, locN,
            r.checked_in_at?new Date(r.checked_in_at).toLocaleString('en-GB'):'',
            tout?new Date(tout).toLocaleString('en-GB'):'',
            shiftHours(r).toFixed(2),
            shiftPay(r)!=null?shiftPay(r).toFixed(2):'',
            ST[st]?.badge.t||''
          ];
        });
        const summaryRows = [
          [],
          ['SUMMARY'],
          ['Brand', brand?.name||'All Brands'],
          ['Location', loc?.name||'All Locations'],
          ['Date Range', customLabel],
          ['Total Records', rows.length],
          ['Total Hours', totalH.toFixed(2)],
          ['Total Earnings (ALL)', totalP.toFixed(2)],
        ];
        const csv = [header,...dataRows,...summaryRows]
          .map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))
          .join('\n');
        const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href=url;
        a.download=`attendance_${customLabel.replace(/[^a-z0-9]/gi,'_')}.csv`;
        a.click(); URL.revokeObjectURL(url);

      } else if(fmt==='pdf') {
        // Build printable HTML → print dialog
        const _emps2=[...(employees||[]),...localEmps];
        const _locs2=[...(allLocations||[]),...localLocs];
        const tbl = rows.map(r=>{
          const st=rowState(r);
          const empN=_emps2.find(e=>e.employee_id===r.employee_id||e.id===r.employee_id)?.full_name||'—';
          const locN=_locs2.find(l=>l.id===r.location_id)?.name||'—';
          const tout=r.hr_override_checkout||r.checked_out_at;
          return `<tr>
            <td>${empN}</td><td>${locN}</td>
            <td>${r.checked_in_at?new Date(r.checked_in_at).toLocaleString('en-GB'):''}</td>
            <td>${tout?new Date(tout).toLocaleString('en-GB'):'—'}</td>
            <td style="text-align:right">${shiftHours(r).toFixed(2)}h</td>
            <td style="text-align:right">${shiftPay(r)!=null?shiftPay(r).toFixed(2)+' ALL':'—'}</td>
            <td>${ST[st]?.badge.t||''}</td>
          </tr>`;
        }).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
          <title>Attendance Report — ${customLabel}</title>
          <style>
            body{font-family:system-ui,sans-serif;font-size:12px;color:#111;margin:32px}
            h1{font-size:18px;margin-bottom:4px}
            .meta{color:#666;font-size:11px;margin-bottom:20px}
            table{width:100%;border-collapse:collapse;margin-bottom:24px}
            th{background:#f4f4f4;padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.06em;border-bottom:2px solid #ddd}
            td{padding:7px 10px;border-bottom:1px solid #eee;font-size:11px}
            .summary{background:#f9f9f9;border:1px solid #ddd;padding:16px 20px;border-radius:8px;display:grid;grid-template-columns:repeat(4,auto);gap:24px}
            .s-label{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}
            .s-value{font-size:16px;font-weight:700;color:#111}
            @media print{body{margin:16px}}
          </style>
        </head><body>
          <h1>Attendance Report</h1>
          <div class="meta">Brand: ${brand?.name||'All Brands'} &nbsp;·&nbsp; Location: ${loc?.name||'All Locations'} &nbsp;·&nbsp; Period: ${customLabel} &nbsp;·&nbsp; Generated: ${new Date().toLocaleString('en-GB')}</div>
          <table><thead><tr><th>Employee</th><th>Location</th><th>Check-in</th><th>Check-out</th><th>Hours</th><th>Earnings</th><th>Status</th></tr></thead>
          <tbody>${tbl}</tbody></table>
          <div class="summary">
            <div><div class="s-label">Total Records</div><div class="s-value">${rows.length}</div></div>
            <div><div class="s-label">Total Hours</div><div class="s-value">${totalH.toFixed(2)}h</div></div>
            <div><div class="s-label">Total Earnings</div><div class="s-value">${totalP.toLocaleString('en-US',{minimumFractionDigits:2})} ALL</div></div>
            <div><div class="s-label">Filters</div><div class="s-value" style="font-size:11px">${[brand?.name,loc?.name].filter(Boolean).join(' / ')||'None'}</div></div>
          </div>
        </body></html>`;
        const w = window.open('','_blank','width=900,height=700');
        w.document.write(html); w.document.close();
        setTimeout(()=>w.print(),400);
      }
    } catch(ex){ alert('Export failed: '+ex.message); }
    setExporting(false);
  };

  /* ── calendar label ── */
  const cr_ = (customRange!=null&&typeof customRange==='object')?customRange:{from:'',to:''};
  const customLabel = cr_.from
    ? fmtDayFull(cr_.from)+(cr_.to&&cr_.to!==cr_.from?' → '+fmtDayFull(cr_.to):'')
    : 'Custom';

  /* ── KPI calculations from loaded rows ── */
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const weekStart  = new Date(); weekStart.setDate(weekStart.getDate()-((weekStart.getDay()+6)%7)); weekStart.setHours(0,0,0,0);
  const todayRows  = rows.filter(r=>new Date(r.checked_in_at)>=todayStart);
    const todayHrs   = todayRows.reduce((s,r)=>s+shiftHours(r),0);
  const todayPay   = todayRows.reduce((s,r)=>s+(shiftPay(r)||0),0);

  /* ── trend helpers (deactivated — kept for future use) ── */
  const days7=[];
  const locs7=[];
  const maxHeat=1;

  return(
    <div style={{paddingBottom:56}}>

      {/* ── PREMIUM CONTROL BAR ── */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20,padding:'11px 16px',background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--cr)',flexWrap:'wrap',position:'relative',boxShadow:'var(--elev-1)'}}>

        {/* Brand selector */}
        <div style={{display:'flex',alignItems:'center',gap:7,padding:'5px 12px',borderRadius:9,border:'1px solid var(--border)',background:'var(--bg2)',cursor:'pointer',flexShrink:0,transition:'border-color .13s'}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:'#16a34a',flexShrink:0}}/>
          <select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)}
            style={{background:'transparent',border:'none',outline:'none',fontSize:12.5,fontWeight:500,color:'var(--ink)',cursor:'pointer',appearance:'none',WebkitAppearance:'none',paddingRight:4}}>
            <option value=''>All Brands</option>
            {(brands||[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <Icon name="chevdown" size={10} color="var(--muted)"/>
        </div>

        <div style={{width:1,height:18,background:'var(--divider)',flexShrink:0}}/>

        {/* Location selector */}
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:9,border:'1px solid var(--border)',background:'var(--bg2)',cursor:'pointer',flexShrink:0,transition:'border-color .13s'}}>
          <Icon name="location" size={12} color="var(--muted)"/>
          <select value={locFilter} onChange={e=>{setLocFilter(e.target.value);setEmpFilter('');setEmpSearch('');}}
            style={{background:'transparent',border:'none',outline:'none',fontSize:12.5,fontWeight:500,color:'var(--ink)',cursor:'pointer',appearance:'none',WebkitAppearance:'none',paddingRight:4}}>
            <option value=''>All Locations</option>
            {(locations||[]).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <Icon name="chevdown" size={10} color="var(--muted)"/>
        </div>

        <div style={{width:1,height:18,background:'var(--divider)',flexShrink:0}}/>

        {/* Employee search filter — location-cascade, Tab autocomplete */}
        {(()=>{
          const _allEmps=[...(employees||[]),...localEmps];
          // Cascade: if locFilter active, only employees at that location
          const poolEmps=locFilter
            ? _allEmps.filter(e=>e.location_id===locFilter||e.home_location_id===locFilter)
            : _allEmps;
          const dedupEmps=Object.values(Object.fromEntries(poolEmps.map(e=>[e.employee_id||e.id,e])));
          const suggestions=empSearch.trim().length>0
            ? dedupEmps.filter(e=>(e.full_name||'').toLowerCase().includes(empSearch.toLowerCase())).slice(0,8)
            : [];
          const selectedEmp=empFilter?dedupEmps.find(e=>(e.employee_id||e.id)===empFilter):null;
          const handleEmpKeyDown=(ev)=>{
            if(ev.key==='Tab'&&suggestions.length>0){
              ev.preventDefault();
              const match=suggestions[0];
              const eid=match.employee_id||match.id;
              setEmpFilter(eid);
              setEmpSearch(match.full_name||'');
              setEmpSugOpen(false);
            }
            if(ev.key==='Escape'){setEmpSugOpen(false);}
          };
          return (
            <div style={{position:'relative',flexShrink:0}}>
              <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',borderRadius:9,border:`1px solid ${empFilter?'var(--acc)':'var(--border)'}`,background:empFilter?'var(--acc-bg)':'var(--bg2)',minWidth:160,maxWidth:200,transition:'border-color .13s'}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0,color:'var(--muted)'}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input
                  ref={empSearchRef}
                  value={empSearch}
                  onChange={e=>{setEmpSearch(e.target.value);setEmpSugOpen(true);if(!e.target.value){setEmpFilter('');}}}
                  onFocus={()=>setEmpSugOpen(true)}
                  onBlur={()=>setTimeout(()=>setEmpSugOpen(false),150)}
                  onKeyDown={handleEmpKeyDown}
                  placeholder={selectedEmp?selectedEmp.full_name:'Partner…'}
                  style={{background:'transparent',border:'none',outline:'none',fontSize:12.5,fontWeight:empFilter?600:400,color:empFilter?'var(--acc)':'var(--ink)',width:'100%',minWidth:0}}
                />
                {empFilter&&(
                  <button onClick={()=>{setEmpFilter('');setEmpSearch('');}} style={{background:'none',border:'none',cursor:'pointer',padding:0,display:'flex',color:'var(--muted)',flexShrink:0}}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                )}
              </div>
              {empSugOpen&&suggestions.length>0&&(
                <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,minWidth:220,background:'var(--card)',border:'1px solid var(--border)',borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,.10)',zIndex:400,overflow:'hidden'}}>
                  {suggestions.map((e,i)=>{
                    const eid=e.employee_id||e.id;
                    return (
                      <div key={eid}
                        onMouseDown={()=>{setEmpFilter(eid);setEmpSearch(e.full_name||'');setEmpSugOpen(false);}}
                        style={{padding:'8px 14px',cursor:'pointer',fontSize:13,color:'var(--ink)',background:i===0?'var(--acc-bg)':'transparent',display:'flex',alignItems:'center',gap:9,transition:'background .1s'}}
                        onMouseEnter={ev=>ev.currentTarget.style.background='var(--bg2)'}
                        onMouseLeave={ev=>ev.currentTarget.style.background=i===0?'var(--acc-bg)':'transparent'}>
                        <div style={{width:22,height:22,borderRadius:'50%',background:'var(--acc-bg)',color:'var(--acc)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,flexShrink:0}}>{(e.full_name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
                        <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.full_name}</span>
                        {i===0&&<span style={{fontSize:10,color:'var(--muted)',fontWeight:500,flexShrink:0}}>Tab ↹</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        <div style={{width:1,height:18,background:'var(--divider)',flexShrink:0}}/>

        {/* Date pills — reuse dashboard .date-pill class */}
        {['Today','Yesterday','This Week','Custom'].map(d=>(
          <button key={d} className={`date-pill ${datePreset===d?'on':''}`}
            onClick={()=>{ setDatePreset(d); if(d==='Custom') setShowCal(true); else setShowCal(false); }}>
            {d==='Custom'&&datePreset==='Custom'&&customRange?.from ? customLabel : d}
          </button>
        ))}

        <div style={{width:1,height:18,background:'var(--divider)',flexShrink:0}}/>

        {/* Status pills */}
        {[{id:'all',l:'All'},{id:'active',l:'Active'},{id:'needs-review',l:'Needs Review'},{id:'completed',l:'Completed'},{id:'override',l:'Override'}].map(s=>(
          <button key={s.id}
            className={`sev-pill ${statusFilter===s.id?'on-all':''}`}
            onClick={()=>setStatusFilter(s.id)}
            style={statusFilter===s.id?{}:{}}>{s.l}</button>
        ))}

        {/* Spacer */}
        <div style={{flex:1,minWidth:8}}/>

        {/* Record count */}
        <span style={{fontSize:11.5,color:'var(--muted)',fontVariantNumeric:'tabular-nums',flexShrink:0}}>{rows.length} record{rows.length!==1?'s':''}</span>

        {/* Refresh — premium native style */}
        <button onClick={load}
          style={{display:'flex',alignItems:'center',gap:6,padding:'5px 14px',borderRadius:9,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--sub)',fontSize:12,fontWeight:500,cursor:'pointer',flexShrink:0,transition:'border-color .15s,color .15s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--acc)';e.currentTarget.style.color='var(--ink)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--divider)';e.currentTarget.style.color='var(--sub)';}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Refresh
        </button>

        <div style={{width:1,height:18,background:'var(--divider)',flexShrink:0}}/>

        {/* Inject Shift */}
        <button onClick={()=>setShowInject(true)}
          style={{display:'flex',alignItems:'center',gap:5,padding:'5px 13px',borderRadius:9,border:'1px solid #f97316',background:'rgba(249,115,22,.06)',color:'#f97316',fontSize:12,fontWeight:600,cursor:'pointer',flexShrink:0,transition:'all .14s'}}
          onMouseEnter={e=>{e.currentTarget.style.background='rgba(249,115,22,.12)';}}
          onMouseLeave={e=>{e.currentTarget.style.background='rgba(249,115,22,.06)';}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Inject Shift
        </button>

        {/* Export — Custom range only */}
        {datePreset==='Custom'&&customRange?.from&&(
          <>
            <div style={{width:1,height:18,background:'var(--divider)',flexShrink:0}}/>
            <button onClick={()=>doExport('excel')} disabled={exporting}
              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:9,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--sub)',fontSize:12,fontWeight:500,cursor:'pointer',flexShrink:0,opacity:exporting?.5:1}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#22c55e';e.currentTarget.style.color='var(--ink)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--divider)';e.currentTarget.style.color='var(--sub)';}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Excel
            </button>
            <button onClick={()=>doExport('pdf')} disabled={exporting}
              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:9,border:'1px solid var(--border)',background:'var(--bg2)',color:'var(--sub)',fontSize:12,fontWeight:500,cursor:'pointer',flexShrink:0,opacity:exporting?.5:1}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#f87171';e.currentTarget.style.color='var(--ink)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--divider)';e.currentTarget.style.color='var(--sub)';}}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              PDF
            </button>
          </>
        )}

        {/* Calendar picker */}
        {datePreset==='Custom'&&showCal&&(
          <div ref={calRef} style={{position:'absolute',top:'calc(100% + 6px)',left:220,zIndex:900}}>
            <CalendarPicker value={customRange} onChange={r=>setCustomRange(r)} onClose={()=>setShowCal(false)}/>
          </div>
        )}
      </div>

      {/* ── ERROR ── */}
      {err&&<div style={{color:'var(--neg)',padding:'11px 16px',marginBottom:16,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,fontSize:13}}>{err}</div>}

      {/* ── KPI Strip: Today hours/pay + Week hours/pay ── */}
      {!loading&&rows.length>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16}}>
          {[
            {label:"Today's Hours",  value:fmtHrs(todayHrs),  sub:'check-ins today'},
            {label:"Today's Pay",    value:fmtPay(todayPay),  sub:'gross earnings'},
            {label:'Week Hours',     value:fmtHrs(rows.reduce((s,r)=>s+shiftHours(r),0)), sub:'Mon–Sun total'},
            {label:'Week Pay',       value:fmtPay(rows.reduce((s,r)=>s+(shiftPay(r)||0),0)), sub:'gross earnings'},
          ].map(k=>(
            <div key={k.label} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--cr-md)',padding:'14px 16px',boxShadow:'var(--elev-1)'}}>
              <div style={{fontSize:10.5,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6}}>{k.label}</div>
              <div style={{fontSize:22,fontWeight:700,color:'var(--ink)',letterSpacing:'-0.03em',fontVariantNumeric:'tabular-nums'}}>{k.value}</div>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:3}}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── TABLE ── */}
      {loading?(
        <div style={{textAlign:'center',padding:'64px 24px',color:'var(--muted)',fontSize:13}}>Loading attendance data…</div>
      ):(
        <div style={{borderRadius:12,border:'1px solid var(--divider)',background:'var(--card)',overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12.5}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--divider)',background:'var(--bg)'}}>
                  {['Employee','Location','Check-in','Check-out','Hours','Earnings','Status','Actions'].map((h,i)=>(
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontWeight:600,fontSize:10.5,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.07em',whiteSpace:'nowrap',borderRight:i<7?'1px solid var(--divider)':undefined}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length===0&&(
                  <tr><td colSpan={8} style={{padding:'52px',textAlign:'center',color:'var(--muted)',fontSize:13}}>No records for this filter.</td></tr>
                )}
                {rows.map((r)=>{
                  const st=rowState(r); const ss=ST[st];
                  const isLive=!r.checked_out_at&&st==='active';
                  const _emps=[...(employees||[]),...localEmps];
                  const _locs=[...(allLocations||[]),...localLocs];
                  const empName=_emps.find(e=>e.employee_id===r.employee_id||e.id===r.employee_id)?.full_name||r.employee_id?.slice(0,8)||'—';
                  const locName=_locs.find(l=>l.id===r.location_id)?.name||r.location_id?.slice(0,8)||'—';
                  return(
                    <tr key={r.id} style={{borderBottom:'1px solid var(--divider)',background:ss.rowBg,transition:'background .12s'}}>

                      {/* Employee */}
                      <td style={{padding:'10px 14px',whiteSpace:'nowrap',borderRight:'1px solid var(--divider)'}}>
                        <div style={{display:'flex',alignItems:'center',gap:9}}>
                          <div style={{width:26,height:26,borderRadius:'50%',background:'var(--acc-bg)',color:'var(--acc)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,flexShrink:0}}>{empName.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?'}</div>
                          <span style={{fontWeight:500,color:'var(--ink)',fontSize:13}}>{empName}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{padding:'10px 14px',whiteSpace:'nowrap',color:'var(--sub)',fontSize:12.5,borderRight:'1px solid var(--divider)'}}>{locName}</td>

                      {/* Check-in */}
                      <td style={{padding:'10px 14px',whiteSpace:'nowrap',color:'var(--ink)',fontSize:12.5,fontVariantNumeric:'tabular-nums',borderRight:'1px solid var(--divider)'}}>{fmtTs(r.checked_in_at)}</td>

                      {/* Check-out */}
                      <td style={{padding:'10px 14px',whiteSpace:'nowrap',fontSize:12.5,fontVariantNumeric:'tabular-nums',borderRight:'1px solid var(--divider)',color:r.checked_out_at?'var(--ink)':'var(--muted)'}}>
                        {r.hr_override_checkout
                          ? <span style={{color:'#60a5fa'}}>{fmtTs(r.hr_override_checkout)} <span style={{fontSize:9.5,opacity:.65,fontWeight:600}}>OVR</span></span>
                          : r.checked_out_at ? fmtTs(r.checked_out_at) : <span style={{fontSize:12,fontStyle:'italic'}}>Active</span>}
                      </td>

                      {/* Hours */}
                      <td style={{padding:'10px 14px',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums',color:'var(--ink)',fontSize:12.5,borderRight:'1px solid var(--divider)'}}>
                        <span style={{color:isLive?'#fbbf24':'var(--ink)'}}>{fmtHrs(shiftHours(r))}{isLive&&<span style={{fontSize:9.5,opacity:.6,fontWeight:600}}> live</span>}</span>
                      </td>

                      {/* Earnings */}
                      <td style={{padding:'10px 14px',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums',borderRight:'1px solid var(--divider)'}}>
                        <span style={{color:'var(--ink)',fontSize:12.5}}>{fmtPay(shiftPay(r))}</span>
                      </td>

                      {/* Status */}
                      <td style={{padding:'10px 14px',borderRight:'1px solid var(--divider)'}}>
                        <span style={{padding:'3px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:ss.badge.bg,color:ss.badge.c,whiteSpace:'nowrap',letterSpacing:'0.01em'}}>{ss.badge.t}</span>
                      </td>

                      {/* Actions */}
                      <td style={{padding:'10px 14px'}}>
                        <div style={{display:'flex',gap:5}}>
                          {(st==='frozen'||st==='overlong')&&(
                            <button onClick={()=>openOverride(r,empName)}
                              style={{padding:'4px 10px',fontSize:11,borderRadius:6,border:'1px solid #f97316',background:'rgba(249,115,22,.06)',color:'#f97316',cursor:'pointer',whiteSpace:'nowrap',fontWeight:600}}
                              onMouseEnter={e=>e.currentTarget.style.background='rgba(249,115,22,.12)'}
                              onMouseLeave={e=>e.currentTarget.style.background='rgba(249,115,22,.06)'}>
                              Override Checkout
                            </button>
                          )}
                          <button onClick={()=>openEdit(r,empName)}
                            style={{padding:'4px 10px',fontSize:11,borderRadius:6,border:'1px solid var(--acc)',background:'transparent',color:'var(--acc)',cursor:'pointer',whiteSpace:'nowrap',fontWeight:500}}
                            onMouseEnter={e=>e.currentTarget.style.background='rgba(34,197,94,.07)'}
                            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            Edit
                          </button>
                          <button onClick={()=>{setFlagModal(r);setFlagNote(r.hr_override_note||'');}}
                            style={{padding:'4px 10px',fontSize:11,borderRadius:6,border:'1px solid var(--divider)',background:'transparent',color:'var(--muted)',cursor:'pointer',fontWeight:500}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--sub)';e.currentTarget.style.color='var(--ink)';}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--divider)';e.currentTarget.style.color='var(--muted)';}}> 
                            Note
                          </button>
                          {isInjected(r)&&(
                            <button onClick={()=>{setVoidModal({row:r,empName});setVoidReason('');}}
                              style={{padding:'4px 10px',fontSize:11,borderRadius:6,border:'1px solid rgba(239,68,68,.3)',background:'transparent',color:'var(--neg)',cursor:'pointer',fontWeight:500,transition:'all .12s'}}
                              onMouseEnter={e=>{e.currentTarget.style.background='var(--neg-bg)';e.currentTarget.style.borderColor='var(--neg)';}}
                              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor='rgba(239,68,68,.3)';}}>
                              Void
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TREND SECTION ── */}
      <div style={{marginTop:20,border:'1px solid var(--divider)',borderRadius:12,overflow:'hidden',background:'var(--card)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 18px',cursor:'pointer',userSelect:'none'}}
          onClick={()=>setTrendOpen(v=>!v)}>
          <span style={{fontWeight:700,fontSize:12.5,color:'var(--ink)',letterSpacing:'0.01em'}}>Attendance Trends</span>
          <span style={{color:'var(--muted)',fontSize:11,fontWeight:600}}>{trendOpen?'COLLAPSE ▲':'EXPAND ▼'}</span>
        </div>
        {trendOpen&&(
          <div style={{padding:'20px 18px 24px',borderTop:'1px solid var(--divider)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:28}}>
            {/* Heatmap */}
            <div>
              <div style={{fontSize:10.5,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14}}>Check-ins / Location / Day (7d)</div>
              {locs7.length===0?(
                <div style={{fontSize:12.5,color:'var(--muted)',padding:'24px 0',textAlign:'center'}}>No data in range</div>
              ):(
                <div style={{overflowX:'auto'}}>
                  <table style={{borderCollapse:'separate',borderSpacing:'3px',fontSize:11}}>
                    <thead>
                      <tr>
                        <th style={{padding:'2px 8px',color:'var(--muted)',fontWeight:600,textAlign:'left',minWidth:110,fontSize:10.5}}/>
                        {days7.map(d=><th key={d} style={{padding:'2px 4px',color:'var(--muted)',fontWeight:600,textAlign:'center',fontSize:9.5,letterSpacing:'0.04em'}}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {locs7.map(loc=>(
                        <tr key={loc}>
                          <td style={{padding:'2px 8px',color:'var(--sub)',fontWeight:500,fontSize:11.5,whiteSpace:'nowrap'}}>{loc}</td>
                          {days7.map(d=>{
                            const v=heatData[`${d}__${loc}`]||0;
                            const intensity=v/maxHeat;
                            return <td key={d} style={{padding:2,textAlign:'center'}}>
                              <div style={{width:32,height:26,borderRadius:5,background:v===0?'var(--bg)':`rgba(34,197,94,${0.1+intensity*0.8})`,display:'flex',alignItems:'center',justifyContent:'center',color:v===0?'var(--divider)':intensity>0.6?'#fff':'var(--pos)',fontSize:11,fontWeight:v>0?600:400,transition:'background .2s',border:'1px solid var(--divider)'}}>
                                {v||'·'}
                              </div>
                            </td>;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {/* Late arrivals bar chart */}
            <div>
              <div style={{fontSize:10.5,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:14}}>Avg Late Minutes / Day (14d)</div>
              {lateData.length===0?(
                <div style={{fontSize:12.5,color:'var(--muted)',padding:'24px 0',textAlign:'center'}}>No late arrivals in this period</div>
              ):(
                <div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:3,height:90}}>
                    {lateData.map(d=>{
                      const maxV=Math.max(...lateData.map(x=>x.avg),1);
                      const pct=d.avg/maxV;
                      return <div key={d.day} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
                        <span style={{fontSize:9,color:'var(--muted)',fontVariantNumeric:'tabular-nums'}}>{d.avg}</span>
                        <div style={{width:'100%',height:`${Math.max(4,Math.round(pct*72))}px`,background:'rgba(249,115,22,.65)',borderRadius:'3px 3px 0 0'}}/>
                      </div>;
                    })}
                  </div>
                  <div style={{display:'flex',alignItems:'flex-end',gap:3,marginTop:4}}>
                    {lateData.map(d=>(
                      <div key={d.day} style={{flex:1,textAlign:'center'}}>
                        <span style={{fontSize:9,color:'var(--muted)',display:'block',writingMode:'vertical-rl',transform:'rotate(180deg)',height:24,margin:'0 auto'}}>{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── INJECT SHIFT MODAL ── */}
      {showInject&&(
        <HRInjectShiftModal
          session={session}
          employees={[...(employees||[]),...localEmps]}
          locations={[...(locations||[]),...localLocs]}
          onClose={()=>setShowInject(false)}
          onDone={()=>{setShowInject(false);load();}}
        />
      )}

      {/* ── VOID INJECTED SHIFT MODAL ── */}
      {voidModal&&(
        <div className="modal-bg" onClick={()=>setVoidModal(null)}>
          <div className="modal-box" style={{maxWidth:420}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'24px 28px 18px',borderBottom:'1px solid var(--divider)',display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
              <div>
                <div style={{fontWeight:800,fontSize:17,color:'var(--neg)'}}>Void Shift Record</div>
                <div style={{fontSize:12.5,color:'var(--muted)',marginTop:4}}>{voidModal.empName} · {voidModal.row.checked_in_at?new Date(voidModal.row.checked_in_at).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):''}</div>
              </div>
              <button onClick={()=>setVoidModal(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',display:'flex'}}><Icon name="close" size={18}/></button>
            </div>
            <div style={{padding:'20px 28px 24px'}}>
              <div style={{padding:'12px 14px',background:'var(--neg-bg)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,marginBottom:16}}>
                <div style={{fontSize:12.5,color:'var(--neg)',fontWeight:500}}>This will permanently delete this manually injected shift record and cancel any related correction tasks. This action cannot be undone.</div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16,padding:'10px 14px',background:'var(--faint)',borderRadius:8,fontSize:12.5,color:'var(--sub)'}}>
                <div><span style={{color:'var(--muted)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:2}}>Check-in</span>{voidModal.row.checked_in_at?new Date(voidModal.row.checked_in_at).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):''}</div>
                <div><span style={{color:'var(--muted)',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',display:'block',marginBottom:2}}>Check-out</span>{voidModal.row.checked_out_at?new Date(voidModal.row.checked_out_at).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):''}</div>
              </div>
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Reason <span style={{color:'var(--neg)'}}>*</span></div>
                <textarea value={voidReason} onChange={e=>setVoidReason(e.target.value)}
                  placeholder="e.g. Accidentally injected as a test — not a real shift"
                  style={{width:'100%',minHeight:64,background:'var(--faint)',border:'1.5px solid var(--border)',borderRadius:8,padding:'9px 12px',fontSize:13,color:'var(--ink)',resize:'vertical',outline:'none',fontFamily:'inherit'}}
                  autoFocus/>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={doVoid} disabled={!voidReason.trim()||actioning}
                  style={{flex:1,height:42,background:(!voidReason.trim()||actioning)?'var(--divider)':'var(--neg)',border:'none',borderRadius:9,color:'#fff',fontSize:14,fontWeight:700,cursor:(!voidReason.trim()||actioning)?'not-allowed':'pointer',transition:'background .15s'}}>
                  {actioning?'Voiding…':'Void Record'}
                </button>
                <button onClick={()=>setVoidModal(null)}
                  style={{height:42,padding:'0 18px',background:'var(--faint)',border:'1px solid var(--border)',borderRadius:9,color:'var(--muted)',fontSize:13,fontWeight:500,cursor:'pointer'}}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OVERRIDE CHECKOUT MODAL ── */}
      {overrideModal&&(
        <div className="modal-bg" onClick={()=>setOverrideModal(null)}>
          <div className="modal-box" style={{maxWidth:460}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'24px 28px 0',display:'flex',alignItems:'flex-start',justifyContent:'space-between',borderBottom:'1px solid var(--divider)',paddingBottom:16}}>
              <div>
                <div style={{fontWeight:800,fontSize:17,color:'var(--ink)'}}>Override Checkout</div>
                <div style={{fontSize:12.5,color:'var(--muted)',marginTop:4}}>{overrideModal.empName} · {overrideModal.row.is_frozen?'Frozen shift':'Overlong shift'}</div>
              </div>
              <button onClick={()=>setOverrideModal(null)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',display:'flex'}}><Icon name="close" size={16}/></button>
            </div>
            <div style={{padding:'20px 28px 24px'}}>
              {/* Shift info */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:20,padding:'12px 14px',background:'var(--faint)',borderRadius:8}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Checked in</div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--ink)'}}>{new Date(overrideModal.row.checked_in_at).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3}}>Hours open</div>
                  <div style={{fontSize:13,fontWeight:600,color:'var(--neg)'}}>
                    {(((Date.now()-new Date(overrideModal.row.checked_in_at).getTime())/3600000)).toFixed(1)}h
                  </div>
                </div>
              </div>
              {/* Schedule suggestion */}
              {scheduleSuggestion&&(
                <div style={{marginBottom:14,padding:'10px 14px',background:'rgba(29,107,243,.05)',border:'1px solid rgba(29,107,243,.18)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div style={{fontSize:12.5,color:'var(--acc)'}}>
                    <span style={{fontWeight:600}}>Scheduled end:</span> {scheduleSuggestion.display}
                  </div>
                  <button onClick={()=>setOverrideOut(scheduleSuggestion.isoLocal)}
                    style={{fontSize:11,fontWeight:600,color:'var(--acc)',background:'rgba(29,107,243,.1)',border:'none',borderRadius:6,padding:'3px 10px',cursor:'pointer'}}>
                    Use this
                  </button>
                </div>
              )}
              {!scheduleSuggestion&&(
                <div style={{marginBottom:14,padding:'10px 14px',background:'var(--faint)',border:'1px solid var(--divider)',borderRadius:8}}>
                  <div style={{fontSize:12,color:'var(--muted)'}}>No scheduled shift found for this day. Default set to check-in + 8h.</div>
                </div>
              )}
              {/* Override checkout time */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Override checkout time</div>
                <input type="datetime-local" value={overrideOut} onChange={e=>setOverrideOut(e.target.value)}
                  style={{width:'100%',background:'var(--faint)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 12px',fontSize:13,color:'var(--ink)',outline:'none'}}/>
              </div>
              {/* Reason */}
              <div style={{marginBottom:20}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:6}}>Reason <span style={{color:'var(--neg)'}}>*</span></div>
                <textarea value={overrideReason} onChange={e=>setOverrideReason(e.target.value)}
                  placeholder="e.g. Employee forgot to check out — confirmed left at end of shift"
                  style={{width:'100%',minHeight:72,background:'var(--faint)',border:'1px solid var(--border)',borderRadius:8,padding:'9px 12px',fontSize:13,color:'var(--ink)',resize:'vertical',outline:'none',fontFamily:'inherit'}}/>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={doOverride} disabled={!overrideOut||!overrideReason.trim()||actioning}
                  style={{flex:1,height:42,background:(!overrideOut||!overrideReason.trim()||actioning)?'var(--divider)':'#f97316',border:'none',borderRadius:9,color:'#fff',fontSize:14,fontWeight:700,cursor:(!overrideOut||!overrideReason.trim()||actioning)?'not-allowed':'pointer',transition:'background .15s'}}>
                  {actioning?'Saving…':'Apply Override'}
                </button>
                <button onClick={()=>setOverrideModal(null)}
                  style={{height:42,padding:'0 18px',background:'var(--faint)',border:'1px solid var(--border)',borderRadius:9,color:'var(--muted)',fontSize:13,fontWeight:500,cursor:'pointer'}}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT ATTENDANCE MODAL ── */}
      {editModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setEditModal(null)}>
          <div style={{background:'var(--card)',borderRadius:'var(--cr-lg)',padding:'28px 30px',width:460,border:'1px solid var(--border)',boxShadow:'var(--elev-4)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#f97316'}}/>
              <div style={{fontWeight:700,fontSize:15,color:'var(--ink)'}}>Edit Attendance Record</div>
            </div>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:4,paddingLeft:16}}>{editModal.empName}</div>
            <div style={{fontSize:11,color:'rgba(249,115,22,.8)',background:'rgba(249,115,22,.07)',border:'1px solid rgba(249,115,22,.2)',borderRadius:7,padding:'7px 12px',marginBottom:20,lineHeight:1.5}}>
              ⚠ This edit is payroll-sensitive. A Watchdog alert will be sent to Finance automatically.
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <label className="form-label">Original Check-in</label>
                <div style={{padding:'7px 10px',borderRadius:7,background:'var(--bg)',border:'1px solid var(--divider)',fontSize:12,color:'var(--muted)',fontVariantNumeric:'tabular-nums'}}>{fmtTs(editModal.row.checked_in_at)}</div>
              </div>
              <div>
                <label className="form-label">Original Check-out</label>
                <div style={{padding:'7px 10px',borderRadius:7,background:'var(--bg)',border:'1px solid var(--divider)',fontSize:12,color:'var(--muted)',fontVariantNumeric:'tabular-nums'}}>{fmtTs(editModal.row.hr_override_checkout||editModal.row.checked_out_at)||'—'}</div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <label className="form-label">New Check-in <span style={{color:'var(--neg)'}}>*</span></label>
                <input className="form-input" type="datetime-local" value={editIn} onChange={e=>setEditIn(e.target.value)}/>
              </div>
              <div>
                <label className="form-label">New Check-out <span style={{color:'var(--muted)',fontWeight:400}}>(optional)</span></label>
                <input className="form-input" type="datetime-local" value={editOut} onChange={e=>setEditOut(e.target.value)}/>
              </div>
            </div>
            <label className="form-label">Reason for Edit <span style={{color:'var(--neg)'}}>*</span></label>
            <textarea className="form-input" rows={3} value={editReason} onChange={e=>setEditReason(e.target.value)} placeholder="Required — describe why this record is being corrected" style={{resize:'vertical',marginBottom:20}}/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setEditModal(null)} style={{padding:'8px 18px',borderRadius:8,border:'1px solid var(--divider)',background:'transparent',color:'var(--sub)',cursor:'pointer',fontSize:12.5}}>Cancel</button>
              <button onClick={doEdit} disabled={actioning||!editIn||!editReason.trim()}
                style={{padding:'8px 20px',borderRadius:8,background:'#f97316',color:'#fff',border:'none',cursor:actioning||!editIn||!editReason.trim()?'not-allowed':'pointer',fontSize:12.5,fontWeight:600,opacity:actioning||!editIn||!editReason.trim()?0.45:1}}>
                {actioning?'Saving…':'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLAG MODAL ── */}
      {flagModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setFlagModal(null)}>
          <div style={{background:'var(--card)',borderRadius:'var(--cr-lg)',padding:'28px 30px',width:380,border:'1px solid var(--border)',boxShadow:'var(--elev-4)'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontWeight:700,fontSize:15,color:'var(--ink)',marginBottom:3}}>Flag Shift</div>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:20}}>{flagModal.employees?.full_name} · {fmtTs(flagModal.checked_in_at)}</div>
            <label className="form-label">Note <span style={{color:'var(--neg)'}}>*</span></label>
            <textarea className="form-input" rows={3} value={flagNote} onChange={e=>setFlagNote(e.target.value)} placeholder="Operational note or flag reason" style={{resize:'vertical',marginBottom:20}}/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <button onClick={()=>setFlagModal(null)} style={{padding:'8px 18px',borderRadius:8,border:'1px solid var(--divider)',background:'transparent',color:'var(--sub)',cursor:'pointer',fontSize:12.5}}>Cancel</button>
              <button onClick={doFlag} disabled={actioning||!flagNote.trim()}
                style={{padding:'8px 20px',borderRadius:8,background:'var(--acc)',color:'#fff',border:'none',cursor:actioning||!flagNote.trim()?'not-allowed':'pointer',fontSize:12.5,fontWeight:600,opacity:actioning||!flagNote.trim()?0.45:1}}>
                {actioning?'Saving…':'Save Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

