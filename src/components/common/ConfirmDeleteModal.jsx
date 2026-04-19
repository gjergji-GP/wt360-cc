import { Icon } from "./Icon";

export function ConfirmDeleteModal({name,onConfirm,onCancel}) {
  return(
    <div className="modal-bg" style={{zIndex:900}} onClick={onCancel}>
      <div className="modal-box" style={{maxWidth:440}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"36px 32px 32px",textAlign:"center"}}>
          <div style={{width:56,height:56,borderRadius:"50%",background:"var(--neg-bg)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}><Icon name="trash" size={24} color="var(--neg)"/></div>
          <div style={{fontWeight:800,fontSize:18,color:"var(--ink)",marginBottom:8}}>Offboard Employee?</div>
          <div style={{fontSize:13.5,color:"var(--sub)",lineHeight:1.6,marginBottom:12}}><strong>{name}</strong> will be deactivated. Their record and history are retained.</div>
          <div style={{fontSize:12.5,color:"var(--muted)",lineHeight:1.6,marginBottom:28,background:"var(--bg)",borderRadius:10,padding:"12px 16px",textAlign:"left"}}>
            <strong style={{color:"var(--ink)"}}>This will trigger:</strong><br/>
            â€¢ Email notification to Finance<br/>
            â€¢ Offboarding task assigned to Finance<br/>
            â€¢ Offboarding task assigned to HR
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={onCancel} style={{padding:"10px 24px",borderRadius:10,border:"1px solid var(--border)",background:"var(--bg)",fontSize:14,cursor:"pointer",color:"var(--sub)"}}>Cancel</button>
            <button onClick={onConfirm} style={{padding:"10px 24px",borderRadius:10,border:"none",background:"var(--neg)",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>Deactivate & Offboard</button>
          </div>
        </div>
      </div>
    </div>
  );
}


