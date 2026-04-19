export const SC_CSS = `
/* -- SC layout tokens -- */
:root {
  --sc-ink:#020617;--sc-sub:#64748B;--sc-muted:#94A3B8;
  --sc-faint:rgba(15,23,42,.05);--sc-divider:#F1F5F9;--sc-border:#E2E8F0;
  --sc-card:#ffffff;--sc-bg:#F1F5F9;--sc-app:#F8FAFC;
  --sc-pos:#059669;--sc-pos-bg:rgba(5,150,105,.08);
  --sc-warn:#D97706;--sc-warn-bg:rgba(217,119,6,.08);
  --sc-neg:#DC2626;--sc-neg-bg:rgba(220,38,38,.07);
  --sc-acc:#1558d6;--sc-acc-bg:rgba(21,88,214,.07);
  --sc-violet:#6d28d9;--sc-violet-bg:rgba(109,40,217,.07);
  --sc-teal:#0891b2;--sc-teal-bg:rgba(8,145,178,.07);
  --sc-sb:#1E293B;--sc-sb-hover:#243447;--sc-sb-active:#2d3f52;
  --sc-sb-t:#dde4f2;--sc-sb-sub:#6b789e;--sc-sb-sel:#60a5fa;
  --sc-shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04);
  --sc-shadow-h:0 4px 24px rgba(0,0,0,.10),0 1px 6px rgba(0,0,0,.06);
  --sc-r:14px;--sc-sbw:232px;--sc-sbw-c:58px;
}
.sc-root{display:flex;min-height:100vh;background:var(--sc-bg);font-family:'Inter',-apple-system,sans-serif;font-size:14px;color:var(--sc-ink);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;line-height:1.5;font-feature-settings:'cv02','cv03','cv04','cv11'}
.sc-root *,.sc-root *::before,.sc-root *::after{box-sizing:border-box}
.sc-sb{position:fixed;top:0;left:0;bottom:0;z-index:500;background:var(--sc-sb);display:flex;flex-direction:column;overflow:hidden;transition:width .2s cubic-bezier(.4,0,.2,1);border-right:1px solid rgba(255,255,255,.04)}
.sc-sb.exp{width:var(--sc-sbw)}.sc-sb.col{width:var(--sc-sbw-c)}
.sc-si{display:flex;align-items:center;gap:11px;padding:9px 11px;margin:1px 8px;border-radius:10px;cursor:pointer;color:var(--sc-sb-sub);font-size:13px;font-weight:500;transition:background .12s,color .12s;user-select:none;white-space:nowrap;min-height:38px;position:relative;letter-spacing:-.01em;font-family:'Inter',-apple-system,sans-serif}
.sc-si:hover{background:var(--sc-sb-hover);color:#c8d3ee}
.sc-si.on{background:var(--sc-sb-active);color:var(--sc-sb-sel);font-weight:600;border-left:2px solid var(--sc-sb-sel);padding-left:9px}
.sc-si .sc-badge{background:var(--sc-neg);color:#fff;font-size:9px;font-weight:800;border-radius:100px;padding:1px 5px;line-height:1.7;flex-shrink:0}
.sc-si .sc-badge.w{background:var(--sc-warn)}
.sc-si .dot-b{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:var(--sc-neg)}
.sc-tip-wrap .sc-tip{visibility:hidden;opacity:0;pointer-events:none;position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);background:rgba(10,12,24,.96);color:#dde4f2;font-size:12px;font-weight:500;white-space:nowrap;padding:5px 11px;border-radius:7px;box-shadow:0 2px 10px rgba(0,0,0,.3);z-index:1000;transition:opacity .12s}
.sc-tip-wrap:hover .sc-tip{visibility:visible;opacity:1}
.sc-sep{height:1px;background:rgba(255,255,255,.05);margin:8px 0}
.sc-nav-sec{font-size:9px;color:#404870;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:14px 18px 4px;opacity:.7;white-space:nowrap}
.sc-sb-foot{padding:6px 8px;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:2px;flex-shrink:0}
.sc-hdr{position:sticky;top:0;z-index:300;background:rgba(245,246,248,.9);border-bottom:1px solid var(--sc-border);backdrop-filter:blur(10px)}
.sc-hdr-top{display:flex;align-items:center;justify-content:space-between;padding:0 44px;height:64px;gap:20px}
.sc-hdr-bar{display:flex;align-items:center;gap:8px;padding:0 40px;height:44px;border-top:1px solid var(--sc-divider);background:rgba(245,246,248,.6);overflow-x:auto}
.sc-hdr-bar::-webkit-scrollbar{display:none}
.sc-dpill{padding:5px 13px;border-radius:8px;border:1px solid var(--sc-border);background:transparent;color:var(--sc-sub);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .1s;font-family:'Inter',-apple-system,sans-serif}
.sc-dpill:hover{border-color:var(--sc-acc);color:var(--sc-ink)}
.sc-dpill.on{background:var(--sc-ink);color:#fff;border-color:var(--sc-ink)}
.sc-srch{background:rgba(15,17,23,.05);border:1px solid var(--sc-border);border-radius:9px;padding:8px 14px 8px 34px;font-size:13px;color:var(--sc-ink);width:220px;transition:border-color .15s,width .2s;font-family:'Inter',-apple-system,sans-serif;font-variant-numeric:tabular-nums}
.sc-srch:focus{border-color:var(--sc-acc);outline:none;width:280px}
.sc-srch::placeholder{color:var(--sc-muted)}
.sc-brand-dd{position:relative;flex-shrink:0}
.sc-brand-btn{display:flex;align-items:center;gap:7px;padding:6px 12px;border-radius:9px;border:1px solid var(--sc-border);background:var(--sc-card);color:var(--sc-ink);font-size:12.5px;font-weight:600;cursor:pointer;white-space:nowrap;transition:border-color .12s,box-shadow .12s;font-family:inherit}
.sc-brand-btn:hover{border-color:var(--sc-acc);box-shadow:0 0 0 3px rgba(21,88,214,.07)}
.sc-brand-menu{position:absolute;top:calc(100% + 6px);right:0;min-width:200px;background:var(--sc-card);border:1px solid var(--sc-border);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:400;overflow:hidden;padding:4px}
.sc-brand-opt{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-radius:8px;font-size:13px;font-weight:500;color:var(--sc-ink);transition:background .08s}
.sc-brand-opt:hover{background:var(--sc-faint)}
.sc-brand-opt.on{background:var(--sc-acc-bg);color:var(--sc-acc);font-weight:700}
.sc-status-bar{display:flex;align-items:center;gap:12px;padding:7px 44px;background:var(--sc-card);border-bottom:1px solid var(--sc-divider);font-size:11.5px}
.sc-live-dot{width:7px;height:7px;border-radius:50%;background:var(--sc-pos);flex-shrink:0;position:relative}
.sc-live-dot::after{content:'';position:absolute;inset:0;border-radius:50%;background:var(--sc-pos);animation:scPulse 2.2s ease infinite}
@keyframes scPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(2);opacity:0}}
.sc-status-dot{width:1px;height:12px;background:var(--sc-divider)}
.sc-card{background:var(--sc-card);border:1px solid var(--sc-border);border-radius:var(--sc-r);box-shadow:var(--sc-shadow)}
.sc-card-h{transition:box-shadow .16s,transform .14s,border-color .14s;cursor:pointer}
.sc-card-h:hover{box-shadow:var(--sc-shadow-h);transform:translateY(-2px);border-color:rgba(21,88,214,.18)}
.sc-kpi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:28px}
@media(max-width:1280px){.sc-kpi-grid{grid-template-columns:repeat(3,1fr)}}
.sc-kpi{padding:22px 26px 24px;border-radius:16px;background:var(--sc-card);border:1px solid var(--sc-border);border-top:3px solid var(--sc-acc);box-shadow:var(--sc-shadow);cursor:pointer;transition:box-shadow .16s,transform .14s,border-color .14s;position:relative;display:flex;flex-direction:column;gap:12px;min-height:128px}
.sc-kpi:hover{box-shadow:var(--sc-shadow-h);transform:translateY(-2px)}
.sc-kpi.alert-r{border-color:rgba(196,29,29,.22);border-top-color:var(--sc-neg);background:linear-gradient(140deg,rgba(196,29,29,.03) 0%,var(--sc-card) 60%)}
.sc-kpi.alert-o{border-color:rgba(180,83,9,.18);border-top-color:var(--sc-warn);background:linear-gradient(140deg,rgba(180,83,9,.03) 0%,var(--sc-card) 60%)}
.sc-kpi-num{font-size:36px;font-weight:700;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums}
.sc-kpi-num.c-pos{color:var(--sc-pos)}.sc-kpi-num.c-neg{color:var(--sc-neg)}.sc-kpi-num.c-warn{color:var(--sc-warn)}.sc-kpi-num.c-acc{color:var(--sc-acc)}.sc-kpi-num.c-muted{color:var(--sc-muted)}
.sc-kpi-label{font-size:13px;font-weight:700;color:var(--sc-ink);letter-spacing:-.01em}
.sc-kpi-sub{font-size:11.5px;color:var(--sc-sub);line-height:1.4}
.sc-kpi-ico{position:absolute;right:22px;top:22px;opacity:.06}
.sc-panel{background:var(--sc-card);border:1px solid var(--sc-border);border-radius:var(--sc-r);box-shadow:var(--sc-shadow);overflow:hidden;margin-bottom:20px}
.sc-ph{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--sc-divider)}
.sc-pt{font-size:14px;font-weight:600;color:var(--sc-ink);letter-spacing:-.01em}
.sc-ps{font-size:11.5px;color:var(--sc-muted);margin-top:2px}
.sc-pb{padding:22px 24px}
.sc-g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.sc-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.sc-tbl{border-collapse:collapse;width:100%;font-size:13px}
.sc-tbl th{padding:10px 18px;text-align:left;font-weight:700;font-size:10.5px;color:var(--sc-muted);white-space:nowrap;background:var(--sc-bg);border-bottom:1px solid var(--sc-divider);letter-spacing:.06em;text-transform:uppercase}
.sc-tbl td{padding:12px 18px;color:var(--sc-ink);border-bottom:1px solid var(--sc-divider);vertical-align:middle;font-variant-numeric:tabular-nums;font-family:'Inter',-apple-system,sans-serif}
.sc-tbl tr:last-child td{border-bottom:none}
.sc-tbl tbody tr{transition:background .08s;cursor:pointer}
.sc-tbl tbody tr:hover{background:rgba(15,17,23,.025)}
.sp{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:100px;font-size:11px;font-weight:600;white-space:nowrap;flex-shrink:0}
.sp-r{background:var(--sc-neg-bg);color:var(--sc-neg)}
.sp-o{background:var(--sc-warn-bg);color:var(--sc-warn)}
.sp-g{background:var(--sc-pos-bg);color:var(--sc-pos)}
.sp-b{background:var(--sc-acc-bg);color:var(--sc-acc)}
.sp-v{background:var(--sc-violet-bg);color:var(--sc-violet)}
.sp-t{background:var(--sc-teal-bg);color:var(--sc-teal)}
.sp-x{background:var(--sc-faint);color:var(--sc-sub)}
.sc-tag{display:inline-flex;align-items:center;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
.st-unk{background:#fef3c7;color:#92400e}
.st-price{background:#fee2e2;color:#991b1b}
.st-uom{background:#ede9fe;color:#5b21b6}
.st-vendor{background:#dbeafe;color:#1e40af}
.sc-sev{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0}
.sev-h{background:var(--sc-neg)}.sev-m{background:var(--sc-warn)}.sev-l{background:var(--sc-pos)}
.sc-btn{display:inline-flex;align-items:center;gap:6px;padding:7px 15px;border-radius:9px;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .14s;border:none;font-family:inherit;white-space:nowrap}
.sc-btn-p{background:var(--sc-acc);color:#fff}.sc-btn-p:hover{background:#1248b8}
.sc-btn-g{background:var(--sc-faint);color:var(--sc-ink);border:1px solid var(--sc-border)}.sc-btn-g:hover{background:var(--sc-divider)}
.sc-btn-d{background:var(--sc-neg-bg);color:var(--sc-neg);border:1px solid rgba(196,29,29,.12)}.sc-btn-d:hover{background:rgba(196,29,29,.12)}
.sc-btn-w{background:var(--sc-warn-bg);color:var(--sc-warn);border:1px solid rgba(180,83,9,.12)}.sc-btn-w:hover{background:rgba(180,83,9,.12)}
.sc-btn-sm{padding:5px 11px;font-size:12px}
.sc-fc{padding:5px 12px;border-radius:8px;border:1px solid var(--sc-border);background:transparent;color:var(--sc-sub);font-size:12px;font-weight:500;cursor:pointer;transition:all .1s;font-family:inherit}
.sc-fc:hover{border-color:var(--sc-acc);color:var(--sc-ink)}
.sc-fc.on{background:var(--sc-ink);color:#fff;border-color:var(--sc-ink)}
.sc-filter-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:20px}
.sc-tab-row{display:flex;gap:2px;padding:4px;background:var(--sc-bg);border-radius:10px;margin-bottom:20px;width:fit-content}
.sc-tab{padding:7px 16px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;color:var(--sc-sub);transition:all .12s;white-space:nowrap}
.sc-tab.on{background:var(--sc-card);color:var(--sc-ink);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.sc-ib{background:var(--sc-bg);border-radius:10px;padding:14px 16px}
.sc-ib-l{font-size:10px;font-weight:700;color:var(--sc-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
.sc-ib-v{font-size:13.5px;font-weight:600;color:var(--sc-ink)}
.sc-overlay{position:fixed;top:108px;left:var(--sc-overlay-left,232px);right:0;bottom:0;background:rgba(7,10,20,.4);z-index:900;display:flex;align-items:flex-start;justify-content:center;padding:24px 40px 40px 40px}
.sc-dp{background:var(--sc-card);border-radius:18px;width:100%;max-height:calc(100vh - 148px);display:flex;flex-direction:column;box-shadow:0 32px 96px rgba(0,0,0,.28),0 4px 16px rgba(0,0,0,.12);overflow:hidden}
.sc-dp-hdr{padding:22px 24px;border-bottom:1px solid var(--sc-divider);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;gap:16px}
.sc-dp-close{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:10px;border:1.5px solid var(--sc-border);background:var(--sc-bg);cursor:pointer;transition:background .1s,border-color .1s,box-shadow .1s;flex-shrink:0}
.sc-dp-close:hover{background:#fff;border-color:var(--sc-sub);box-shadow:0 2px 8px rgba(0,0,0,.10)}
.sc-dp-body{padding:28px;overflow-y:auto;flex:1}
.sc-flow{display:flex;align-items:flex-start;gap:0}
.sc-flow-stage{flex:1;display:flex;flex-direction:column;align-items:center;gap:0;min-width:0;padding:0 4px}
.sc-flow-n{font-size:32px;font-weight:800;letter-spacing:-.04em;line-height:1}
.sc-flow-l{font-size:10.5px;font-weight:600;color:var(--sc-sub);text-align:center;margin-top:5px;line-height:1.3}
.sc-flow-sep{color:var(--sc-border);font-size:18px;align-self:flex-start;margin-top:6px;flex-shrink:0}
.sc-wbar-bg{height:5px;background:var(--sc-divider);border-radius:3px;overflow:hidden;flex:1}
.sc-wbar-fill{height:100%;border-radius:3px;transition:width .5s cubic-bezier(.4,0,.2,1)}
.sc-rep-nav{width:220px;flex-shrink:0;background:var(--sc-card);border:1px solid var(--sc-border);border-radius:var(--sc-r);overflow:hidden;position:sticky;top:20px;max-height:calc(100vh - 140px);display:flex;flex-direction:column}
.sc-rep-sec{font-size:9.5px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--sc-muted);padding:14px 16px 4px}
.sc-rep-item{display:flex;align-items:center;gap:10px;padding:9px 16px;cursor:pointer;transition:background .1s;color:var(--sc-sub);font-size:12.5px;font-weight:500;border-radius:8px;margin:0 4px 1px}
.sc-rep-item:hover{background:var(--sc-faint);color:var(--sc-ink)}
.sc-rep-item.on{background:var(--sc-acc-bg);color:var(--sc-acc);font-weight:600}
.sc-empty{padding:48px;text-align:center;color:var(--sc-muted)}
.sc-main{flex:1;overflow-y:auto;padding:36px 48px 100px}
.sc-page{max-width:1440px;margin:0 auto}
@keyframes scFadeUp{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:none}}
.sc-fu{animation:scFadeUp .28s ease both}
.sc-d1{animation-delay:.04s}.sc-d2{animation-delay:.08s}.sc-d3{animation-delay:.12s}.sc-d4{animation-delay:.16s}.sc-d5{animation-delay:.2s}.sc-d6{animation-delay:.24s}
`;
