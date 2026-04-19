export const CC_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   WT360 UNIFIED DESIGN TOKEN SYSTEM â€” PHASE 0
   Additive only. Existing rules below are untouched.
   All tokens prefixed --wt- to avoid collisions with existing --var names.
   Migration order: RM CC â†’ Finance CC â†’ SC CC â†’ HR CC (built fresh)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
:root {

  /* â”€â”€ Z-INDEX SCALE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Replaces: hardcoded 20/50/300/400/500/800/900/1000/2000 scattered
     across all CCs. Use these going forward, never raw values.        */
  --wt-z-base:      1;
  --wt-z-dropdown:  400;
  --wt-z-header:    300;
  --wt-z-sidebar:   500;
  --wt-z-overlay:   800;
  --wt-z-modal:     900;
  --wt-z-tooltip:   1000;
  --wt-z-toast:     2000;

  /* â”€â”€ SURFACE / COLOR FOUNDATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Neutral base shared across all CCs.
     Matches existing --app / --bg / --card / --border values exactly
     so migrated components are visually identical during transition.  */
  --wt-app:         #F8FAFC;
  --wt-bg:          #F1F5F9;
  --wt-surface:     #ffffff;
  --wt-surface-raised: #ffffff;
  --wt-border:      #E2E8F0;
  --wt-divider:     #F1F5F9;
  --wt-faint:       rgba(15,23,42,0.05);

  /* â”€â”€ TEXT HIERARCHY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  --wt-ink:         #020617;
  --wt-sub:         #64748B;
  --wt-muted:       #94A3B8;

  /* â”€â”€ SEMANTIC COLORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  --wt-pos:         #15803d;
  --wt-pos-bg:      rgba(21,128,61,0.08);
  --wt-warn:        #b45309;
  --wt-warn-bg:     rgba(180,83,9,0.08);
  --wt-neg:         #DC2626;
  --wt-neg-bg:      rgba(220,38,38,0.07);
  --wt-acc:         #0369A1;
  --wt-acc-bg:      rgba(3,105,161,0.07);
  --wt-violet:      #6d28d9;
  --wt-violet-bg:   rgba(109,40,217,0.07);
  --wt-teal:        #0891b2;
  --wt-teal-bg:     rgba(8,145,178,0.07);

  /* â”€â”€ SIDEBAR TOKENS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  --wt-sb:          #1E293B;
  --wt-sb-hover:    #161829;
  --wt-sb-active:   #1e2038;
  --wt-sb-text:     #eef0f8;
  --wt-sb-sub:      #7c84ad;
  --wt-sb-sel:      #5ab4ff;
  --wt-sb-dim:      #404870;
  --wt-sb-border:   rgba(255,255,255,0.05);
  --wt-sbw:         228px;
  --wt-sbw-col:     58px;

  /* â”€â”€ TYPOGRAPHY SCALE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  --wt-f:           'Inter',-apple-system,sans-serif;
  --wt-text-display:  32px;   /* KPI numbers, hero metrics            */
  --wt-text-heading:  22px;   /* Page section headings                */
  --wt-text-title:    16px;   /* Card titles, panel titles            */
  --wt-text-body:     14px;   /* Primary body / default               */
  --wt-text-body-sm:  13px;   /* Dense tables, secondary content      */
  --wt-text-caption:  11px;   /* Labels, metadata, uppercase headers  */
  --wt-text-badge:    10.5px; /* Badge text                           */
  --wt-text-micro:    10px;   /* Timestamps, fine print               */

  /* â”€â”€ SPACING SCALE (4/8-based) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  --wt-sp-1:   4px;
  --wt-sp-2:   8px;
  --wt-sp-3:   12px;
  --wt-sp-4:   16px;
  --wt-sp-5:   20px;
  --wt-sp-6:   24px;
  --wt-sp-8:   32px;
  --wt-sp-10:  40px;
  --wt-sp-12:  48px;

  /* â”€â”€ RADIUS SCALE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  --wt-r-xs:   6px;
  --wt-r-sm:   8px;
  --wt-r-md:   10px;
  --wt-r-lg:   14px;
  --wt-r-xl:   18px;
  --wt-r-pill: 100px;

  /* â”€â”€ SHADOW SCALE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  --wt-shadow-sm:  0 1px 3px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04);
  --wt-shadow-md:  0 1px 4px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
  --wt-shadow-lg:  0 4px 20px rgba(0,0,0,.10), 0 1px 6px rgba(0,0,0,.06);
  --wt-shadow-xl:  0 32px 96px rgba(0,0,0,.20), 0 4px 24px rgba(0,0,0,.10);
  --wt-shadow-modal: 0 32px 100px rgba(0,0,0,.22), 0 4px 24px rgba(0,0,0,.10);

  /* â”€â”€ MODAL / OVERLAY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  --wt-overlay-bg:  rgba(0,0,0,0.45);
  --wt-modal-r:     18px;

  /* â”€â”€ TRANSITION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  --wt-t-fast:   0.10s ease;
  --wt-t-base:   0.15s ease;
  --wt-t-slow:   0.20s cubic-bezier(0.4,0,0.2,1);

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   END WT360 DESIGN TOKENS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

:root{
  --app:#F8FAFC;--bg:#F1F5F9;--card:#ffffff;--border:#E2E8F0;--divider:#F1F5F9;
  --ink:#020617;--sub:#64748B;--muted:#94A3B8;--faint:rgba(15,23,42,0.05);
  --pos:#059669;--pos-bg:rgba(5,150,105,0.08);
  --warn:#D97706;--warn-bg:rgba(217,119,6,0.08);
  --neg:#DC2626;--neg-bg:rgba(220,38,38,0.07);
  --acc:#0369A1;--acc-bg:rgba(3,105,161,0.07);
  --sb:#1E293B;--sb-hover:#243447;--sb-active:#2d3f52;
  --sb-t:#eef0f8;--sb-sub:#7c84ad;--sb-sel:#5ab4ff;--sb-dim:#404870;
  --sb-border:rgba(255,255,255,0.05);
  --card-shadow:0 1px 4px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.04);
  --card-shadow-hover:0 4px 20px rgba(0,0,0,.10),0 1px 6px rgba(0,0,0,.06);
  --sbw:228px;--sbw-col:58px;--cr:14px;--f:'Inter',-apple-system,sans-serif;
}
body{font-family:var(--f);font-size:14px;color:var(--ink);background:var(--bg);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;line-height:1.5;font-feature-settings:'cv02','cv03','cv04','cv11'}
button,input,select,textarea{font-family:var(--f)}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:var(--divider);border-radius:3px}
.sb-wrap{position:fixed;top:0;left:0;bottom:0;z-index:500;background:var(--sb);border-right:1px solid var(--sb-border);display:flex;flex-direction:column;overflow:hidden;transition:width 0.20s cubic-bezier(0.4,0,0.2,1)}
.sb-wrap.exp{width:var(--sbw)}.sb-wrap.col{width:var(--sbw-col)}
.sb-foot{padding:6px 8px;border-top:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;gap:2px;flex-shrink:0}
.si{display:flex;align-items:center;gap:11px;padding:9px 11px;margin:1px 8px;border-radius:11px;cursor:pointer;color:var(--sb-sub);font-size:13px;font-weight:500;transition:background .12s,color .12s;user-select:none;white-space:nowrap;min-height:38px;position:relative;letter-spacing:-0.01em}
.si:hover{background:var(--sb-hover);color:#d4d8ef}.si.active{background:var(--sb-active);color:var(--sb-sel);font-weight:600;border-left:2px solid var(--sb-sel);padding-left:9px}
.si .si-badge{background:var(--neg);color:#fff;font-size:9px;font-weight:800;border-radius:100px;padding:1px 5px;line-height:1.7;flex-shrink:0}
.si .si-badge.warn{background:var(--warn)}.si .dot-badge{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:var(--neg)}
.ss{display:flex;align-items:center;gap:9px;padding:6px 10px 6px 38px;margin:1px 8px;border-radius:9px;cursor:pointer;color:var(--sb-dim);font-size:12px;font-weight:400;transition:background .1s,color .1s;white-space:nowrap;user-select:none;letter-spacing:-0.005em}
.ss:hover{background:var(--sb-hover);color:#cdd0e4}.ss.active{background:var(--sb-active);color:var(--sb-sel);font-weight:500}
.sb-section{font-size:9px;color:var(--sb-dim);font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:14px 18px 4px;opacity:0.6}
.si-tip .tip{visibility:hidden;opacity:0;pointer-events:none;position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);background:rgba(14,16,30,0.95);color:#e8ecff;font-size:12px;font-weight:500;white-space:nowrap;padding:5px 11px;border-radius:7px;box-shadow:0 2px 10px rgba(0,0,0,0.3);transition:opacity .14s;z-index:1000}
.si-tip:hover .tip{visibility:visible;opacity:1}
.card{background:var(--card);border:1px solid var(--border);border-radius:var(--cr);box-shadow:var(--card-shadow)}
.card-hover{transition:box-shadow .18s,transform .15s;cursor:pointer}.card-hover:hover{box-shadow:var(--card-shadow-hover);transform:translateY(-2px)}
.kpi-row{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--divider);min-height:40px;gap:12px}.kpi-strip-card{background:var(--card);border:1px solid rgba(0,0,0,.08);border-top:3px solid var(--acc);border-radius:14px;padding:16px 20px;flex:1;min-width:0}.kpi-strip-card.neg{border-top-color:var(--neg)}.kpi-strip-card.warn{border-top-color:var(--warn)}.kpi-strip-card.pos{border-top-color:var(--pos)}.kpi-row:last-child{border-bottom:none}
.badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:100px;font-size:10.5px;font-weight:700;white-space:nowrap;letter-spacing:0.01em}
.badge-r{background:var(--neg-bg);color:var(--neg)}.badge-o{background:var(--warn-bg);color:var(--warn)}
.badge-g{background:var(--pos-bg);color:#15803d}.badge-b{background:var(--acc-bg);color:var(--acc)}.badge-x{background:var(--faint);color:var(--sub)}
.hdr-wrap{position:sticky;top:0;z-index:300;background:var(--app);border-bottom:1px solid var(--border);backdrop-filter:blur(8px)}
.hdr-row1{display:flex;align-items:center;justify-content:space-between;padding:0 44px;height:64px;gap:20px}
.hdr-row2{display:flex;align-items:center;gap:10px;padding:0 40px;height:46px;border-top:1px solid var(--divider);background:var(--bg);overflow-x:auto;position:relative}
.hdr-row2::-webkit-scrollbar{display:none}
.date-pill{padding:5px 13px;border-radius:8px;border:1px solid var(--border);background:var(--app);color:var(--sub);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .1s}
.date-pill:hover{border-color:var(--acc);color:var(--ink)}.date-pill.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.sev-pill{padding:5px 13px;border-radius:100px;border:1px solid var(--border);background:var(--app);color:var(--sub);font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .1s}
.sev-pill.on-all{background:var(--ink);color:#fff;border-color:var(--ink)}
.sev-pill.on-crit{background:var(--neg);color:#fff;border-color:var(--neg)}.sev-pill.on-warn{background:var(--warn);color:#fff;border-color:var(--warn)}.sev-pill.on-stab{background:var(--pos);color:#fff;border-color:var(--pos)}
.brand-chip{display:flex;align-items:center;gap:7px;padding:5px 12px;border-radius:8px;border:1px solid var(--border);background:var(--app);font-size:12.5px;font-weight:500;color:var(--ink);cursor:pointer;white-space:nowrap;flex-shrink:0;transition:border-color .1s}
.brand-chip:hover{border-color:var(--acc)}
.g-search{background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:8px 14px 8px 36px;font-size:13px;color:var(--ink);width:230px;transition:border-color .15s,width .2s}
.g-search:focus{border-color:var(--acc);outline:none;width:290px}.g-search::placeholder{color:var(--muted)}
.icon-btn{width:36px;height:36px;border-radius:9px;border:1px solid var(--border);background:var(--app);display:flex;align-items:center;justify-content:center;color:var(--sub);cursor:pointer;position:relative;flex-shrink:0;transition:border-color .12s,color .12s}
.icon-btn:hover{border-color:var(--acc);color:var(--ink)}
@keyframes drop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.notif-panel{animation:drop .16s ease both;position:absolute;top:calc(100% + 8px);right:0;width:360px;z-index:900;background:var(--app);border:1px solid var(--border);border-radius:14px;box-shadow:0 8px 40px rgba(0,0,0,.10);overflow:hidden}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes drawLine{from{stroke-dashoffset:700}to{stroke-dashoffset:0}}
@keyframes livePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.9);opacity:0}}
@keyframes spin{to{transform:rotate(360deg)}}
.fade-up{animation:fadeUp .32s ease both}
.d1{animation-delay:.04s}.d2{animation-delay:.08s}.d3{animation-delay:.12s}.d4{animation-delay:.16s}.d5{animation-delay:.20s}
.draw-line{stroke-dasharray:700;animation:drawLine 1.4s cubic-bezier(.4,0,.2,1) both}
.live-dot{position:relative;display:inline-flex;align-items:center;justify-content:center;width:8px;height:8px}
.live-dot::after{content:'';position:absolute;inset:0;border-radius:50%;background:var(--pos);animation:livePulse 2.2s ease infinite}
.live-dot-inner{width:8px;height:8px;border-radius:50%;background:var(--pos);position:relative;z-index:1}
.rh{transition:background .1s;cursor:pointer}.rh:hover{background:rgba(28,29,32,.03);border-radius:8px}
.main-content{flex:1;overflow-y:auto;padding:40px 48px 100px}
.page-max{max-width:1440px;margin:0 auto;position:relative}
.sb-sep{height:1px;background:rgba(255,255,255,.05);margin:8px 0}
.data-table{border-collapse:collapse;width:100%;font-size:13px}
.data-table th{padding:10px 16px;text-align:left;font-weight:600;font-size:10.5px;color:var(--muted);white-space:nowrap;background:var(--bg);border-bottom:1px solid var(--divider);letter-spacing:0.06em;text-transform:uppercase}
.data-table td{padding:11px 16px;color:var(--ink);border-bottom:1px solid var(--divider);vertical-align:middle;font-variant-numeric:tabular-nums}
.data-table tr:last-child td{border-bottom:none}.data-table tbody tr:hover{background:rgba(17,19,24,.025)}
.cmp-label{font-size:11px;color:var(--muted);font-style:italic;white-space:nowrap;flex-shrink:0}
/* Calendar picker - single month */
.cal-panel{position:absolute;top:calc(100% + 6px);left:0;z-index:900;background:var(--app);border:1px solid var(--border);border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,0.12);padding:20px;min-width:360px;animation:drop .16s ease both}
.cal-day{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12.5px;cursor:pointer;transition:background .1s,color .1s;user-select:none;position:relative}
.cal-day:hover:not(.disabled){background:var(--faint)}
.cal-day.sel-start{background:var(--acc);color:#fff;font-weight:700;border-radius:8px 0 0 8px}
.cal-day.sel-end{background:var(--acc);color:#fff;font-weight:700;border-radius:0 8px 8px 0}
.cal-day.sel-single{background:var(--acc);color:#fff;font-weight:700;border-radius:8px}
.cal-day.in-range{background:var(--acc-bg);color:var(--acc);border-radius:0}
.cal-day.today:not(.sel-start):not(.sel-end):not(.sel-single){font-weight:700;color:var(--acc)}
.cal-day.other-month{color:var(--muted)}.cal-day.disabled{opacity:.3;cursor:default}
/* Search results dropdown */
.search-dropdown{position:absolute;top:calc(100% + 6px);left:0;width:320px;background:var(--app);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12);z-index:800;overflow:hidden;animation:drop .14s ease both}
.search-result-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .1s;border-bottom:1px solid var(--divider)}
.search-result-item:last-child{border-bottom:none}.search-result-item:hover{background:var(--faint)}
/* Dark login */
.login-wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0c1220;position:relative;overflow:hidden}
.login-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.login-card{background:rgba(12,18,32,0.72);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,0.09);border-radius:18px;padding:44px 40px;width:390px;box-shadow:0 24px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.06);position:relative;z-index:1}

