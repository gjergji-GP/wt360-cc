import { useEffect, useState } from "react";
import { Icon } from "../../components/common/Icon";
import { SB } from "../../lib/supabase";
import { SbItem, StagePill, WtBtn, WtCard, WtEmpty, WtField, WtInput, WtPageHeader, WtSelect, WtToast } from "../mlc/shared";
import { useMLCData } from "../mlc/useMLCData";
import { WT } from "../mlc/tokens";
export function TechnicalDirectorCC({ session, onSignOut }) {

  const brandId = session?.brand_id || 'a2911ac0-bcac-42c4-b39b-fed6813d321e';
  const empId   = session?.employee_id;
  const [page, setPage]   = useState('inbox');
  const [exp, setExp]     = useState(true);
  const { products, loading, reload } = useMLCData(brandId);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [toast, setToast] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formulaLines, setFormulaLines] = useState([]);
  const [addLine, setAddLine] = useState({
    component_type:'RAW_MATERIAL', raw_material_id:'',
    semi_finished_product_id:'', quantity:'', uom:'g',
    waste_factor:'1.0', role_in_formula:'BASE'
  });
  const [savingLine, setSavingLine] = useState(false);

  useEffect(() => {
    SB.from('master_products')
      .select('id,sku_code,product_name,last_purchase_price,category_id')
      .eq('brand_id', brandId).eq('status','ACTIVE').order('product_name')
      .then(({data}) => setRawMaterials(data||[]));
  }, [brandId]);

  const showToast = (msg, type='success') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),3500);
  };

  // The current editable formula version for a product
  const getEditableFV = (p) =>
    p?.formula_headers?.[0]?.formula_versions
      ?.sort((a,b)=>b.version_no-a.version_no)
      .find(v => ['DRAFT','REVISION'].includes(v.technical_status));

  // Load formula lines when product selected
  useEffect(() => {
    const fv = getEditableFV(selectedProduct);
    if (!fv) { setFormulaLines([]); return; }
    SB.from('formula_lines').select('*').eq('formula_version_id', fv.id).order('line_no')
      .then(({data}) => { setFormulaLines(data||[]); });
  }, [products, selectedProduct]);

  const myInbox = products.filter(p =>
    ['BRIEF_SUBMITTED','RECIPE_DRAFT','RECIPE_REVISION','REACTIVATION_TECH_REVIEW']
      .includes(p.menu_product_lifecycle?.lifecycle_stage)
  );

  const acceptBrief = async (productId) => {
    try {
      const {error} = await SB.rpc('mlc_td_accept_brief', {p_product_id:productId, p_actor_id:empId});
      if (error) throw error;
      showToast('Brief accepted â€” formula studio opened');
      const p = products.find(x=>x.id===productId);
      if (p) { setSelectedProduct(p); setPage('studio'); }
      reload();
    } catch(e) { showToast(e.message,'error'); }
  };

  const returnBrief = async (productId) => {
    const notes = window.prompt('Return notes for Marketing:');
    if (!notes?.trim()) return;
    try {
      const {error} = await SB.rpc('mlc_td_return_brief', {p_product_id:productId, p_return_notes:notes, p_actor_id:empId});
      if (error) throw error;
      showToast('Brief returned to Marketing'); reload();
    } catch(e) { showToast(e.message,'error'); }
  };

  const submitForTest = async () => {
    const fv = getEditableFV(selectedProduct);
    if (!fv) return;
    try {
      const {error} = await SB.rpc('mlc_submit_formula_for_testing', {p_formula_version_id:fv.id, p_actor_id:empId});
      if (error) throw error;
      showToast('Formula submitted for test batch'); reload();
    } catch(e) { showToast(e.message,'error'); }
  };

  const submitForOpsReview = async () => {
    const fv = getEditableFV(selectedProduct);
    if (!fv) return;
    try {
      const {error} = await SB.rpc('mlc_submit_for_operational_review', {p_formula_version_id:fv.id, p_actor_id:empId});
      if (error) throw error;
      showToast('Submitted for operational review'); reload();
    } catch(e) { showToast(e.message,'error'); }
  };

  const addIngredient = async () => {
    const fv = getEditableFV(selectedProduct);
    if (!fv) return;
    if (!addLine.quantity || parseFloat(addLine.quantity)<=0) {
      showToast('Enter a valid quantity','error'); return;
    }
    if (addLine.component_type==='RAW_MATERIAL' && !addLine.raw_material_id) {
      showToast('Select a raw material','error'); return;
    }
    if (addLine.component_type==='SEMI_FINISHED' && !addLine.semi_finished_product_id) {
      showToast('Select a semi-finished product','error'); return;
    }
    setSavingLine(true);
    const nextLine = formulaLines.length>0 ? Math.max(...formulaLines.map(l=>l.line_no))+1 : 1;
    const {error} = await SB.from('formula_lines').insert({
      formula_version_id:fv.id, line_no:nextLine,
      component_type:addLine.component_type,
      raw_material_id:addLine.component_type==='RAW_MATERIAL'?addLine.raw_material_id:null,
      semi_finished_product_id:addLine.component_type==='SEMI_FINISHED'?addLine.semi_finished_product_id:null,
      quantity:parseFloat(addLine.quantity), uom:addLine.uom,
      waste_factor:parseFloat(addLine.waste_factor)||1.0,
      role_in_formula:addLine.role_in_formula, created_by:empId
    });
    if (error) { showToast(error.message,'error'); }
    else {
      showToast('Ingredient added');
      setAddLine({component_type:'RAW_MATERIAL',raw_material_id:'',
        semi_finished_product_id:'',quantity:'',uom:'g',waste_factor:'1.0',role_in_formula:'BASE'});
      SB.from('formula_lines').select('*').eq('formula_version_id',fv.id).order('line_no')
        .then(({data})=>setFormulaLines(data||[]));
    }
    setSavingLine(false);
  };

  const NAV = [
    {id:'inbox',    label:`Inbox (${myInbox.length})`,  iconName:"inbox"},
    {id:'register', label:'Product Register',            iconName:"book"},
    {id:'studio',   label:'Formula Studio',              iconName:"flask"},
    {id:'safety',   label:'Food Safety',                 iconName:"shield"},
    {id:'testing',  label:'Validation Lab',              iconName:"testtube"},
    {id:'impact',   label:'Change Impact',               iconName:"zap"},
  ];

  const sidebar = (
    <div style={{
      width:exp?220:64, minHeight:'100vh', background:WT.shellDark,
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
        fontFamily:WT.font}}>Technical</div>}
      <nav style={{flex:1, padding:'8px 8px'}}>
        {NAV.map(item => (
          <SbItem key={item.id} label={item.label} iconName={item.iconName}
            active={page===item.id} exp={exp} onClick={() => setPage(item.id)}/>
        ))}
      </nav>
      <div style={{padding:'8px 8px', borderTop:`1px solid ${WT.shellBorder}`}}>
        <SbItem label="Sign out" iconName="logout" active={false} exp={exp} onClick={onSignOut}/>
      </div>
    </div>
  );

  // â”€â”€ Inbox page â”€â”€
  const inboxPage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title="TD Inbox"
        subtitle={`${myInbox.length} item${myInbox.length!==1?'s':''} requiring attention`}/>
      {myInbox.length===0
        ? <WtEmpty icon="inbox" title="Inbox clear" subtitle="New briefs and revision requests appear here"/>
        : myInbox.map(p => {
          const lc = p.menu_product_lifecycle;
          const brief = p.product_briefs?.sort((a,b)=>b.brief_no-a.brief_no)[0];
          const isReact = lc?.lifecycle_stage === 'REACTIVATION_TECH_REVIEW';
          return (
            <WtCard key={p.id} style={{
              marginBottom:12,
              borderLeft:`3px solid ${isReact ? '#7C3AED' : WT.blue600}`
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
                    <span style={{fontWeight:700, fontSize:15, color:WT.textStrong}}>{p.name}</span>
                    <StagePill stage={lc?.lifecycle_stage}/>
                  </div>
                  {brief && (
                    <div style={{fontSize:13, color:WT.textSecondary, marginBottom:6}}>
                      {brief.working_title} Â· Target {brief.target_selling_price} ALL
                      Â· Floor {brief.target_margin_floor_pct}%
                    </div>
                  )}
                  {brief?.positioning && (
                    <p style={{fontSize:12, color:WT.textTertiary, fontStyle:'italic',
                      margin:'0 0 8px', lineHeight:1.5}}>"{brief.positioning}"</p>
                  )}
                  {brief?.mandatory_constraints && (
                    <div style={{padding:'8px 12px', background:WT.warning050,
                      borderRadius:WT.rMd, border:`1px solid #F6E2AF`,
                      fontSize:12, color:'#92400E'}}>
                      Constraints: {brief.mandatory_constraints}
                    </div>
                  )}
                  {isReact && (
                    <div style={{padding:'8px 12px', background:WT.info050,
                      borderRadius:WT.rMd, border:`1px solid #BAE6FD`,
                      fontSize:12, color:WT.info600, marginTop:6}}>
                      Reactivation review â€” assess staleness and decide if new version is required
                    </div>
                  )}
                </div>
                <div style={{display:'flex', gap:8, flexShrink:0}}>
                  {lc?.lifecycle_stage==='BRIEF_SUBMITTED' && <>
                    <WtBtn size="sm" onClick={() => acceptBrief(p.id)}>Accept Brief</WtBtn>
                    <WtBtn size="sm" variant="secondary" onClick={() => returnBrief(p.id)}>Return</WtBtn>
                  </>}
                  {['RECIPE_DRAFT','RECIPE_REVISION'].includes(lc?.lifecycle_stage) && (
                    <WtBtn size="sm" variant="secondary" onClick={() => {
                      setSelectedProduct(p); setPage('studio');
                    }}>Open Studio</WtBtn>
                  )}
                  {isReact && <>
                    <WtBtn size="sm" variant="success" onClick={async () => {
                      const {error} = await SB.rpc('mlc_complete_tech_reactivation_review',
                        {p_product_id:p.id, p_new_version_required:false, p_actor_id:empId});
                      if (error) showToast(error.message,'error');
                      else { showToast('Reactivation cleared'); reload(); }
                    }}>Clear</WtBtn>
                    <WtBtn size="sm" variant="secondary" onClick={async () => {
                      const {error} = await SB.rpc('mlc_complete_tech_reactivation_review',
                        {p_product_id:p.id, p_new_version_required:true, p_notes:'New version required', p_actor_id:empId});
                      if (error) showToast(error.message,'error');
                      else { showToast('Returned for new version'); reload(); }
                    }}>New Version Req.</WtBtn>
                  </>}
                </div>
              </div>
            </WtCard>
          );
        })
      }
    </div>
  );

  // â”€â”€ Product Register â”€â”€
  const registerProducts = products.filter(p =>
    !['BRIEF_ABANDONED','ARCHIVED_UNVIABLE','RETIRED'].includes(p.menu_product_lifecycle?.lifecycle_stage)
  );
  const registerPage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title="Product Register"
        subtitle={`${registerProducts.length} governed products`}/>
      {registerProducts.length===0
        ? <WtEmpty icon="book" title="No products yet" subtitle="Products created by Marketing appear here"/>
        : (
          <WtCard style={{padding:0, overflow:'hidden'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, fontFamily:WT.font}}>
              <thead>
                <tr style={{borderBottom:`2px solid ${WT.border}`}}>
                  {['Product','Type','Category','Formula','Stage','Action'].map(h => (
                    <th key={h} style={{padding:'12px 16px', textAlign:'left', fontWeight:600,
                      color:WT.textTertiary, fontSize:11, textTransform:'uppercase',
                      letterSpacing:'0.06em', background:WT.bgMuted}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registerProducts.map((p,i) => {
                  const lc = p.menu_product_lifecycle;
                  const fv = p.formula_headers?.[0]?.formula_versions
                    ?.sort((a,b)=>b.version_no-a.version_no)[0];
                  return (
                    <tr key={p.id} style={{borderBottom:`1px solid ${WT.divider}`,
                      background:i%2===0?WT.bgPanel:WT.bgSoft}}>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{fontWeight:600, color:WT.textStrong}}>{p.name}</div>
                        <div style={{fontSize:11, color:WT.textTertiary, marginTop:2}}>{p.internal_code}</div>
                      </td>
                      <td style={{padding:'12px 16px', color:WT.textSecondary}}>{p.product_type}</td>
                      <td style={{padding:'12px 16px', color:WT.textSecondary}}>{p.category_code}</td>
                      <td style={{padding:'12px 16px'}}>
                        {fv
                          ? <span style={{fontSize:12, fontWeight:600,
                              color:fv.technical_status==='APPROVED'?WT.success600:WT.textSecondary}}>
                              v{fv.version_no} Â· {fv.technical_status}
                            </span>
                          : <span style={{color:WT.textDisabled, fontSize:12}}>No formula</span>
                        }
                      </td>
                      <td style={{padding:'12px 16px'}}><StagePill stage={lc?.lifecycle_stage}/></td>
                      <td style={{padding:'12px 16px'}}>
                        {['RECIPE_DRAFT','RECIPE_REVISION'].includes(lc?.lifecycle_stage) && (
                          <WtBtn size="sm" variant="secondary" onClick={() => {
                            setSelectedProduct(p); setPage('studio');
                          }}>Studio</WtBtn>
                        )}
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

  // â”€â”€ Formula Studio â”€â”€
  const studioProduct = selectedProduct ||
    products.find(p => ['RECIPE_DRAFT','RECIPE_REVISION'].includes(p.menu_product_lifecycle?.lifecycle_stage));
  const studioFV = getEditableFV(studioProduct);
  const sfpOptions = products.filter(p => p.product_type==='SEMI_FINISHED');
  const studioLc = studioProduct?.menu_product_lifecycle?.lifecycle_stage;

  const studioPage = (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
        <div>
          <h1 style={{fontSize:24, fontWeight:700, color:WT.textStrong, margin:0, letterSpacing:'-0.02em'}}>
            Formula Studio
          </h1>
          <p style={{fontSize:14, color:WT.textSecondary, margin:'4px 0 0'}}>
            Build and manage ingredient formulas
          </p>
        </div>
        <WtSelect value={selectedProduct?.id||''} onChange={e => {
          const p = products.find(x => x.id===e.target.value);
          setSelectedProduct(p||null);
        }} style={{minWidth:240}}>
          <option value="">Select product...</option>
          {products.filter(p =>
            ['RECIPE_DRAFT','RECIPE_REVISION','TESTING','OPERATIONAL_REVIEW']
              .includes(p.menu_product_lifecycle?.lifecycle_stage)
          ).map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </WtSelect>
      </div>

      {!studioProduct
        ? <WtEmpty icon="flask" title="Select a product to begin"
            subtitle="Products in RECIPE_DRAFT or RECIPE_REVISION appear in the selector above"/>
        : (
          <>
            {/* Product context card */}
            <WtCard style={{marginBottom:20, background:WT.bgMuted, border:`1px solid ${WT.border}`}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700, fontSize:15, color:WT.textStrong, marginBottom:4}}>
                    {studioProduct.name}
                  </div>
                  <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <StagePill stage={studioLc}/>
                    {studioFV && <span style={{fontSize:12, color:WT.textSecondary}}>
                      Formula v{studioFV.version_no} Â· {studioFV.technical_status}
                    </span>}
                  </div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  {studioFV && studioLc==='RECIPE_DRAFT' && (
                    <WtBtn size="sm" disabled={formulaLines.length===0} onClick={submitForTest}>
                      Submit for Test
                    </WtBtn>
                  )}
                  {studioFV && studioLc==='RECIPE_REVISION' && (
                    <WtBtn size="sm" onClick={submitForOpsReview}>Submit for Ops Review</WtBtn>
                  )}
                </div>
              </div>
            </WtCard>

            {/* Formula lines */}
            {formulaLines.length>0 && (
              <WtCard style={{marginBottom:20, padding:0, overflow:'hidden'}}>
                <div style={{padding:'14px 20px', borderBottom:`1px solid ${WT.divider}`,
                  fontWeight:600, fontSize:13, color:WT.textStrong, background:WT.bgMuted}}>
                  Formula â€” {formulaLines.length} ingredient{formulaLines.length!==1?'s':''}
                </div>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, fontFamily:WT.font}}>
                  <thead>
                    <tr style={{borderBottom:`1px solid ${WT.divider}`}}>
                      {['#','Type','Ingredient','Quantity','UOM','Waste','Role'].map(h => (
                        <th key={h} style={{padding:'10px 16px', textAlign:'left', fontWeight:600,
                          color:WT.textTertiary, fontSize:11, textTransform:'uppercase',
                          letterSpacing:'0.06em'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formulaLines.map((l,i) => {
                      const rm  = rawMaterials.find(r=>r.id===l.raw_material_id);
                      const sfp = products.find(p=>p.id===l.semi_finished_product_id);
                      return (
                        <tr key={l.id} style={{borderBottom:`1px solid ${WT.divider}`,
                          background:i%2===0?WT.bgPanel:WT.bgSoft}}>
                          <td style={{padding:'10px 16px', color:WT.textTertiary, fontVariantNumeric:'tabular-nums'}}>
                            {l.line_no}
                          </td>
                          <td style={{padding:'10px 16px'}}>
                            <span style={{
                              fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:WT.rPill,
                              background: l.component_type==='RAW_MATERIAL' ? WT.blue050 : '#F5F3FF',
                              color: l.component_type==='RAW_MATERIAL' ? WT.blue600 : '#7C3AED',
                              border: `1px solid ${l.component_type==='RAW_MATERIAL' ? WT.blue100 : '#DDD6FE'}`
                            }}>
                              {l.component_type==='RAW_MATERIAL' ? 'RM' : 'SFP'}
                            </span>
                          </td>
                          <td style={{padding:'10px 16px', fontWeight:500, color:WT.textStrong}}>
                            {rm?.product_name||sfp?.name||'â€”'}
                          </td>
                          <td style={{padding:'10px 16px', fontVariantNumeric:'tabular-nums', color:WT.textStrong}}>
                            {l.quantity}
                          </td>
                          <td style={{padding:'10px 16px', color:WT.textSecondary}}>{l.uom}</td>
                          <td style={{padding:'10px 16px', color:WT.textSecondary,
                            fontVariantNumeric:'tabular-nums'}}>{l.waste_factor}Ã—</td>
                          <td style={{padding:'10px 16px', color:WT.textTertiary, fontSize:12}}>
                            {l.role_in_formula}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </WtCard>
            )}

            {/* Add ingredient */}
            {studioFV && (
              <WtCard>
                <div style={{fontWeight:600, fontSize:14, color:WT.textStrong, marginBottom:16}}>
                  Add Ingredient
                </div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:14}}>
                  <WtSelect label="Component Type" value={addLine.component_type}
                    onChange={e => setAddLine(f=>({...f,component_type:e.target.value,
                      raw_material_id:'',semi_finished_product_id:''}))}>
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="SEMI_FINISHED">Semi-Finished (SFP)</option>
                  </WtSelect>
                  <div>
                    <label style={{display:'block', fontSize:12, fontWeight:600,
                      color:WT.textSecondary, marginBottom:6, fontFamily:WT.font}}>
                      {addLine.component_type==='RAW_MATERIAL' ? 'Raw Material' : 'SFP Product'}
                    </label>
                    {addLine.component_type==='RAW_MATERIAL'
                      ? <select value={addLine.raw_material_id}
                          onChange={e => setAddLine(f=>({...f,raw_material_id:e.target.value}))}
                          style={{width:'100%',padding:'10px 14px',border:`1px solid ${WT.border}`,
                            borderRadius:WT.rMd,fontSize:13,fontFamily:WT.font,
                            background:WT.bgPanel,color:WT.textPrimary}}>
                          <option value="">Select...</option>
                          {rawMaterials.map(r=>(
                            <option key={r.id} value={r.id}>{r.product_name} ({r.sku_code})</option>
                          ))}
                        </select>
                      : <select value={addLine.semi_finished_product_id}
                          onChange={e => setAddLine(f=>({...f,semi_finished_product_id:e.target.value}))}
                          style={{width:'100%',padding:'10px 14px',border:`1px solid ${WT.border}`,
                            borderRadius:WT.rMd,fontSize:13,fontFamily:WT.font,
                            background:WT.bgPanel,color:WT.textPrimary}}>
                          <option value="">Select SFP...</option>
                          {sfpOptions.map(s=>(
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                    }
                  </div>
                  <WtSelect label="Role" value={addLine.role_in_formula}
                    onChange={e => setAddLine(f=>({...f,role_in_formula:e.target.value}))}>
                    {['BASE','PROTEIN','SAUCE','GARNISH','PACKAGING','OTHER'].map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </WtSelect>
                  <WtInput label="Quantity *" type="number" value={addLine.quantity}
                    onChange={e => setAddLine(f=>({...f,quantity:e.target.value}))}
                    placeholder="e.g. 180"/>
                  <WtSelect label="UOM" value={addLine.uom}
                    onChange={e => setAddLine(f=>({...f,uom:e.target.value}))}>
                    {['g','kg','ml','l','piece','tbsp','tsp'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </WtSelect>
                  <WtInput label="Waste Factor" type="number" value={addLine.waste_factor}
                    onChange={e => setAddLine(f=>({...f,waste_factor:e.target.value}))}
                    placeholder="1.0 = no waste"/>
                </div>
                <div style={{display:'flex', justifyContent:'flex-end'}}>
                  <WtBtn onClick={addIngredient} disabled={savingLine}>
                    {savingLine ? 'Adding...' : 'Add Ingredient'}
                  </WtBtn>
                </div>
              </WtCard>
            )}
          </>
        )
      }
    </div>
  );

  const placeholderPage = (iconName, title, subtitle) => (
    <div style={{padding:'28px 32px', fontFamily:WT.font}}>
      <WtPageHeader title={title}/>
      <WtEmpty icon={iconName} title={subtitle} subtitle="Coming in next sprint"/>
    </div>
  );

  const pages = {
    inbox: inboxPage,
    register: registerPage,
    studio: studioPage,
    safety:  placeholderPage('shield',   'Food Safety',     'Select a product with an approved formula'),
    testing: placeholderPage('testtube', 'Validation Lab',  'Test batch recording â€” next sprint'),
    impact:  placeholderPage('zap',      'Change Impact',   'Upstream change monitoring active â€” no alerts'),
  };

  return (
    <div style={{display:'flex', minHeight:'100vh', background:WT.bgApp, fontFamily:WT.font}}>
      {sidebar}
      <div style={{flex:1, overflow:'auto'}}>
        {loading
          ? <div style={{display:'flex', alignItems:'center', justifyContent:'center',
              height:'100vh', color:WT.textTertiary, fontFamily:WT.font, gap:10}}>
              <div style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${WT.blue600}`,
                borderTopColor:'transparent',animation:'spin 0.7s linear infinite'}}/>
              Loading...
            </div>
          : (pages[page]||inboxPage)
        }
      </div>
      <WtToast toast={toast}/>
    </div>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CFO FINANCE COMMAND CENTRE â€” MENU LIFECYCLE PAGE
// WT360 Universal Design System v1
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•


