export const POS_CSS = `
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
.tb-btn.out:hover{border-color:var(--red);}
`;