.login-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:11px 15px;font-size:14px;color:#f0f1f6;outline:none;transition:border-color .15s;margin-bottom:12px}
.login-input:focus{border-color:rgba(107,195,255,0.5)}.login-input::placeholder{color:rgba(255,255,255,0.25)}
.login-btn{width:100%;padding:12px;border-radius:10px;border:none;background:var(--acc);color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s}
.login-btn:hover{opacity:.88}.login-btn:disabled{opacity:.4;cursor:not-allowed}
.spinner{width:32px;height:32px;border:3px solid var(--divider);border-top-color:var(--acc);border-radius:50%;animation:spin 0.7s linear infinite}
.f-select{background:var(--card);border:1px solid var(--border);border-radius:9px;padding:7px 12px;font-size:12.5px;color:var(--ink);cursor:pointer;outline:none;transition:border-color .12s;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.f-select:focus{border-color:var(--acc)}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:800;display:flex;align-items:center;justify-content:center;padding:20px}
.modal-box{background:var(--card);border:1px solid var(--border);border-radius:18px;max-width:680px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 32px 100px rgba(0,0,0,.20),0 4px 24px rgba(0,0,0,.10)}
.form-label{display:block;font-size:11px;font-weight:700;color:var(--muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:0.05em}
.form-input{width:100%;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:11px 15px;font-size:13.5px;color:var(--ink);outline:none;transition:border-color .15s,box-shadow .15s}
.form-input:focus{border-color:var(--acc);box-shadow:0 0 0 3px rgba(21,88,214,0.10)}.form-input::placeholder{color:var(--muted)}
.tab-btn{padding:10px 20px;border:none;border-bottom:2px solid transparent;background:none;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:color .1s,border-color .1s;margin-bottom:-1px;letter-spacing:-0.01em}
.tab-btn.on{color:var(--acc);border-bottom-color:var(--acc);font-weight:700}
.tab-btn:not(.on){color:var(--sub)}
.tab-btn:not(.on):hover{color:var(--ink)}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   WT360 UNIFIED COMPONENT SYSTEM â€” PHASE 1
   All classes prefixed wt- to avoid collision with existing classes.
   Dormant until Phase 2+ migrates each CC to use them.
   Built on --wt-* tokens defined above.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

/* â”€â”€ SHELL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-root{display:flex;min-height:100vh;background:var(--wt-bg);font-family:var(--wt-f);font-size:var(--wt-text-body);color:var(--wt-ink);-webkit-font-smoothing:antialiased;line-height:1.5}
.wt-root *,.wt-root *::before,.wt-root *::after{box-sizing:border-box}
.wt-main{flex:1;overflow-y:auto;min-width:0}
.wt-page{padding:var(--wt-sp-10) var(--wt-sp-12) 100px;max-width:1440px;margin:0 auto;position:relative}

/* â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-sb{position:fixed;top:0;left:0;bottom:0;z-index:var(--wt-z-sidebar);background:var(--wt-sb);display:flex;flex-direction:column;overflow:hidden;transition:width var(--wt-t-slow);border-right:1px solid var(--wt-sb-border)}
.wt-sb.exp{width:var(--wt-sbw)}.wt-sb.col{width:var(--wt-sbw-col)}
.wt-sb-logo{display:flex;align-items:center;gap:10px;padding:20px 16px 16px;flex-shrink:0}
.wt-sb-sep{height:1px;background:rgba(255,255,255,.05);margin:6px 0;flex-shrink:0}
.wt-sb-sec{font-size:9px;color:var(--wt-sb-dim);font-weight:700;letter-spacing:0.12em;text-transform:uppercase;padding:14px 18px 4px;opacity:.65;white-space:nowrap}
.wt-si{display:flex;align-items:center;gap:11px;padding:9px 11px;margin:1px 8px;border-radius:var(--wt-r-md);cursor:pointer;color:var(--wt-sb-sub);font-size:var(--wt-text-body-sm);font-weight:500;transition:background var(--wt-t-fast),color var(--wt-t-fast);user-select:none;white-space:nowrap;min-height:38px;position:relative;letter-spacing:-.01em}
.wt-si:hover{background:var(--wt-sb-hover);color:#d4d8ef}
.wt-si.on{background:var(--wt-sb-active);color:var(--wt-sb-sel);font-weight:600}
.wt-si-badge{background:var(--wt-neg);color:#fff;font-size:9px;font-weight:800;border-radius:var(--wt-r-pill);padding:1px 5px;line-height:1.7;flex-shrink:0}
.wt-si-badge.warn{background:var(--wt-warn)}
.wt-si-dot{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:var(--wt-neg)}
/* Collapsed tooltip */
.wt-si-tip{position:absolute;left:calc(100% + 10px);top:50%;transform:translateY(-50%);background:rgba(14,16,30,.95);color:#e8ecff;font-size:12px;font-weight:500;white-space:nowrap;padding:5px 11px;border-radius:var(--wt-r-sm);box-shadow:0 2px 10px rgba(0,0,0,.3);z-index:var(--wt-z-tooltip);pointer-events:none;opacity:0;visibility:hidden;transition:opacity var(--wt-t-fast)}
.wt-si:hover .wt-si-tip{opacity:1;visibility:visible}

/* â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-hdr{position:sticky;top:0;z-index:var(--wt-z-header);background:rgba(250,251,252,.92);border-bottom:1px solid var(--wt-border);backdrop-filter:blur(10px)}
.wt-hdr-top{display:flex;align-items:center;justify-content:space-between;padding:0 var(--wt-sp-12);height:64px;gap:var(--wt-sp-5)}
.wt-hdr-bar{display:flex;align-items:center;gap:var(--wt-sp-2);padding:0 var(--wt-sp-10);height:44px;border-top:1px solid var(--wt-divider);overflow-x:auto}
.wt-hdr-bar::-webkit-scrollbar{display:none}
.wt-page-title{font-size:var(--wt-text-body);font-weight:700;color:var(--wt-ink);letter-spacing:-.01em}
.wt-page-sub{font-size:var(--wt-text-body-sm);color:var(--wt-muted);margin-top:1px}

/* â”€â”€ CARDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-card{background:var(--wt-surface);border:1px solid var(--wt-border);border-radius:var(--wt-r-lg);box-shadow:var(--wt-shadow-md)}
.wt-card-h{transition:box-shadow var(--wt-t-base),transform var(--wt-t-base),border-color var(--wt-t-base);cursor:pointer}
.wt-card-h:hover{box-shadow:var(--wt-shadow-lg);transform:translateY(-2px);border-color:rgba(21,88,214,.16)}
.wt-panel{background:var(--wt-surface);border:1px solid var(--wt-border);border-radius:var(--wt-r-lg);box-shadow:var(--wt-shadow-md);overflow:hidden;margin-bottom:var(--wt-sp-5)}
.wt-ph{display:flex;align-items:center;justify-content:space-between;padding:var(--wt-sp-4) var(--wt-sp-6);border-bottom:1px solid var(--wt-divider)}
.wt-pt{font-size:var(--wt-text-body);font-weight:700;color:var(--wt-ink);letter-spacing:-.01em}
.wt-ps{font-size:var(--wt-text-caption);color:var(--wt-muted);margin-top:2px}
.wt-pb{padding:var(--wt-sp-5) var(--wt-sp-6)}

/* KPI Card */
.wt-kpi{padding:var(--wt-sp-6);border-radius:var(--wt-r-xl);background:var(--wt-surface);border:1px solid var(--wt-border);box-shadow:var(--wt-shadow-md);cursor:pointer;transition:box-shadow var(--wt-t-base),transform var(--wt-t-base),border-color var(--wt-t-base);position:relative;overflow:hidden;display:flex;flex-direction:column;gap:var(--wt-sp-3);min-height:120px}
.wt-kpi:hover{box-shadow:var(--wt-shadow-lg);transform:translateY(-2px)}
.wt-kpi.alert-r{border-color:rgba(196,29,29,.20);background:linear-gradient(140deg,rgba(196,29,29,.025) 0%,var(--wt-surface) 60%)}
.wt-kpi.alert-o{border-color:rgba(180,83,9,.16);background:linear-gradient(140deg,rgba(180,83,9,.025) 0%,var(--wt-surface) 60%)}
.wt-kpi-num{font-size:var(--wt-text-display);font-weight:800;letter-spacing:-.04em;line-height:1}
.wt-kpi-num.pos{color:var(--wt-pos)}.wt-kpi-num.neg{color:var(--wt-neg)}.wt-kpi-num.warn{color:var(--wt-warn)}.wt-kpi-num.acc{color:var(--wt-acc)}.wt-kpi-num.muted{color:var(--wt-muted)}
.wt-kpi-label{font-size:var(--wt-text-body-sm);font-weight:700;color:var(--wt-ink);letter-spacing:-.01em}
.wt-kpi-sub{font-size:var(--wt-text-caption);color:var(--wt-sub);line-height:1.4}
.wt-kpi-ico{position:absolute;right:20px;top:20px;opacity:.06}
.wt-kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:var(--wt-sp-4)}

/* â”€â”€ TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-tbl-wrap{overflow-x:auto;border-radius:var(--wt-r-lg);border:1px solid var(--wt-border)}
.wt-tbl{border-collapse:collapse;width:100%;font-size:var(--wt-text-body-sm);background:var(--wt-surface)}
.wt-tbl th{padding:10px var(--wt-sp-4);text-align:left;font-weight:700;font-size:var(--wt-text-badge);color:var(--wt-muted);white-space:nowrap;background:var(--wt-bg);border-bottom:1px solid var(--wt-divider);letter-spacing:.06em;text-transform:uppercase;position:sticky;top:0;z-index:var(--wt-z-base)}
.wt-tbl th.r{text-align:right}
.wt-tbl td{padding:11px var(--wt-sp-4);color:var(--wt-ink);border-bottom:1px solid var(--wt-divider);vertical-align:middle}
.wt-tbl td.r{text-align:right;font-variant-numeric:tabular-nums}
.wt-tbl td.muted{color:var(--wt-sub);font-size:var(--wt-text-body-sm)}
.wt-tbl tr:last-child td{border-bottom:none}
.wt-tbl tbody tr{transition:background var(--wt-t-fast)}
.wt-tbl tbody tr.clickable{cursor:pointer}
.wt-tbl tbody tr.clickable:hover{background:rgba(17,19,24,.025)}
/* Empty state inside table */
.wt-tbl-empty{padding:56px 24px;text-align:center;color:var(--wt-muted);font-size:var(--wt-text-body-sm)}
/* Skeleton row */
.wt-tbl-skel td{padding:13px var(--wt-sp-4)}
.wt-skel{background:linear-gradient(90deg,var(--wt-faint) 25%,rgba(17,19,24,.10) 50%,var(--wt-faint) 75%);background-size:400% 100%;animation:wtSkel 1.4s ease infinite;border-radius:var(--wt-r-sm);height:12px;display:inline-block}
@keyframes wtSkel{0%{background-position:100% 50%}100%{background-position:0% 50%}}

/* â”€â”€ BADGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:var(--wt-r-pill);font-size:var(--wt-text-badge);font-weight:700;white-space:nowrap;letter-spacing:.01em;flex-shrink:0}
.wt-badge-r{background:var(--wt-neg-bg);color:var(--wt-neg)}
.wt-badge-o{background:var(--wt-warn-bg);color:var(--wt-warn)}
.wt-badge-g{background:var(--wt-pos-bg);color:var(--wt-pos)}
.wt-badge-b{background:var(--wt-acc-bg);color:var(--wt-acc)}
.wt-badge-v{background:var(--wt-violet-bg);color:var(--wt-violet)}
.wt-badge-t{background:var(--wt-teal-bg);color:var(--wt-teal)}
.wt-badge-x{background:var(--wt-faint);color:var(--wt-sub)}

/* â”€â”€ BUTTONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border-radius:var(--wt-r-md);font-size:var(--wt-text-body-sm);font-weight:600;cursor:pointer;transition:all var(--wt-t-base);border:none;font-family:var(--wt-f);white-space:nowrap;padding:8px var(--wt-sp-4);height:36px;flex-shrink:0}
.wt-btn:disabled{opacity:.45;cursor:not-allowed;pointer-events:none}
/* Sizes */
.wt-btn-sm{padding:5px 11px;height:30px;font-size:var(--wt-text-badge);border-radius:var(--wt-r-sm)}
.wt-btn-lg{padding:10px var(--wt-sp-5);height:42px;font-size:var(--wt-text-body)}
/* Variants */
.wt-btn-p{background:var(--wt-acc);color:#fff}.wt-btn-p:hover:not(:disabled){background:#1248b8;box-shadow:0 2px 8px rgba(21,88,214,.28)}
.wt-btn-s{background:var(--wt-faint);color:var(--wt-ink);border:1px solid var(--wt-border)}.wt-btn-s:hover:not(:disabled){background:var(--wt-divider)}
.wt-btn-g{background:transparent;color:var(--wt-sub);border:1px solid var(--wt-border)}.wt-btn-g:hover:not(:disabled){border-color:var(--wt-acc);color:var(--wt-ink)}
.wt-btn-d{background:var(--wt-neg-bg);color:var(--wt-neg);border:1px solid rgba(196,29,29,.12)}.wt-btn-d:hover:not(:disabled){background:rgba(196,29,29,.13)}
.wt-btn-w{background:var(--wt-warn-bg);color:var(--wt-warn);border:1px solid rgba(180,83,9,.12)}.wt-btn-w:hover:not(:disabled){background:rgba(180,83,9,.13)}
/* Loading spinner inside button */
.wt-btn-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:wtSpin .65s linear infinite;flex-shrink:0}
.wt-btn-spin.dark{border:2px solid var(--wt-divider);border-top-color:var(--wt-acc)}
@keyframes wtSpin{to{transform:rotate(360deg)}}
/* Icon-only button */
.wt-icon-btn{width:36px;height:36px;border-radius:var(--wt-r-md);border:1px solid var(--wt-border);background:var(--wt-surface);display:flex;align-items:center;justify-content:center;color:var(--wt-sub);cursor:pointer;flex-shrink:0;transition:border-color var(--wt-t-fast),color var(--wt-t-fast),box-shadow var(--wt-t-fast)}
.wt-icon-btn:hover{border-color:var(--wt-acc);color:var(--wt-ink);box-shadow:0 0 0 3px var(--wt-acc-bg)}

/* â”€â”€ FILTER BAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-filter-bar{display:flex;align-items:center;gap:var(--wt-sp-2);flex-wrap:wrap;margin-bottom:var(--wt-sp-5)}
.wt-filter-bar-top{display:flex;align-items:center;gap:var(--wt-sp-2);padding:0 var(--wt-sp-10);height:44px;border-top:1px solid var(--wt-divider);overflow-x:auto}
.wt-filter-bar-top::-webkit-scrollbar{display:none}
.wt-pill{padding:5px 13px;border-radius:var(--wt-r-sm);border:1px solid var(--wt-border);background:transparent;color:var(--wt-sub);font-size:12.5px;font-weight:500;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all var(--wt-t-fast);font-family:var(--wt-f)}
.wt-pill:hover{border-color:var(--wt-acc);color:var(--wt-ink)}
.wt-pill.on{background:var(--wt-ink);color:#fff;border-color:var(--wt-ink)}
.wt-pill.on-r{background:var(--wt-neg);color:#fff;border-color:var(--wt-neg)}
.wt-pill.on-o{background:var(--wt-warn);color:#fff;border-color:var(--wt-warn)}
.wt-pill.on-g{background:var(--wt-pos);color:#fff;border-color:var(--wt-pos)}
.wt-pill.on-b{background:var(--wt-acc);color:#fff;border-color:var(--wt-acc)}

/* â”€â”€ SEARCH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-search-wrap{position:relative;flex-shrink:0}
.wt-search{background:var(--wt-faint);border:1px solid var(--wt-border);border-radius:var(--wt-r-md);padding:8px 14px 8px 34px;font-size:var(--wt-text-body-sm);color:var(--wt-ink);width:220px;transition:border-color var(--wt-t-base),width var(--wt-t-slow);font-family:var(--wt-f);outline:none}
.wt-search:focus{border-color:var(--wt-acc);width:280px;box-shadow:0 0 0 3px var(--wt-acc-bg)}
.wt-search::placeholder{color:var(--wt-muted)}
.wt-search-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--wt-muted);pointer-events:none}

/* â”€â”€ FORMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-label{display:block;font-size:var(--wt-text-caption);font-weight:700;color:var(--wt-muted);margin-bottom:5px;text-transform:uppercase;letter-spacing:.05em}
.wt-input{width:100%;background:var(--wt-bg);border:1px solid var(--wt-border);border-radius:var(--wt-r-md);padding:10px var(--wt-sp-4);font-size:var(--wt-text-body-sm);color:var(--wt-ink);outline:none;transition:border-color var(--wt-t-base),box-shadow var(--wt-t-base);font-family:var(--wt-f);line-height:1.5}
.wt-input:focus{border-color:var(--wt-acc);box-shadow:0 0 0 3px var(--wt-acc-bg)}
.wt-input::placeholder{color:var(--wt-muted)}
.wt-input.err{border-color:var(--wt-neg);box-shadow:0 0 0 3px var(--wt-neg-bg)}
.wt-select{width:100%;background:var(--wt-bg);border:1px solid var(--wt-border);border-radius:var(--wt-r-md);padding:10px var(--wt-sp-4);font-size:var(--wt-text-body-sm);color:var(--wt-ink);outline:none;cursor:pointer;transition:border-color var(--wt-t-base);font-family:var(--wt-f)}
.wt-select:focus{border-color:var(--wt-acc);box-shadow:0 0 0 3px var(--wt-acc-bg)}
.wt-field-err{font-size:var(--wt-text-caption);color:var(--wt-neg);margin-top:4px}
.wt-field-help{font-size:var(--wt-text-caption);color:var(--wt-muted);margin-top:4px}
.wt-field-group{margin-bottom:var(--wt-sp-4)}
.wt-required{color:var(--wt-neg);margin-left:2px}

/* â”€â”€ MODAL / DRAWER SYSTEM â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
/* DOCTRINE:
   - All modals/drawers must be rendered at CC root level (outside overflow containers)
   - Use wt-modal-bg for center modals, wt-drawer-bg for side panels
   - Never nest inside a scrollable div
   - z-index always from --wt-z-modal / --wt-z-overlay
*/
/* Center modal */
.wt-modal-bg{position:fixed;inset:0;background:var(--wt-overlay-bg);z-index:var(--wt-z-modal);display:flex;align-items:center;justify-content:center;padding:var(--wt-sp-5);animation:wtFadeIn var(--wt-t-base) both}
.wt-modal{background:var(--wt-surface);border:1px solid var(--wt-border);border-radius:var(--wt-modal-r);width:100%;max-height:90vh;overflow-y:auto;box-shadow:var(--wt-shadow-modal);animation:wtSlideUp .18s ease both;position:relative}
.wt-modal-sm{max-width:480px}
.wt-modal-md{max-width:640px}
.wt-modal-lg{max-width:860px}
.wt-modal-xl{max-width:1080px}
.wt-modal-hdr{padding:var(--wt-sp-5) var(--wt-sp-8);border-bottom:1px solid var(--wt-border);display:flex;align-items:flex-start;justify-content:space-between;position:sticky;top:0;background:var(--wt-surface);z-index:var(--wt-z-base);border-radius:var(--wt-modal-r) var(--wt-modal-r) 0 0;gap:var(--wt-sp-4);flex-shrink:0}
.wt-modal-title{font-size:var(--wt-text-title);font-weight:700;color:var(--wt-ink);letter-spacing:-.02em;line-height:1.3}
.wt-modal-sub{font-size:var(--wt-text-body-sm);color:var(--wt-muted);margin-top:3px}
.wt-modal-body{padding:var(--wt-sp-6) var(--wt-sp-8)}
.wt-modal-ftr{padding:var(--wt-sp-4) var(--wt-sp-8);border-top:1px solid var(--wt-border);display:flex;align-items:center;justify-content:flex-end;gap:var(--wt-sp-3);position:sticky;bottom:0;background:var(--wt-surface);border-radius:0 0 var(--wt-modal-r) var(--wt-modal-r)}
.wt-modal-close{width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:var(--wt-r-md);border:1.5px solid var(--wt-border);background:var(--wt-bg);cursor:pointer;transition:background var(--wt-t-fast),border-color var(--wt-t-fast);flex-shrink:0;color:var(--wt-sub)}
.wt-modal-close:hover{background:var(--wt-surface);border-color:var(--wt-sub);box-shadow:0 2px 6px rgba(0,0,0,.08);color:var(--wt-ink)}
/* Right drawer */
.wt-drawer-bg{position:fixed;inset:0;background:var(--wt-overlay-bg);z-index:var(--wt-z-modal);animation:wtFadeIn var(--wt-t-base) both}
.wt-drawer{position:fixed;top:0;right:0;bottom:0;width:min(680px,90vw);background:var(--wt-surface);box-shadow:-8px 0 48px rgba(0,0,0,.15);z-index:var(--wt-z-modal);display:flex;flex-direction:column;animation:wtSlideLeft .20s cubic-bezier(.4,0,.2,1) both}
.wt-drawer-hdr{padding:var(--wt-sp-5) var(--wt-sp-6);border-bottom:1px solid var(--wt-border);display:flex;align-items:flex-start;justify-content:space-between;flex-shrink:0;gap:var(--wt-sp-4);position:sticky;top:0;background:var(--wt-surface);z-index:var(--wt-z-base)}
.wt-drawer-body{padding:var(--wt-sp-6);overflow-y:auto;flex:1}
/* Animations */
@keyframes wtFadeIn{from{opacity:0}to{opacity:1}}
@keyframes wtSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes wtSlideLeft{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}

/* â”€â”€ TABS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-tab-strip{display:flex;gap:2px;padding:4px;background:var(--wt-bg);border-radius:var(--wt-r-md);width:fit-content;flex-shrink:0}
.wt-tab{padding:6px var(--wt-sp-4);border-radius:var(--wt-r-sm);font-size:var(--wt-text-body-sm);font-weight:500;cursor:pointer;color:var(--wt-sub);transition:all var(--wt-t-fast);white-space:nowrap;border:none;background:none;font-family:var(--wt-f)}
.wt-tab.on{background:var(--wt-surface);color:var(--wt-ink);font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,.08)}
/* Underline tabs */
.wt-tab-line{display:flex;gap:0;border-bottom:1px solid var(--wt-border);margin-bottom:-1px}
.wt-tab-l{padding:10px var(--wt-sp-5);border:none;border-bottom:2px solid transparent;background:none;font-size:var(--wt-text-body-sm);font-weight:500;cursor:pointer;white-space:nowrap;color:var(--wt-sub);transition:color var(--wt-t-fast),border-color var(--wt-t-fast);font-family:var(--wt-f);letter-spacing:-.01em}
.wt-tab-l.on{color:var(--wt-acc);border-bottom-color:var(--wt-acc);font-weight:700}
.wt-tab-l:hover:not(.on){color:var(--wt-ink)}

/* â”€â”€ INFO BLOCKS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-ib{background:var(--wt-bg);border-radius:var(--wt-r-md);padding:12px var(--wt-sp-4)}
.wt-ib-l{font-size:var(--wt-text-micro);font-weight:700;color:var(--wt-muted);text-transform:uppercase;letter-spacing:.07em;margin-bottom:3px}
.wt-ib-v{font-size:var(--wt-text-body-sm);font-weight:600;color:var(--wt-ink)}
.wt-ib-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:var(--wt-sp-3)}

/* â”€â”€ SECTION HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-sec-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--wt-sp-4);gap:var(--wt-sp-4)}
.wt-sec-title{font-size:var(--wt-text-body);font-weight:700;color:var(--wt-ink);letter-spacing:-.01em}
.wt-sec-sub{font-size:var(--wt-text-caption);color:var(--wt-muted);margin-top:2px}
.wt-divider{height:1px;background:var(--wt-divider);margin:var(--wt-sp-5) 0}

/* â”€â”€ EMPTY STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:64px var(--wt-sp-6);text-align:center;gap:var(--wt-sp-3)}
.wt-empty-ico{width:48px;height:48px;border-radius:var(--wt-r-lg);background:var(--wt-faint);display:flex;align-items:center;justify-content:center;color:var(--wt-muted);flex-shrink:0}
.wt-empty-title{font-size:var(--wt-text-body);font-weight:600;color:var(--wt-ink)}
.wt-empty-sub{font-size:var(--wt-text-body-sm);color:var(--wt-muted);max-width:340px;line-height:1.5}

/* â”€â”€ ERROR / ALERT STRIP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-alert{display:flex;align-items:flex-start;gap:var(--wt-sp-3);padding:var(--wt-sp-3) var(--wt-sp-4);border-radius:var(--wt-r-md);font-size:var(--wt-text-body-sm);margin-bottom:var(--wt-sp-4)}
.wt-alert-r{background:var(--wt-neg-bg);color:var(--wt-neg);border:1px solid rgba(196,29,29,.15)}
.wt-alert-o{background:var(--wt-warn-bg);color:var(--wt-warn);border:1px solid rgba(180,83,9,.15)}
.wt-alert-g{background:var(--wt-pos-bg);color:var(--wt-pos);border:1px solid rgba(21,128,61,.15)}
.wt-alert-b{background:var(--wt-acc-bg);color:var(--wt-acc);border:1px solid rgba(21,88,214,.15)}

/* â”€â”€ TOAST â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-toast{position:fixed;top:20px;right:24px;padding:10px var(--wt-sp-4);border-radius:var(--wt-r-md);font-size:var(--wt-text-body-sm);font-weight:600;z-index:var(--wt-z-toast);box-shadow:0 4px 20px rgba(0,0,0,.15);animation:wtSlideUp .16s ease both;display:flex;align-items:center;gap:var(--wt-sp-2)}
.wt-toast-g{background:var(--wt-pos);color:#fff}
.wt-toast-r{background:var(--wt-neg);color:#fff}
.wt-toast-o{background:var(--wt-warn);color:#fff}

/* â”€â”€ GRID HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-g2{display:grid;grid-template-columns:1fr 1fr;gap:var(--wt-sp-5)}
.wt-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--wt-sp-4)}
.wt-g4{display:grid;grid-template-columns:repeat(4,1fr);gap:var(--wt-sp-4)}
@media(max-width:1024px){.wt-g3{grid-template-columns:1fr 1fr}.wt-g4{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.wt-g2,.wt-g3,.wt-g4{grid-template-columns:1fr}}

/* â”€â”€ SCROLLBAR UNIFIED â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.wt-scroll{scrollbar-width:thin;scrollbar-color:var(--wt-divider) transparent}
.wt-scroll::-webkit-scrollbar{width:4px;height:4px}
.wt-scroll::-webkit-scrollbar-thumb{background:var(--wt-divider);border-radius:4px}
.wt-scroll::-webkit-scrollbar-track{background:transparent}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   END WT360 UNIFIED COMPONENT SYSTEM â€” PHASE 1
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
`;


