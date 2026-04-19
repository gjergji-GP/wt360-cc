import { useState } from "react";
import { Icon } from "./Icon";
import { fmtFull } from "../../lib/leadershipHelpers";

export function CalendarPicker({value, onChange, onClose}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hoverDate, setHoverDate] = useState(null);
  const from = value.from ? new Date(value.from+"T00:00:00") : null;
  const to = value.to ? new Date(value.to+"T00:00:00") : null;

  function fmt(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  function getDays(year, month) {
    const first=new Date(year,month,1),last=new Date(year,month+1,0),days=[];
    const startDow=first.getDay();
    for(let i=0;i<startDow;i++){const d=new Date(year,month,1-startDow+i);days.push({date:d,cur:false});}
    for(let i=1;i<=last.getDate();i++) days.push({date:new Date(year,month,i),cur:true});
    while(days.length%7!==0){const d=new Date(year,month+1,days.length-last.getDate()-startDow+1);days.push({date:d,cur:false});}
    return days;
  }
  function handleDay(d) {
    const ds=fmt(d);
    if(!from||(from&&to)){onChange({from:ds,to:""});}
    else{if(d<from)onChange({from:ds,to:fmt(from)});else if(d.getTime()===from.getTime())onChange({from:ds,to:ds});else onChange({from:fmt(from),to:ds});}
  }
  function isInRange(d) {
    const effEnd=to||(hoverDate&&from&&!to?hoverDate:null);
    if(!from||!effEnd)return false;
    const dTime=d.getTime(),fTime=from.getTime(),eTime=effEnd.getTime();
    return dTime>Math.min(fTime,eTime)&&dTime<Math.max(fTime,eTime);
  }
  function isStart(d){return from&&fmt(d)===fmt(from);}
  function isEnd(d){
    const effEnd=to||(hoverDate&&from&&!to?hoverDate:null);
    return effEnd&&fmt(d)===fmt(effEnd)&&fmt(d)!==fmt(from);
  }
  function isSingle(d){return from&&to&&fmt(from)===fmt(to)&&fmt(d)===fmt(from);}

  const days=getDays(viewYear,viewMonth);
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS=["Su","Mo","Tu","We","Th","Fr","Sa"];

  const prevMonth=()=>{if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);};
  const nextMonth=()=>{if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);};

  return(
    <div className="cal-panel" onMouseLeave={()=>setHoverDate(null)}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button onClick={prevMonth} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="chevleft" size={14} color="var(--sub)"/>
        </button>
        <span style={{fontWeight:700,fontSize:13.5,color:"var(--ink)"}}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{background:"var(--bg)",border:"1px solid var(--border)",borderRadius:8,width:30,height:30,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <Icon name="chevright" size={14} color="var(--sub)"/>
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,34px)",gap:1,marginBottom:6}}>
        {DAYS.map(d=><div key={d} style={{width:34,textAlign:"center",fontSize:11,fontWeight:600,color:"var(--muted)"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,34px)",gap:1}}>
        {days.map((d,i)=>{
          const single=isSingle(d.date);
          const start=!single&&isStart(d.date);
          const end=!single&&isEnd(d.date);
          const inR=!single&&!start&&!end&&isInRange(d.date);
          const todayD=fmt(today)===fmt(d.date);
          let cls="cal-day";
          if(single) cls+=" sel-single";
          else if(start) cls+=" sel-start";
          else if(end) cls+=" sel-end";
          else if(inR) cls+=" in-range";
          if(todayD&&!single&&!start&&!end) cls+=" today";
          if(!d.cur) cls+=" other-month";
          return(<div key={i} className={cls}
            onClick={()=>handleDay(d.date)}
            onMouseEnter={()=>{if(from&&!to)setHoverDate(d.date);}}>
            {d.date.getDate()}
          </div>);
        })}
      </div>
      <div style={{marginTop:14,paddingTop:12,borderTop:"1px solid var(--divider)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:12.5,color:"var(--sub)"}}>
          {from?<><span style={{fontWeight:600,color:"var(--ink)"}}>{fmtFull(fmt(from))}</span>{to?<><span style={{margin:"0 6px",color:"var(--muted)"}}>â†’</span><span style={{fontWeight:600,color:"var(--ink)"}}>{fmtFull(fmt(to))}</span></>:<span style={{color:"var(--muted)"}}> â†’ pick end date</span>}</>:<span style={{color:"var(--muted)"}}>Pick start date</span>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>onChange({from:"",to:""})} style={{padding:"6px 12px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",fontSize:12,color:"var(--sub)",cursor:"pointer"}}>Clear</button>
          <button onClick={onClose} style={{padding:"6px 14px",borderRadius:8,border:"none",background:"var(--ink)",color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>Apply</button>
        </div>
      </div>
    </div>
  );
}


/* â”€â”€â”€ CONFIRM DELETE MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
