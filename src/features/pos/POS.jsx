import { useCallback, useEffect, useState } from "react";
import { CAT_COLORS, MENU_DATA, ORDER_TYPES } from "./config";
import { ageClass, elapsed, fmtN, timerColor } from "./utils";
import { POS_CSS } from "./styles";
import { SB } from "../../lib/supabase";

const CSS = POS_CSS + `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#F4F5F7;--bg2:#EEF1F4;--card:#FFFFFF;--input:#F8F9FB;
  --b1:#E8EAED;--b2:#ECEFF3;--div:#EFF1F4;
  --t1:#1C1C1C;--t2:#202020;--t3:#6B7280;--t4:#9CA3AF;--t5:#B6BDC7;
  --blue:#009DE0;--blueh:#008DCA;--bluetint:#E6F6FD;
  --green:#16A34A;--greentint:#EAF8EE;
  --amber:#F59E0B;--ambertint:#FFF6E5;
  --red:#EF4444;--redtint:#FDECEC;
  --navy:#0D0E1A;
  --sp: 0 10px 30px rgba(16,24,40,0.06);
  --st: 0 1px 4px rgba(16,24,40,0.06),0 0 0 1px #E8EAED;
  --sth:0 4px 16px rgba(0,157,224,0.12),0 1px 4px rgba(16,24,40,0.06);
  --sm: 0 20px 50px rgba(16,24,40,0.16);
  font-family:'DM Sans',system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
}
body{background:var(--bg);color:var(--t1);overflow:hidden;height:100vh;}

/* offline */
.offline-bar{position:fixed;top:0;left:0;right:0;z-index:9999;background:var(--ambertint);border-bottom:1px solid #FDE68A;color:#78350F;text-align:center;padding:7px 16px;font-size:13px;font-weight:600;letter-spacing:.1px;}

/* login */
.login-shell{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:24px;}
.login-card{background:var(--card);border-radius:24px;box-shadow:var(--sm);border:1px solid var(--b1);padding:40px;width:100%;max-width:480px;}
.login-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;}
.login-brand{font-size:22px;font-weight:700;color:var(--t1);letter-spacing:-.3px;}
.login-tc{display:flex;align-items:center;gap:6px;background:var(--input);border:1px solid var(--b1);border-radius:999px;padding:7px 14px;font-size:13px;font-weight:500;color:var(--t3);cursor:pointer;transition:all .14s;}
.login-tc:hover{border-color:var(--blue);color:var(--blue);background:var(--bluetint);}
.login-inst{font-size:19px;font-weight:500;color:var(--t2);text-align:center;margin-bottom:6px;letter-spacing:-.2px;}
.login-support{text-align:center;font-size:13px;color:var(--t4);margin-bottom:24px;}
.pin-display{background:var(--input);border:1.5px solid var(--b1);border-radius:12px;height:60px;display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:20px;transition:border-color .14s;}
.pin-display.active{border-color:var(--blue);}
.pin-dot{width:11px;height:11px;border-radius:50%;background:var(--t5);transition:background .12s;}
.pin-dot.on{background:var(--t1);}
.pin-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.pin-btn{background:var(--input);border:1px solid var(--b1);border-radius:14px;color:var(--t1);font-size:22px;font-weight:600;font-family:'DM Sans',sans-serif;height:64px;cursor:pointer;transition:all .12s;display:flex;align-items:center;justify-content:center;user-select:none;}
.pin-btn:hover{background:var(--bg2);border-color:var(--b2);}
.pin-btn:active{transform:scale(.96);background:var(--b1);}
.pin-btn.go{background:var(--blue);border-color:var(--blue);color:#fff;font-size:17px;margin-top:10px;height:56px;border-radius:14px;width:100%;}
.pin-btn.go:hover{background:var(--blueh);}
.pin-btn.util{font-size:17px;color:var(--t3);}
.login-footer{text-align:center;font-size:12px;color:var(--t5);margin-top:20px;}
.login-err{text-align:center;font-size:13px;color:var(--red);min-height:20px;margin-top:8px;font-weight:500;}

/* shell */
.pos-shell{display:grid;grid-template-rows:52px 1fr;height:100vh;}
.topbar{background:var(--card);border-bottom:1px solid var(--b1);display:flex;align-items:center;justify-content:space-between;padding:0 20px;box-shadow:0 1px 0 var(--b1);}
.tb-l{display:flex;align-items:center;}
.tb-brand{font-size:18px;font-weight:700;color:var(--t1);letter-spacing:-.3px;}
.tb-sep{width:1px;height:18px;background:var(--b1);margin:0 14px;}
.tb-loc{font-size:14px;font-weight:600;color:var(--t2);}
.tb-code{font-size:11px;color:var(--t5);margin-left:8px;font-family:'DM Mono',monospace;}
.tb-r{display:flex;align-items:center;gap:8px;}
.tb-emp{font-size:14px;font-weight:600;color:var(--t2);margin-right:4px;}
.tb-btn{background:var(--input);border:1px solid var(--b1);border-radius:14px;color:var(--t3);font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;padding:7px 14px;cursor:pointer;transition:all .14s;display:flex;align-items:center;gap:5px;height:36px;}
.tb-btn:hover{border-color:var(--blue);color:var(--blue);background:var(--bluetint);}
.tb-btn.kds{color:var(--amber);border-color:#FDE68A;background:var(--ambertint);}
.tb-btn.kds:hover{border-color:var(--amber);}
.tb-btn.out{color:var(--red);border-color:#FECACA;background:var(--redtint);}
.tb-btn.out:hover{border-color:var(--red);}.numpad-overlay{position:fixed;inset:0;z-index:500;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(16,24,40,.35);animation:fIn .15s ease;}.numpad-sheet{background:var(--card);border-radius:24px 24px 0 0;padding:24px 32px 40px;box-shadow:0 -8px 32px rgba(16,24,40,.14);animation:sUp .18s ease;max-width:640px;width:100%;margin:0 auto;}.numpad-label{font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;text-align:center;}.numpad-display{background:var(--bg);border:2px solid var(--blue);border-radius:14px;height:70px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:700;color:var(--t1);font-variant-numeric:tabular-nums;letter-spacing:-1px;margin-bottom:20px;position:relative;}.numpad-display.pin{letter-spacing:12px;font-size:24px;}.numpad-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;}.nk{background:var(--bg2);border:1px solid var(--b1);border-radius:18px;width:100%;aspect-ratio:1.8/1;max-height:96px;font-size:28px;font-weight:600;font-family:'DM Sans',sans-serif;color:var(--t1);cursor:pointer;transition:all .1s;display:flex;flex-direction:column;align-items:center;justify-content:center;user-select:none;}.nk:active{transform:scale(.94);background:var(--b1);}.nk.nk-del{font-size:18px;color:var(--t3);}.nk.nk-zero{font-size:22px;}.nk.nk-ok{background:var(--blue);border-color:var(--blue);color:#fff;font-size:16px;font-weight:700;}.nk.nk-ok:active{background:var(--blueh);}.nk.nk-ok:disabled{background:var(--t5);border-color:var(--t5);cursor:not-allowed;}.nk.nk-cancel{background:var(--input);border-color:var(--b2);color:var(--t3);font-size:14px;}.po-modal{background:var(--card);border-radius:20px;box-shadow:var(--sm);padding:32px 32px 28px;width:100%;max-width:560px;animation:sUp .2s ease;max-height:92vh;overflow-y:auto;}.po-title{font-size:20px;font-weight:700;color:var(--t1);letter-spacing:-.3px;margin-bottom:2px;}.po-sub{font-size:12px;color:var(--t4);margin-bottom:20px;}.po-balance{display:flex;align-items:center;justify-content:space-between;background:var(--bg);border:1px solid var(--b1);border-radius:12px;padding:10px 16px;margin-bottom:18px;font-size:13px;}.po-amt-display{background:var(--bg);border:2px solid var(--b1);border-radius:12px;height:52px;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:var(--t1);font-variant-numeric:tabular-nums;margin-bottom:16px;cursor:pointer;transition:border-color .14s;}.po-amt-display.focus{border-color:var(--blue);}.po-amt-display.zero{color:var(--t5);}.po-cats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;}.po-cat{background:var(--input);border:1.5px solid var(--b2);border-radius:14px;padding:14px 8px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;color:var(--t3);cursor:pointer;transition:all .12s;text-align:center;line-height:1.3;min-height:52px;display:flex;align-items:center;justify-content:center;}.po-cat.on{background:var(--bluetint);border-color:var(--blue);color:var(--blue);}.po-note{width:100%;background:var(--input);border:1.5px solid var(--b2);border-radius:12px;padding:14px 16px;font-size:16px;font-family:'DM Sans',sans-serif;color:var(--t1);outline:none;resize:none;margin-bottom:16px;transition:border-color .14s;min-height:80px;-webkit-user-select:text;user-select:text;}.po-note:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,157,224,.1);}.po-warn{background:var(--ambertint);border:1px solid #FDE68A;border-radius:10px;padding:9px 14px;font-size:12px;color:#78350F;font-weight:600;margin-bottom:14px;display:flex;align-items:center;gap:8px;}.po-err{background:var(--redtint);border:1px solid #FECACA;border-radius:10px;padding:9px 14px;font-size:12px;color:var(--red);font-weight:600;margin-bottom:14px;}.po-pin-label{font-size:12px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;text-align:center;}.po-pin-dots{display:flex;gap:10px;justify-content:center;margin-bottom:16px;}.po-pin-dot{width:13px;height:13px;border-radius:50%;background:var(--b1);transition:background .12s;}.po-pin-dot.on{background:var(--t1);}.cl-section{font-size:10px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.7px;margin:14px 0 6px;}.cl-po-item{display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0;color:var(--t2);}.cl-po-badge{font-size:10px;font-weight:700;background:var(--ambertint);color:#78350F;border-radius:999px;padding:2px 8px;margin-left:6px;}.cl-comment{width:100%;background:var(--input);border:1.5px solid var(--amber);border-radius:10px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;color:var(--t1);outline:none;margin-bottom:12px;}.tb-btn.po{color:#7C3AED;border-color:#DDD6FE;background:#F5F3FF;}.tb-btn.po:hover{border-color:#7C3AED;}

/* body */
.pos-body{display:grid;grid-template-columns:280px 1fr 280px;overflow:hidden;}

/* ticket */
.ticket{background:var(--card);border-right:1px solid var(--b1);display:flex;flex-direction:column;box-shadow:var(--sp);}
.tz1{padding:16px 16px 12px;border-bottom:1px solid var(--div);}
.tkt-id{font-size:11px;font-weight:600;color:var(--t4);letter-spacing:1.2px;text-transform:uppercase;font-family:'DM Mono',monospace;}
.otype-row{display:flex;gap:4px;margin-top:10px;}
.ot-btn{flex:1;background:var(--input);border:1px solid var(--b2);border-radius:999px;color:var(--t4);font-size:10px;font-weight:700;padding:7px 2px;text-align:center;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all .12s;white-space:nowrap;}
.ot-btn.on{background:var(--bluetint);border-color:var(--blue);color:var(--blue);}
.tz2{flex:1;overflow-y:auto;padding:8px 12px;}
.t-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--t4);padding:32px;text-align:center;gap:10px;}
.t-empty-ic{width:40px;height:40px;border-radius:50%;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:18px;}
.t-empty-lbl{font-size:13px;font-weight:500;}
.o-line{display:flex;align-items:flex-start;gap:10px;padding:10px 8px;border-radius:10px;transition:background .1s;margin-bottom:2px;}
.o-line:hover{background:var(--bg);}
.l-qty{background:var(--bg2);border:1px solid var(--b1);border-radius:999px;min-width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:var(--t2);flex-shrink:0;margin-top:1px;}
.l-body{flex:1;}
.l-name{font-size:15px;font-weight:600;color:var(--t1);line-height:1.2;}
.l-mod{font-size:11px;color:var(--t4);margin-top:2px;}
.l-akh{display:inline-flex;align-items:center;margin-top:3px;background:var(--ambertint);border:1px solid #FDE68A;border-radius:999px;padding:2px 8px;font-size:9px;font-weight:700;color:#78350F;letter-spacing:.4px;}
.l-price{font-size:15px;font-weight:700;color:var(--t2);font-variant-numeric:tabular-nums;white-space:nowrap;padding-top:2px;}
.l-price span{font-size:11px;font-weight:400;color:var(--t4);margin-left:2px;}
.l-rm{background:none;border:none;color:var(--t5);cursor:pointer;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all .12s;margin-top:2px;flex-shrink:0;}
.l-rm:hover{color:var(--red);background:var(--redtint);}
.tz3{padding:16px 16px 0;border-top:1px solid var(--div);}
.calc-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
.c-lbl{font-size:13px;font-weight:500;color:var(--t3);}
.c-val{font-size:14px;font-weight:600;color:var(--t2);font-variant-numeric:tabular-nums;}
.c-div{height:1px;background:var(--div);margin:10px 0;}
.tot-lbl{font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px;}
.tot-amt{font-size:34px;font-weight:700;color:var(--t1);font-variant-numeric:tabular-nums;letter-spacing:-1px;line-height:1;}
.tot-amt span{font-size:15px;font-weight:500;color:var(--t3);margin-left:4px;letter-spacing:0;}
.tz4{padding:16px;}
.pay-btn{width:100%;background:var(--blue);border:none;border-radius:16px;color:#fff;font-size:18px;font-weight:700;font-family:'DM Sans',sans-serif;height:58px;cursor:pointer;transition:all .15s;font-variant-numeric:tabular-nums;letter-spacing:-.2px;display:flex;align-items:center;justify-content:center;}
.pay-btn:hover:not(:disabled){background:var(--blueh);transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,157,224,.22);}
.pay-btn:active:not(:disabled){transform:scale(.99);}
.pay-btn:disabled{background:var(--t5);cursor:not-allowed;transform:none;box-shadow:none;}
.new-btn{width:100%;background:transparent;border:1px solid var(--b1);border-radius:14px;color:var(--t3);font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;height:40px;cursor:pointer;transition:all .14s;margin-top:8px;}
.new-btn:hover{border-color:var(--t4);color:var(--t2);background:var(--bg);}

/* workspace */
.workspace{display:flex;flex-direction:column;overflow:hidden;background:var(--bg);}.cat-col{background:var(--card);border-left:1px solid var(--b1);display:flex;flex-direction:column;padding:8px 6px;gap:4px;overflow-y:auto;}.cat-btn{border-radius:12px;font-size:13px;font-weight:700;font-family:'DM Sans',sans-serif;padding:12px 6px;cursor:pointer;transition:all .14s;border:2px solid transparent;min-height:68px;width:100%;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.3;letter-spacing:.3px;text-transform:uppercase;}.cat-btn:active{transform:scale(.97);}.qa-strip{padding:8px 12px;border-top:1px solid var(--b1);background:var(--bg);flex-shrink:0;}.qa-label{font-size:9px;font-weight:700;color:var(--t5);text-transform:uppercase;letter-spacing:.8px;margin-bottom:5px;}.qa-row{display:flex;gap:5px;}.qa-btn{flex:1;background:var(--card);border:1px solid var(--b1);border-radius:10px;padding:7px 4px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif;color:var(--t3);cursor:pointer;transition:all .12s;text-align:center;line-height:1.3;}.qa-btn:hover{border-color:var(--blue);color:var(--blue);background:var(--bluetint);}.qa-btn:active{transform:scale(.96);}.qa-price{font-size:9px;font-weight:500;color:var(--t4);display:block;margin-top:2px;}.avg-ticket{padding:5px 16px 8px;text-align:right;}.avg-ticket-lbl{font-size:10px;color:var(--t5);font-weight:500;}.avg-ticket-val{font-size:12px;color:var(--t4);font-weight:600;font-variant-numeric:tabular-nums;margin-left:5px;}.upsell-strip{background:var(--greentint);border:1px solid #BBF7D0;border-radius:14px;padding:13px 16px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;}.upsell-text{flex:1;}.upsell-say{font-size:11px;color:#166534;font-style:italic;margin-bottom:3px;font-weight:500;}.upsell-name{font-size:14px;font-weight:700;color:#14532D;}.upsell-price{font-size:12px;color:#166534;margin-top:1px;}.upsell-add{background:#16A34A;border:none;border-radius:10px;color:#fff;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;padding:9px 14px;cursor:pointer;white-space:nowrap;}.upsell-add:hover{background:#15803D;}.upsell-skip{background:none;border:none;font-size:11px;color:var(--t4);cursor:pointer;font-family:'DM Sans',sans-serif;padding:4px 8px;display:block;text-align:center;margin-bottom:8px;}.cat-btn.daypart-active{animation:dpulse 2s ease 0s 1;}@keyframes dpulse{0%{transform:scale(1)}40%{transform:scale(1.04)}100%{transform:scale(1)}}.kbd-overlay{position:fixed;inset:0;z-index:600;display:flex;flex-direction:column;justify-content:flex-end;}.kbd-sheet{background:#D1D5DB;border-radius:20px 20px 0 0;padding:14px 12px 28px;animation:sUp .18s ease;}.kbd-display{background:#fff;border:2px solid var(--blue);border-radius:12px;min-height:60px;padding:12px 18px;font-size:18px;font-weight:500;color:var(--t1);margin-bottom:12px;word-break:break-word;line-height:1.5;font-family:'DM Sans',sans-serif;position:relative;}.kbd-display-ph{color:var(--t5);font-style:italic;}.kbd-row{display:flex;gap:7px;justify-content:center;margin-bottom:8px;}.kk{background:#fff;border:none;border-radius:10px;height:56px;min-width:44px;flex:1;max-width:56px;font-size:20px;font-weight:500;font-family:'DM Sans',sans-serif;color:var(--t1);cursor:pointer;box-shadow:0 3px 0 #9CA3AF;transition:all .08s;display:flex;align-items:center;justify-content:center;user-select:none;}.kk:active{transform:translateY(1px);box-shadow:0 1px 0 #9CA3AF;}.kk.kk-dark{background:#ADB5BD;color:var(--t1);font-size:16px;font-weight:600;flex:1.5;max-width:72px;}.kk.kk-space{background:#fff;flex:4;max-width:240px;font-size:15px;color:var(--t3);}.kk.kk-ok{background:var(--blue);color:#fff;font-size:16px;font-weight:700;flex:1.5;max-width:96px;box-shadow:0 3px 0 #007AB5;}.kk.kk-ok:active{background:var(--blueh);}.kk.kk-num{font-size:13px;}



.search-wrap{padding:10px 16px 0;flex-shrink:0;}
.srch-field{position:relative;width:100%;}
.srch-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--t4);pointer-events:none;}
.srch-input{width:100%;background:var(--card);border:1.5px solid var(--b1);border-radius:14px;padding:0 16px 0 40px;height:48px;font-size:15px;font-family:'DM Sans',sans-serif;color:var(--t1);outline:none;transition:border-color .14s;box-shadow:var(--st);}
.srch-input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,157,224,.1);}
.srch-input::placeholder{color:var(--t4);}
.item-grid{flex:1;padding:12px 16px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(138px,1fr));gap:10px;align-content:start;overflow-y:auto;}
.sec-lbl{grid-column:1/-1;font-size:11px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:1px;padding:8px 0 2px;}
.tile{background:var(--card);border:1px solid var(--b1);border-radius:16px;padding:16px 14px;cursor:pointer;transition:all .14s;min-height:88px;display:flex;flex-direction:column;justify-content:space-between;position:relative;box-shadow:var(--st);user-select:none;}
.tile:hover{border-color:rgba(0,157,224,.3);box-shadow:var(--sth);transform:translateY(-2px);}
.tile:active{transform:scale(.97);}
.tile.na{opacity:.35;cursor:not-allowed;}
.tile-name{font-size:14px;font-weight:600;color:var(--t1);line-height:1.3;text-transform:uppercase;letter-spacing:.2px;}
.tile-pop{position:absolute;top:10px;right:10px;width:6px;height:6px;border-radius:50%;background:var(--blue);opacity:.4;}

/* processing */
.proc-screen{height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg);gap:20px;}
.proc-spin{width:48px;height:48px;border-radius:50%;border:3px solid var(--b1);border-top-color:var(--blue);animation:spin .75s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
.proc-lbl{font-size:16px;font-weight:500;color:var(--t3);}
.proc-sub{font-size:13px;color:var(--t4);}

/* overlay */
.overlay{position:fixed;inset:0;z-index:200;background:rgba(16,24,40,.4);display:flex;align-items:center;justify-content:center;animation:fIn .18s ease;padding:24px;}
@keyframes fIn{from{opacity:0}to{opacity:1}}
.ov-card{background:var(--card);border-radius:20px;box-shadow:var(--sm);padding:32px 36px;width:100%;max-width:580px;animation:sUp .2s ease;max-height:92vh;overflow-y:auto;}
@keyframes sUp{from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1}}
.ov-title{font-size:20px;font-weight:700;color:var(--t1);margin-bottom:4px;letter-spacing:-.3px;}
.ov-sub{font-size:12px;color:var(--t4);margin-bottom:20px;font-family:'DM Mono',monospace;}
.tender-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;}.om-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;}.om-opt{background:var(--input);border:2px solid var(--b1);border-radius:16px;padding:20px 12px;cursor:pointer;text-align:center;transition:all .14s;font-family:'DM Sans',sans-serif;}.om-opt:hover{border-color:var(--blue);background:var(--bluetint);}.om-opt.on{background:var(--bluetint);border-color:var(--blue);}.om-ico{display:none;}.om-lbl{font-size:15px;font-weight:700;color:var(--t1);line-height:1.3;}.om-sub{font-size:11px;color:var(--t3);margin-top:4px;}.om-opt.on .om-lbl{color:var(--blue);}.om-opt.on .om-sub{color:var(--blue);opacity:.8;}.om-section{font-size:10px;font-weight:700;color:var(--t4);text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;}.pay-section-div{height:1px;background:var(--b1);margin:16px 0;}
.tender-opt{background:var(--input);border:2px solid var(--b1);border-radius:14px;padding:16px;cursor:pointer;text-align:center;transition:all .14s;font-family:'DM Sans',sans-serif;}
.tender-opt:hover{border-color:var(--blue);background:var(--bluetint);}
.tender-opt.on{background:var(--bluetint);border-color:var(--blue);}
.tender-opt.dis{opacity:.38;cursor:not-allowed;}
.t-ico{font-size:22px;margin-bottom:6px;}
.t-lbl{font-size:14px;font-weight:700;color:var(--t1);}
.t-sub{font-size:11px;color:var(--t3);margin-top:2px;}
.ov-due{display:flex;justify-content:space-between;align-items:center;background:var(--bg);border-radius:12px;padding:14px 16px;margin-bottom:16px;border:1px solid var(--b1);}
.ov-due-lbl{font-size:13px;font-weight:500;color:var(--t3);}
.ov-due-val{font-size:24px;font-weight:700;color:var(--t1);font-variant-numeric:tabular-nums;letter-spacing:-.5px;}
.ov-due-val span{font-size:13px;color:var(--t3);margin-left:3px;}
.c-inp-lbl{font-size:11px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;}
.c-inp{width:100%;background:var(--input);border:1.5px solid var(--b1);border-radius:12px;padding:14px 16px;font-size:22px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--t1);font-family:'DM Sans',sans-serif;outline:none;transition:border-color .14s;margin-bottom:12px;}
.c-inp:focus{border-color:var(--blue);}
.change-blk{display:flex;justify-content:space-between;align-items:center;background:var(--greentint);border:1px solid #BBF7D0;border-radius:12px;padding:12px 16px;margin-bottom:20px;}
.ch-lbl{font-size:13px;font-weight:600;color:#064E3B;}
.ch-amt{font-size:22px;font-weight:700;color:#064E3B;font-variant-numeric:tabular-nums;}
.ov-cfm{width:100%;background:var(--blue);border:none;border-radius:16px;color:#fff;font-size:16px;font-weight:700;font-family:'DM Sans',sans-serif;height:52px;cursor:pointer;transition:all .15s;margin-bottom:8px;}
.ov-cfm:hover:not(:disabled){background:var(--blueh);}
.ov-cfm:disabled{background:var(--t5);cursor:not-allowed;}
.ov-cnl{width:100%;background:transparent;border:1px solid var(--b1);border-radius:14px;color:var(--t3);font-size:14px;font-weight:600;font-family:'DM Sans',sans-serif;height:42px;cursor:pointer;transition:all .14s;}
.ov-cnl:hover{border-color:var(--t4);color:var(--t2);background:var(--bg);}

/* close */
.close-card{background:var(--card);border-radius:20px;box-shadow:var(--sm);padding:32px;width:100%;max-width:440px;animation:sUp .2s ease;}
.cl-title{font-size:20px;font-weight:700;color:var(--t1);margin-bottom:4px;}
.cl-sub{font-size:13px;color:var(--t3);margin-bottom:24px;}
.cl-rows{display:flex;flex-direction:column;gap:8px;margin-bottom:20px;}
.cl-row{display:flex;justify-content:space-between;font-size:14px;}
.cl-row .lbl{color:var(--t3);}
.cl-row .val{font-weight:600;color:var(--t2);font-variant-numeric:tabular-nums;}
.cl-row.tot{padding-top:10px;border-top:1px solid var(--div);}
.cl-row.tot .lbl{font-size:15px;font-weight:600;color:var(--t1);}
.cl-row.tot .val{font-size:15px;font-weight:700;}
.cl-var{padding:12px 16px;border-radius:12px;display:flex;justify-content:space-between;font-size:14px;margin-bottom:20px;}
.cl-var.ok{background:var(--greentint);border:1px solid #BBF7D0;}
.cl-var.warn{background:var(--ambertint);border:1px solid #FDE68A;}
.cl-var .lbl{font-weight:500;}
.cl-var.ok .val{color:var(--green);font-weight:700;}
.cl-var.warn .val{color:var(--amber);font-weight:700;}

/* KDS */
.kds-shell{height:100vh;display:flex;flex-direction:column;background:#0D0E1A;}
.kds-top{background:#171A27;border-bottom:1px solid rgba(255,255,255,.07);padding:0 20px;height:52px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.kds-brand{font-size:16px;font-weight:700;color:#fff;letter-spacing:-.2px;}
.kds-sub{font-size:12px;color:#A7B0BE;margin-left:10px;}
.kds-cnt{font-size:12px;color:#A7B0BE;}
.kds-exit{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:999px;color:#A7B0BE;font-size:12px;font-weight:600;font-family:'DM Sans',sans-serif;padding:6px 14px;cursor:pointer;transition:all .14s;}
.kds-exit:hover{background:rgba(255,255,255,.13);color:#fff;}
.kds-grid{flex:1;padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;align-content:start;overflow-y:auto;}
.kds-tkt{background:#171A27;border-radius:16px;border:1.5px solid rgba(255,255,255,.08);overflow:hidden;transition:border-color .2s;}
.kds-tkt.age-green{border-color:rgba(34,197,94,.3);}
.kds-tkt.age-amber{border-color:rgba(245,158,11,.4);}
.kds-tkt.age-red{border-color:rgba(239,68,68,.5);animation:pr 2.5s infinite;}
@keyframes pr{0%,100%{border-color:rgba(239,68,68,.5);}50%{border-color:rgba(239,68,68,.2);}}
.kds-th{padding:12px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,.06);}
.kds-on{font-size:13px;font-weight:700;color:#fff;font-family:'DM Mono',monospace;}
.kds-ot{font-size:10px;color:#A7B0BE;text-transform:uppercase;letter-spacing:.5px;margin-top:2px;}
.kds-timer{font-size:20px;font-weight:700;font-variant-numeric:tabular-nums;font-family:'DM Mono',monospace;}
.tc-green{color:#4ADE80;}.tc-amber{color:#FCD34D;}.tc-red{color:#F87171;}
.kds-items{padding:10px 14px;}
.kds-item{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.05);}
.kds-item:last-child{border-bottom:none;}
.kds-iqty{min-width:22px;height:22px;border-radius:5px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;}
.kds-iname{flex:1;font-size:13px;font-weight:500;color:#E2E8F0;}
.kds-iss{font-size:9px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;padding:2px 7px;border-radius:999px;}
.kds-iss.sent{background:rgba(0,157,224,.15);color:#7DD3FC;}
.kds-iss.acknowledged{background:rgba(139,92,246,.15);color:#C4B5FD;}
.kds-iss.in_progress{background:rgba(245,158,11,.15);color:#FCD34D;}
.kds-iss.ready{background:rgba(34,197,94,.15);color:#4ADE80;}
.kds-acts{padding:10px 14px;display:flex;gap:8px;border-top:1px solid rgba(255,255,255,.06);}
.kds-act{flex:1;border:none;border-radius:10px;font-size:12px;font-weight:700;font-family:'DM Sans',sans-serif;height:36px;cursor:pointer;transition:all .14s;text-transform:uppercase;letter-spacing:.3px;}
.kds-act.ack{background:rgba(99,102,241,.15);color:#A5B4FC;}
.kds-act.ack:hover{background:rgba(99,102,241,.25);}
.kds-act.ready{background:rgba(34,197,94,.15);color:#4ADE80;}
.kds-act.ready:hover{background:rgba(34,197,94,.25);}
.kds-act.fulfill{background:rgba(34,197,94,.25);color:#4ADE80;}
.kds-act.fulfill:hover{background:rgba(34,197,94,.35);}
.kds-empty{text-align:center;color:#A7B0BE;padding:80px 20px;font-size:15px;}

/* toasts */
.kitchen-toast{position:fixed;bottom:24px;right:24px;z-index:300;background:var(--card);border:1.5px solid #BBF7D0;border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:14px;box-shadow:0 8px 32px rgba(22,163,74,.12);animation:sInR .35s ease;}
@keyframes sInR{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
.kt-ico{font-size:26px;}
.kt-title{font-size:14px;font-weight:700;color:var(--t1);}
.kt-sub{font-size:11px;color:var(--t3);margin-top:2px;}
.err-toast{position:fixed;bottom:24px;right:24px;z-index:300;background:var(--card);border:1px solid #FECACA;border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:12px;box-shadow:var(--sm);animation:sInR .3s ease;}
.et-ico{font-size:18px;}
.et-msg{font-size:14px;font-weight:600;color:var(--t1);}
.et-sub{font-size:12px;color:var(--t3);margin-top:2px;}

::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--b1);border-radius:2px;}
`;

