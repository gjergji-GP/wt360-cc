export const RM_CSS = `
.rm-root{display:flex;height:100vh;font-family:var(--wt-f);background:var(--wt-bg);color:var(--wt-ink);-webkit-font-smoothing:antialiased}
.rm-root .wt-btn-p{background:#1E293B;color:#F8FAFC}.rm-root .wt-btn-p:hover:not(:disabled){background:#0F172A;box-shadow:0 2px 8px rgba(30,41,59,.28)}
.rm-root *,.rm-root *::before,.rm-root *::after{box-sizing:border-box}
.rm-sb{width:var(--wt-sbw);flex-shrink:0;background:#1E293B;border-right:1px solid rgba(255,255,255,.06);display:flex;flex-direction:column;transition:width var(--wt-t-slow);overflow:hidden}
.rm-sb.col{width:var(--wt-sbw-col)}
.rm-sb-logo{padding:18px 16px 14px;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:10px;flex-shrink:0}
.rm-sb-mark{display:flex;align-items:baseline;gap:2px;flex-shrink:0}
.rm-sb-mark-txt{font-weight:800;font-size:15px;color:#ffffff;letter-spacing:-0.02em;font-family:'Inter',-apple-system,sans-serif}
.rm-sb-mark-dot{color:#22c55e;font-size:8px}
.rm-sb-name{font-size:var(--wt-text-body-sm);font-weight:700;color:#E2E8F0;white-space:nowrap}
.rm-sb-role{font-size:9px;color:#475569;text-transform:uppercase;letter-spacing:.07em;white-space:nowrap}
.rm-nav{flex:1;padding:8px;display:flex;flex-direction:column;gap:2px;overflow-y:auto}
.rm-si{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--wt-r-md);border:none;cursor:pointer;text-align:left;background:transparent;color:#94A3B8;font-weight:500;font-size:var(--wt-text-body-sm);font-family:var(--wt-f);transition:background var(--wt-t-fast),color var(--wt-t-fast);width:100%;position:relative;white-space:nowrap}
.rm-si:hover{background:rgba(255,255,255,.06);color:#E2E8F0}
.rm-si.on{background:rgba(3,105,161,.18);color:#38BDF8;font-weight:600;border-left:2px solid #38BDF8;padding-left:8px}
.rm-si-ico{width:20px;height:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:inherit}
.rm-si-badge{position:absolute;top:6px;right:8px;background:#EF4444;color:#fff;border-radius:var(--wt-r-pill);font-size:9px;font-weight:700;min-width:17px;height:17px;display:flex;align-items:center;justify-content:center;padding:0 4px}
.rm-sb-foot{padding:8px;border-top:1px solid rgba(255,255,255,.07);display:flex;flex-direction:column;gap:2px;flex-shrink:0}
.rm-sb-btn{padding:8px 10px;border-radius:var(--wt-r-md);border:none;background:none;cursor:pointer;color:#64748B;display:flex;align-items:center;gap:8px;font-size:var(--wt-text-body-sm);font-family:var(--wt-f);transition:color var(--wt-t-fast),background var(--wt-t-fast);white-space:nowrap;width:100%}
.rm-sb-btn:hover{background:rgba(255,255,255,.06);color:#E2E8F0}
.rm-hdr{height:56px;border-bottom:1px solid var(--wt-border);display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:rgba(248,250,252,.95);backdrop-filter:blur(10px);flex-shrink:0;position:sticky;top:0;z-index:var(--wt-z-header)}
.rm-hdr-title{font-size:var(--wt-text-body);font-weight:700;color:var(--wt-ink)}
.rm-hdr-loc{font-size:var(--wt-text-body-sm);color:var(--wt-muted)}
.rm-main{flex:1;display:flex;flex-direction:column;overflow:visible;min-width:0}
.rm-page{flex:1;overflow-y:auto;padding:32px 40px 80px}
.rm-page-inner{max-width:1000px;margin:0 auto}
.rm-card{background:var(--wt-surface);border:1px solid var(--wt-border);border-radius:var(--wt-r-lg);padding:20px 24px}
.rm-sec{font-size:10px;font-weight:800;color:var(--wt-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}
.rm-kpi-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:24px}
.rm-kpi{flex:1;min-width:140px;background:var(--wt-surface);border:1px solid rgba(0,0,0,.09);border-top:3px solid var(--wt-acc);border-radius:var(--wt-r-lg);padding:16px 20px}
.rm-kpi-label{font-size:11px;color:var(--wt-muted);font-weight:600;margin-bottom:6px}
.rm-kpi-val{font-size:26px;font-weight:600;color:var(--wt-ink);line-height:1;letter-spacing:-0.03em;font-variant-numeric:tabular-nums}
.rm-kpi-sub{font-size:11px;color:var(--wt-muted);margin-top:4px}
.rm-urgent{display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--wt-warn-bg);border:1px solid rgba(180,83,9,.18);border-radius:var(--wt-r-md);margin-bottom:8px}
.rm-urgent-label{flex:1;font-size:13px;color:var(--wt-warn);font-weight:500}
.rm-urgent-count{font-size:12px;font-weight:800;color:var(--wt-warn);background:rgba(180,83,9,.12);padding:2px 9px;border-radius:var(--wt-r-pill)}
.rm-urgent.info{background:var(--wt-acc-bg);border-color:rgba(21,88,214,.18)}
.rm-urgent.info .rm-urgent-label{color:var(--wt-acc)}
.rm-urgent.info .rm-urgent-count{color:var(--wt-acc);background:rgba(21,88,214,.10)}
.rm-recv-card{background:var(--wt-surface);border:1px solid var(--wt-border);border-left:3px solid var(--wt-warn);border-radius:var(--wt-r-lg);padding:16px 20px;margin-bottom:10px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px;transition:box-shadow var(--wt-t-base)}
.rm-recv-card:hover{box-shadow:var(--wt-shadow-lg)}
.rm-recv-card.done{border-left-color:var(--wt-pos);opacity:.65;cursor:default}
.rm-recv-card.done:hover{box-shadow:none}
.rm-recv-title{font-size:14px;font-weight:600;color:var(--wt-ink);margin-bottom:3px}
.rm-avatar{width:24px;height:24px;border-radius:50%;background:rgba(3,105,161,.10);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:var(--wt-acc);flex-shrink:0}
.rm-tbl{border-collapse:collapse;width:100%}
.rm-tbl th{text-align:left;font-size:10.5px;font-weight:700;color:var(--wt-muted);padding:6px 8px;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid var(--wt-border)}
.rm-tbl td{padding:10px 8px;border-bottom:1px solid var(--wt-divider);color:var(--wt-ink);font-size:13px;vertical-align:middle;font-variant-numeric:tabular-nums}
.rm-tbl tr:last-child td{border-bottom:none}
.rm-field{display:flex;flex-direction:column;gap:4px}
.rm-field-label{font-size:11px;font-weight:600;color:var(--wt-ink)}
.rm-field-input{padding:8px 10px;border:1px solid var(--wt-border);border-radius:var(--wt-r-sm);font-size:13px;background:var(--wt-surface);color:var(--wt-ink);width:100%;outline:none;font-family:var(--wt-f);transition:border-color var(--wt-t-base)}
.rm-field-input:focus{border-color:var(--wt-acc);box-shadow:0 0 0 3px var(--wt-acc-bg)}
.rm-field-input[readonly]{background:var(--wt-bg);color:var(--wt-sub)}
.rm-field-hint{font-size:10px;color:var(--wt-muted)}
.rm-badge{font-size:10.5px;font-weight:700;padding:3px 8px;border-radius:var(--wt-r-pill);white-space:nowrap}
.rm-badge-g{background:var(--wt-pos-bg);color:var(--wt-pos)}
.rm-badge-o{background:var(--wt-warn-bg);color:var(--wt-warn)}
.rm-badge-r{background:var(--wt-neg-bg);color:var(--wt-neg)}
.rm-badge-b{background:var(--wt-acc-bg);color:var(--wt-acc)}
.rm-badge-v{background:var(--wt-violet-bg);color:var(--wt-violet)}
.rm-badge-x{background:var(--wt-faint);color:var(--wt-sub)}
.rm-toast{position:fixed;top:20px;right:24px;background:var(--wt-pos);color:#fff;padding:10px 16px;border-radius:var(--wt-r-md);font-size:13px;font-weight:600;z-index:var(--wt-z-toast);box-shadow:var(--wt-shadow-lg)}
.rm-modal-bg{position:fixed;inset:0;background:var(--wt-overlay-bg);z-index:var(--wt-z-modal);display:flex;align-items:center;justify-content:center;padding:20px}
.rm-modal{background:var(--wt-surface);border:1px solid var(--wt-border);border-radius:var(--wt-modal-r);width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:var(--wt-shadow-modal)}
.rm-modal-hdr{padding:20px 24px;border-bottom:1px solid var(--wt-border);display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;background:var(--wt-surface);z-index:1;border-radius:var(--wt-modal-r) var(--wt-modal-r) 0 0}
.rm-modal-title{font-size:16px;font-weight:700;color:var(--wt-ink)}
.rm-modal-body{padding:20px 24px}
.rm-modal-ftr{padding:16px 24px;border-top:1px solid var(--wt-border);display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:var(--wt-surface);border-radius:0 0 var(--wt-modal-r) var(--wt-modal-r)}
.rm-close{width:32px;height:32px;border-radius:var(--wt-r-md);border:1.5px solid var(--wt-border);background:var(--wt-bg);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--wt-sub);transition:all var(--wt-t-fast);flex-shrink:0}
.rm-btn-p{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 18px;background:#1E293B;color:#F8FAFC;border:none;border-radius:var(--wt-r-md);font-size:13px;font-weight:600;cursor:pointer;transition:background var(--wt-t-fast);font-family:var(--wt-f);white-space:nowrap}
.rm-btn-p:hover:not(:disabled){background:#0F172A}
.rm-btn-p:disabled{opacity:.45;cursor:not-allowed}
.rm-btn-p.full{width:100%;padding:11px}
.rm-btn-p.lg{padding:12px 20px;font-size:14px;font-weight:700}
.rm-btn-sec{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 18px;background:transparent;color:var(--wt-sub);border:1px solid var(--wt-border);border-radius:var(--wt-r-md);font-size:13px;font-weight:500;cursor:pointer;transition:all var(--wt-t-fast);font-family:var(--wt-f);white-space:nowrap}
.rm-btn-sec:hover{border-color:var(--wt-acc);color:var(--wt-ink)}
.rm-btn-d-full{width:100%;padding:11px;display:flex;align-items:center;justify-content:center;background:var(--wt-neg);color:#fff;border:none;border-radius:var(--wt-r-md);font-size:13px;font-weight:600;cursor:pointer;transition:background var(--wt-t-fast);font-family:var(--wt-f)}
.rm-btn-d-full:hover:not(:disabled){background:#B91C1C}
.rm-btn-d-full:disabled{opacity:.45;cursor:not-allowed}
.rm-close:hover{background:var(--wt-surface);border-color:var(--wt-sub);color:var(--wt-ink)}
`;
