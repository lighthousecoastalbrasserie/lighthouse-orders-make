const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800&family=Barlow+Condensed:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
:root {
  --bg:#f0f4f8;
  --surface:#ffffff;
  --surface2:#e8f0f7;
  --surface3:#d4e4f0;
  --border:#b8d0e8;
  --border2:#8ab4d4;
  --text:#1a2f45;
  --text2:#2d5070;
  --muted:#6b90aa;
  --yellow:#f5a700;
  --yellow-dim:#f5a70018;
  --green:#00897b;
  --green-dim:#00897b18;
  --red:#c62828;
  --red-dim:#c6282818;
  --blue:#1565c0;
  --blue-dim:#1565c018;
  --orange:#e65100;
  --orange-dim:#e6510018;
  --navy:#1a2f45;
  --font:'Barlow',sans-serif;
  --font-cond:'Barlow Condensed',sans-serif;
  --font-mono:'JetBrains Mono',monospace;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:14px;line-height:1.5;}
::-webkit-scrollbar{width:5px;height:5px;}
::-webkit-scrollbar-track{background:var(--bg);}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
input,select,textarea,button{font-family:var(--font);}
.layout{display:flex;min-height:100vh;}
.sidebar{width:220px;background:var(--navy);display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto;}
.sidebar.mobile-open{transform:translateX(0);}
.mobile-overlay{display:none;}
.hamburger{display:none;}
.mobile-header{display:none;}
@media(max-width:768px){
  .sidebar{position:fixed;top:0;left:0;height:100vh;z-index:100;transform:translateX(-100%);transition:transform .3s ease;width:260px;}
  .sidebar.mobile-open{transform:translateX(0);}
  .mobile-overlay{display:block;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99;}
  .hamburger{display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:var(--navy);border:none;border-radius:8px;cursor:pointer;flex-direction:column;gap:5px;padding:10px;}
  .hamburger span{display:block;width:20px;height:2px;background:#fff;border-radius:2px;}
  .mobile-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--navy);position:sticky;top:0;z-index:50;width:100%;}
  .mobile-header img{height:28px;}
  .main{padding:12px;width:100%;}
  .layout{flex-direction:column;}
  table{display:none;}
  .tbl-wrap{overflow-x:visible;}
}
  .sidebar.mobile-open{transform:translateX(0);}
  .mobile-overlay{display:block;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99;}
  .hamburger{display:flex;align-items:center;justify-content:center;width:40px;height:40px;background:var(--navy);border:none;border-radius:8px;cursor:pointer;flex-direction:column;gap:5px;padding:10px;}
  .hamburger span{display:block;width:20px;height:2px;background:#fff;border-radius:2px;}
  .mobile-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--navy);position:sticky;top:0;z-index:50;}
  .mobile-header img{height:32px;}
  .main{padding:16px;}
}
.sidebar-logo{padding:24px 20px 20px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:8px;}
.logo-main{font-family:var(--font-cond);font-size:22px;font-weight:800;letter-spacing:1px;color:var(--yellow);}
.logo-sub{font-size:10px;font-weight:600;letter-spacing:3px;color:rgba(255,255,255,.5);margin-top:3px;text-transform:uppercase;}
.nav-btn{display:flex;align-items:center;gap:10px;padding:12px 20px;background:none;border:none;border-left:3px solid transparent;color:rgba(255,255,255,.6);font-size:13px;font-weight:600;width:100%;text-align:left;cursor:pointer;transition:all .15s;}
.nav-btn:hover{color:#fff;background:rgba(255,255,255,.08);}
.nav-btn.active{color:var(--yellow);border-left-color:var(--yellow);background:rgba(245,167,0,.12);}
.nav-user{margin-top:auto;padding:16px 20px;border-top:1px solid rgba(255,255,255,.1);}
.nav-user-name{font-weight:700;color:#fff;font-size:13px;}
.nav-user-role{font-size:11px;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:1px;}
.main{flex:1;padding:28px 32px;min-width:0;overflow-x:hidden;}
.page-title{font-family:var(--font-cond);font-size:28px;font-weight:800;letter-spacing:.5px;color:var(--navy);}
.page-sub{color:var(--muted);font-size:12px;font-family:var(--font-mono);margin-top:2px;margin-bottom:24px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px;box-shadow:0 1px 4px rgba(26,47,69,.06);}
.card-hd{font-family:var(--font-cond);font-size:11px;font-weight:700;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:18px 20px;box-shadow:0 1px 4px rgba(26,47,69,.06);}
.stat-val{font-family:var(--font-cond);font-size:36px;font-weight:800;letter-spacing:-1px;line-height:1;}
.stat-lbl{font-size:11px;color:var(--muted);font-family:var(--font-mono);margin-top:4px;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.g3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.tbl-wrap{overflow-x:auto;}
table{width:100%;border-collapse:collapse;font-size:13px;}
th{padding:8px 12px;text-align:left;font-size:10px;font-weight:700;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;border-bottom:2px solid var(--border);white-space:nowrap;background:var(--surface2);}
td{padding:10px 12px;border-bottom:1px solid var(--border);vertical-align:middle;}
tr:last-child td{border-bottom:none;}
tr:hover td{background:var(--surface2);}
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;font-family:var(--font-mono);white-space:nowrap;}
.badge-green{background:var(--green-dim);color:var(--green);}
.badge-red{background:var(--red-dim);color:var(--red);}
.badge-yellow{background:var(--yellow-dim);color:var(--yellow);}
.badge-blue{background:var(--blue-dim);color:var(--blue);}
.badge-orange{background:var(--orange-dim);color:var(--orange);}
.badge-gray{background:var(--surface2);color:var(--muted);border:1px solid var(--border);}
.badge-navy{background:var(--navy);color:#fff;}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:6px;font-size:13px;font-weight:700;border:none;cursor:pointer;transition:all .15s;}
.btn-yellow{background:var(--yellow);color:#fff;}.btn-yellow:hover{background:#d4920a;}
.btn-navy{background:var(--navy);color:#fff;}.btn-navy:hover{opacity:.85;}
.btn-green{background:var(--green);color:#fff;}.btn-green:hover{opacity:.85;}
.btn-red{background:var(--red-dim);color:var(--red);border:1px solid var(--red);}.btn-red:hover{background:var(--red);color:#fff;}
.btn-ghost{background:transparent;color:var(--text2);border:1px solid var(--border);}.btn-ghost:hover{border-color:var(--border2);background:var(--surface2);}
.btn-blue{background:var(--blue-dim);color:var(--blue);border:1px solid var(--blue);}.btn-blue:hover{background:var(--blue);color:#fff;}
.btn-orange{background:var(--orange-dim);color:var(--orange);border:1px solid var(--orange);}.btn-orange:hover{background:var(--orange);color:#fff;}
.btn-sm{padding:5px 10px;font-size:11px;border-radius:5px;}
.btn-xs{padding:3px 8px;font-size:10px;border-radius:4px;}
.btn-lg{padding:12px 28px;font-size:15px;}
.inp{background:var(--surface);border:1px solid var(--border);border-radius:6px;color:var(--text);padding:8px 12px;font-size:13px;outline:none;transition:border-color .15s;width:100%;}
.inp:focus{border-color:var(--yellow);box-shadow:0 0 0 3px var(--yellow-dim);}
.inp-sm{padding:5px 10px;font-size:12px;}
.inp-center{text-align:center;}
.lbl{font-size:10px;font-weight:700;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;display:block;margin-bottom:5px;}
.fg{display:flex;flex-direction:column;gap:2px;}
.overlay{position:fixed;inset:0;background:rgba(26,47,69,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:200;padding:20px;}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(26,47,69,.2);}
.modal-lg{max-width:860px;}
.modal-title{font-family:var(--font-cond);font-size:22px;font-weight:800;margin-bottom:20px;color:var(--navy);}
.filter-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:16px;}
.cat-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex-shrink:0;}
.divider{border:none;border-top:1px solid var(--border);margin:16px 0;}
.toast{position:fixed;bottom:24px;right:24px;background:var(--navy);color:#fff;padding:12px 20px;border-radius:8px;font-weight:700;font-size:13px;z-index:999;animation:fadeUp .3s ease;box-shadow:0 4px 20px rgba(26,47,69,.3);}
.toast-err{background:var(--red);}
.toast-ok{background:var(--green);}
@keyframes fadeUp{from{transform:translateY(16px);opacity:0;}to{transform:translateY(0);opacity:1;}}
.loading{display:flex;align-items:center;justify-content:center;height:100vh;font-family:var(--font-cond);font-size:22px;font-weight:700;color:var(--navy);gap:12px;background:var(--bg);}
.spinner{width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--yellow);border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.pin-screen{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--navy);}
.pin-card{background:#ffffff;border-radius:20px;padding:40px;width:100%;max-width:380px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3);}
.pin-logo{font-family:var(--font-cond);font-size:32px;font-weight:800;color:var(--yellow);letter-spacing:2px;margin-bottom:4px;}
.pin-sub{font-size:11px;color:var(--muted);letter-spacing:3px;text-transform:uppercase;margin-bottom:32px;}
.pin-dots{display:flex;justify-content:center;gap:12px;margin-bottom:28px;}
.pin-dot{width:16px;height:16px;border-radius:50%;border:2px solid var(--border);transition:all .2s;}
.pin-dot.filled{background:var(--yellow);border-color:var(--yellow);}
.pin-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}
.pin-btn{padding:18px;border:1px solid var(--border);border-radius:10px;background:var(--surface2);color:var(--text);font-size:20px;font-weight:700;cursor:pointer;transition:all .15s;}
.pin-btn:hover{background:var(--yellow);color:#fff;border-color:var(--yellow);}
.pin-btn:active{transform:scale(.95);}
.pin-error{color:var(--red);font-size:13px;font-weight:600;margin-top:8px;}
.sup-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;cursor:pointer;border:2px solid transparent;transition:all .12s;}
.sup-chip.active{border-color:currentColor;}
.section-header{background:var(--navy);color:#fff;padding:8px 16px;font-family:var(--font-cond);font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;border-radius:6px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;}
.section-sub{color:var(--yellow);font-size:12px;}
.order-qty-inp{width:80px;text-align:center;font-weight:700;font-size:14px;padding:6px;border:2px solid var(--border);border-radius:6px;background:var(--surface);color:var(--text);outline:none;}
.order-qty-inp:focus{border-color:var(--yellow);}
.order-qty-inp.has-value{border-color:var(--green);background:var(--green-dim);}
.stock-inp{width:80px;text-align:center;font-size:13px;padding:6px;border:1px solid var(--border);border-radius:6px;background:var(--surface2);color:var(--text);outline:none;}
.stock-inp:focus{border-color:var(--blue);}
.history-row{padding:14px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;}
.history-row:hover{background:var(--surface2);}
.history-row:last-child{border-bottom:none;}
.flex{display:flex;}.flex-col{flex-direction:column;}.items-center{align-items:center;}.items-start{align-items:flex-start;}
.justify-between{justify-content:space-between;}.justify-end{justify-content:flex-end;}.justify-center{justify-content:center;}
.gap4{gap:4px;}.gap6{gap:6px;}.gap8{gap:8px;}.gap10{gap:10px;}.gap12{gap:12px;}.gap16{gap:16px;}.gap20{gap:20px;}
.mt4{margin-top:4px;}.mt8{margin-top:8px;}.mt12{margin-top:12px;}.mt16{margin-top:16px;}.mt20{margin-top:20px;}.mt24{margin-top:24px;}
.mb4{margin-bottom:4px;}.mb8{margin-bottom:8px;}.mb12{margin-bottom:12px;}.mb16{margin-bottom:16px;}.mb20{margin-bottom:20px;}
.text-sm{font-size:12px;}.text-xs{font-size:11px;}.text-muted{color:var(--muted);}.text-navy{color:var(--navy);}
.text-yellow{color:var(--yellow);}.text-green{color:var(--green);}.text-red{color:var(--red);}
.font-mono{font-family:var(--font-mono);}.font-bold{font-weight:700;}.font-cond{font-family:var(--font-cond);}
.w100{width:100%;}.text-right{text-align:right;}.text-center{text-align:center;}
.rounded{border-radius:8px;}.shadow{box-shadow:0 2px 8px rgba(26,47,69,.1);}
`;

export default STYLES;