export function POS({ onSignOut = () => {} }) {
  const [screen, setScreen]     = useState("LOGIN");
  const [offline, setOffline]   = useState(false);

  const [pin, setPin]           = useState("");
  const [pinError, setPinError] = useState("");
  const [employee, setEmployee] = useState(null);

  const [device, setDevice]             = useState(null);
  const [drawer, setDrawer]             = useState(null);
  const [cashierSession, setCashierSession] = useState(null);

  const [order, setOrder]       = useState(null);
  const [lines, setLines]       = useState([]);
  const [orderType, setOrderType] = useState("");

  const [activeCat, setActiveCat] = useState("All");
  const [searchQ, setSearchQ]     = useState("");

  const [showPay, setShowPay]   = useState(false);
  const [tender, setTender]     = useState("Cash");
  const [cashGiven, setCashGiven] = useState("");

  const [kdsTickets, setKdsTickets] = useState([]);
  const [kdsTick, setKdsTick]       = useState(0);

  const [showClose, setShowClose]   = useState(false);
  const [closeData, setCloseData]   = useState(null);
  const [cashDecl, setCashDecl]     = useState("");
  const [closeComment, setCloseComment] = useState("");

  const [kitchenToast, setKitchenToast] = useState(false);

  // â”€â”€ Paid Out state â”€â”€
  const [showPaidOut, setShowPaidOut]   = useState(false);
  const [poStep, setPoStep]             = useState('AMOUNT'); // AMOUNT | CATEGORY | APPROVER
  const [poAmount, setPoAmount]         = useState('');
  const [poCat, setPoCat]               = useState('');
  const [poNote, setPoNote]             = useState('');
  const [poApproverPin, setPoApproverPin] = useState('');
  const [poApproverErr, setPoApproverErr] = useState('');
  const [poSubmitting, setPoSubmitting] = useState(false);
  const [poError, setPoError]           = useState('');
  const [paidOuts, setPaidOuts]         = useState([]);
  const [showNumPad, setShowNumPad]     = useState(false);
  const [numPadTarget, setNumPadTarget] = useState(null); // 'AMOUNT'|'DECLARE'
  const [numPadValue, setNumPadValue]   = useState('');
  const [numPadCallback, setNumPadCallback] = useState(null);
  // â”€â”€ Commercial feature state (useState only â€” derived vars below activeLines) â”€â”€
  const [sessionOrders, setSessionOrders]   = useState([]);
  const [upsellDismissed, setUpsellDismissed] = useState(false);
  const [daypartApplied, setDaypartApplied] = useState(false);
  const QUICK_ADD_ITEMS = [
    {name:'Brown Rice',  price:200},
    {name:'Extra Sauce', price:150},
    {name:'Side Salad',  price:320},
  ];
  const DAYPART_MAP = {7:'Smoothies',8:'Smoothies',9:'Smoothies',10:'Bowls',11:'Bowls',
    12:'Bowls',13:'Bowls',14:'Bowls',15:'Snacks',16:'Snacks',
    17:'Wraps',18:'Wraps',19:'Wraps',20:'Wraps',21:'Wraps'};

  // â”€â”€ QWERTY keyboard state â”€â”€
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [kbdValue, setKbdValue] = useState('');
  const [kbdCallback, setKbdCallback] = useState(null);
  const [kbdPlaceholder, setKbdPlaceholder] = useState('');
  const [kbdShift, setKbdShift] = useState(false);

  const [poCategories, setPoCategories] = useState([
    {code:'SUPPLIES',label:'Supplies',requires_note:false},
    {code:'FOOD_BEV',label:'Food & Bev',requires_note:false},
    {code:'MAINTENANCE',label:'Maintenance',requires_note:true},
    {code:'PACKAGING',label:'Packaging',requires_note:false},
    {code:'COURIER',label:'Courier',requires_note:false},
    {code:'EMERGENCY',label:'Emergency',requires_note:true},
    {code:'OTHER',label:'Other',requires_note:true},
  ]);
  const [poConfig, setPoConfig] = useState({
    thresholdAuto:1000, thresholdManager:5000,
    thresholdBlock:10000, approverRoles:'RESTAURANT_MANAGER,LOCATION_MANAGER,FOH_SUPERVISOR,OPERATIONAL_LEADER,CFO,COO'
  });
  const [errToast, setErrToast]         = useState(null);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    loadFixtures();
    const onOnline  = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online",  onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online",onOnline); window.removeEventListener("offline",onOffline); };
  }, []);

  useEffect(() => {
    if (screen !== "KDS") return;
    loadKds();
    const id = setInterval(() => { loadKds(); setKdsTick(t => t+1); }, 10000);
    return () => clearInterval(id);
  }, [screen]);

  async function loadFixtures() {
    const { data: dev } = await SB.from("pos_devices").select("*").eq("device_code",DEVICE_CODE).single();
    const { data: drw } = await SB.from("pos_cash_drawers").select("*").eq("drawer_code","BLK-DRAWER-01").single();
    if (dev) setDevice(dev);
    if (drw) setDrawer(drw);
  }

  function pressPin(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setPinError("");
    if (next.length === 4) tryLogin(next);
  }

  async function tryLogin(p) {
    const { data: roles } = await SB.from("roles").select("id").in("code",["FOH_OPERATOR","RESTAURANT_MANAGER","FOH_SUPERVISOR"]);
    const rids = (roles||[]).map(r=>r.id);
    const { data: emp } = await SB.from("employees").select("*,roles(code,name)").eq("is_active",true).in("role_id",rids).limit(1).single();
    if (!emp) { setPinError("No POS-capable employee found"); setPin(""); return; }
    setEmployee(emp);
    await openSession(emp);
  }

  async function openSession(emp) {
    if (!device || !drawer) { setPinError("Terminal not configured"); setPin(""); return; }
    let ds;
    const { data: ex } = await SB.from("pos_device_sessions").select("*").eq("device_id",device.id).in("status",["OPEN","ACTIVE"]).maybeSingle();
    if (ex) { ds = ex; }
    else {
      const { data: nd } = await SB.from("pos_device_sessions").insert({ brand_id:BRAND_ID, location_id:LOCATION_ID, device_id:device.id, opened_by:emp.id, status:"ACTIVE" }).select().single();
      ds = nd;
    }
    const { data: cs } = await SB.from("pos_cashier_sessions").insert({ brand_id:BRAND_ID, location_id:LOCATION_ID, device_id:device.id, device_session_id:ds.id, employee_id:emp.id, drawer_id:drawer.id, status:"ACTIVE", starting_cash_basis:drawer.fixed_float_amount }).select().single();
    setCashierSession(cs);
    setPin("");
    // Daypart auto-focus
    const hr = new Date().getHours();
    const dpCat = DAYPART_MAP[hr];
    if (dpCat) { setActiveCat(dpCat); setDaypartApplied(true); }
    setScreen("ORDER");
  }

  async function ensureOrder() {
    if (order) return order;
    const key = crypto.randomUUID();
    const num = `GP-BLK-${Date.now().toString().slice(-5)}`;
    const { data: o } = await SB.from("pos_orders").insert({ brand_id:BRAND_ID, location_id:LOCATION_ID, cashier_session_id:cashierSession.id, order_number:num, order_type:orderType.toUpperCase().replace(" ","_"), idempotency_key:key, cashier_visible_state:"OPEN", subtotal:0, tax_amount:0, total:0, discount_amount:0 }).select().single();
    setOrder(o);
    return o;
  }

  async function addItem(name, price) {
    if (!cashierSession) return;
    const i = lines.findIndex(l => l.name===name && !l.sent);
    if (i >= 0) {
      setLines(ls => ls.map((l,idx) => idx===i ? {...l, qty:l.qty+1} : l));
    } else {
      setLines(ls => [...ls, { id:crypto.randomUUID(), name, price, qty:1, sent:false, mod:null }]);
    }
    if (!order) await ensureOrder();
  }

  function removeLine(id) {
    setLines(ls => {
      const updated = ls.map(l => l.id===id ? (l.qty>1 ? {...l,qty:l.qty-1} : null) : l).filter(Boolean);
      if (!updated.length) setOrder(null);
      return updated;
    });
  }

  function clearOrder() { setOrder(null); setLines([]); setCashGiven(''); setTender('Cash'); setOrderType(''); setShowPay(false); }

  const activeLines = lines.filter(l => !l.voided);
  const subtotal    = activeLines.reduce((s,l) => s+l.price*l.qty, 0);

  // â”€â”€ Commercial derived state (requires activeLines) â”€â”€
  const DRINK_NAMES = ['Green Power','Protein Shake','Mango Lassi','Acai Blend'];
  const SNACK_NAMES = ['Protein Bar','Energy Balls x3','Rice Cakes'];
  const hasDrink  = activeLines.some(l => DRINK_NAMES.includes(l.name));
  const hasSnack  = activeLines.some(l => SNACK_NAMES.includes(l.name));
  const upsellItem = (!hasDrink)
    ? {name:'Green Power', price:650, say:"Would they like a Green Power with that?"}
    : (!hasSnack)
    ? {name:'Protein Bar',  price:350, say:"Would they like a Protein Bar to go?"}
    : null;
  const showUpsell = !!upsellItem && !upsellDismissed && activeLines.length > 0;
  const avgTicket  = sessionOrders.length > 0
    ? Math.round(sessionOrders.reduce((s,o)=>s+o,0) / sessionOrders.length)
    : null;
  const vat         = Math.round(subtotal * VAT_RATE);
  const total       = subtotal + vat;
  const canPay      = activeLines.length > 0;
  const cashChange  = tender==="Cash" && cashGiven ? Math.max(0, parseFloat(cashGiven||0)-total) : 0;

  async function confirmPayment() {
    setShowPay(false);
    setScreen("PROCESSING");
    try {
      const o = await ensureOrder();
      const { data: mp } = await SB.from("master_products").select("id").eq("status","ACTIVE").limit(1).single();
      const li = activeLines.map(l => ({ order_id:o.id, product_id:mp?.id, quantity:l.qty, unit_price:l.price, modifiers_total:0, modifier_selections:[], course:"MAIN", kds_status:"PENDING" }));
      await SB.from("pos_order_lines").insert(li);
      await SB.from("pos_orders").update({ order_type:orderType.toUpperCase().replace(" ","_"), subtotal, tax_amount:vat, total, discount_amount:0 }).eq("id",o.id);
      await SB.from("pos_order_events").insert({ order_id:o.id, event_type:"ORDER_CREATED", performed_by:employee.id });
      const chg = tender==="Cash" ? Math.round((parseFloat(cashGiven||0)-total)*100)/100 : 0;
      await SB.from("pos_payment_events").insert({ brand_id:BRAND_ID, location_id:LOCATION_ID, order_id:o.id, tender_type:tender.toUpperCase(), amount_due:total, amount_tendered:tender==="Cash"?parseFloat(cashGiven):total, change_given:tender==="Cash"?chg:null, status:"SUCCEEDED", created_by:employee.id });
      await SB.from("pos_order_events").insert({ order_id:o.id, event_type:"PAYMENT_SUCCEEDED", performed_by:employee.id });
      const rcpt = `MOCK-${o.id}`;
      await SB.from("pos_fiscal_events").insert({ brand_id:BRAND_ID, order_id:o.id, fiscal_receipt_id:rcpt, status:"MOCK_SUCCEEDED", attempt_number:1 });
      await SB.from("pos_orders").update({ fiscal_receipt_id:rcpt }).eq("id",o.id);
      await SB.from("pos_order_events").insert({ order_id:o.id, event_type:"MOCK_FISCAL_SUCCEEDED", performed_by:employee.id });
      await SB.from("pos_order_lines").update({ kds_status:"SENT", fired_at:new Date().toISOString() }).eq("order_id",o.id).eq("kds_status","PENDING");
      await SB.from("pos_orders").update({ cashier_visible_state:"AT_KITCHEN" }).eq("id",o.id);
      await SB.from("pos_order_events").insert({ order_id:o.id, event_type:"RELEASED_TO_PRODUCTION", performed_by:employee.id });
      if (cashierSession) await SB.from("pos_cashier_sessions").update({ orders_count:(cashierSession.orders_count||0)+1 }).eq("id",cashierSession.id);
      setScreen("ORDER");
      clearOrder();
      setKitchenToast(true);
      setTimeout(() => setKitchenToast(false), 4200);
      setSessionOrders(prev=>[...prev, total]);
      setUpsellDismissed(false);
    } catch(e) {
      setScreen("ORDER");
      setErrToast({ msg:"Payment failed", sub:e.message });
      setTimeout(() => setErrToast(null), 5000);
    }
  }

  async function loadKds() {
    const { data: orders } = await SB.from("pos_orders").select("id,order_number,order_type,cashier_visible_state,created_at").eq("location_id",LOCATION_ID).in("cashier_visible_state",["AT_KITCHEN","READY"]).order("created_at");
    if (!orders?.length) { setKdsTickets([]); return; }
    const { data: ls } = await SB.from("pos_order_lines").select("*").in("order_id",orders.map(o=>o.id)).neq("kds_status","VOIDED");
    setKdsTickets(orders.map(o => ({ ...o, lines:(ls||[]).filter(l=>l.order_id===o.id) })));
  }

  async function kdsAck(oid) {
    await SB.from("pos_order_lines").update({kds_status:"ACKNOWLEDGED"}).eq("order_id",oid).eq("kds_status","SENT");
    setKdsTickets(t=>t.map(k=>k.id===oid?{...k,lines:k.lines.map(l=>l.kds_status==="SENT"?{...l,kds_status:"ACKNOWLEDGED"}:l)}:k));
  }
  async function kdsReady(oid) {
    await SB.from("pos_order_lines").update({kds_status:"READY"}).eq("order_id",oid);
    await SB.from("pos_orders").update({cashier_visible_state:"READY"}).eq("id",oid);
    setKdsTickets(t=>t.map(k=>k.id===oid?{...k,cashier_visible_state:"READY",lines:k.lines.map(l=>({...l,kds_status:"READY"}))}:k));
  }
  async function kdsFulfill(oid) {
    await SB.from("pos_order_lines").update({kds_status:"FULFILLED",fulfilled_at:new Date().toISOString()}).eq("order_id",oid).eq("kds_status","READY");
    await SB.from("pos_orders").update({cashier_visible_state:"DONE"}).eq("id",oid);
    setKdsTickets(t=>t.filter(k=>k.id!==oid));
  }

  // â”€â”€ Theoretical drawer balance â”€â”€
  function theoreticalBalance() {
    const paid = paidOuts.filter(p=>p.status==='RECORDED').reduce((s,p)=>s+p.amount,0);
    if (!closeData) {
      const basis = parseFloat(cashierSession?.starting_cash_basis||0);
      return basis - paid;
    }
    return closeData.expected - paid;
  }

  // â”€â”€ Open Keyboard â”€â”€
  function openKeyboard(currentVal, placeholder, onConfirm) {
    setKbdValue(currentVal||'');
    setKbdPlaceholder(placeholder||'');
    setKbdCallback(()=>onConfirm);
    setKbdShift(false);
    setShowKeyboard(true);
  }

  // â”€â”€ Open NumPad â”€â”€
  function openNumPad(target, currentVal, onConfirm) {
    setNumPadTarget(target);
    setNumPadValue(currentVal||'');
    setNumPadCallback(()=>onConfirm);
    setShowNumPad(true);
  }

  // â”€â”€ NumPad key press â”€â”€
  function numPadPress(key) {
    setNumPadValue(v => {
      if (key==='DEL') return v.slice(0,-1);
      if (key==='CLR') return '';
      if (v.length >= 8) return v;
      if (key==='0' && v==='') return v;
      return v + key;
    });
  }

  // â”€â”€ Start PaidOut flow â”€â”€
  function startPaidOut() {
    setPoStep('AMOUNT'); setPoAmount(''); setPoCat('');
    setPoNote(''); setPoApproverPin(''); setPoApproverErr('');
    setPoError(''); setShowPaidOut(true);
  }

  // â”€â”€ Advance from AMOUNT to CATEGORY â”€â”€
  function poConfirmAmount() {
    const amt = parseInt(poAmount||'0',10);
    if (!amt || amt<=0) { setPoError('Enter an amount above 0'); return; }
    if (amt > poConfig.thresholdBlock) {
      setPoError(`Paid-out above ${fmtN(poConfig.thresholdBlock)} ALL is blocked. Contact management.`);
      return;
    }
    const balance = theoreticalBalance();
    if (amt > balance && balance >= 0) {
      setPoError(`Drawer balance insufficient. Theoretical cash: ${fmtN(balance)} ALL.`);
      return;
    }
    setPoError(''); setPoStep('CATEGORY');
  }

  // â”€â”€ Advance from CATEGORY to SUBMIT or APPROVER â”€â”€
  async function poConfirmCategory() {
    if (!poCat) { setPoError('Select a category'); return; }
    const cat = poCategories.find(c=>c.code===poCat);
    if (cat?.requires_note && !poNote.trim()) { setPoError('A note is required for this category'); return; }
    const amt = parseInt(poAmount,10);
    setPoError('');
    if (amt >= poConfig.thresholdManager) {
      setPoStep('APPROVER'); setPoApproverPin(''); setPoApproverErr('');
    } else {
      await submitPaidOut('AUTO_BELOW_THRESHOLD', null, null);
    }
  }

  // â”€â”€ Validate approver PIN â”€â”€
  async function validateApproverPin() {
    if (poApproverPin.length!==4) { setPoApproverErr('Enter 4-digit PIN'); return; }
    const approverRoles = poConfig.approverRoles.split(',');
    const {data:roles} = await SB.from('roles').select('id').in('code', approverRoles);
    const rids = (roles||[]).map(r=>r.id);
    if (!rids.length) { setPoApproverErr('No approver roles configured'); return; }
    const {data:emp} = await SB.from('employees')
      .select('id,roles(code)')
      .eq('is_active',true)
      .eq('pin_hash', poApproverPin)
      .in('role_id', rids)
      .eq('brand_id', BRAND_ID)
      .maybeSingle();
    if (!emp) {
      // Log failed attempt
      await SB.from('pos_paidout_attempts').insert({
        brand_id:BRAND_ID, location_id:LOCATION_ID,
        device_id:cashierSession.device_id,
        cashier_session_id:cashierSession.id,
        attempted_by:employee.id,
        amount:parseInt(poAmount,10),
        category_code:poCat, note:poNote||null,
        failure_reason:'APPROVER_PIN_REJECTED'
      });
      setPoApproverErr('Invalid PIN or insufficient authority. Attempt logged.');
      return;
    }
    await submitPaidOut('DELEGATE_PIN', emp.id, emp.roles?.code||null);
  }

  // â”€â”€ Write the paid-out record â”€â”€
  async function submitPaidOut(approvalMethod, approvedById, approverRoleCode) {
    setPoSubmitting(true);
    try {
      const amt = parseInt(poAmount,10);
      const balance = theoreticalBalance();
      const rec = {
        brand_id:           BRAND_ID,
        location_id:        LOCATION_ID,
        device_id:          cashierSession.device_id,
        cashier_session_id: cashierSession.id,
        amount:             amt,
        category_code:      poCat,
        note:               poNote||null,
        recorded_by:        employee.id,
        approval_method:    approvalMethod,
        manager_approved_by:  approvedById||null,
        manager_approved_at:  approvedById ? new Date().toISOString() : null,
        approver_role_code:   approverRoleCode||null,
        theoretical_balance_at_time: balance,
        status: 'RECORDED'
      };
      const {data:po, error} = await SB.from('pos_paid_outs').insert(rec).select().single();
      if (error) throw error;
      // Update session running totals
      await SB.from('pos_cashier_sessions').update({
        paid_outs_total: (cashierSession.paid_outs_total||0) + amt,
        paid_outs_count: (cashierSession.paid_outs_count||0) + 1,
      }).eq('id', cashierSession.id);
      setPaidOuts(ps=>[...ps, po]);
      setShowPaidOut(false);
      setPoStep('AMOUNT'); setPoAmount(''); setPoCat(''); setPoNote('');
      setPoApproverPin(''); setPoApproverErr('');
    } catch(e) { setPoError(e.message); }
    setPoSubmitting(false);
  }

  async function prepareClose() {
    if (!cashierSession) return;
    const { data: pmts } = await SB.from("pos_payment_events").select("*").in("order_id",
      ((await SB.from("pos_orders").select("id").eq("cashier_session_id",cashierSession.id)).data||[]).map(o=>o.id)
    );
    const cashIn = (pmts||[]).filter(p=>p.tender_type==="CASH"&&p.status==="SUCCEEDED").reduce((s,p)=>s+(parseFloat(p.amount_tendered||0)-parseFloat(p.change_given||0)),0);
    const paidOutTotal = paidOuts.filter(p=>p.status==='RECORDED').reduce((s,p)=>s+p.amount,0);
    const exp = parseFloat(cashierSession.starting_cash_basis)+cashIn-paidOutTotal;
    setCloseData({ ordersCount:cashierSession.orders_count||0, startingBasis:cashierSession.starting_cash_basis, cashIn, paidOutTotal, paidOutList:paidOuts.filter(p=>p.status==='RECORDED'), expected:exp });
    setShowClose(true);
  }

  async function finalizeClose() {
    const declared = parseFloat(cashDecl)||0;
    const variance = declared - closeData.expected;
    await SB.from("pos_cashier_sessions").update({
      status:"CLOSED", closed_at:new Date().toISOString(),
      cash_expected:closeData.expected, cash_declared:declared,
      cash_variance: variance,
      paid_outs_total: closeData.paidOutTotal||0,
      paid_outs_count: (closeData.paidOutList||[]).length,
      overshort_comment: closeComment||null
    }).eq("id",cashierSession.id);
    setCashierSession(null); setEmployee(null); clearOrder();
    setShowClose(false); setCashDecl(""); setCloseData(null);
    setScreen("LOGIN"); setPin("");
  }

  // Menu compute
  const menuItems = (() => {
    const q = searchQ.toLowerCase();
    const out = [];
    let curSec = "";
    let lastSec = "";
    MENU_DATA.forEach(m => {
      if (m.section) { curSec = m.section; return; }
      if (activeCat !== "All" && curSec !== activeCat) return;
      if (q && !m.name.toLowerCase().includes(q)) return;
      if (!q && curSec !== lastSec) { out.push({ isSection:true, label:curSec }); lastSec = curSec; }
      out.push({ ...m, curSec });
    });
    return out;
  })();

  const categories = ["All","Bowls","Wraps","Salads","Smoothies","Snacks","Extras"];

  function timerStr(firedAt) {
    if (!firedAt) return "0:00";
    const s = elapsed(firedAt);
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  }
  function tClass(firedAt) {
    if (!firedAt) return "tc-green";
    const s = elapsed(firedAt);
    return timerColor(s);
  }

  const OfflineBar = offline && (
    <div className="offline-bar">âš  Offline â€” cash only, orders queued</div>
  );

  // â”€â”€ LOGIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (screen === "LOGIN") return (
    <>
      {OfflineBar}
      <div className="login-shell">
        <div className="login-card">
          <div className="login-header">
            <span className="login-brand">WT360</span>
            <button className="login-tc">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
              </svg>
              Timeclock
            </button>
          </div>
          <div className="login-inst">Swipe card or enter your passcode</div>
          <div className="login-support">Blloku Restaurant Â· BLK-TERMINAL-01</div>
          <div className={`pin-display${pin.length > 0 ? " active" : ""}`}>
            {[0,1,2,3].map(i => <div key={i} className={`pin-dot${i < pin.length ? " on" : ""}`}/>)}
          </div>
          <div className="pin-grid">
            {[1,2,3,4,5,6,7,8,9].map(d => (
              <button key={d} className="pin-btn" onClick={() => pressPin(String(d))}>{d}</button>
            ))}
            <button className="pin-btn util" onClick={() => { setPin(""); setPinError(""); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1 2-2h4a2,2 0 0,1 2,2v2"/>
              </svg>
            </button>
            <button className="pin-btn" onClick={() => pressPin("0")}>0</button>
            <button className="pin-btn util" onClick={() => { setPin(p => p.slice(0,-1)); setPinError(""); }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21,4H8l-7,8 7,8h13a2,2 0 0,0 2-2V6a2,2 0 0,0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
              </svg>
            </button>
          </div>
          {pin.length === 4 && (
            <button className="pin-btn go" onClick={() => tryLogin(pin)}>
              Go â†’
            </button>
          )}
          <div className="login-err">{pinError}</div>
          <div className="login-footer">WT360 POS 2.0 Â· WT360 Payment Application 1.0</div>
        </div>
      </div>
    </>
  );

  // â”€â”€ PROCESSING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (screen === "PROCESSING") return (
    <div className="proc-screen">
      <div className="proc-spin"/>
      <div className="proc-lbl">Processing payment</div>
      <div className="proc-sub">Please waitâ€¦</div>
    </div>
  );

  // â”€â”€ KDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (screen === "KDS") return (
    <div className="kds-shell">
      <div className="kds-top">
        <div style={{display:"flex",alignItems:"center"}}>
          <span className="kds-brand">WT360 KDS</span>
          <span className="kds-sub">Blloku Kitchen Â· Pass-Through</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span className="kds-cnt">{kdsTickets.length} active ticket{kdsTickets.length!==1?"s":""}</span>
          <button className="kds-exit" onClick={() => setScreen("ORDER")}>â† POS Terminal</button>
        </div>
      </div>
      {kdsTickets.length === 0 ? (
        <div className="kds-empty">
          <div style={{fontSize:34,marginBottom:12}}>âœ“</div>
          Kitchen clear â€” no active tickets
        </div>
      ) : (
        <div className="kds-grid">
          {kdsTickets.map(t => {
            const fa    = t.lines[0]?.fired_at;
            const secs  = elapsed(fa);
            const allR  = t.lines.every(l=>["READY","FULFILLED"].includes(l.kds_status));
            const allA  = t.lines.every(l=>["ACKNOWLEDGED","IN_PROGRESS","READY","FULFILLED"].includes(l.kds_status));
            return (
              <div key={t.id} className={`kds-tkt ${ageClass(secs)}`}>
                <div className="kds-th">
                  <div>
                    <div className="kds-on">{t.order_number}</div>
                    <div className="kds-ot">{(t.order_type||"").replace("_"," ")}</div>
                  </div>
                  <div className={`kds-timer ${tClass(fa)}`}>{timerStr(fa)}</div>
                </div>
                <div className="kds-items">
                  {t.lines.map(l => (
                    <div key={l.id} className="kds-item">
                      <div className="kds-iqty">{l.quantity}</div>
                      <div className="kds-iname">Item</div>
                      <span className={`kds-iss ${l.kds_status.toLowerCase()}`}>
                        {l.kds_status==="SENT"?"NEW":l.kds_status.replace("_"," ")}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="kds-acts">
                  {!allA && <button className="kds-act ack" onClick={()=>kdsAck(t.id)}>Acknowledge</button>}
                  {allA && !allR && <button className="kds-act ready" onClick={()=>kdsReady(t.id)}>All Ready</button>}
                  {allR && <button className="kds-act fulfill" onClick={()=>kdsFulfill(t.id)}>âœ“ Fulfilled</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // â”€â”€ ORDER SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <>
      {OfflineBar}
      <div className="pos-shell" style={{marginTop:offline?36:0}}>

        {/* TOPBAR */}
        <div className="topbar">
          <div className="tb-l">
            <span className="tb-brand">WT360</span>
            <div className="tb-sep"/>
            <span className="tb-loc">Blloku Restaurant</span>
            <span className="tb-code">QP-BLK-29720</span>
          </div>
          <div className="tb-r">
            <span className="tb-emp">{employee?.first_name} {employee?.last_name}</span>
            <button className="tb-btn po" onClick={startPaidOut}>â†‘ Paid Out</button>
            <button className="tb-btn kds" onClick={()=>setScreen("KDS")}>ðŸ³ KDS</button>
            <button className="tb-btn" onClick={prepareClose}>Close Session</button>
            <button className="tb-btn out" onClick={()=>{setEmployee(null);setCashierSession(null);setScreen("LOGIN");}}>Sign Out</button>
          </div>
        </div>

        {/* BODY */}
        <div className="pos-body">

          {/* â”€â”€ TICKET â”€â”€ */}
          <div className="ticket">

            {/* Z1 â€” Context */}
            <div className="tz1">
              <div className="tkt-id">{order ? order.order_number : "No active order"}</div>
              {orderType && orderType!=="Counter" && (
                <div style={{marginTop:8,display:'inline-flex',alignItems:'center',gap:6,
                  background:'var(--bluetint)',border:'1px solid var(--blue)',borderRadius:999,
                  padding:'3px 10px',fontSize:10,fontWeight:700,color:'var(--blue)'}}>
                  {orderType==="Dine in"?"ðŸ½":orderType==="Takeaway"?"ðŸ›":"ðŸ›µ"} {orderType}
                </div>
              )}
            </div>

            {/* Z2 â€” Lines */}
            <div className="tz2">
              {activeLines.length === 0 ? (
                <div className="t-empty">
                  <div className="t-empty-ic">ðŸ›’</div>
                  <div className="t-empty-lbl">Tap items to add them</div>
                </div>
              ) : activeLines.map(l => (
                <div key={l.id} className="o-line">
                  <div className="l-qty">{l.qty}</div>
                  <div className="l-body">
                    <div className="l-name">{l.name}</div>
                    {l.sent && <div className="l-akh">AT KITCHEN</div>}
                    {l.mod && !l.sent && <div className="l-mod">{l.mod}</div>}
                  </div>
                  <div className="l-price">{fmtN(l.price*l.qty)}<span>L</span></div>
                  {!l.sent && <button className="l-rm" onClick={()=>removeLine(l.id)}>Ã—</button>}
                </div>
              ))}
            </div>

            {/* Z3 â€” Calculation */}
            <div className="tz3">
              <div className="calc-row">
                <span className="c-lbl">Subtotal</span>
                <span className="c-val">{fmtN(subtotal)} L</span>
              </div>
              <div className="calc-row">
                <span className="c-lbl">VAT 20%</span>
                <span className="c-val">{fmtN(vat)} L</span>
              </div>
              <div className="c-div"/>
              <div className="tot-lbl">Total</div>
              <div className="tot-amt">{fmtN(total)}<span>L</span></div>
            </div>

            {/* Z4 â€” Actions */}
            <div className="tz4">
              <button className="pay-btn" onClick={()=>{setShowPay(true);setUpsellDismissed(false);}} disabled={!canPay}>
                {canPay ? `Pay ${fmtN(total)} L` : "Pay"}
              </button>
              <button className="new-btn" onClick={clearOrder}>New Order</button>
            </div>

            {/* Quick-add strip */}
            <div className="qa-strip">
              <div className="qa-label">Quick Add</div>
              <div className="qa-row">
                {QUICK_ADD_ITEMS.map(item=>(
                  <button key={item.name} className="qa-btn"
                    onClick={()=>addItem(item.name, item.price)}>
                    {item.name}
                    <span className="qa-price">{fmtN(item.price)} L</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Session avg ticket */}
            {avgTicket && (
              <div className="avg-ticket">
                <span className="avg-ticket-lbl">Session avg</span>
                <span className="avg-ticket-val">{fmtN(avgTicket)} L</span>
              </div>
            )}
          </div>

          {/* â”€â”€ WORKSPACE â”€â”€ */}
          <div className="workspace">



            {/* Search */}
            <div className="search-wrap">
              <div className="srch-field">
                <span className="srch-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </span>
                <input
                  className="srch-input"
                  placeholder="Search menuâ€¦"
                  value={searchQ}
                  onChange={e=>setSearchQ(e.target.value)}
                />
              </div>
            </div>

            {/* Active category label */}
            {activeCat!=="All"&&(
              <div style={{padding:"0 16px 6px",flexShrink:0}}>
                <span style={{fontSize:10,fontWeight:700,color:"var(--blue)",textTransform:"uppercase",letterSpacing:"1px"}}>{activeCat}</span>
              </div>
            )}

            {/* Grid */}
            <div className="item-grid">
              {menuItems.map((m,i) =>
                m.isSection ? (
                  <div key={`s-${m.label}-${i}`} className="sec-lbl">{m.label}</div>
                ) : (
                  <div
                    key={m.name}
                    className={`tile${m.available===false?" na":""}`}
                    onClick={() => m.available!==false && addItem(m.name, m.price)}
                  >
                    {m.pop && <div className="tile-pop"/>}
                    <div className="tile-name">{m.name}</div>
                  </div>
                )
              )}
              {menuItems.length === 0 && (
                <div style={{gridColumn:"1/-1",textAlign:"center",color:"var(--t4)",padding:"48px 0",fontSize:14,fontWeight:500}}>
                  No items found
                </div>
              )}
            </div>
          </div>

          {/* â”€â”€ CATEGORY COLUMN (right) â”€â”€ */}
          <div className="cat-col">
            {categories.map(c => {
              const col = CAT_COLORS[c] || CAT_COLORS.All;
              const on  = activeCat === c;
              return (
                <button
                  key={c}
                  className="cat-btn"
                  style={on
                    ? {background:col.active, borderColor:col.active, color:'#fff',
                       boxShadow:`0 4px 12px ${col.active}44`}
                    : {background:col.bg, borderColor:col.border, color:col.text}
                  }
                  onClick={() => setActiveCat(c)}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* â”€â”€ PAYMENT OVERLAY â”€â”€ */}
      {showPay && (
        <div className="overlay" onClick={()=>setShowPay(false)}>
          <div className="ov-card" onClick={e=>e.stopPropagation()}>

            {/* Header */}
            <div className="ov-title">Confirm & Pay</div>
            <div className="ov-sub">{order?.order_number || "New order"}</div>

            {/* â”€â”€ ORDER METHOD â€” mandatory â”€â”€ */}
            <div className="om-section">How is this order? *</div>
            <div className="om-row">
              <div className={`om-opt${orderType==="Dine in"?" on":""}`} onClick={()=>setOrderType("Dine in")}>
                <div className="om-ico">ðŸ½</div>
                <div className="om-lbl">Dine In</div>
                <div className="om-sub">Eating here</div>
              </div>
              <div className={`om-opt${orderType==="Takeaway"?" on":""}`} onClick={()=>setOrderType("Takeaway")}>
                <div className="om-ico">ðŸ›</div>
                <div className="om-lbl">Takeaway</div>
                <div className="om-sub">Taking away</div>
              </div>
              <div className={`om-opt${orderType==="Delivery"?" on":""}`} onClick={()=>setOrderType("Delivery")}>
                <div className="om-ico">ðŸ›µ</div>
                <div className="om-lbl">Delivery</div>
                <div className="om-sub">Going out</div>
              </div>
            </div>

            <div className="pay-section-div"/>

            {/* â”€â”€ PAYMENT METHOD â”€â”€ */}
            <div className="om-section">Payment method *</div>
            <div className="tender-row">
              <div className={`tender-opt${tender==="Cash"?" on":""}`} onClick={()=>setTender("Cash")}>
                <div className="t-ico">ðŸ’µ</div>
                <div className="t-lbl">Cash</div>
                <div className="t-sub">Count & tender</div>
              </div>
              <div className={`tender-opt${offline?" dis":tender==="Card"?" on":""}`} onClick={()=>!offline&&setTender("Card")}>
                <div className="t-ico" style={{opacity:offline?.4:1}}>ðŸ’³</div>
                <div className="t-lbl">Card</div>
                <div className="t-sub">{offline?"Unavailable offline":"External terminal"}</div>
              </div>
            </div>

            {/* â”€â”€ AMOUNT DUE â”€â”€ */}
            <div className="ov-due">
              <span className="ov-due-lbl">Amount due</span>
              <span className="ov-due-val">{fmtN(total)}<span>L</span></span>
            </div>

            {/* â”€â”€ UPSELL PROMPT â€” one suggestion only â”€â”€ */}
            {showUpsell && (
              <>
                <div className="upsell-strip">
                  <div className="upsell-text">
                    <div className="upsell-say">"{upsellItem.say}"</div>
                    <div className="upsell-name">{upsellItem.name}</div>
                    <div className="upsell-price">{fmtN(upsellItem.price)} L</div>
                  </div>
                  <button className="upsell-add"
                    onClick={()=>{addItem(upsellItem.name,upsellItem.price);setUpsellDismissed(true);}}>
                    + Add
                  </button>
                </div>
                <button className="upsell-skip" onClick={()=>setUpsellDismissed(true)}>No thanks</button>
              </>
            )}

            {/* â”€â”€ CASH TENDERED â€” NumPad â”€â”€ */}
            {tender==="Cash" && (
              <>
                <div className="c-inp-lbl">Cash tendered (ALL)</div>
                <div
                  className={`po-amt-display${cashGiven?'':' zero'}`}
                  style={{marginBottom:12,cursor:'pointer'}}
                  onClick={()=>openNumPad('AMOUNT', cashGiven, v=>setCashGiven(v))}
                >
                  {cashGiven ? fmtN(parseInt(cashGiven,10)) + ' L' : 'Tap to enter'}
                </div>
                {cashGiven && parseInt(cashGiven,10)>=total && (
                  <div className="change-blk">
                    <span className="ch-lbl">Change</span>
                    <span className="ch-amt">{fmtN(Math.max(0,parseInt(cashGiven,10)-total))} L</span>
                  </div>
                )}
              </>
            )}

            {tender==="Card" && (
              <div style={{textAlign:"center",color:"var(--t3)",fontSize:13,marginBottom:20,lineHeight:1.6}}>
                Process payment on the external card terminal,<br/>then confirm below.
              </div>
            )}

            <button className="ov-cfm" onClick={confirmPayment}
              disabled={
                !orderType ||
                (tender==="Cash" && (!cashGiven || parseInt(cashGiven,10)<total))
              }>
              Confirm Payment
            </button>
            <button className="ov-cnl" onClick={()=>setShowPay(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* â”€â”€ SESSION CLOSE OVERLAY â”€â”€ */}
      {showClose && (
        <div className="overlay" onClick={()=>setShowClose(false)}>
          <div className="close-card" onClick={e=>e.stopPropagation()} style={{maxHeight:'90vh',overflowY:'auto'}}>
            <div className="cl-title">Close Session</div>
            <div className="cl-sub">Count the cash drawer and declare the total amount.</div>
            {closeData && (
              <div className="cl-rows">
                <div className="cl-row"><span className="lbl">Starting float</span><span className="val">{fmtN(closeData.startingBasis)} L</span></div>
                <div className="cl-row"><span className="lbl">Cash collected</span><span className="val">+{fmtN(closeData.cashIn)} L</span></div>
                <div className="cl-row"><span className="lbl">Orders</span><span className="val">{closeData.ordersCount}</span></div>
                {(closeData.paidOutTotal||0)>0 && (
                  <div className="cl-row" style={{color:'var(--amber)'}}>
                    <span className="lbl">Paid Outs <span className="cl-po-badge">{(closeData.paidOutList||[]).length}</span></span>
                    <span className="val">âˆ’{fmtN(closeData.paidOutTotal)} L</span>
                  </div>
                )}
                <div className="cl-row tot"><span className="lbl">Expected in drawer</span><span className="val">{fmtN(closeData.expected)} L</span></div>
              </div>
            )}
            {closeData && (closeData.paidOutList||[]).length>0 && (
              <div style={{marginBottom:12}}>
                <div className="cl-section">Paid Out Detail</div>
                {closeData.paidOutList.map((po,i)=>(
                  <div key={i} className="cl-po-item">
                    <span style={{color:'var(--t3)'}}>{po.category_code}{po.note?` Â· ${po.note.slice(0,30)}`:''}</span>
                    <span style={{fontWeight:700,fontVariantNumeric:'tabular-nums'}}>{fmtN(po.amount)} L</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--t3)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Declare cash (ALL)</div>
              <div
                className={`po-amt-display${cashDecl?'':' zero'}`}
                style={{marginBottom:0,cursor:'pointer'}}
                onClick={()=>openNumPad('DECLARE', cashDecl, v=>setCashDecl(v))}
              >
                {cashDecl ? fmtN(parseInt(cashDecl,10)) + ' L' : 'Tap to enter'}
              </div>
            </div>
            {cashDecl && closeData && (() => {
              const variance = parseInt(cashDecl,10) - closeData.expected;
              const absVar = Math.abs(variance);
              const needComment = absVar > 100;
              return (
                <>
                  <div className={`cl-var ${absVar>500?"warn":"ok"}`}>
                    <span className="lbl">{variance>=0?'Over':'Short'}</span>
                    <span className="val">{variance>=0?'+':''}{fmtN(variance)} L</span>
                  </div>
                  {needComment && (
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:"var(--amber)",textTransform:"uppercase",letterSpacing:".5px",marginBottom:6}}>
                        Explain variance (required)
                      </div>
                      <div
                        className="cl-comment"
                        style={{cursor:'pointer',minHeight:52,display:'flex',alignItems:'center',
                          color:closeComment?'var(--t1)':'var(--t5)',
                          fontStyle:closeComment?'normal':'italic'}}
                        onClick={()=>openKeyboard(closeComment,'Explain the cash discrepancy...',v=>setCloseComment(v))}
                      >{closeComment||'Tap to explain...'}</div>
                    </div>
                  )}
                  <button className="ov-cfm" onClick={finalizeClose}
                    disabled={!cashDecl || (needComment && !closeComment.trim())}>
                    Confirm & Close Session
                  </button>
                </>
              );
            })()}
            {!cashDecl && <button className="ov-cfm" disabled>Confirm & Close Session</button>}
            <button className="ov-cnl" style={{marginTop:8}} onClick={()=>setShowClose(false)}>Cancel</button>
          </div>
        </div>
      )}



      {/* â”€â”€ QWERTY KEYBOARD OVERLAY â”€â”€ */}
      {showKeyboard && (
        <div className="kbd-overlay">
          <div className="kbd-sheet" onClick={e=>e.stopPropagation()}>
            <div className="kbd-display">
              {kbdValue
                ? <>{kbdValue}<span style={{display:'inline-block',width:2,height:'1em',background:'var(--blue)',verticalAlign:'text-bottom',animation:'blink 1s step-end infinite',marginLeft:1}}/></>
                : <span className="kbd-display-ph">{kbdPlaceholder}</span>
              }
            </div>
            {/* Row 1 */}
            <div className="kbd-row">
              {(kbdShift?['Q','W','E','R','T','Y','U','I','O','P']:['q','w','e','r','t','y','u','i','o','p']).map(k=>(
                <button key={k} className="kk" onClick={()=>setKbdValue(v=>v+k)}>{k}</button>
              ))}
            </div>
            {/* Row 2 */}
            <div className="kbd-row">
              {(kbdShift?['A','S','D','F','G','H','J','K','L']:['a','s','d','f','g','h','j','k','l']).map(k=>(
                <button key={k} className="kk" onClick={()=>setKbdValue(v=>v+k)}>{k}</button>
              ))}
            </div>
            {/* Row 3 */}
            <div className="kbd-row">
              <button className="kk kk-dark" onClick={()=>setKbdShift(s=>!s)}>{kbdShift?'â¬†':'â‡§'}</button>
              {(kbdShift?['Z','X','C','V','B','N','M']:['z','x','c','v','b','n','m']).map(k=>(
                <button key={k} className="kk" onClick={()=>setKbdValue(v=>v+k)}>{k}</button>
              ))}
              <button className="kk kk-dark" onClick={()=>setKbdValue(v=>v.slice(0,-1))}>âŒ«</button>
            </div>
            {/* Row 4 â€” bottom */}
            <div className="kbd-row">
              <button className="kk kk-dark kk-num" onClick={()=>setKbdValue(v=>v+'1')}>1</button>
              <button className="kk kk-dark kk-num" onClick={()=>setKbdValue(v=>v+'2')}>2</button>
              <button className="kk kk-dark kk-num" onClick={()=>setKbdValue(v=>v+'3')}>3</button>
              <button className="kk kk-space" onClick={()=>setKbdValue(v=>v+' ')}>space</button>
              <button className="kk kk-dark kk-num" onClick={()=>setKbdValue(v=>v+'.')}>.</button>
              <button className="kk kk-dark kk-num" onClick={()=>setKbdValue(v=>v+',')}>ï¼Œ</button>
              <button className="kk kk-ok" onClick={()=>{
                if(kbdCallback) kbdCallback(kbdValue);
                setShowKeyboard(false);
              }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ NUMPAD OVERLAY â”€â”€ */}
      {showNumPad && (
        <div className="numpad-overlay" onClick={()=>setShowNumPad(false)}>
          <div className="numpad-sheet" onClick={e=>e.stopPropagation()}>
            <div className="numpad-label">
              {numPadTarget==='AMOUNT' ? 'Enter Amount (ALL)' : 'Declare Cash (ALL)'}
            </div>
            <div className="numpad-display">
              {numPadValue ? fmtN(parseInt(numPadValue,10)) + ' L' : <span style={{color:'var(--t5)'}}>0 L</span>}
            </div>
            <div className="numpad-grid">
              {['7','8','9','4','5','6','1','2','3'].map(k=>(
                <button key={k} className="nk" onClick={()=>numPadPress(k)}>{k}</button>
              ))}
              <button className="nk nk-cancel" onClick={()=>{setShowNumPad(false);}}>Cancel</button>
              <button className="nk nk-zero" onClick={()=>numPadPress('0')}>0</button>
              <button className="nk nk-del" onClick={()=>numPadPress('DEL')}>âŒ«</button>
              <button className="nk nk-ok" style={{gridColumn:'1/-1',height:56,borderRadius:16,fontSize:17}}
                onClick={()=>{
                  if(numPadCallback) numPadCallback(numPadValue);
                  setShowNumPad(false);
                }}
                disabled={!numPadValue}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ PAID OUT MODAL â”€â”€ */}
      {showPaidOut && (
        <div className="overlay" onClick={()=>setShowPaidOut(false)}>
          <div className="po-modal" onClick={e=>e.stopPropagation()}>
            <div className="po-title">Paid Out</div>
            <div className="po-sub">Cash taken from drawer Â· This will affect your session reconciliation</div>

            {/* Theoretical balance strip */}
            <div className="po-balance">
              <span style={{color:'var(--t3)',fontWeight:500}}>Theoretical drawer balance</span>
              <span style={{fontWeight:700,color:'var(--t1)',fontVariantNumeric:'tabular-nums'}}>
                {fmtN(theoreticalBalance())} L
              </span>
            </div>

            {poError && <div className="po-err">{poError}</div>}

            {/* â”€â”€ STEP: AMOUNT â”€â”€ */}
            {poStep==='AMOUNT' && (
              <>
                <div style={{fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:8}}>
                  Amount (ALL)
                </div>
                <div
                  className={`po-amt-display${poAmount?'':' zero'}`}
                  onClick={()=>openNumPad('AMOUNT', poAmount, v=>setPoAmount(v))}
                >
                  {poAmount ? fmtN(parseInt(poAmount,10)) + ' L' : 'Tap to enter'}
                </div>

                {parseInt(poAmount||'0',10) >= poConfig.thresholdManager && (
                  <div className="po-warn">
                    âš  Above {fmtN(poConfig.thresholdManager)} ALL â€” manager approval required
                  </div>
                )}
                {parseInt(poAmount||'0',10) >= poConfig.thresholdBlock && (
                  <div className="po-err">
                    Above {fmtN(poConfig.thresholdBlock)} ALL â€” blocked. Contact management.
                  </div>
                )}

                <div style={{display:'flex',gap:10}}>
                  <button className="ov-cnl" style={{flex:1}} onClick={()=>setShowPaidOut(false)}>Cancel</button>
                  <button className="ov-cfm" style={{flex:2}} onClick={poConfirmAmount}
                    disabled={!poAmount || parseInt(poAmount,10)<=0}>
                    Next â†’
                  </button>
                </div>
              </>
            )}

            {/* â”€â”€ STEP: CATEGORY â”€â”€ */}
            {poStep==='CATEGORY' && (
              <>
                <div style={{fontSize:13,fontWeight:700,color:'var(--t1)',marginBottom:4,fontVariantNumeric:'tabular-nums'}}>
                  {fmtN(parseInt(poAmount,10))} L
                </div>
                <div style={{fontSize:11,fontWeight:700,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:10}}>
                  Category
                </div>
                <div className="po-cats">
                  {poCategories.map(c=>(
                    <button key={c.code} className={`po-cat${poCat===c.code?' on':''}`}
                      onClick={()=>{setPoCat(c.code);setPoError('');}}>
                      {c.label}
                    </button>
                  ))}
                </div>

                {poCat && poCategories.find(c=>c.code===poCat)?.requires_note && (
                  <div
                    className="po-note"
                    style={{cursor:'pointer',color:poNote?'var(--t1)':'var(--t5)',fontStyle:poNote?'normal':'italic'}}
                    onClick={()=>openKeyboard(poNote,'Describe the purpose (required)...',v=>setPoNote(v))}
                  >{poNote||'Tap to enter reason (required)...'}</div>
                )}
                {poCat && !poCategories.find(c=>c.code===poCat)?.requires_note && (
                  <div
                    className="po-note"
                    style={{cursor:'pointer',color:poNote?'var(--t1)':'var(--t5)',fontStyle:poNote?'normal':'italic'}}
                    onClick={()=>openKeyboard(poNote,'Add a note (optional)...',v=>setPoNote(v))}
                  >{poNote||'Tap to add a note (optional)...'}</div>
                )}

                <div style={{display:'flex',gap:10}}>
                  <button className="ov-cnl" style={{flex:1}} onClick={()=>setPoStep('AMOUNT')}>â† Back</button>
                  <button className="ov-cfm" style={{flex:2}} onClick={poConfirmCategory}
                    disabled={poSubmitting}>
                    {poSubmitting ? 'Recording...' : 'Record Paid Out'}
                  </button>
                </div>
              </>
            )}

            {/* â”€â”€ STEP: APPROVER PIN â”€â”€ */}
            {poStep==='APPROVER' && (
              <>
                <div style={{background:'var(--ambertint)',border:'1px solid #FDE68A',borderRadius:12,padding:'12px 16px',marginBottom:18}}>
                  <div style={{fontWeight:700,fontSize:13,color:'#78350F',marginBottom:2}}>Manager approval required</div>
                  <div style={{fontSize:12,color:'#92400E'}}>
                    {fmtN(parseInt(poAmount,10))} ALL exceeds the {fmtN(poConfig.thresholdManager)} ALL threshold.
                    An authorised manager must enter their PIN.
                  </div>
                </div>
                <div className="po-pin-label">Approver PIN</div>
                <div className="po-pin-dots">
                  {[0,1,2,3].map(i=>(
                    <div key={i} className={`po-pin-dot${i<poApproverPin.length?' on':''}`}/>
                  ))}
                </div>
                {poApproverErr && <div className="po-err" style={{marginBottom:12}}>{poApproverErr}</div>}
                <div className="numpad-grid">
                  {['7','8','9','4','5','6','1','2','3'].map(k=>(
                    <button key={k} className="nk" onClick={()=>{
                      if(poApproverPin.length<4) setPoApproverPin(p=>p+k);
                    }}>{k}</button>
                  ))}
                  <button className="nk nk-cancel" onClick={()=>setPoStep('CATEGORY')}>â† Back</button>
                  <button className="nk nk-zero" onClick={()=>{
                    if(poApproverPin.length<4) setPoApproverPin(p=>p+'0');
                  }}>0</button>
                  <button className="nk nk-del" onClick={()=>setPoApproverPin(p=>p.slice(0,-1))}>âŒ«</button>
                  <button className="nk nk-ok" style={{gridColumn:'1/-1',height:56,borderRadius:16,fontSize:17}}
                    onClick={validateApproverPin}
                    disabled={poApproverPin.length!==4||poSubmitting}>
                    {poSubmitting?'Verifying...':'Confirm Approval'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ KITCHEN TOAST â”€â”€ */}
      {kitchenToast && (
        <div className="kitchen-toast">
          <div className="kt-ico">ðŸ³</div>
          <div>
            <div className="kt-title">Order sent to kitchen</div>
            <div className="kt-sub">Payment confirmed Â· Mock fiscal âœ“</div>
          </div>
        </div>
      )}

      {/* â”€â”€ ERROR TOAST â”€â”€ */}
      {errToast && (
        <div className="err-toast">
          <div className="et-ico">âš ï¸</div>
          <div>
            <div className="et-msg">{errToast.msg}</div>
            {errToast.sub && <div className="et-sub">{errToast.sub}</div>}
          </div>
        </div>
      )}
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   APP ROOT â€” URL-aware routing
   / â†’ role-based CC / Partners Portal
   /pos â†’ POS Terminal (POS_ROLES only)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MENU LIFECYCLE ENGINE â€” THREE COMMAND CENTRE SURFACES
// WT360 Universal Design System v1 â€” Full Compliance Build
// Marketing CC Â· Technical Director CC Â· CFO Finance CC
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

// â”€â”€â”€ DESIGN TOKENS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const WT = {
  // Backgrounds
  bgApp:        '#F4F5F7',
  bgPanel:      '#FFFFFF',
  bgMuted:      '#F8F9FB',
  bgSoft:       '#FBFCFD',
  // Borders
  border:       '#E8EAED',
  borderSoft:   '#ECEFF3',
  divider:      '#EFF1F4',
  // Text
  textPrimary:  '#1C1C1C',
  textStrong:   '#202020',
  textSecondary:'#6B7280',
  textTertiary: '#9CA3AF',
  textDisabled: '#B6BDC7',
  textOnDark:   '#F9FAFB',
  textDarkMuted:'#A7B0BE',
  // Brand blue â€” primary CTA
  blue600:      '#009DE0',
  blue700:      '#008DCA',
  blue050:      '#E6F6FD',
  blue100:      '#D8F0FB',
  // Semantic
  success600:   '#16A34A',
  success050:   '#EAF8EE',
  warning600:   '#F59E0B',
  warning050:   '#FFF6E5',
  error600:     '#EF4444',
  error050:     '#FDECEC',
  info600:      '#0284C7',
  info050:      '#E8F5FC',
  // Dark shell
  shellDark:    '#0D0E1A',
  shellActive:  '#171A27',
  shellBorder:  'rgba(255,255,255,0.06)',
  // Radii
  rSm:  '12px',
  rMd:  '14px',
  rLg:  '16px',
  rXl:  '20px',
  rXxl: '24px',
  rPill:'999px',
  // Shadows
  shadowPanel: '0 8px 30px rgba(16,24,40,0.06)',
  shadowTile:  '0 1px 4px rgba(16,24,40,0.06), 0 0 0 1px #E8EAED',
  shadowModal: '0 20px 50px rgba(16,24,40,0.16)',
  // Font
  font: "'DM Sans','Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
};

// â”€â”€â”€ MLC STAGE DATA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MLC_STAGES = {
  BRIEF_DRAFT:                { label:'Brief Draft',            color:WT.textSecondary, bg:WT.bgMuted,     border:WT.border },
  BRIEF_SUBMITTED:            { label:'Brief Submitted',        color:WT.blue600,       bg:WT.blue050,     border:WT.blue100 },
  BRIEF_REVISION_REQUESTED:   { label:'Revision Requested',     color:WT.warning600,    bg:WT.warning050,  border:'#F6E2AF' },
  BRIEF_ABANDONED:            { label:'Abandoned',              color:WT.textTertiary,  bg:WT.bgMuted,     border:WT.border },
  RECIPE_DRAFT:               { label:'Recipe Draft',           color:'#7C3AED',        bg:'#F5F3FF',      border:'#DDD6FE' },
  TESTING:                    { label:'Testing',                color:WT.info600,       bg:WT.info050,     border:'#BAE6FD' },
  RECIPE_REVISION:            { label:'Recipe Revision',        color:WT.warning600,    bg:WT.warning050,  border:'#F6E2AF' },
  OPERATIONAL_REVIEW:         { label:'Ops Review',             color:'#0F766E',        bg:'#F0FDFA',      border:'#99F6E4' },
  FINANCE_REVIEW:             { label:'Finance Review',         color:WT.success600,    bg:WT.success050,  border:'#BBF7D0' },
  FINANCE_REJECTED:           { label:'Finance Rejected',       color:WT.error600,      bg:WT.error050,    border:'#FECACA' },
  APPROVED_READY:             { label:'Approved â€” Ready',       color:WT.success600,    bg:WT.success050,  border:'#BBF7D0' },
  DEFERRED:                   { label:'Deferred',               color:WT.textSecondary, bg:WT.bgMuted,     border:WT.border },
  ARCHIVED_UNVIABLE:          { label:'Archived',               color:WT.textTertiary,  bg:WT.bgMuted,     border:WT.border },
  REACTIVATION_TECH_REVIEW:   { label:'Tech Reactivation',      color:'#7C3AED',        bg:'#F5F3FF',      border:'#DDD6FE' },
  REACTIVATION_FINANCE_REVIEW:{ label:'Finance Reactivation',   color:WT.success600,    bg:WT.success050,  border:'#BBF7D0' },
  RETIRED:                    { label:'Retired',                color:WT.textTertiary,  bg:WT.bgMuted,     border:WT.border },
};

const MLC_ACTIVATION = {
  LIVE:        { label:'Live',        color:WT.success600, bg:WT.success050, dot:'#22C55E' },
  SCHEDULED:   { label:'Scheduled',  color:WT.blue600,    bg:WT.blue050,    dot:WT.blue600 },
  INACTIVE:    { label:'Inactive',   color:WT.textSecondary, bg:WT.bgMuted, dot:WT.textTertiary },
  UNSCHEDULED: { label:'Unscheduled',color:WT.textTertiary,  bg:WT.bgSoft,  dot:WT.textDisabled },
};

// â”€â”€â”€ SHARED PRIMITIVES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StagePill({stage}) {
  const s = MLC_STAGES[stage] || {label:stage, color:WT.textSecondary, bg:WT.bgMuted, border:WT.border};
  return (
    <span style={{
      display:'inline-block', padding:'3px 10px', borderRadius:WT.rPill,
      fontSize:11, fontWeight:600, letterSpacing:'0.01em',
      color:s.color, background:s.bg, border:`1px solid ${s.border}`,
      fontFamily:WT.font, fontVariantNumeric:'tabular-nums'
    }}>{s.label}</span>
  );
}

function ActivationPill({status}) {
  const a = MLC_ACTIVATION[status] || MLC_ACTIVATION.INACTIVE;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px',
      borderRadius:WT.rPill, fontSize:11, fontWeight:600, letterSpacing:'0.01em',
      color:a.color, background:a.bg, fontFamily:WT.font
    }}>
      <span style={{width:6,height:6,borderRadius:'50%',background:a.dot,flexShrink:0}}/>
      {a.label}
    </span>
  );
}

// Card panel
function WtCard({children, style={}}) {
  return (
    <div style={{
      background:WT.bgPanel, borderRadius:WT.rLg,
      boxShadow:WT.shadowTile, padding:'20px 24px', ...style
    }}>{children}</div>
  );
}

// Modal
function WtModal({open, onClose, title, width=600, children}) {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(16,24,40,0.45)',
      zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center',
      backdropFilter:'blur(2px)'
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:WT.bgPanel, borderRadius:WT.rXxl, width, maxWidth:'95vw',
        maxHeight:'90vh', overflowY:'auto', padding:32, position:'relative',
        boxShadow:WT.shadowModal, fontFamily:WT.font
      }}>
        <button onClick={onClose} style={{
          position:'absolute', top:16, right:16, width:32, height:32,
          background:WT.bgMuted, border:`1px solid ${WT.border}`,
          borderRadius:WT.rSm, cursor:'pointer', color:WT.textSecondary,
          fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:WT.font
        }}>âœ•</button>
        <div style={{fontWeight:700, fontSize:18, marginBottom:24, color:WT.textStrong, paddingRight:40}}>{title}</div>
        {children}
      </div>
    </div>
  );
}

// Buttons
function WtBtn({children, onClick, variant='primary', size='md', disabled=false, style={}}) {
  const sizes = {
    sm: {padding:'7px 14px', fontSize:12, height:32},
    md: {padding:'9px 18px', fontSize:13, height:40},
    lg: {padding:'11px 24px', fontSize:14, height:44},
  };
  const variants = {
    primary:     {background:WT.blue600,    color:'#fff',           border:`1px solid ${WT.blue600}`},
    secondary:   {background:WT.bgPanel,    color:WT.textPrimary,   border:`1px solid ${WT.border}`},
    ghost:       {background:'transparent', color:WT.textSecondary, border:'1px solid transparent'},
    danger:      {background:WT.error050,   color:WT.error600,      border:`1px solid #FECACA`},
    success:     {background:WT.success050, color:WT.success600,    border:`1px solid #BBF7D0`},
    blue_ghost:  {background:WT.blue050,    color:WT.blue600,       border:`1px solid ${WT.blue100}`},
  };
  const v = variants[variant] || variants.primary;
  const s = sizes[size] || sizes.md;
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        ...s, ...v,
        borderRadius:WT.rMd, cursor:disabled?'not-allowed':'pointer',
        fontWeight:600, fontFamily:WT.font, opacity:disabled?0.45:1,
        display:'inline-flex', alignItems:'center', gap:6,
        transition:'all 0.12s', whiteSpace:'nowrap', ...style
      }}
    >{children}</button>
  );
}

// Field display
function WtField({label, value, sub, style={}}) {
  return (
    <div style={{...style}}>
      <div style={{fontSize:11, fontWeight:600, color:WT.textTertiary, textTransform:'uppercase',
        letterSpacing:'0.06em', marginBottom:4, fontFamily:WT.font}}>{label}</div>
      <div style={{fontSize:14, color:WT.textStrong, fontWeight:600,
        fontFamily:WT.font, fontVariantNumeric:'tabular-nums'}}>{value||'â€”'}</div>
      {sub && <div style={{fontSize:12, color:WT.textSecondary, marginTop:2, fontFamily:WT.font}}>{sub}</div>}
    </div>
  );
}

// Label/value input row
function WtInput({label, value, onChange, placeholder, type='text', style={}}) {
  return (
    <div style={{...style}}>
      <label style={{display:'block', fontSize:12, fontWeight:600, color:WT.textSecondary,
        marginBottom:6, fontFamily:WT.font}}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width:'100%', padding:'10px 14px', border:`1px solid ${WT.border}`,
          borderRadius:WT.rMd, fontSize:13, fontFamily:WT.font, color:WT.textPrimary,
          background:WT.bgPanel, outline:'none', boxSizing:'border-box',
          fontVariantNumeric:'tabular-nums'
        }}
      />
    </div>
  );
}

function WtSelect({label, value, onChange, children, style={}}) {
  return (
    <div style={{...style}}>
      {label && <label style={{display:'block', fontSize:12, fontWeight:600, color:WT.textSecondary,
        marginBottom:6, fontFamily:WT.font}}>{label}</label>}
      <select value={value} onChange={onChange} style={{
        width:'100%', padding:'10px 14px', border:`1px solid ${WT.border}`,
        borderRadius:WT.rMd, fontSize:13, fontFamily:WT.font, color:WT.textPrimary,
        background:WT.bgPanel, outline:'none', boxSizing:'border-box'
      }}>{children}</select>
    </div>
  );
}

function WtTextarea({label, value, onChange, placeholder, rows=3, style={}}) {
  return (
    <div style={{...style}}>
      {label && <label style={{display:'block', fontSize:12, fontWeight:600, color:WT.textSecondary,
        marginBottom:6, fontFamily:WT.font}}>{label}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{
        width:'100%', padding:'10px 14px', border:`1px solid ${WT.border}`,
        borderRadius:WT.rMd, fontSize:13, fontFamily:WT.font, color:WT.textPrimary,
        background:WT.bgPanel, outline:'none', resize:'vertical', boxSizing:'border-box'
      }}/>
    </div>
  );
}

// Empty state
function WtEmpty({icon, title, subtitle}) {
  return (
    <div style={{textAlign:'center', padding:'56px 24px', color:WT.textTertiary, fontFamily:WT.font}}>
      <div style={{width:48, height:48, borderRadius:WT.rLg, background:WT.bgMuted,
        border:`1px solid ${WT.border}`, display:'inline-flex', alignItems:'center',
        justifyContent:'center', marginBottom:16}}>
        {icon && <Icon name={icon} size={22} color={WT.textTertiary}/>}
      </div>
      <div style={{fontWeight:600, fontSize:15, color:WT.textSecondary, marginBottom:6}}>{title}</div>
      {subtitle && <div style={{fontSize:13, color:WT.textTertiary}}>{subtitle}</div>}
    </div>
  );
}

// KPI card
function WtKpi({label, value, sub, icon, color, onClick}) {
  return (
    <div onClick={onClick} style={{
      background:WT.bgPanel, borderRadius:WT.rXl, boxShadow:WT.shadowTile,
      padding:'20px 24px', cursor:onClick?'pointer':'default',
      transition:'box-shadow 0.15s', fontFamily:WT.font
    }}
    onMouseEnter={e=>onClick&&(e.currentTarget.style.boxShadow=WT.shadowPanel)}
    onMouseLeave={e=>onClick&&(e.currentTarget.style.boxShadow=WT.shadowTile)}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
        <div style={{fontSize:12, fontWeight:600, color:WT.textTertiary, textTransform:'uppercase',
          letterSpacing:'0.06em'}}>{label}</div>
        {icon && <div style={{width:32, height:32, borderRadius:WT.rSm, background:WT.bgMuted,
          border:`1px solid ${WT.border}`, display:'flex', alignItems:'center', justifyContent:'center'}}>
          {icon}
        </div>}
      </div>
      <div style={{fontSize:32, fontWeight:700, color:color||WT.textStrong, lineHeight:1.1,
        fontVariantNumeric:'tabular-nums'}}>{value}</div>
      {sub && <div style={{fontSize:12, color:WT.textSecondary, marginTop:6}}>{sub}</div>}
    </div>
  );
}

// Toast notification
function WtToast({toast}) {
  if (!toast) return null;
  const map = {
    success: {bg:WT.success050, border:'#BBF7D0', color:WT.success600},
    error:   {bg:WT.error050,   border:'#FECACA',  color:WT.error600},
    warn:    {bg:WT.warning050, border:'#F6E2AF',  color:WT.warning600},
    info:    {bg:WT.info050,    border:'#BAE6FD',  color:WT.info600},
  };
  const t = map[toast.type] || map.success;
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, padding:'12px 20px',
      background:t.bg, border:`1px solid ${t.border}`, borderRadius:WT.rLg,
      fontWeight:600, fontSize:13, zIndex:9999, color:t.color,
      maxWidth:380, boxShadow:WT.shadowPanel, fontFamily:WT.font
    }}>{toast.msg}</div>
  );
}

// Section header
function WtPageHeader({title, subtitle, action}) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start',
      marginBottom:24, fontFamily:WT.font}}>
      <div>
        <h1 style={{fontSize:24, fontWeight:700, color:WT.textStrong, margin:0,
          lineHeight:1.2, letterSpacing:'-0.02em'}}>{title}</h1>
        {subtitle && <p style={{fontSize:14, color:WT.textSecondary, margin:'4px 0 0', fontWeight:400}}>{subtitle}</p>}
      </div>
      {action && <div style={{flexShrink:0, marginLeft:16}}>{action}</div>}
    </div>
  );
}

// Sidebar item
function SbItem({label, iconName, active, badge, onClick, exp}) {
  return (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
      borderRadius:WT.rSm, cursor:'pointer', marginBottom:2,
      background: active ? WT.shellActive : 'transparent',
      color: active ? WT.textOnDark : WT.textDarkMuted,
      fontWeight: active ? 600 : 400, transition:'all 0.12s',
      justifyContent: exp ? 'flex-start' : 'center',
    }}>
      {iconName && <Icon name={iconName} size={16} color={active ? WT.textOnDark : WT.textDarkMuted}/>}
      {exp && <span style={{fontSize:13, flex:1, fontFamily:WT.font}}>{label}</span>}
      {exp && badge != null && badge > 0 && (
        <span style={{
          background: WT.error600, color:'#fff', fontSize:10, fontWeight:700,
          padding:'1px 6px', borderRadius:WT.rPill, fontFamily:WT.font
        }}>{badge}</span>
      )}
    </div>
  );
}

// â”€â”€â”€ DATA HOOK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function useMLCData(SB, brandId) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await SB
        .from('menu_products')
        .select(`
          *,
          menu_product_lifecycle(*),
          product_briefs(id,brief_no,brief_status,working_title,target_selling_price,
            target_margin_floor_pct,positioning,strategic_rationale,channel_intent,
            submitted_at,returned_notes,mandatory_constraints),
          formula_headers(
            id,
            formula_versions(id,version_no,technical_status,product_type_snapshot,
              target_portion_qty,target_portion_uom,tested_portion_qty,
              theoretical_cogs_cache,tested_cogs_last,approved_at,approved_by)
          ),
          menu_product_versions(id,version_no,approved_selling_price,tested_cogs,
            gross_margin_pct,max_discount_headroom_pct,published_at,cfo_approved_at),
          menu_product_activations(id,activation_status,scheduled_live_at,
            actual_live_at,actual_inactive_at,
            menu_product_activation_scopes(location_id,channel_type))
        `)
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });
      setProducts(data || []);
    } catch(e) { console.error('useMLCData error:', e); }
    setLoading(false);
  }, [SB, brandId]);

  useEffect(() => { load(); }, [load]);
  return { products, loading, reload: load };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MARKETING COMMAND CENTRE
// WT360 Universal Design System v1
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•


