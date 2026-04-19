import { useCallback, useEffect, useState } from "react";
import { Icon } from "../../components/common/Icon";
import { SB } from "../../lib/supabase";
import { SbItem, StagePill, WtBtn, WtCard, WtEmpty, WtField, WtInput, WtKpi, WtModal, WtPageHeader, WtSelect, WtTextarea, WtToast } from "../mlc/shared";
import { useMLCData } from "../mlc/useMLCData";
import { WT } from "../mlc/tokens";

export function CFOCommandCentre({ session, onSignOut }) {
  const brandId = session?.brand_id || 'a2911ac0-bcac-42c4-b39b-fed6813d321e';
  const empId   = session?.employee_id;

  const [page, setPage] = useState('overview');
  const [exp, setExp]   = useState(true);
  const [toast, setToast] = useState(null);

  // MLC data (Domain A)
  const { products, loading: mlcLoading, reload: reloadMlc } = useMLCData(brandId);

  // Finance data (Domain B)
  const [invoices,    setInvoices]    = useState([]);
  const [baselines,   setBaselines]   = useState([]);
  const [watchdogs,   setWatchdogs]   = useState([]);
  const [spendData,   setSpendData]   = useState([]);
  const [reconcQueue, setReconcQueue] = useState([]);
  const [vendors,     setVendors]     = useState([]);
  const [finLoading,  setFinLoading]  = useState(true);

  const showToast = (msg, type='success') => {
    setToast({msg, type}); setTimeout(() => setToast(null), 3500);
  };

  const loadFinance = useCallback(async () => {
    setFinLoading(true);
    try {
      const [invRes, baseRes, taskRes, spendRes, reconcRes, vendorRes] = await Promise.all([
        SB.from('fiscal_invoices')
          .select('id,fiscal_ref,vendor_id,vendor_name_raw,invoice_date,due_date,pay_deadline,total_amount,tax_amount,currency,status,payment_status,payment_method,expense_category_code,expense_subcategory,classified_by,classified_at,approved_for_payment_by,approved_for_payment_at,paid_at,paid_by,transaction_ref,source,ebills_fic,confirmed_amount,disputed_amount')
          .eq('brand_id', brandId)
          .not('status','in','("CANCELLED","REJECTED")')
          .order('due_date', {ascending: true, nullsFirst: false}),
        SB.from('baseline_update_requests')
          .select('*')
          .eq('brand_id', brandId)
          .eq('status','PENDING_COAPPROVAL')
          .order('requested_at', {ascending: true}),
        SB.from('tasks')
          .select('*')
          .eq('brand_id', brandId)
          .in('task_type_code', ['WATCHDOG_ESCALATION','WATCHDOG_PAYMENT_OVERDUE','FINANCE_POST_INVOICE'])
          .eq('status','OPEN')
          .order('created_at', {ascending: true}),
        SB.from('v_purchase_spend_by_vendor')
          .select('*')
          .order('month', {ascending: false})
          .limit(60),
        SB.from('v_reconciliation_queue')
          .select('*')
          .limit(50),
        SB.from('vendors')
          .select('id,vendor_name')
          .eq('brand_id', brandId),
      ]);
      setInvoices(invRes.data || []);
      setBaselines(baseRes.data || []);
      setWatchdogs(taskRes.data || []);
      setVendors(vendorRes.data || []);
      setSpendData(spendRes.data || []);
      setReconcQueue(reconcRes.data || []);
    } catch(e) { console.error('CFO finance load:', e); }
    setFinLoading(false);
  }, [brandId]);

  useEffect(() => { loadFinance(); }, [loadFinance]);

  // â”€â”€ Derived MLC queues â”€â”€
  const mlcFinanceQueue      = products.filter(p => p.menu_product_lifecycle?.lifecycle_stage === 'FINANCE_REVIEW');
  const mlcReactivationQueue = products.filter(p => p.menu_product_lifecycle?.lifecycle_stage === 'REACTIVATION_FINANCE_REVIEW');
  const mlcDeferred          = products.filter(p => p.menu_product_lifecycle?.lifecycle_stage === 'DEFERRED');

  // â”€â”€ Derived Finance queues â”€â”€
  const paymentQueue    = invoices.filter(i => i.status === 'CLASSIFIED' && i.payment_status === 'UNPAID');
  const awaitingConf    = invoices.filter(i => i.status === 'APPROVED_FOR_PAYMENT' && i.payment_status === 'UNPAID');
  const overdueInv      = awaitingConf.filter(i => {
    const due = i.due_date || i.pay_deadline;
    return due && new Date(due) < new Date();
  });
  const watchdogAlerts  = watchdogs.filter(w => w.task_type_code === 'WATCHDOG_ESCALATION');
  const paymentOverdue  = watchdogs.filter(w => w.task_type_code === 'WATCHDOG_PAYMENT_OVERDUE');

  // Total payment exposure
  const queueTotal    = paymentQueue.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);
  const awaitingTotal = awaitingConf.reduce((s, i) => s + parseFloat(i.total_amount || 0), 0);

  const fmtAmt = (n) => `${(+n||0).toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0})} ALL`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : 'â€”';
  const daysDiff = (d) => {
    if (!d) return null;
    return Math.round((new Date(d) - new Date()) / 86400000);
  };

  const getVendorName = (inv) =>
    vendors.find(v => v.id === inv.vendor_id)?.vendor_name || inv.vendor_name_raw || 'â€”';

  // â”€â”€ MLC Decision Modal â”€â”€
  const [decisionModal, setDecisionModal] = useState(null);
  const [decisionForm, setDecisionForm]   = useState({
    decision:'APPROVE', approved_price:'', rejection_code:'RECIPE_COST',
    deferred_reason:'', deferred_until:'', deferred_due:'', notes:''
  });
  const [submittingMlc, setSubmittingMlc] = useState(false);

  const submitMlcDecision = async () => {
    const p = decisionModal;
    const f = decisionForm;
    if (f.decision==='APPROVE' && (!f.approved_price || parseFloat(f.approved_price)<=0)) {
      showToast('Approved price required','error'); return;
    }
    if (f.decision==='REJECT' && !f.rejection_code) {
      showToast('Rejection reason required','error'); return;
    }
    if (f.decision==='DEFER' && (!f.deferred_reason || !f.deferred_until || !f.deferred_due)) {
      showToast('All defer fields required','error'); return;
    }
    setSubmittingMlc(true);
    try {
      const { error } = await SB.rpc('mlc_cfo_decision', {
        p_product_id:          p.id,
        p_decision:            f.decision,
        p_approved_price:      f.approved_price ? parseFloat(f.approved_price) : null,
        p_rejection_code:      f.rejection_code || null,
        p_decision_notes:      f.notes || null,
        p_deferred_reason:     f.deferred_reason || null,
        p_deferred_until:      f.deferred_until ? new Date(f.deferred_until).toISOString() : null,
        p_deferred_review_due: f.deferred_due   ? new Date(f.deferred_due).toISOString()   : null,
        p_actor_id:            empId
      });
      if (error) throw error;
      showToast(`MLC decision recorded: ${f.decision}`);
      setDecisionModal(null); reloadMlc();
    } catch(e) { showToast(e.message,'error'); }
    setSubmittingMlc(false);
  };

  const getMlcMargin = (product, price) => {
    const fv = product?.formula_headers?.[0]?.formula_versions?.find(v => v.technical_status==='APPROVED');
    if (!fv?.tested_cogs_last || !price || parseFloat(price)<=0) return null;
    return Math.round(((parseFloat(price) - parseFloat(fv.tested_cogs_last)) / parseFloat(price)) * 1000) / 10;
  };

  // â”€â”€ Payment authorise modal â”€â”€
  const [authoriseModal, setAuthoriseModal] = useState(null);
  const [authoriseNotes, setAuthoriseNotes] = useState('');
  const [submittingPay,  setSubmittingPay]  = useState(false);

  const authorisePayment = async () => {
    setSubmittingPay(true);
    try {
      const { error } = await SB.rpc('approve_invoice_for_payment', {
        p_fiscal_invoice_id: authoriseModal.id,
        p_notes:             authoriseNotes || null
      });
      if (error) throw error;
      showToast('Payment authorised â€” Finance Manager can now mark as paid');
      setAuthoriseModal(null); setAuthoriseNotes(''); loadFinance();
    } catch(e) { showToast(e.message, 'error'); }
    setSubmittingPay(false);
  };

  // â”€â”€ Baseline modal â”€â”€
  const [baselineModal,  setBaselineModal]  = useState(null);
  const [baselineNotes,  setBaselineNotes]  = useState('');
  const [baselineSkuMap, setBaselineSkuMap] = useState({});
  const [submittingBase, setSubmittingBase] = useState(false);

  useEffect(() => {
    if (!baselines.length) return;
    const ids = [...new Set(baselines.map(b => b.sku_id))];
    SB.from('master_products').select('id,product_name,sku_code').in('id', ids)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(p => { map[p.id] = p; });
        setBaselineSkuMap(map);
      });
  }, [baselines]);

  const resolveBaseline = async (requestId, action) => {
    setSubmittingBase(true);
    try {
      // Update baseline_update_requests directly â€” no RPC exists for this yet
      // Use the status update pattern
      const updates = {
        status:       action === 'approve' ? 'APPROVED' : 'REJECTED',
        reviewed_by:  empId,
        reviewed_at:  new Date().toISOString(),
        review_notes: baselineNotes || null,
      };
      if (action === 'approve') {
        const req = baselines.find(b => b.id === requestId);
        if (req) {
          // Update vendor_product_mappings baseline price
          await SB.from('vendor_product_mappings')
            .update({ baseline_price: req.new_baseline_price })
            .eq('sku_id', req.sku_id)
            .eq('vendor_id', req.vendor_id);
          // Update master_products last_purchase_price
          await SB.from('master_products')
            .update({ last_purchase_price: req.new_baseline_price })
            .eq('id', req.sku_id);
        }
      }
      const { error } = await SB.from('baseline_update_requests')
        .update(updates).eq('id', requestId);
      if (error) throw error;
      showToast(action === 'approve' ? 'Baseline approved and updated' : 'Baseline rejected');
      setBaselineModal(null); setBaselineNotes(''); loadFinance();
    } catch(e) { showToast(e.message,'error'); }
    setSubmittingBase(false);
  };

  // â”€â”€ Admin override â”€â”€
  const adminOverride = async (taskId) => {
    try {
      const { error } = await SB.rpc('task_set_status_as_admin', {
        p_task_id: taskId, p_to_status: 'DONE',
        p_note: 'CFO admin override'
      });
      if (error) throw error;
      showToast('Task overridden'); loadFinance();
    } catch(e) { showToast(e.message,'error'); }
  };

  // â”€â”€ MLC reactivation â”€â”€
  const mlcReactivationDecide = async (productId, decision) => {
    try {
      const { error } = await SB.rpc('mlc_complete_finance_reactivation_review', {
        p_product_id: productId, p_decision: decision, p_actor_id: empId
      });
      if (error) throw error;
      showToast(`Reactivation: ${decision}`); reloadMlc();
    } catch(e) { showToast(e.message,'error'); }
  };

  const mlcActDeferred = async (productId, action, newDue) => {
    try {
      const { error } = await SB.rpc('mlc_act_on_deferred', {
        p_product_id: productId, p_action: action,
        p_new_review_due: newDue || null, p_actor_id: empId
      });
      if (error) throw error;
      showToast(`Deferred: ${action}`); reloadMlc();
    } catch(e) { showToast(e.message,'error'); }
  };

  // â”€â”€ NAV â”€â”€
  const NAV = [
    { id:'overview',  iconName:'dashboard', label:'Overview' },
    { id:'mlc',       iconName:'checkcircle', label:'Menu Review',    badge: mlcFinanceQueue.length + mlcReactivationQueue.length },
    { id:'payment',   iconName:'reports',   label:'Payment Queue',   badge: paymentQueue.length },
    { id:'awaiting',  iconName:'clock',     label:'Awaiting Confirm',badge: overdueInv.length || null },
    { id:'baseline',  iconName:'alerttri',  label:'Baseline Approvals', badge: baselines.length },
    { id:'watchdog',  iconName:'alert',     label:'Watchdog',        badge: watchdogAlerts.length || null },
    { id:'spend',     iconName:'trend',     label:'Spend Intelligence' },
    { id:'reconcile', iconName:'task',      label:'Reconciliation' },
  ];

  // â”€â”€ Sidebar â”€â”€
  const sidebar = (
    <div style={{
      width:exp?232:64, minHeight:'100vh', background:WT.shellDark,
      display:'flex', flexDirection:'column', transition:'width 0.18s',
      flexShrink:0, borderRight:`1px solid ${WT.shellBorder}`
    }}>
      <div style={{
        padding:'18px 14px 14px', display:'flex', alignItems:'center', gap:10,
        borderBottom:`1px solid ${WT.shellBorder}`, cursor:'pointer',
        justifyContent:exp?'flex-start':'center'
      }} onClick={() => setExp(e=>!e)}>
        <div style={{width:28,height:28,borderRadius:WT.rSm,background:WT.blue600,
          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <span style={{color:'#fff',fontWeight:800,fontSize:12,fontFamily:WT.font}}>W</span>
        </div>
        {exp && (
          <div style={{display:'flex',alignItems:'baseline',gap:3}}>
            <span style={{fontWeight:800,fontSize:14,color:WT.textOnDark,
              letterSpacing:'-0.01em',fontFamily:WT.font}}>WT360</span>
            <span style={{color:WT.blue600,fontSize:8,lineHeight:1}}>â—</span>
          </div>
        )}
      </div>

      {exp && <div style={{padding:'16px 14px 4px', fontSize:10, fontWeight:700,
        color:WT.textDarkMuted, letterSpacing:'0.1em', textTransform:'uppercase',
        fontFamily:WT.font}}>CFO</div>}

      <nav style={{flex:1, padding:'8px 8px', overflowY:'auto'}}>
        {NAV.map(item => (
          <SbItem key={item.id} label={item.label} iconName={item.iconName}
            active={page===item.id} badge={item.badge} exp={exp}
            onClick={() => setPage(item.id)}/>
        ))}
      </nav>
      <div style={{padding:'8px 8px', borderTop:`1px solid ${WT.shellBorder}`}}>
        <SbItem label="Sign out" iconName="logout" active={false} exp={exp} onClick={onSignOut}/>
      </div>
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PAGE: OVERVIEW
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const overviewPage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader
        title={`CFO Command Centre`}
        subtitle={`${session?.employee_name||'CFO'} Â· ${new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}`}
      />

      {/* Domain A â€” MLC */}
      <div style={{fontSize:11, fontWeight:700, color:WT.textTertiary, textTransform:'uppercase',
        letterSpacing:'0.08em', marginBottom:12, fontFamily:WT.font}}>Menu Lifecycle</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:28}}>
        <WtKpi label="Finance Review Queue" value={mlcFinanceQueue.length}
          icon={<Icon name="checkcircle" size={16} color={mlcFinanceQueue.length>0?WT.blue600:WT.textTertiary}/>}
          color={mlcFinanceQueue.length>0?WT.blue600:WT.textStrong}
          onClick={() => setPage('mlc')}
          sub={mlcFinanceQueue.length>0 ? 'Products awaiting your decision' : 'Queue clear'}/>
        <WtKpi label="Reactivation Reviews" value={mlcReactivationQueue.length}
          icon={<Icon name="trendingup" size={16} color={mlcReactivationQueue.length>0?WT.warning600:WT.textTertiary}/>}
          color={mlcReactivationQueue.length>0?WT.warning600:WT.textStrong}
          onClick={() => setPage('mlc')}
          sub="Finance staleness checks"/>
        <WtKpi label="Deferred Products" value={mlcDeferred.length}
          icon={<Icon name="pause" size={16} color={WT.textTertiary}/>}
          onClick={() => setPage('mlc')}
          sub="On hold â€” review due"/>
      </div>

      {/* Domain B â€” Finance */}
      <div style={{fontSize:11, fontWeight:700, color:WT.textTertiary, textTransform:'uppercase',
        letterSpacing:'0.08em', marginBottom:12, fontFamily:WT.font}}>Payment Authority</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28}}>
        <WtKpi label="Payment Queue" value={paymentQueue.length}
          icon={<Icon name="reports" size={16} color={paymentQueue.length>0?WT.blue600:WT.textTertiary}/>}
          color={paymentQueue.length>0?WT.blue600:WT.textStrong}
          onClick={() => setPage('payment')}
          sub={fmtAmt(queueTotal)}/>
        <WtKpi label="Awaiting Confirmation" value={awaitingConf.length}
          icon={<Icon name="clock" size={16} color={overdueInv.length>0?WT.error600:WT.textTertiary}/>}
          color={overdueInv.length>0?WT.error600:WT.textStrong}
          onClick={() => setPage('awaiting')}
          sub={overdueInv.length>0?`${overdueInv.length} overdue`:`${fmtAmt(awaitingTotal)} committed`}/>
        <WtKpi label="Baseline Co-Approvals" value={baselines.length}
          icon={<Icon name="alerttri" size={16} color={baselines.length>0?WT.warning600:WT.textTertiary}/>}
          color={baselines.length>0?WT.warning600:WT.textStrong}
          onClick={() => setPage('baseline')}
          sub={baselines.length>0?'Price deviation >10%':'All clear'}/>
        <WtKpi label="Watchdog Alerts" value={watchdogAlerts.length}
          icon={<Icon name="alert" size={16} color={watchdogAlerts.length>0?WT.error600:WT.textTertiary}/>}
          color={watchdogAlerts.length>0?WT.error600:WT.textStrong}
          onClick={() => setPage('watchdog')}
          sub={watchdogAlerts.length>0?'Escalations open':'System healthy'}/>
      </div>

      {/* Urgent strip */}
      {overdueInv.length > 0 && (
        <WtCard style={{border:`1px solid #FECACA`, marginBottom:16}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
            <Icon name="alerttri" size={15} color={WT.error600}/>
            <span style={{fontWeight:700, fontSize:14, color:WT.error600}}>
              {overdueInv.length} invoice{overdueInv.length!==1?'s':''} overdue â€” you have authorised but FM has not paid
            </span>
          </div>
          {overdueInv.map(inv => {
            const days = daysDiff(inv.due_date || inv.pay_deadline);
            return (
              <div key={inv.id} style={{display:'flex', justifyContent:'space-between',
                padding:'8px 0', borderBottom:`1px solid ${WT.divider}`, fontSize:13}}>
                <span style={{fontWeight:600, color:WT.textStrong}}>{getVendorName(inv)}</span>
                <span style={{fontVariantNumeric:'tabular-nums', fontWeight:700, color:WT.error600}}>
                  {fmtAmt(inv.total_amount)}
                  <span style={{fontWeight:400, color:WT.textSecondary, marginLeft:8}}>
                    {days !== null ? (days < 0 ? `${Math.abs(days)}d overdue` : `due in ${days}d`) : ''}
                  </span>
                </span>
              </div>
            );
          })}
        </WtCard>
      )}
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PAGE: MLC (Finance Review + Reactivation + Deferred)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const mlcPage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title="Menu Lifecycle Decisions"
        subtitle="Finance review, reactivation approvals, and deferred products"/>

      {/* Finance Review Queue */}
      <div style={{fontSize:13, fontWeight:700, color:WT.textStrong, marginBottom:12}}>
        Finance Review Queue
        {mlcFinanceQueue.length > 0 && (
          <span style={{marginLeft:8, padding:'2px 10px', background:WT.error050,
            color:WT.error600, borderRadius:WT.rPill, fontSize:11, fontWeight:700,
            border:`1px solid #FECACA`}}>{mlcFinanceQueue.length} pending</span>
        )}
      </div>

      {mlcFinanceQueue.length === 0
        ? <WtCard style={{marginBottom:20}}><WtEmpty icon="checkcircle" title="Review queue clear"
            subtitle="Products arrive here after Operational Review"/></WtCard>
        : mlcFinanceQueue.map(p => {
          const brief = p.product_briefs?.sort((a,b)=>b.brief_no-a.brief_no)[0];
          const fv = p.formula_headers?.[0]?.formula_versions?.find(v=>v.technical_status==='APPROVED');
          const margin = brief?.target_selling_price && fv?.tested_cogs_last
            ? Math.round(((brief.target_selling_price - fv.tested_cogs_last) / brief.target_selling_price) * 1000) / 10 : null;
          const floor = brief?.target_margin_floor_pct || 30;
          return (
            <WtCard key={p.id} style={{marginBottom:12,
              border:`1px solid ${margin!==null&&margin<floor?'#FECACA':WT.border}`}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700, fontSize:15, color:WT.textStrong, marginBottom:10}}>
                    {p.name}
                    <span style={{fontSize:11, fontWeight:400, color:WT.textTertiary, marginLeft:8}}>{p.internal_code}</span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:10}}>
                    <WtField label="Target Price" value={brief?.target_selling_price ? `${brief.target_selling_price} ALL` : 'â€”'}/>
                    <WtField label="Tested COGS" value={fv?.tested_cogs_last ? `${fv.tested_cogs_last} ALL` : 'â€”'}/>
                    <WtField label="Est. Margin"
                      value={margin !== null ? `${margin}%` : 'â€”'}
                      sub={margin!==null ? (margin>=floor?`Above ${floor}% floor OK`:`Warning: below ${floor}% floor`) : undefined}/>
                    <WtField label="Margin Floor" value={`${floor}%`}/>
                  </div>
                  {brief?.positioning && (
                    <p style={{fontSize:12, color:WT.textTertiary, fontStyle:'italic', margin:0, lineHeight:1.5}}>
                      "{brief.positioning}"
                    </p>
                  )}
                </div>
                <WtBtn size="sm" style={{flexShrink:0}} onClick={() => {
                  setDecisionModal(p);
                  setDecisionForm({decision:'APPROVE', approved_price:brief?.target_selling_price||'',
                    rejection_code:'RECIPE_COST', deferred_reason:'', deferred_until:'', deferred_due:'', notes:''});
                }}>Review & Decide</WtBtn>
              </div>
            </WtCard>
          );
        })
      }

      {/* Reactivation Finance Review */}
      {mlcReactivationQueue.length > 0 && (
        <>
          <div style={{fontSize:13, fontWeight:700, color:WT.textStrong, margin:'24px 0 12px'}}>
            Reactivation Finance Review
            <span style={{marginLeft:8, fontSize:12, fontWeight:500, color:WT.textSecondary}}>
              {mlcReactivationQueue.length} pending
            </span>
          </div>
          {mlcReactivationQueue.map(p => (
            <WtCard key={p.id} style={{marginBottom:12, border:`1px solid #DDD6FE`}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700, fontSize:14, color:WT.textStrong, marginBottom:4}}>{p.name}</div>
                  <div style={{fontSize:13, color:WT.textSecondary}}>
                    Financial staleness detected â€” COGS drift &gt;15% from published version
                  </div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <WtBtn size="sm" variant="success" onClick={() => mlcReactivationDecide(p.id,'APPROVE')}>Approve</WtBtn>
                  <WtBtn size="sm" variant="secondary" onClick={() => mlcReactivationDecide(p.id,'NEW_VERSION_REQUIRED')}>New Version</WtBtn>
                  <WtBtn size="sm" variant="danger" onClick={() => mlcReactivationDecide(p.id,'REJECT')}>Reject</WtBtn>
                </div>
              </div>
            </WtCard>
          ))}
        </>
      )}

      {/* Deferred Products */}
      {mlcDeferred.length > 0 && (
        <>
          <div style={{fontSize:13, fontWeight:700, color:WT.textStrong, margin:'24px 0 12px'}}>
            Deferred Products
            <span style={{marginLeft:8, fontSize:12, fontWeight:500, color:WT.textSecondary}}>
              {mlcDeferred.length}
            </span>
          </div>
          {mlcDeferred.map(p => {
            const lc = p.menu_product_lifecycle;
            const reviewDue = lc?.deferred_review_due_at ? new Date(lc.deferred_review_due_at) : null;
            const overdue   = reviewDue && reviewDue < new Date();
            return (
              <WtCard key={p.id} style={{marginBottom:12,
                border:overdue?`1px solid #FECACA`:undefined}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                      <span style={{fontWeight:700, fontSize:14, color:WT.textStrong}}>{p.name}</span>
                      {overdue && <span style={{fontSize:11, fontWeight:700, color:WT.error600,
                        padding:'1px 8px', background:WT.error050, borderRadius:WT.rPill,
                        border:`1px solid #FECACA`}}>REVIEW OVERDUE</span>}
                    </div>
                    <div style={{fontSize:13, color:WT.textSecondary, marginBottom:2}}>{lc?.deferred_reason||'â€”'}</div>
                    <div style={{fontSize:12, color:WT.textTertiary}}>
                      Review due: {reviewDue?.toLocaleDateString('en-GB')||'â€”'}
                    </div>
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <WtBtn size="sm" variant="success"
                      onClick={() => mlcActDeferred(p.id,'REOPEN')}>Reopen</WtBtn>
                    <WtBtn size="sm" variant="secondary" onClick={async () => {
                      const d = window.prompt('New review due date (YYYY-MM-DD):');
                      if (!d) return;
                      await mlcActDeferred(p.id,'EXTEND', new Date(d).toISOString());
                    }}>Extend</WtBtn>
                    <WtBtn size="sm" variant="danger" onClick={() => {
                      if (!window.confirm('Archive as unviable? Cannot be undone.')) return;
                      mlcActDeferred(p.id,'ARCHIVE');
                    }}>Archive</WtBtn>
                  </div>
                </div>
              </WtCard>
            );
          })}
        </>
      )}

      {mlcFinanceQueue.length===0 && mlcReactivationQueue.length===0 && mlcDeferred.length===0 && (
        <WtEmpty icon="checkcircle" title="All MLC queues clear" subtitle="No pending menu lifecycle decisions"/>
      )}
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PAGE: PAYMENT QUEUE (Classified â†’ Approve for Payment)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const paymentPage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title="Payment Authorisation Queue"
        subtitle={`${paymentQueue.length} invoices classified by Finance Manager â€” your authorisation required`}
        action={<div style={{fontSize:13, fontWeight:700, color:WT.textStrong, fontVariantNumeric:'tabular-nums'}}>
          Total: {fmtAmt(queueTotal)}
        </div>}/>

      {paymentQueue.length === 0
        ? <WtEmpty icon="checkcircle" title="Queue clear"
            subtitle="Finance Manager classifies invoices, they appear here for your authorisation"/>
        : paymentQueue.map(inv => {
          const due   = inv.due_date || inv.pay_deadline;
          const dDiff = daysDiff(due);
          const urgent = dDiff !== null && dDiff <= 3;
          return (
            <WtCard key={inv.id} style={{marginBottom:12,
              border:`1px solid ${urgent?'#FECACA':WT.border}`}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
                    <span style={{fontWeight:700, fontSize:15, color:WT.textStrong}}>{getVendorName(inv)}</span>
                    {inv.ebills_fic && <span style={{fontSize:11, color:WT.textTertiary,
                      background:WT.bgMuted, padding:'2px 8px', borderRadius:WT.rPill,
                      border:`1px solid ${WT.border}`}}>FIC: {inv.ebills_fic.slice(-8)}</span>}
                    {urgent && <span style={{fontSize:11, fontWeight:700, color:WT.error600,
                      background:WT.error050, padding:'2px 8px', borderRadius:WT.rPill,
                      border:`1px solid #FECACA`}}>
                      {dDiff < 0 ? `${Math.abs(dDiff)}d overdue` : `Due in ${dDiff}d`}
                    </span>}
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14}}>
                    <WtField label="Amount" value={fmtAmt(inv.total_amount)}/>
                    <WtField label="VAT" value={inv.tax_amount ? fmtAmt(inv.tax_amount) : 'â€”'}/>
                    <WtField label="Category" value={inv.expense_category_code||'â€”'}
                      sub={inv.expense_subcategory||undefined}/>
                    <WtField label="Invoice Date" value={fmtDate(inv.invoice_date)}/>
                    <WtField label="Due Date"
                      value={fmtDate(due)}
                      sub={dDiff !== null ? (dDiff<0?`${Math.abs(dDiff)}d overdue`:`${dDiff}d remaining`) : undefined}/>
                  </div>
                  {inv.classified_at && (
                    <div style={{fontSize:12, color:WT.textTertiary, marginTop:8}}>
                      Classified {fmtDate(inv.classified_at)}
                    </div>
                  )}
                </div>
                <WtBtn size="sm" style={{flexShrink:0}}
                  onClick={() => { setAuthoriseModal(inv); setAuthoriseNotes(''); }}>
                  Authorise Payment
                </WtBtn>
              </div>
            </WtCard>
          );
        })
      }
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PAGE: AWAITING CONFIRMATION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const awaitingPage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title="Awaiting Payment Confirmation"
        subtitle={`${awaitingConf.length} invoices authorised by you â€” Finance Manager to record payment`}/>

      {overdueInv.length > 0 && (
        <div style={{padding:'12px 16px', background:WT.error050, borderRadius:WT.rMd,
          border:`1px solid #FECACA`, marginBottom:20, fontSize:13,
          color:WT.error600, fontWeight:600}}>
          Warning: {overdueInv.length} invoice{overdueInv.length!==1?'s':''} are overdue - Finance Manager has not yet recorded payment. Chase FM immediately.
        </div>
      )}

      {awaitingConf.length === 0
        ? <WtEmpty icon="clock" title="Nothing awaiting confirmation"
            subtitle="Invoices you authorise appear here until FM records payment"/>
        : (
          <WtCard style={{padding:0, overflow:'hidden'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, fontFamily:WT.font}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${WT.border}`}}>
                  {['Vendor','FIC','Amount','Authorised','Due Date','Status'].map(h => (
                    <th key={h} style={{padding:'12px 16px', textAlign:'left', fontWeight:600,
                      color:WT.textTertiary, fontSize:11, textTransform:'uppercase',
                      letterSpacing:'0.06em', background:WT.bgMuted}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {awaitingConf.map((inv, i) => {
                  const due   = inv.due_date || inv.pay_deadline;
                  const dDiff = daysDiff(due);
                  const isOvd = dDiff !== null && dDiff < 0;
                  const authHours = inv.approved_for_payment_at
                    ? Math.round((Date.now() - new Date(inv.approved_for_payment_at).getTime()) / 3600000) : null;
                  return (
                    <tr key={inv.id} style={{borderBottom:`1px solid ${WT.divider}`,
                      background:isOvd ? '#FFF5F5' : i%2===0?WT.bgPanel:WT.bgSoft}}>
                      <td style={{padding:'12px 16px', fontWeight:600, color:WT.textStrong}}>{getVendorName(inv)}</td>
                      <td style={{padding:'12px 16px', color:WT.textTertiary, fontSize:12}}>
                        {inv.ebills_fic ? inv.ebills_fic.slice(-10) : inv.fiscal_ref?.slice(-8) || 'â€”'}
                      </td>
                      <td style={{padding:'12px 16px', fontWeight:700, fontVariantNumeric:'tabular-nums',
                        color:WT.textStrong}}>{fmtAmt(inv.total_amount)}</td>
                      <td style={{padding:'12px 16px', color:WT.textSecondary, fontSize:12}}>
                        {inv.approved_for_payment_at ? fmtDate(inv.approved_for_payment_at) : 'â€”'}
                        {authHours !== null && authHours > 24 && (
                          <span style={{color:WT.error600, fontWeight:600, marginLeft:6,fontSize:11}}>
                            {authHours}h ago
                          </span>
                        )}
                      </td>
                      <td style={{padding:'12px 16px', fontVariantNumeric:'tabular-nums'}}>
                        <span style={{color:isOvd?WT.error600:WT.textSecondary, fontWeight:isOvd?700:400}}>
                          {fmtDate(due)}
                          {dDiff!==null && <span style={{marginLeft:6, fontSize:11}}>
                            {dDiff<0?`${Math.abs(dDiff)}d overdue`:`${dDiff}d`}
                          </span>}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{fontSize:11, fontWeight:700, padding:'3px 10px',
                          borderRadius:WT.rPill, background:WT.info050,
                          color:WT.info600, border:`1px solid #BAE6FD`}}>
                          Authorised
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </WtCard>
        )
      }
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PAGE: BASELINE CO-APPROVALS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const baselinePage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title="MPR Baseline Co-Approvals"
        subtitle="Price deviations >10% from baseline â€” SC Manager requested update, your approval required"/>

      {baselines.length === 0
        ? <WtEmpty icon="alerttri" title="No baseline requests pending"
            subtitle="When SC Manager approves a price deviation above 10%, it appears here for your sign-off"/>
        : baselines.map(req => {
          const sku = baselineSkuMap[req.sku_id];
          const vendor = vendors.find(v => v.id === req.vendor_id);
          const devPct = parseFloat(req.deviation_pct) * 100;
          return (
            <WtCard key={req.id} style={{marginBottom:12,
              border:`1px solid ${devPct>25?'#FECACA':devPct>15?'#F6E2AF':WT.border}`}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
                    <span style={{fontWeight:700, fontSize:15, color:WT.textStrong}}>
                      {sku?.product_name || req.sku_id}
                    </span>
                    <span style={{fontSize:11, color:WT.textTertiary, background:WT.bgMuted,
                      padding:'2px 8px', borderRadius:WT.rPill, border:`1px solid ${WT.border}`}}>
                      {sku?.sku_code || 'â€”'}
                    </span>
                    <span style={{
                      fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:WT.rPill,
                      background: devPct>25?WT.error050:WT.warning050,
                      color: devPct>25?WT.error600:WT.warning600,
                      border:`1px solid ${devPct>25?'#FECACA':'#F6E2AF'}`
                    }}>+{devPct.toFixed(1)}% deviation</span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16}}>
                    <WtField label="Current Baseline" value={`${req.old_baseline_price} ALL`}/>
                    <WtField label="New Proposed Price" value={`${req.new_baseline_price} ALL`}
                      sub="From invoice"/>
                    <WtField label="Vendor" value={vendor?.vendor_name || 'â€”'}/>
                    <WtField label="Requested" value={fmtDate(req.requested_at)}/>
                  </div>
                  <div style={{marginTop:10, padding:'8px 12px', background:WT.warning050,
                    borderRadius:WT.rMd, border:`1px solid #F6E2AF`, fontSize:12, color:'#92400E'}}>
                    Approving this will update the MPR baseline and all future COGS calculations that reference this SKU.
                  </div>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:8, flexShrink:0}}>
                  <WtBtn size="sm" variant="success"
                    onClick={() => { setBaselineModal({...req, action:'approve'}); setBaselineNotes(''); }}>
                    Approve
                  </WtBtn>
                  <WtBtn size="sm" variant="danger"
                    onClick={() => { setBaselineModal({...req, action:'reject'}); setBaselineNotes(''); }}>
                    Reject
                  </WtBtn>
                </div>
              </div>
            </WtCard>
          );
        })
      }
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PAGE: WATCHDOG & ESCALATIONS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const watchdogPage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title="Watchdog & Escalations"
        subtitle="System alerts, overdue tasks, and admin override surface"/>

      {watchdogAlerts.length === 0 && paymentOverdue.length === 0
        ? <WtEmpty icon="checkcircle" title="No active escalations"
            subtitle="The watchdog system is clean â€” all tasks within SLA"/>
        : (
          <>
            {paymentOverdue.length > 0 && (
              <>
                <div style={{fontSize:13, fontWeight:700, color:WT.error600, marginBottom:12}}>
                  Payment Overdue Alerts ({paymentOverdue.length})
                </div>
                {paymentOverdue.map(task => (
                  <WtCard key={task.id} style={{marginBottom:12, border:`1px solid #FECACA`}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <div>
                        <div style={{fontWeight:600, fontSize:14, color:WT.textStrong, marginBottom:4}}>
                          {task.task_type_code.replace(/_/g,' ')}
                        </div>
                        <div style={{fontSize:12, color:WT.textSecondary}}>
                          Created: {fmtDate(task.created_at)}
                          {task.due_at && ` Â· Due: ${fmtDate(task.due_at)}`}
                        </div>
                      </div>
                      <WtBtn size="sm" variant="danger" onClick={() => adminOverride(task.id)}>
                        Admin Override
                      </WtBtn>
                    </div>
                  </WtCard>
                ))}
              </>
            )}

            {watchdogAlerts.length > 0 && (
              <>
                <div style={{fontSize:13, fontWeight:700, color:WT.textStrong, margin:'20px 0 12px'}}>
                  Escalation Alerts ({watchdogAlerts.length})
                </div>
                {watchdogAlerts.map(task => {
                  const hoursOpen = Math.round((Date.now() - new Date(task.created_at).getTime()) / 3600000);
                  return (
                    <WtCard key={task.id} style={{marginBottom:12, borderLeft:`3px solid ${WT.error600}`}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div>
                          <div style={{fontWeight:600, fontSize:14, color:WT.textStrong, marginBottom:4}}>
                            {task.task_type_code.replace(/_/g,' ')}
                          </div>
                          <div style={{fontSize:12, color:WT.textSecondary}}>
                            Open {hoursOpen}h
                            {task.due_at && ` Â· Due: ${fmtDate(task.due_at)}`}
                            {task.assigned_role && ` Â· Role: ${task.assigned_role}`}
                          </div>
                          {task.payload?.note && (
                            <div style={{fontSize:12, color:WT.textTertiary, marginTop:4, fontStyle:'italic'}}>
                              "{task.payload.note}"
                            </div>
                          )}
                        </div>
                        <WtBtn size="sm" variant="secondary" onClick={() => adminOverride(task.id)}>
                          Admin Override
                        </WtBtn>
                      </div>
                    </WtCard>
                  );
                })}
              </>
            )}
          </>
        )
      }
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PAGE: VENDOR SPEND INTELLIGENCE
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const spendPage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title="Vendor Spend Intelligence"
        subtitle="Purchase spend by vendor â€” monthly breakdown, paid vs outstanding"/>

      {spendData.length === 0
        ? <WtEmpty icon="trend" title="No spend data available"
            subtitle="Spend data populates as invoices are classified and paid"/>
        : (
          <WtCard style={{padding:0, overflow:'hidden'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, fontFamily:WT.font}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${WT.border}`}}>
                  {['Vendor','Month','Invoices','Gross Spend','Net (ex-VAT)','Paid','Unpaid'].map(h => (
                    <th key={h} style={{padding:'12px 16px', textAlign:'left', fontWeight:600,
                      color:WT.textTertiary, fontSize:11, textTransform:'uppercase',
                      letterSpacing:'0.06em', background:WT.bgMuted}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {spendData.map((row, i) => (
                  <tr key={i} style={{borderBottom:`1px solid ${WT.divider}`,
                    background:i%2===0?WT.bgPanel:WT.bgSoft}}>
                    <td style={{padding:'12px 16px', fontWeight:600, color:WT.textStrong}}>
                      {row.vendor_name||'â€”'}
                    </td>
                    <td style={{padding:'12px 16px', color:WT.textSecondary, fontSize:12}}>
                      {row.month ? new Date(row.month).toLocaleDateString('en-GB',{month:'short',year:'numeric'}) : 'â€”'}
                    </td>
                    <td style={{padding:'12px 16px', color:WT.textSecondary, fontVariantNumeric:'tabular-nums'}}>
                      {row.invoice_count||0}
                    </td>
                    <td style={{padding:'12px 16px', fontWeight:700, fontVariantNumeric:'tabular-nums',
                      color:WT.textStrong}}>{fmtAmt(row.gross_spend||0)}</td>
                    <td style={{padding:'12px 16px', fontVariantNumeric:'tabular-nums', color:WT.textSecondary}}>
                      {fmtAmt(row.net_spend||0)}
                    </td>
                    <td style={{padding:'12px 16px', fontVariantNumeric:'tabular-nums', color:WT.success600, fontWeight:600}}>
                      {row.paid_count||0}
                    </td>
                    <td style={{padding:'12px 16px', fontVariantNumeric:'tabular-nums',
                      color:(row.unpaid_count||0)>0?WT.warning600:WT.textSecondary, fontWeight:(row.unpaid_count||0)>0?700:400}}>
                      {row.unpaid_count||0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </WtCard>
        )
      }
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PAGE: RECONCILIATION COCKPIT
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  const reconcilePage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title="Reconciliation Cockpit"
        subtitle="GRN receiving tickets â€” expected vs actual, disputes, and delta tracking"/>

      {reconcQueue.length === 0
        ? <WtEmpty icon="task" title="Reconciliation queue clear"
            subtitle="GRN tickets submitted by Restaurant Managers appear here"/>
        : (
          <WtCard style={{padding:0, overflow:'hidden'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, fontFamily:WT.font}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${WT.border}`}}>
                  {['Location','Received','Lines','Invoice Value','Received Value','Delta','Status','Days Open'].map(h => (
                    <th key={h} style={{padding:'12px 16px', textAlign:'left', fontWeight:600,
                      color:WT.textTertiary, fontSize:11, textTransform:'uppercase',
                      letterSpacing:'0.06em', background:WT.bgMuted}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reconcQueue.map((row, i) => {
                  const isDisputed   = row.reconciliation_status === 'DISPUTED';
                  const isPending    = row.reconciliation_status === 'PENDING_ALLOC';
                  const deltaAbs     = Math.abs(parseFloat(row.delta_pct||0));
                  return (
                    <tr key={row.ticket_id||i} style={{borderBottom:`1px solid ${WT.divider}`,
                      background:isDisputed?'#FFF5F5':i%2===0?WT.bgPanel:WT.bgSoft}}>
                      <td style={{padding:'12px 16px', fontWeight:600, color:WT.textStrong}}>
                        {row.location_name||'â€”'}
                      </td>
                      <td style={{padding:'12px 16px', color:WT.textSecondary, fontSize:12}}>
                        {fmtDate(row.received_at)}
                      </td>
                      <td style={{padding:'12px 16px', fontVariantNumeric:'tabular-nums',
                        color:WT.textSecondary}}>{row.line_count||0}</td>
                      <td style={{padding:'12px 16px', fontVariantNumeric:'tabular-nums', color:WT.textStrong}}>
                        {row.invoice_total ? fmtAmt(row.invoice_total) : 'â€”'}
                      </td>
                      <td style={{padding:'12px 16px', fontVariantNumeric:'tabular-nums', color:WT.textStrong}}>
                        {fmtAmt(row.received_value||0)}
                      </td>
                      <td style={{padding:'12px 16px', fontVariantNumeric:'tabular-nums',
                        fontWeight:deltaAbs>5?700:400,
                        color:deltaAbs>5?WT.error600:deltaAbs>2?WT.warning600:WT.success600}}>
                        {row.delta_pct !== null ? `${parseFloat(row.delta_pct).toFixed(1)}%` : 'â€”'}
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <span style={{
                          fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:WT.rPill,
                          background: isDisputed?WT.error050 : isPending?WT.warning050 : WT.success050,
                          color: isDisputed?WT.error600 : isPending?WT.warning600 : WT.success600,
                          border: `1px solid ${isDisputed?'#FECACA':isPending?'#F6E2AF':'#BBF7D0'}`
                        }}>
                          {row.reconciliation_status?.replace(/_/g,' ')||'â€”'}
                        </span>
                      </td>
                      <td style={{padding:'12px 16px', fontVariantNumeric:'tabular-nums',
                        color:(row.days_open||0)>3?WT.warning600:WT.textSecondary}}>
                        {row.days_open ?? 'â€”'}d
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </WtCard>
        )
      }
    </div>
  );

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // MODALS
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  // MLC Decision Modal
  const mlcDecisionModal = (
    <WtModal open={!!decisionModal} onClose={() => setDecisionModal(null)}
      title={`Finance Decision â€” ${decisionModal?.name}`} width={560}>
      <div style={{marginBottom:20}}>
        <label style={{display:'block', fontSize:12, fontWeight:600,
          color:WT.textSecondary, marginBottom:8, fontFamily:WT.font}}>Decision</label>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8}}>
          {['APPROVE','REJECT','DEFER','CONDITIONAL'].map(d => (
            <div key={d} onClick={() => setDecisionForm(f=>({...f,decision:d}))}
              style={{
                padding:'10px 8px', borderRadius:WT.rMd, textAlign:'center',
                cursor:'pointer', fontSize:12, fontWeight:600, fontFamily:WT.font,
                border:`2px solid ${decisionForm.decision===d?WT.blue600:WT.border}`,
                background:decisionForm.decision===d?WT.blue050:WT.bgPanel,
                color:decisionForm.decision===d?WT.blue600:WT.textSecondary,
                transition:'all 0.12s'
              }}>{d}</div>
          ))}
        </div>
      </div>

      {['APPROVE','CONDITIONAL'].includes(decisionForm.decision) && (
        <>
          <WtInput label={decisionForm.decision==='CONDITIONAL'?'Counter-Price (ALL) *':'Approved Price (ALL) *'}
            type="number" value={decisionForm.approved_price}
            onChange={e => setDecisionForm(f=>({...f,approved_price:e.target.value}))}
            style={{marginBottom:10}}/>
          {decisionModal && decisionForm.approved_price && (() => {
            const margin = getMlcMargin(decisionModal, decisionForm.approved_price);
            const brief  = decisionModal.product_briefs?.sort((a,b)=>b.brief_no-a.brief_no)[0];
            const floor  = brief?.target_margin_floor_pct || 30;
            const fv     = decisionModal.formula_headers?.[0]?.formula_versions?.find(v=>v.technical_status==='APPROVED');
            if (margin === null) return null;
            return (
              <div style={{padding:'10px 14px', borderRadius:WT.rMd, marginBottom:16,
                background:margin>=floor?WT.success050:WT.error050,
                border:`1px solid ${margin>=floor?'#BBF7D0':'#FECACA'}`,
                fontSize:13, fontWeight:600, fontVariantNumeric:'tabular-nums',
                color:margin>=floor?WT.success600:WT.error600}}>
                Projected margin: {margin}%
                {margin>=floor ? ` â€” above ${floor}% floor âœ“` : ` â€” below ${floor}% floor`}
                {fv?.tested_cogs_last && (
                  <span style={{fontWeight:400, marginLeft:12}}>COGS: {fv.tested_cogs_last} ALL</span>
                )}
              </div>
            );
          })()}
        </>
      )}

      {decisionForm.decision==='REJECT' && (
        <WtSelect label="Rejection Reason *" value={decisionForm.rejection_code}
          onChange={e => setDecisionForm(f=>({...f,rejection_code:e.target.value}))}
          style={{marginBottom:16}}>
          <option value="RECIPE_COST">Recipe Cost â€” TD to revise formula</option>
          <option value="PRICE_TOO_LOW">Price Too Low â€” Marketing to revise price</option>
          <option value="STRUCTURALLY_UNVIABLE">Structurally Unviable â€” archive permanently</option>
          <option value="TIMING">Timing / Portfolio â€” consider defer</option>
        </WtSelect>
      )}

      {decisionForm.decision==='DEFER' && (
        <>
          <WtInput label="Deferred Reason *" value={decisionForm.deferred_reason}
            onChange={e => setDecisionForm(f=>({...f,deferred_reason:e.target.value}))}
            placeholder="e.g. Supplier pricing uncertainty"
            style={{marginBottom:16}}/>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:16}}>
            <WtInput label="Defer Until *" type="date" value={decisionForm.deferred_until}
              onChange={e => setDecisionForm(f=>({...f,deferred_until:e.target.value}))}/>
            <WtInput label="Review Due *" type="date" value={decisionForm.deferred_due}
              onChange={e => setDecisionForm(f=>({...f,deferred_due:e.target.value}))}/>
          </div>
        </>
      )}

      <WtTextarea label="Notes (optional)" value={decisionForm.notes}
        onChange={e => setDecisionForm(f=>({...f,notes:e.target.value}))}
        placeholder="Decision rationale..." rows={2} style={{marginBottom:24}}/>

      <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
        <WtBtn variant="secondary" onClick={() => setDecisionModal(null)}>Cancel</WtBtn>
        <WtBtn
          variant={decisionForm.decision==='APPROVE'?'primary':decisionForm.decision==='REJECT'?'danger':'secondary'}
          onClick={submitMlcDecision} disabled={submittingMlc}>
          {submittingMlc ? 'Submitting...' : `Confirm ${decisionForm.decision}`}
        </WtBtn>
      </div>
    </WtModal>
  );

  // Payment Authorise Modal
  const authorisePayModal = (
    <WtModal open={!!authoriseModal} onClose={() => setAuthoriseModal(null)}
      title="Authorise Payment" width={480}>
      {authoriseModal && (
        <>
          <div style={{padding:'14px 16px', background:WT.bgMuted, borderRadius:WT.rMd,
            border:`1px solid ${WT.border}`, marginBottom:20}}>
            <div style={{fontWeight:700, fontSize:15, color:WT.textStrong, marginBottom:6}}>
              {getVendorName(authoriseModal)}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <WtField label="Amount" value={fmtAmt(authoriseModal.total_amount)}/>
              <WtField label="Due Date"
                value={fmtDate(authoriseModal.due_date || authoriseModal.pay_deadline)}/>
              <WtField label="FIC" value={authoriseModal.ebills_fic || authoriseModal.fiscal_ref || 'â€”'}/>
              <WtField label="Category" value={authoriseModal.expense_category_code || 'â€”'}/>
            </div>
          </div>
          <div style={{padding:'10px 14px', background:WT.info050, borderRadius:WT.rMd,
            border:`1px solid #BAE6FD`, marginBottom:20, fontSize:13, color:WT.info600}}>
            Authorising confirms you have reviewed this invoice. Finance Manager will execute and record the payment.
          </div>
          <WtTextarea label="Notes (optional)" value={authoriseNotes}
            onChange={e => setAuthoriseNotes(e.target.value)}
            placeholder="Any instructions for Finance Manager..."
            rows={2} style={{marginBottom:24}}/>
          <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
            <WtBtn variant="secondary" onClick={() => setAuthoriseModal(null)}>Cancel</WtBtn>
            <WtBtn onClick={authorisePayment} disabled={submittingPay}>
              {submittingPay ? 'Authorising...' : 'Authorise Payment'}
            </WtBtn>
          </div>
        </>
      )}
    </WtModal>
  );

  // Baseline Decision Modal
  const baselineDecModal = (
    <WtModal open={!!baselineModal} onClose={() => setBaselineModal(null)}
      title={baselineModal?.action === 'approve' ? 'Approve Baseline Update' : 'Reject Baseline Update'}
      width={480}>
      {baselineModal && (
        <>
          <div style={{padding:'14px 16px', background:WT.bgMuted, borderRadius:WT.rMd,
            border:`1px solid ${WT.border}`, marginBottom:20}}>
            <div style={{fontWeight:700, fontSize:14, color:WT.textStrong, marginBottom:10}}>
              {baselineSkuMap[baselineModal.sku_id]?.product_name || 'â€”'}
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
              <WtField label="Current Baseline" value={`${baselineModal.old_baseline_price} ALL`}/>
              <WtField label="New Price" value={`${baselineModal.new_baseline_price} ALL`}/>
              <WtField label="Deviation" value={`+${(parseFloat(baselineModal.deviation_pct)*100).toFixed(1)}%`}/>
            </div>
          </div>
          {baselineModal.action === 'approve' && (
            <div style={{padding:'10px 14px', background:WT.warning050, borderRadius:WT.rMd,
              border:`1px solid #F6E2AF`, marginBottom:16, fontSize:13, color:'#92400E'}}>
              This will permanently update the MPR baseline price and affect all future COGS calculations.
            </div>
          )}
          <WtTextarea label="Review Notes (optional)" value={baselineNotes}
            onChange={e => setBaselineNotes(e.target.value)}
            placeholder={baselineModal.action==='reject'?'Reason for rejection...':'Approval notes...'}
            rows={2} style={{marginBottom:24}}/>
          <div style={{display:'flex', justifyContent:'flex-end', gap:10}}>
            <WtBtn variant="secondary" onClick={() => setBaselineModal(null)}>Cancel</WtBtn>
            <WtBtn
              variant={baselineModal.action==='approve'?'primary':'danger'}
              onClick={() => resolveBaseline(baselineModal.id, baselineModal.action)}
              disabled={submittingBase}>
              {submittingBase ? 'Processing...' : baselineModal.action==='approve' ? 'Confirm Approve' : 'Confirm Reject'}
            </WtBtn>
          </div>
        </>
      )}
    </WtModal>
  );

  // â”€â”€ Page routing â”€â”€
  const isLoading = mlcLoading || finLoading;
  const pages = {
    overview:  overviewPage,
    mlc:       mlcPage,
    payment:   paymentPage,
    awaiting:  awaitingPage,
    baseline:  baselinePage,
    watchdog:  watchdogPage,
    spend:     spendPage,
    reconcile: reconcilePage,
  };

  return (
    <div style={{display:'flex', minHeight:'100vh', background:WT.bgApp, fontFamily:WT.font}}>
      {sidebar}
      <div style={{flex:1, overflow:'auto'}}>
        {isLoading
          ? <div style={{display:'flex', alignItems:'center', justifyContent:'center',
              height:'100vh', color:WT.textTertiary, fontFamily:WT.font, gap:10}}>
              <div style={{width:20, height:20, borderRadius:'50%',
                border:`2px solid ${WT.blue600}`, borderTopColor:'transparent',
                animation:'spin 0.7s linear infinite'}}/>
              Loading CFO data...
            </div>
          : (pages[page] || overviewPage)
        }
      </div>

      {mlcDecisionModal}
      {authorisePayModal}
      {baselineDecModal}
      <WtToast toast={toast}/>
    </div>
  );
}

