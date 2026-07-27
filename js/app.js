/* =========================================================
   LulaSecSystem — Main Application
   Pages, routing, event handling
   ========================================================= */

(function () {
  'use strict';

  // ---- State ----
  let currentPage = 'dashboard';
  let notifOpen = false;
  let theme = localStorage.getItem('lula_theme') || 'dark';

  // ---- DOM refs ----
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // =========================================================
  // INIT
  // =========================================================
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    buildDemoAccounts();
    bindGlobalEvents();
    if (window.LulaAuth.isAuthenticated()) {
      showApp();
    } else {
      showLanding();
    }
  });

  // =========================================================
  // GLOBAL EVENTS
  // =========================================================
  function bindGlobalEvents() {
    // Landing buttons
    document.addEventListener('click', handleClick);
    // Login form
    $('#login-form').addEventListener('submit', handleLoginSubmit);
    // Search
    $('#global-search').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = e.target.value.trim();
        if (q) toast('Search', `Searching for "${q}"…`, 'info');
      }
    });
    // Cmd+K
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        $('#global-search').focus();
      }
      if (e.key === 'Escape') {
        if (!$('#generic-modal').hidden) closeGenericModal();
        if (!$('#login-modal').hidden) closeModal();
      }
    });
    // Sidebar collapse
    $('#sidebar-collapse').addEventListener('click', () => {
      $('#sidebar').classList.toggle('collapsed');
    });
    $('#mobile-menu-btn').addEventListener('click', () => {
      $('#sidebar').classList.toggle('mobile-open');
    });
  }

  function handleClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const role = target.dataset.role;
    const id = target.dataset.id;

    switch (action) {
      case 'show-login':
        if (role) {
          // Pre-fill demo
          const user = window.LulaDB.users.find(u => u.role === role);
          if (user) {
            $('#login-email').value = user.email;
            $('#login-password').value = 'Demo1234!';
          }
        }
        showLoginModal();
        break;
      case 'close-modal': closeModal(); break;
      case 'close-generic': closeGenericModal(); break;
      case 'logout': doLogout(); break;
      case 'forgot':
        toast('Password Reset', 'A reset link would be sent to your email in production.', 'info');
        break;
      case 'open-docs': openDocsModal(); break;
      case 'open-demo-info': openDemoInfo(); break;
      case 'open-notifications': toggleNotifications(); break;
      case 'mark-all-read': markAllRead(); break;
      case 'toggle-theme': toggleTheme(); break;
      case 'panic': triggerPanic(); break;
      case 'cancel-panic': cancelPanic(); break;
      case 'nav':
        navigate(target.dataset.page);
        $('#sidebar').classList.remove('mobile-open');
        break;
      // Incident actions
      case 'new-incident': newIncidentModal(); break;
      case 'view-incident': viewIncident(id); break;
      case 'assign-incident': assignIncidentModal(id); break;
      case 'resolve-incident':
        window.LulaDB.updateIncident(id, { status: 'resolved' });
        toast('Incident resolved', `Incident ${id} marked as resolved.`, 'success');
        renderPage();
        renderSidebar();
        break;
      case 'close-incident':
        window.LulaDB.updateIncident(id, { status: 'closed' });
        toast('Incident closed', `Incident ${id} closed.`, 'info');
        renderPage();
        renderSidebar();
        break;
      // Visitor actions
      case 'new-visitor': newVisitorModal(); break;
      case 'checkin-visitor':
        const v = window.LulaDB.visitors.find(x => x.id === id);
        if (v) {
          v.status = 'checked-in';
          v.checkIn = new Date().toISOString();
          window.LulaDB.addNotification({ type: 'info', icon: '🪪', title: 'Visitor checked in', text: `${v.name} (${v.passCode}) at ${v.site}` });
          toast('Checked in', `${v.name} has been checked in.`, 'success');
          renderPage();
          renderSidebar();
        }
        break;
      case 'checkout-visitor':
        const vv = window.LulaDB.visitors.find(x => x.id === id);
        if (vv) {
          vv.status = 'checked-out';
          vv.checkOut = new Date().toISOString();
          toast('Checked out', `${vv.name} has been checked out.`, 'info');
          renderPage();
        }
        break;
      // Guard actions
      case 'view-guard': viewGuard(id); break;
      case 'checkpoint-scan': checkpointScan(); break;
      case 'request-backup': requestBackup(); break;
      // Camera actions
      case 'view-camera': viewCamera(id); break;
      // Access actions
      case 'toggle-access': toggleAccess(id); break;
      // Generic
      case 'submit-incident': submitIncident(target); break;
      case 'submit-visitor': submitVisitor(target); break;
    }
  }

  // =========================================================
  // LANDING / LOGIN
  // =========================================================
  function showLanding() {
    $('#landing-page').hidden = false;
    $('#app-shell').hidden = true;
  }

  function showLoginModal() {
    $('#login-modal').hidden = false;
    $('#login-error').hidden = true;
    setTimeout(() => $('#login-email').focus(), 100);
  }
  function closeModal() { $('#login-modal').hidden = true; }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    const errEl = $('#login-error');
    errEl.hidden = true;
    const res = window.LulaAuth.login(email, password);
    if (!res.ok) {
      errEl.textContent = res.error;
      errEl.hidden = false;
      return;
    }
    closeModal();
    showApp();
    toast('Welcome back!', `Signed in as ${res.user.name} (${window.LulaDB.roles[res.user.role].label})`, 'success');
  }

  function buildDemoAccounts() {
    const grid = $('#demo-grid');
    const demos = [
      { role: 'admin',    icon: '🛡️', label: 'Administrator',    sub: 'admin@lulasecsystem.com' },
      { role: 'officer',  icon: '🎯', label: 'Security Officer', sub: 'officer@lulasecsystem.com' },
      { role: 'guard',    icon: '👮', label: 'Security Guard',   sub: 'guard@lulasecsystem.com' },
      { role: 'resident', icon: '🏠', label: 'Resident',         sub: 'resident@lulasecsystem.com' },
      { role: 'visitor',  icon: '🪪', label: 'Visitor',          sub: 'visitor@lulasecsystem.com' }
    ];
    grid.innerHTML = demos.map(d => `
      <button class="demo-btn" data-action="show-login" data-role="${d.role}">
        <div class="demo-avatar">${d.icon}</div>
        <div class="demo-info">
          <strong>${d.label}</strong>
          <span>${d.sub}</span>
        </div>
      </button>
    `).join('');
  }

  function openDemoInfo() {
    const body = `
      <h2 style="margin-top:0">🎬 Try a Demo Account</h2>
      <p class="text-muted">LulaSecSystem supports 5 distinct user roles. Click any account below to log in instantly — no password needed (it's pre-filled).</p>
      <div class="demo-grid" style="grid-template-columns:1fr; gap:12px; margin-top:16px;">
        ${[
          { r:'admin', icon:'🛡️', name:'Administrator', desc:'Full system access — manage everything: users, sites, policies & analytics. Best for exploring the entire platform.' },
          { r:'officer', icon:'🎯', name:'Security Officer', desc:'Operational command center — incident triage, guard dispatch, live surveillance.' },
          { r:'guard', icon:'👮', name:'Security Guard', desc:'Field ops view — patrol routes, incident reporting, panic button, comms.' },
          { r:'resident', icon:'🏠', name:'Resident', desc:'Community member — pre-register guests, report issues, neighborhood watch.' },
          { r:'visitor', icon:'🪪', name:'Visitor', desc:'Pre-registered guest with limited, purpose-specific access.' }
        ].map(d => `
          <button class="demo-btn" data-action="show-login" data-role="${d.r}" style="padding:14px;">
            <div class="demo-avatar" style="background:${window.LulaDB.roles[d.r].color}">${d.icon}</div>
            <div class="demo-info">
              <strong>${d.name}</strong>
              <span>${d.desc}</span>
            </div>
          </button>
        `).join('')}
      </div>
      <p class="text-muted text-small" style="margin-top:16px;">All demo accounts use the password <strong>Demo1234!</strong></p>
    `;
    openGenericModal(body);
  }

  function openDocsModal() {
    // Try to fetch the docs page; gracefully fall back if running from file:// or unavailable
    if (typeof fetch !== 'function') {
      openGenericModal(`
        <h2 style="margin-top:0">📘 Documentation</h2>
        <p class="text-muted">For the complete user guide with role permissions, workflows, and architecture details, see <code>docs/index.html</code> in the repository.</p>
        <h3>Quick start</h3>
        <ol style="line-height:1.8">
          <li>Click any demo account card on the login screen</li>
          <li>Password is pre-filled (Demo1234!)</li>
          <li>Explore the role-specific dashboard</li>
          <li>Try the red <strong>🆘 PANIC</strong> button in the top bar</li>
          <li>Click <strong>🌙</strong> to toggle dark/light theme</li>
        </ol>
        <h3>Roles</h3>
        <ul style="line-height:1.8">
          <li><strong>🛡️ Administrator</strong> — Full system access (12 nav items)</li>
          <li><strong>🎯 Security Officer</strong> — Operational command center (8 nav items)</li>
          <li><strong>👮 Security Guard</strong> — Field operations (6 nav items)</li>
          <li><strong>🏠 Resident</strong> — Community member view (6 nav items)</li>
          <li><strong>🪪 Visitor</strong> — Pre-registered guest (2 nav items)</li>
        </ul>
      `);
      return;
    }
    fetch('docs/index.html').then(r => {
      if (!r.ok) throw new Error('not found');
      return r.text();
    }).then(html => {
      openGenericModal(html, true);
    }).catch(() => {
      openGenericModal(`
        <h2 style="margin-top:0">📘 Documentation</h2>
        <p class="text-muted">For the complete user guide, see <code>docs/index.html</code> in the repository.</p>
        <p class="text-muted">You can also view the README in the project root.</p>
        <h3>Quick start</h3>
        <ol style="line-height:1.8">
          <li>Click any demo account card on the login screen</li>
          <li>Password is pre-filled (<code>Demo1234!</code>)</li>
          <li>Explore the role-specific dashboard</li>
        </ol>
      `);
    });
  }

  // =========================================================
  // APP SHELL
  // =========================================================
  function showApp() {
    $('#landing-page').hidden = true;
    $('#app-shell').hidden = false;
    const session = window.LulaAuth.getSession();
    renderSidebar();
    renderTopbar();
    navigate('dashboard');
  }

  function renderTopbar() {
    const session = window.LulaAuth.getSession();
    if (!session) return;
    $('#user-avatar').textContent = session.avatar;
    $('#user-name').textContent = session.name;
    $('#user-role').textContent = window.LulaDB.roles[session.role].label;
    const unread = window.LulaDB.notifications.filter(n => n.unread).length;
    $('#notif-dot').hidden = unread === 0;
  }

  function renderSidebar() {
    const session = window.LulaAuth.getSession();
    if (!session) return;
    const role = window.LulaDB.getRole(session.role);
    $('#sidebar-role-label').textContent = role.label;

    // Update user card
    const userCard = $('#user-card');
    userCard.querySelector('.avatar').textContent = session.avatar;
    userCard.querySelector('.avatar').style.background = session.color;
    $('#user-name').textContent = session.name;
    $('#user-role').textContent = role.label;

    // Build nav
    const nav = $('#sidebar-nav');
    const openCount = window.LulaDB.getOpenIncidents().length;
    nav.innerHTML = role.nav.map(item => {
      if (item.section) {
        return `<div class="nav-section"><div class="nav-section-title">${item.section}</div></div>`;
      }
      let badge = '';
      if (item.id === 'incidents' && openCount > 0) {
        badge = `<span class="nav-badge">${openCount}</span>`;
      }
      return `
        <button class="nav-item ${item.id === currentPage ? 'active' : ''}" data-action="nav" data-page="${item.id}">
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
          ${badge}
        </button>
      `;
    }).join('');
  }

  function navigate(page) {
    currentPage = page;
    renderSidebar();
    renderPage();
  }

  function renderPage() {
    const session = window.LulaAuth.getSession();
    if (!session) return;
    const role = session.role;
    const roleDef = window.LulaDB.getRole(role);
    const page = roleDef.nav.find(n => n.id === currentPage);
    if (!page) {
      // Fallback to dashboard
      currentPage = 'dashboard';
      return renderPage();
    }
    const renderer = pages[currentPage] || pages.dashboard;
    const host = $('#page-host');
    host.innerHTML = renderer(session);
    host.scrollTop = 0;
    // Run post-render hooks
    if (postRender[currentPage]) postRender[currentPage]();
  }

  // =========================================================
  // PAGE RENDERERS
  // =========================================================
  const pages = {};
  const postRender = {};

  // ---- DASHBOARD (role-specific) ----
  pages.dashboard = (session) => {
    const role = session.role;
    if (role === 'admin')    return renderAdminDashboard(session);
    if (role === 'officer')  return renderOfficerDashboard(session);
    if (role === 'guard')    return renderGuardDashboard(session);
    if (role === 'resident') return renderResidentDashboard(session);
    if (role === 'visitor')  return renderVisitorDashboard(session);
    return '';
  };

  function renderAdminDashboard(s) {
    const open = window.LulaDB.getOpenIncidents();
    const onDuty = window.LulaDB.getOnDutyGuards().length;
    const visitors = window.LulaDB.getActiveVisitors().length;
    const onlineCams = window.LulaDB.getOnlineCameras().length;
    const totalCams = window.LulaDB.cameras.length;

    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">Welcome back, ${s.name.split(' ')[0]} 👋</h1>
          <p class="page-sub">Here's what's happening across all your sites today, ${formatDate(new Date())}.</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" data-action="new-incident">🚨 New Incident</button>
          <button class="btn btn-primary" data-action="new-visitor">🪪 Register Visitor</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card danger">
          <div class="stat-icon">🚨</div>
          <p class="stat-label">Open Incidents</p>
          <p class="stat-value">${open.length}</p>
          <div class="stat-trend down">▲ ${open.filter(i => i.severity === 'high').length} high severity</div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">👮</div>
          <p class="stat-label">Guards On Duty</p>
          <p class="stat-value">${onDuty} <span style="font-size:14px;color:var(--text-3);">/ ${window.LulaDB.guards.length}</span></p>
          <div class="stat-trend up">All sites covered</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">🪪</div>
          <p class="stat-label">Active Visitors</p>
          <p class="stat-value">${visitors}</p>
          <div class="stat-trend up">▲ 12% vs yesterday</div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">📹</div>
          <p class="stat-label">Cameras Online</p>
          <p class="stat-value">${onlineCams} <span style="font-size:14px;color:var(--text-3);">/ ${totalCams}</span></p>
          <div class="stat-trend ${onlineCams === totalCams ? 'up' : 'down'}">${onlineCams === totalCams ? 'All systems operational' : `${totalCams - onlineCams} offline`}</div>
        </div>
      </div>

      <div class="dash-grid">
        <div>
          <div class="card mb-16">
            <div class="card-header">
              <div>
                <h3 class="card-title">Incident Trends (Last 7 Days)</h3>
                <p class="card-sub">Daily incident volume across all sites</p>
              </div>
              <button class="btn btn-ghost btn-sm" data-action="nav" data-page="analytics">View Report →</button>
            </div>
            <div class="chart-container">${renderBarChart(window.LulaDB.analytics.incidentTrend)}</div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Active Incidents</h3>
                <p class="card-sub">Requires attention</p>
              </div>
              <button class="btn btn-ghost btn-sm" data-action="nav" data-page="incidents">View all →</button>
            </div>
            <div class="item-list">
              ${open.slice(0, 5).map(i => `
                <div class="item ${i.severity === 'high' ? 'danger' : i.severity === 'medium' ? 'warning' : ''}" data-action="view-incident" data-id="${i.id}" style="cursor:pointer">
                  <div class="item-icon">🚨</div>
                  <div class="item-body">
                    <p class="item-title">${i.title}</p>
                    <p class="item-meta">
                      <span>${i.id}</span>·<span>${i.site}</span>·<span>${i.zone}</span>
                    </p>
                  </div>
                  <div class="text-small">
                    <span class="badge ${i.severity}">${i.severity}</span>
                    <p class="text-muted text-small mt-8" style="margin:6px 0 0">${formatTime(i.reportedAt)}</p>
                  </div>
                </div>
              `).join('') || '<p class="text-muted">No active incidents. 🎉</p>'}
            </div>
          </div>
        </div>

        <div>
          <div class="card mb-16">
            <div class="card-header">
              <h3 class="card-title">Site Status</h3>
            </div>
            <div class="item-list">
              ${window.LulaDB.sites.map(site => `
                <div class="item ${site.status === 'alert' ? 'warning' : 'success'}">
                  <div class="item-icon">${site.status === 'alert' ? '⚠️' : '🟢'}</div>
                  <div class="item-body">
                    <p class="item-title">${site.name}</p>
                    <p class="item-meta"><span>${site.guards} guards</span>·<span>${site.cameras} cameras</span></p>
                  </div>
                  <span class="badge ${site.status === 'alert' ? 'warning' : 'success'}">${site.status}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">Recent Notifications</h3>
              <button class="btn btn-ghost btn-sm" data-action="open-notifications">All →</button>
            </div>
            <div class="item-list">
              ${window.LulaDB.notifications.slice(0, 4).map(n => `
                <div class="item ${n.unread ? 'unread' : ''} ${n.type}">
                  <div class="item-icon">${n.icon}</div>
                  <div class="item-body">
                    <p class="item-title">${n.title}</p>
                    <p class="item-meta"><span>${n.text}</span></p>
                  </div>
                  <p class="item-time">${n.time}</p>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderOfficerDashboard(s) {
    const open = window.LulaDB.getOpenIncidents();
    const onDuty = window.LulaDB.getOnDutyGuards();
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">🎯 Command Center</h1>
          <p class="page-sub">${s.site} • ${formatDateTime(new Date())}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" data-action="nav" data-page="live-map">🗺️ Live Map</button>
          <button class="btn btn-danger" data-action="new-incident">🚨 Declare Incident</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card danger"><div class="stat-icon">🚨</div><p class="stat-label">Active Incidents</p><p class="stat-value">${open.length}</p><div class="stat-trend down">${open.filter(i => i.severity === 'high').length} critical</div></div>
        <div class="stat-card success"><div class="stat-icon">👮</div><p class="stat-label">Force on Duty</p><p class="stat-value">${onDuty.length}</p><div class="stat-trend up">Optimal coverage</div></div>
        <div class="stat-card warning"><div class="stat-icon">⏱️</div><p class="stat-label">Avg Response</p><p class="stat-value">22<small style="font-size:14px">s</small></p><div class="stat-trend up">▼ 18% this week</div></div>
        <div class="stat-card info"><div class="stat-icon">📹</div><p class="stat-label">Cameras Active</p><p class="stat-value">${window.LulaDB.getOnlineCameras().length}</p><div class="stat-trend up">Live monitoring</div></div>
      </div>

      <div class="dash-grid">
        <div>
          <div class="card mb-16">
            <div class="card-header">
              <h3 class="card-title">🚨 Incident Triage Queue</h3>
              <button class="btn btn-ghost btn-sm" data-action="nav" data-page="incidents">All incidents →</button>
            </div>
            <div class="item-list">
              ${open.map(i => `
                <div class="item ${i.severity === 'high' ? 'danger' : 'warning'}" data-action="view-incident" data-id="${i.id}" style="cursor:pointer">
                  <div class="item-icon">🚨</div>
                  <div class="item-body">
                    <p class="item-title">${i.title}</p>
                    <p class="item-meta">
                      <span>${i.id}</span>·<span>${i.site}</span>·<span>${i.zone}</span>·<span>Threat: ${i.threatScore}/100</span>
                    </p>
                    <p class="text-muted text-small" style="margin:6px 0 0">${i.description.slice(0, 100)}…</p>
                  </div>
                  <div class="text-small" style="text-align:right">
                    <span class="badge ${i.severity}">${i.severity}</span>
                    <span class="badge ${i.status}">${i.status}</span>
                    <p class="text-muted text-small mt-8" style="margin:6px 0 0">${formatTime(i.reportedAt)}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="card mb-16">
            <div class="card-header"><h3 class="card-title">👮 Active Guards</h3></div>
            <div class="item-list">
              ${onDuty.slice(0, 6).map(g => `
                <div class="item ${g.status === 'on-break' ? 'warning' : 'success'}">
                  <div class="item-icon">${g.status === 'on-break' ? '☕' : '✅'}</div>
                  <div class="item-body">
                    <p class="item-title">${g.name}</p>
                    <p class="item-meta"><span>${g.badge}</span>·<span>${g.location}</span></p>
                  </div>
                  <span class="badge ${g.status === 'on-break' ? 'warning' : 'success'}">${g.status}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderGuardDashboard(s) {
    const myIncidents = window.LulaDB.incidents.filter(i => i.assignedTo && i.assignedTo.includes(s.name.split(' ')[0]));
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">🏠 My Dashboard</h1>
          <p class="page-sub">${s.title} • ${formatDateTime(new Date())}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-success" data-action="checkpoint-scan">📍 Check In</button>
          <button class="btn btn-primary" data-action="new-incident">🚨 Report</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card success">
          <div class="stat-icon">⏰</div>
          <p class="stat-label">Shift Started</p>
          <p class="stat-value" style="font-size:22px">2h 14m</p>
          <div class="stat-trend up">Ends at 06:00</div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">📍</div>
          <p class="stat-label">Checkpoints</p>
          <p class="stat-value">8 <span style="font-size:14px;color:var(--text-3)">/ 12</span></p>
          <div class="stat-trend up">67% complete</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">📋</div>
          <p class="stat-label">My Active Reports</p>
          <p class="stat-value">${myIncidents.filter(i => i.status !== 'closed' && i.status !== 'resolved').length}</p>
          <div class="stat-trend up">All on time</div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">⭐</div>
          <p class="stat-label">Performance</p>
          <p class="stat-value">4.9<span style="font-size:14px;color:var(--text-3)">/5</small></p>
          <div class="stat-trend up">Excellent</div>
        </div>
      </div>

      <div class="dash-grid">
        <div>
          <div class="card mb-16">
            <div class="card-header">
              <h3 class="card-title">🚶 Active Patrol Route — "Bravo"</h3>
              <span class="badge success">In Progress</span>
            </div>
            <div class="map-card" style="height:280px">
              <div class="map-grid-bg"></div>
              <div class="map-pin camera" style="left:25%;top:30%">📍</div>
              <div class="map-pin camera" style="left:50%;top:50%;background:linear-gradient(135deg,#22c55e,#16a34a)">📍</div>
              <div class="map-pin camera" style="left:75%;top:40%">📍</div>
              <div class="map-pin guard" style="left:62%;top:60%">🧍</div>
              <svg style="position:absolute;inset:0;width:100%;height:100%;z-index:1" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 25 30 Q 38 40 50 50 T 75 40" stroke="#0ea5e9" stroke-width="0.4" stroke-dasharray="2,2" fill="none" />
              </svg>
            </div>
            <div class="text-small text-muted mt-16">
              Next checkpoint: <strong>Floor 4 - Server Corridor</strong> in ~3 minutes
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">My Assigned Incidents</h3>
            </div>
            <div class="item-list">
              ${myIncidents.length ? myIncidents.map(i => `
                <div class="item ${i.severity === 'high' ? 'danger' : 'warning'}" data-action="view-incident" data-id="${i.id}" style="cursor:pointer">
                  <div class="item-icon">🚨</div>
                  <div class="item-body">
                    <p class="item-title">${i.title}</p>
                    <p class="item-meta"><span>${i.id}</span>·<span>${i.zone}</span></p>
                  </div>
                  <span class="badge ${i.status}">${i.status}</span>
                </div>
              `).join('') : '<p class="text-muted">No incidents assigned. Enjoy a smooth shift! 🎉</p>'}
            </div>
          </div>
        </div>

        <div>
          <div class="card mb-16">
            <div class="card-header"><h3 class="card-title">🛠️ Quick Actions</h3></div>
            <div class="item-list">
              <button class="item" data-action="nav" data-page="incidents" style="width:100%;text-align:left;cursor:pointer">
                <div class="item-icon">📝</div>
                <div class="item-body"><p class="item-title">Submit Incident Report</p><p class="item-meta">Document an event in detail</p></div>
              </button>
              <button class="item" data-action="nav" data-page="visitors" style="width:100%;text-align:left;cursor:pointer">
                <div class="item-icon">🪪</div>
                <div class="item-body"><p class="item-title">Check In Visitor</p><p class="item-meta">Scan QR or enter pass code</p></div>
              </button>
              <button class="item" data-action="request-backup" style="width:100%;text-align:left;cursor:pointer">
                <div class="item-icon">📞</div>
                <div class="item-body"><p class="item-title">Request Backup</p><p class="item-meta">Dispatch additional units</p></div>
              </button>
              <button class="item" data-action="nav" data-page="communications" style="width:100%;text-align:left;cursor:pointer">
                <div class="item-icon">📡</div>
                <div class="item-body"><p class="item-title">Radio Dispatch</p><p class="item-meta">Open comms channel</p></div>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderResidentDashboard(s) {
    const myVisitors = window.LulaDB.visitors.filter(v => v.host && v.host.includes(s.name.split(' ')[0]));
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">🏠 Hello, ${s.name.split(' ')[0]}</h1>
          <p class="page-sub">${s.site} • ${formatDate(new Date())}</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost" data-action="nav" data-page="incidents">🚨 Report Issue</button>
          <button class="btn btn-primary" data-action="new-visitor">🪪 Pre-Register Guest</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card success">
          <div class="stat-icon">🛡️</div>
          <p class="stat-label">Estate Security</p>
          <p class="stat-value" style="font-size:20px">All Clear</p>
          <div class="stat-trend up">10 guards on duty</div>
        </div>
        <div class="stat-card info">
          <div class="stat-icon">👥</div>
          <p class="stat-label">Expected Guests</p>
          <p class="stat-value">${myVisitors.filter(v => v.status === 'pre-registered' || v.status === 'checked-in').length}</p>
          <div class="stat-trend up">Today</div>
        </div>
        <div class="stat-card warning">
          <div class="stat-icon">📦</div>
          <p class="stat-label">Packages</p>
          <p class="stat-value">2</p>
          <div class="stat-trend up">At reception</div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon">📅</div>
          <p class="stat-label">Next Event</p>
          <p class="stat-value" style="font-size:18px">Sat 10AM</p>
          <div class="stat-trend up">Estate meeting</div>
        </div>
      </div>

      <div class="dash-grid">
        <div>
          <div class="card mb-16">
            <div class="card-header">
              <h3 class="card-title">🪪 My Guests</h3>
              <button class="btn btn-ghost btn-sm" data-action="new-visitor">+ Add</button>
            </div>
            <div class="item-list">
              ${myVisitors.length ? myVisitors.map(v => `
                <div class="item ${v.status === 'checked-in' ? 'success' : ''}">
                  <div class="item-icon">🪪</div>
                  <div class="item-body">
                    <p class="item-title">${v.name}</p>
                    <p class="item-meta"><span>${v.passCode}</span>·<span>${v.purpose}</span>·<span>${formatTime(v.checkIn || v.checkOut)}</span></p>
                  </div>
                  <span class="badge ${v.status === 'checked-in' ? 'success' : v.status === 'pre-registered' ? 'info' : 'muted'}">${v.status}</span>
                </div>
              `).join('') : '<p class="text-muted">No upcoming guests. Pre-register visitors for seamless entry.</p>'}
            </div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-header"><h3 class="card-title">📢 Estate Announcements</h3></div>
            <div class="item-list">
              <div class="item warning">
                <div class="item-icon">🔥</div>
                <div class="item-body">
                  <p class="item-title">Fire Drill — Wed 30 July, 2PM</p>
                  <p class="item-meta"><span>All residents</span></p>
                </div>
                <p class="item-time">1d ago</p>
              </div>
              <div class="item success">
                <div class="item-icon">✅</div>
                <div class="item-body">
                  <p class="item-title">New gate access system installed</p>
                  <p class="item-meta"><span>North Gate</span></p>
                </div>
                <p class="item-time">3d ago</p>
              </div>
              <div class="item">
                <div class="item-icon">📅</div>
                <div class="item-body">
                  <p class="item-title">Estate meeting Saturday 10AM</p>
                  <p class="item-meta"><span>Clubhouse</span></p>
                </div>
                <p class="item-time">5d ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderVisitorDashboard(s) {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">🎫 Welcome, ${s.name.split(' ')[0]}</h1>
          <p class="page-sub">Your visit pass & access details</p>
        </div>
      </div>

      <div class="dash-grid" style="grid-template-columns: 1fr 1fr;">
        <div class="card" style="text-align:center">
          <h3 class="card-title">Your Visitor Pass</h3>
          <p class="text-muted text-small">Show this QR code at any entry checkpoint</p>
          <div class="qr-box" style="margin:20px auto;"></div>
          <h2 style="margin:16px 0 4px;font-family:var(--font-mono);letter-spacing:0.1em">VST-A4821</h2>
          <p class="text-muted">Valid until: <strong>Today, 6:00 PM</strong></p>
          <div style="margin-top:20px;display:flex;gap:8px;justify-content:center">
            <button class="btn btn-ghost btn-sm">📲 Save to Wallet</button>
            <button class="btn btn-ghost btn-sm">🖨️ Print</button>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title">Visit Details</h3>
          <div class="form-grid" style="grid-template-columns:1fr;gap:12px;margin-top:12px;">
            <div><span class="text-muted text-small">Visitor</span><br><strong>${s.name}</strong></div>
            <div><span class="text-muted text-small">Host</span><br><strong>${s.title || 'Sarah Adeyemi'}</strong></div>
            <div><span class="text-muted text-small">Purpose</span><br><strong>Business Meeting</strong></div>
            <div><span class="text-muted text-small">Site</span><br><strong>${s.site || 'Sandton HQ'}</strong></div>
            <div><span class="text-muted text-small">Valid Zones</span><br><strong>Ground Floor, Floor 2, Meeting Rooms</strong></div>
            <div><span class="text-muted text-small">Escort Required</span><br><strong>Yes — please meet your host at reception</strong></div>
          </div>
          <div class="mt-16" style="padding:12px;background:rgba(94,234,212,0.08);border:1px solid rgba(94,234,212,0.2);border-radius:8px;">
            <strong>ℹ️ Important</strong>
            <p class="text-small text-muted" style="margin:4px 0 0">Please carry photo ID. Your host has been notified of your arrival.</p>
          </div>
        </div>
      </div>
    `;
  }

  // ---- LIVE MAP ----
  pages['live-map'] = () => {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">🗺️ Live Operations Map</h1>
          <p class="page-sub">Real-time situational awareness across all sites</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm">🛰️ Satellite</button>
          <button class="btn btn-ghost btn-sm">🌡️ Heatmap</button>
          <button class="btn btn-ghost btn-sm">📍 All Sites</button>
        </div>
      </div>

      <div class="dash-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Sandton HQ — Active View</h3>
            <span class="badge success">Live • Updates every 2s</span>
          </div>
          <div class="map-card" style="height:480px">
            <div class="map-grid-bg"></div>
            <!-- Building outline -->
            <svg style="position:absolute;inset:0;width:100%;height:100%;z-index:1" viewBox="0 0 100 100" preserveAspectRatio="none">
              <rect x="20" y="20" width="60" height="60" stroke="#0ea5e9" stroke-width="0.3" fill="rgba(14,165,233,0.05)" />
              <line x1="20" y1="40" x2="80" y2="40" stroke="#0ea5e9" stroke-width="0.2" stroke-dasharray="1,1"/>
              <line x1="20" y1="60" x2="80" y2="60" stroke="#0ea5e9" stroke-width="0.2" stroke-dasharray="1,1"/>
              <line x1="40" y1="20" x2="40" y2="80" stroke="#0ea5e9" stroke-width="0.2" stroke-dasharray="1,1"/>
              <line x1="60" y1="20" x2="60" y2="80" stroke="#0ea5e9" stroke-width="0.2" stroke-dasharray="1,1"/>
              <text x="50" y="32" fill="#5eead4" font-size="2" text-anchor="middle">FLOOR 4 — INCIDENT ACTIVE</text>
            </svg>
            <!-- Pins -->
            <div class="map-pin guard" style="left:30%;top:35%">🧍<div class="pin-pulse"></div></div>
            <div class="map-pin guard" style="left:65%;top:50%">🧍</div>
            <div class="map-pin camera" style="left:25%;top:25%">📹</div>
            <div class="map-pin camera" style="left:45%;top:30%">📹</div>
            <div class="map-pin camera" style="left:50%;top:35%">📹<div class="pin-pulse"></div></div>
            <div class="map-pin camera" style="left:75%;top:65%">📹</div>
            <div class="map-pin visitor" style="left:35%;top:75%">🪪</div>
            <div class="map-pin incident" style="left:50%;top:30%">🚨</div>
            <div class="map-pin camera" style="left:55%;top:72%">📹</div>
            <div class="map-pin guard" style="left:50%;top:78%">🧍</div>

            <!-- Legend -->
            <div style="position:absolute;bottom:12px;right:12px;background:rgba(0,0,0,0.7);padding:10px;border-radius:8px;font-size:11px;z-index:5">
              <div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:10px;height:10px;background:#0ea5e9;border-radius:50%"></span>Guards (3)</div>
              <div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:10px;height:10px;background:#22c55e;border-radius:50%"></span>Cameras (5)</div>
              <div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:10px;height:10px;background:#f59e0b;border-radius:50%"></span>Visitors (1)</div>
              <div style="display:flex;align-items:center;gap:6px;margin:3px 0"><span style="width:10px;height:10px;background:#ef4444;border-radius:50%"></span>Incidents (1)</div>
            </div>
          </div>
        </div>

        <div>
          <div class="card mb-16">
            <div class="card-header"><h3 class="card-title">Active On Map</h3></div>
            <div class="item-list">
              ${window.LulaDB.getOpenIncidents().map(i => `
                <div class="item danger">
                  <div class="item-icon">🚨</div>
                  <div class="item-body">
                    <p class="item-title">${i.title}</p>
                    <p class="item-meta"><span>${i.id}</span>·<span>${i.zone}</span></p>
                  </div>
                </div>
              `).join('')}
              ${window.LulaDB.getOnDutyGuards().slice(0,3).map(g => `
                <div class="item success">
                  <div class="item-icon">👮</div>
                  <div class="item-body">
                    <p class="item-title">${g.name}</p>
                    <p class="item-meta"><span>${g.location}</span></p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // ---- INCIDENTS ----
  pages.incidents = () => {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">🚨 Incidents</h1>
          <p class="page-sub">${window.LulaDB.incidents.length} total • ${window.LulaDB.getOpenIncidents().length} active</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm">📊 Export</button>
          <button class="btn btn-primary" data-action="new-incident">+ New Incident</button>
        </div>
      </div>

      <div class="card">
        <div class="tabs" id="incident-tabs">
          <button class="tab active" data-filter="all">All (${window.LulaDB.incidents.length})</button>
          <button class="tab" data-filter="open">Open (${window.LulaDB.incidents.filter(i=>i.status==='open').length})</button>
          <button class="tab" data-filter="in-progress">In Progress (${window.LulaDB.incidents.filter(i=>i.status==='in-progress').length})</button>
          <button class="tab" data-filter="resolved">Resolved (${window.LulaDB.incidents.filter(i=>i.status==='resolved').length})</button>
          <button class="tab" data-filter="closed">Closed (${window.LulaDB.incidents.filter(i=>i.status==='closed').length})</button>
        </div>
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr><th>ID</th><th>Title</th><th>Site</th><th>Severity</th><th>Status</th><th>Assigned</th><th>Reported</th><th>Threat</th><th></th></tr>
            </thead>
            <tbody id="incidents-tbody">
              ${renderIncidentRows(window.LulaDB.incidents)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };
  postRender.incidents = () => {
    $$('#incident-tabs .tab').forEach(t => {
      t.addEventListener('click', () => {
        $$('#incident-tabs .tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        const f = t.dataset.filter;
        const filtered = f === 'all' ? window.LulaDB.incidents : window.LulaDB.incidents.filter(i => i.status === f);
        $('#incidents-tbody').innerHTML = renderIncidentRows(filtered);
      });
    });
  };
  function renderIncidentRows(list) {
    return list.map(i => `
      <tr>
        <td class="mono text-small">${i.id}</td>
        <td>
          <strong>${i.title}</strong>
          <p class="text-muted text-small" style="margin:2px 0 0">${i.type} · ${i.zone}</p>
        </td>
        <td class="text-small">${i.site}</td>
        <td><span class="badge ${i.severity}">${i.severity}</span></td>
        <td><span class="badge ${i.status}">${i.status}</span></td>
        <td class="text-small">${i.assignedTo}</td>
        <td class="text-small">${formatTime(i.reportedAt)}</td>
        <td>
          <div class="flex center gap-8">
            <strong style="color:${i.threatScore > 70 ? 'var(--danger)' : i.threatScore > 40 ? 'var(--warning)' : 'var(--success)'}">${i.threatScore}</strong>
          </div>
        </td>
        <td class="actions">
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" data-action="view-incident" data-id="${i.id}">View</button>
            ${i.status !== 'resolved' && i.status !== 'closed' ? `<button class="btn btn-success btn-sm" data-action="resolve-incident" data-id="${i.id}">Resolve</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ---- VISITORS ----
  pages.visitors = () => {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">🪪 Visitor Management</h1>
          <p class="page-sub">${window.LulaDB.getActiveVisitors().length} active today • ${window.LulaDB.visitors.length} total records</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm">📋 Watchlist</button>
          <button class="btn btn-primary" data-action="new-visitor">+ Pre-Register Visitor</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card success"><div class="stat-icon">✅</div><p class="stat-label">Checked In</p><p class="stat-value">${window.LulaDB.visitors.filter(v=>v.status==='checked-in').length}</p></div>
        <div class="stat-card info"><div class="stat-icon">📅</div><p class="stat-label">Pre-Registered</p><p class="stat-value">${window.LulaDB.visitors.filter(v=>v.status==='pre-registered').length}</p></div>
        <div class="stat-card warning"><div class="stat-icon">🚪</div><p class="stat-label">Checked Out</p><p class="stat-value">${window.LulaDB.visitors.filter(v=>v.status==='checked-out').length}</p></div>
        <div class="stat-card danger"><div class="stat-icon">🚫</div><p class="stat-label">Watchlist</p><p class="stat-value">0</p></div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr><th>Pass</th><th>Name</th><th>Company</th><th>Host</th><th>Site</th><th>Purpose</th><th>Status</th><th>Time</th><th></th></tr>
            </thead>
            <tbody>
              ${window.LulaDB.visitors.map(v => `
                <tr>
                  <td class="mono text-small"><strong>${v.passCode}</strong></td>
                  <td><strong>${v.name}</strong><p class="text-muted text-small" style="margin:2px 0 0">${v.idType} • ${v.idNumber}</p></td>
                  <td class="text-small">${v.company}</td>
                  <td class="text-small">${v.host}</td>
                  <td class="text-small">${v.site}</td>
                  <td class="text-small">${v.purpose}</td>
                  <td><span class="badge ${v.status === 'checked-in' ? 'success' : v.status === 'pre-registered' ? 'info' : 'muted'}">${v.status}</span></td>
                  <td class="text-small text-muted">${v.checkIn ? 'In: ' + formatTime(v.checkIn) : ''}${v.checkOut ? '<br>Out: ' + formatTime(v.checkOut) : ''}</td>
                  <td class="actions">
                    <div class="row-actions">
                      ${v.status === 'pre-registered' ? `<button class="btn btn-success btn-sm" data-action="checkin-visitor" data-id="${v.id}">Check In</button>` : ''}
                      ${v.status === 'checked-in' ? `<button class="btn btn-warning btn-sm" data-action="checkout-visitor" data-id="${v.id}">Check Out</button>` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ---- GUARDS ----
  pages.guards = () => {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">👮 Guards & Patrols</h1>
          <p class="page-sub">${window.LulaDB.getOnDutyGuards().length} on duty • ${window.LulaDB.guards.length} total</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm">📋 Shift Schedule</button>
          <button class="btn btn-ghost btn-sm">📊 Performance</button>
          <button class="btn btn-primary">+ Add Guard</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card success"><div class="stat-icon">✅</div><p class="stat-label">On Duty</p><p class="stat-value">${window.LulaDB.guards.filter(g=>g.status==='on-duty').length}</p></div>
        <div class="stat-card warning"><div class="stat-icon">☕</div><p class="stat-label">On Break</p><p class="stat-value">${window.LulaDB.guards.filter(g=>g.status==='on-break').length}</p></div>
        <div class="stat-card info"><div class="stat-icon">📍</div><p class="stat-label">Patrols Active</p><p class="stat-value">4</p></div>
        <div class="stat-card success"><div class="stat-icon">⭐</div><p class="stat-label">Avg Rating</p><p class="stat-value">4.7</p></div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr><th>Badge</th><th>Name</th><th>Site</th><th>Shift</th><th>Status</th><th>Location</th><th>Patrol</th><th>Rating</th></tr>
            </thead>
            <tbody>
              ${window.LulaDB.guards.map(g => `
                <tr data-action="view-guard" data-id="${g.id}" style="cursor:pointer">
                  <td class="mono text-small">${g.badge}</td>
                  <td>
                    <div class="flex center gap-12">
                      <div class="avatar" style="width:32px;height:32px;font-size:12px;background:${window.LulaDB.users.find(u=>u.name===g.name)?.color || 'linear-gradient(135deg,#0ea5e9,#6366f1)'}">${g.name.split(' ').map(s=>s[0]).join('')}</div>
                      <strong>${g.name}</strong>
                    </div>
                  </td>
                  <td class="text-small">${g.site}</td>
                  <td class="text-small">${g.shift}</td>
                  <td><span class="badge ${g.status === 'on-duty' ? 'success' : g.status === 'on-break' ? 'warning' : 'muted'}">${g.status}</span></td>
                  <td class="text-small">${g.location}</td>
                  <td>
                    <div class="flex center gap-8">
                      <div class="progress" style="width:80px"><div class="progress-bar ${g.patrol > 90 ? 'success' : g.patrol > 75 ? '' : 'warning'}" style="width:${g.patrol}%"></div></div>
                      <span class="text-small">${g.patrol}%</span>
                    </div>
                  </td>
                  <td><strong>⭐ ${g.rating}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ---- PATROL (guard) ----
  pages.patrol = () => {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">🚶 My Active Patrol</h1>
          <p class="page-sub">Route "Bravo" • Started 08:00 • Estimated completion 10:30</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm" data-action="request-backup">📞 Request Backup</button>
          <button class="btn btn-success" data-action="checkpoint-scan">📍 Scan Next Checkpoint</button>
        </div>
      </div>

      <div class="card mb-16">
        <div class="card-header">
          <h3 class="card-title">Route Progress</h3>
          <span class="badge success">8 of 12 checkpoints</span>
        </div>
        <div class="progress mb-16"><div class="progress-bar success" style="width:67%"></div></div>

        <div class="item-list">
          ${[
            { id: 1, name: 'Main Lobby', time: '08:05', status: 'done' },
            { id: 2, name: 'Reception Desk', time: '08:12', status: 'done' },
            { id: 3, name: 'Floor 1 Corridor', time: '08:25', status: 'done' },
            { id: 4, name: 'Floor 2 - Cafeteria', time: '08:40', status: 'done' },
            { id: 5, name: 'Floor 3 - Open Plan', time: '08:55', status: 'done' },
            { id: 6, name: 'Floor 4 - Elevator Lobby', time: '09:10', status: 'done' },
            { id: 7, name: 'Floor 4 - Server Room A', time: '09:22', status: 'done' },
            { id: 8, name: 'Floor 4 - Server Room B', time: '09:38', status: 'done' },
            { id: 9, name: 'Floor 4 - Server Corridor', time: 'in progress', status: 'active' },
            { id: 10, name: 'Floor 5 - Executive', time: 'pending', status: 'pending' },
            { id: 11, name: 'Floor 6 - Boardroom', time: 'pending', status: 'pending' },
            { id: 12, name: 'Roof Access', time: 'pending', status: 'pending' }
          ].map(cp => `
            <div class="item ${cp.status === 'active' ? 'warning' : cp.status === 'done' ? 'success' : ''}">
              <div class="item-icon">${cp.status === 'done' ? '✅' : cp.status === 'active' ? '📍' : '⚪'}</div>
              <div class="item-body">
                <p class="item-title">Checkpoint ${cp.id}: ${cp.name}</p>
                <p class="item-meta">${cp.status === 'done' ? `Completed at ${cp.time}` : cp.status === 'active' ? 'Scan QR to confirm' : 'Upcoming'}</p>
              </div>
              ${cp.status === 'active' ? '<button class="btn btn-success btn-sm" data-action="checkpoint-scan">Scan</button>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // ---- CAMERAS ----
  pages.cameras = () => {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">📹 Camera Surveillance</h1>
          <p class="page-sub">${window.LulaDB.getOnlineCameras().length} of ${window.LulaDB.cameras.length} online • AI monitoring active</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm">🎬 Recordings</button>
          <button class="btn btn-ghost btn-sm">⚙️ AI Settings</button>
          <button class="btn btn-primary">+ Add Camera</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card success"><div class="stat-icon">📹</div><p class="stat-label">Online</p><p class="stat-value">${window.LulaDB.getOnlineCameras().length}</p></div>
        <div class="stat-card danger"><div class="stat-icon">⚠️</div><p class="stat-label">Offline</p><p class="stat-value">${window.LulaDB.cameras.length - window.LulaDB.getOnlineCameras().length}</p></div>
        <div class="stat-card warning"><div class="stat-icon">🤖</div><p class="stat-label">AI Alerts Today</p><p class="stat-value">14</p></div>
        <div class="stat-card info"><div class="stat-icon">💾</div><p class="stat-label">Storage</p><p class="stat-value">68%</p></div>
      </div>

      <div class="camera-grid">
        ${window.LulaDB.cameras.map(c => `
          <div class="camera-card" data-action="view-camera" data-id="${c.id}" style="cursor:pointer">
            <div class="camera-feed">
              ${c.status === 'online' ? '<div class="scan-line"></div>' : '<div style="color:#ef4444;font-size:14px">⚠️ SIGNAL LOST</div>'}
            </div>
            <div class="camera-overlay">
              ${c.status === 'online' ? `<span class="camera-rec">REC</span><span class="camera-meta">${c.id.toUpperCase()}</span>` : `<span class="camera-meta">OFFLINE</span>`}
            </div>
            <div class="camera-label">
              <div>
                <strong>${c.name}</strong>
                <p class="text-muted" style="margin:2px 0 0;font-size:10px">${c.zone} • ${c.site}</p>
              </div>
              <div class="cam-actions">
                ${c.ai ? '<button title="AI Active">🤖</button>' : ''}
                <button title="Fullscreen">⛶</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  // ---- ACCESS CONTROL ----
  pages.access = () => {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">🔐 Access Control</h1>
          <p class="page-sub">${window.LulaDB.accessPoints.length} managed access points</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm">🪪 Credentials</button>
          <button class="btn btn-ghost btn-sm">📅 Schedules</button>
          <button class="btn btn-primary">+ New Access Point</button>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="tbl">
            <thead>
              <tr><th>Name</th><th>Type</th><th>Site</th><th>Status</th><th>Mode</th><th>Users</th><th>Last Access</th><th></th></tr>
            </thead>
            <tbody>
              ${window.LulaDB.accessPoints.map(a => `
                <tr>
                  <td><strong>${a.name}</strong></td>
                  <td class="text-small">${a.type}</td>
                  <td class="text-small">${a.site}</td>
                  <td><span class="badge ${a.status === 'locked' ? 'success' : 'warning'}">${a.status}</span></td>
                  <td class="text-small">${a.mode}</td>
                  <td class="text-small">${a.users}</td>
                  <td class="text-small text-muted">${formatTime(a.lastAccess)}</td>
                  <td class="actions">
                    <button class="btn btn-${a.status === 'locked' ? 'warning' : 'success'} btn-sm" data-action="toggle-access" data-id="${a.id}">
                      ${a.status === 'locked' ? '🔓 Unlock' : '🔒 Lock'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ---- ANALYTICS ----
  pages.analytics = () => {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">📈 Analytics & Reports</h1>
          <p class="page-sub">Operational metrics and security insights</p>
        </div>
        <div class="page-actions">
          <select class="btn btn-ghost btn-sm">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Custom range</option>
          </select>
          <button class="btn btn-ghost btn-sm">📊 Export PDF</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card success"><div class="stat-icon">⏱️</div><p class="stat-label">Avg Response Time</p><p class="stat-value">22s</p><div class="stat-trend up">▼ 18% vs last week</div></div>
        <div class="stat-card info"><div class="stat-icon">✅</div><p class="stat-label">Resolution Rate</p><p class="stat-value">94%</p><div class="stat-trend up">▲ 3% improvement</div></div>
        <div class="stat-card warning"><div class="stat-icon">🚨</div><p class="stat-label">Incidents / Day</p><p class="stat-value">10.6</p><div class="stat-trend down">▼ 12% reduction</div></div>
        <div class="stat-card success"><div class="stat-icon">⭐</div><p class="stat-label">Guard Performance</p><p class="stat-value">4.7/5</p><div class="stat-trend up">Excellent</div></div>
      </div>

      <div class="dash-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Incidents by Day</h3>
          </div>
          <div class="chart-container">${renderBarChart(window.LulaDB.analytics.incidentTrend)}</div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Incidents by Type</h3>
          </div>
          <div class="chart-container">${renderDonutChart(window.LulaDB.analytics.byType)}</div>
        </div>
      </div>

      <div class="card mt-16">
        <div class="card-header">
          <h3 class="card-title">Response Time Trend (Last 7 Months)</h3>
        </div>
        <div class="chart-container">${renderLineChart(window.LulaDB.analytics.responseTimes)}</div>
      </div>
    `;
  };

  // ---- USERS (admin only) ----
  pages.users = () => {
    return `
      <div class="page-header">
        <div>
          <h1 class="page-title">👥 User Management</h1>
          <p class="page-sub">${window.LulaDB.users.length} users • 5 roles</p>
        </div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm">📥 Import</button>
          <button class="btn btn-primary">+ Add User</button>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>User</th><th>Role</th><th>Email</th><th>Site</th><th>Status</th><th></th></tr></thead>
            <tbody>
              ${window.LulaDB.users.map(u => `
                <tr>
                  <td>
                    <div class="flex center gap-12">
                      <div class="avatar" style="width:36px;height:36px;background:${u.color}">${u.avatar}</div>
                      <div>
                        <strong>${u.name}</strong>
                        <p class="text-muted text-small" style="margin:2px 0 0">${u.title}</p>
                      </div>
                    </div>
                  </td>
                  <td><span class="badge info">${window.LulaDB.roles[u.role].label}</span></td>
                  <td class="text-small">${u.email}</td>
                  <td class="text-small">${u.site}</td>
                  <td><span class="badge success">Active</span></td>
                  <td class="actions">
                    <div class="row-actions">
                      <button class="btn btn-ghost btn-sm">Edit</button>
                      <button class="btn btn-ghost btn-sm">⋯</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  // ---- SETTINGS ----
  pages.settings = () => {
    return `
      <div class="page-header">
        <div><h1 class="page-title">⚙️ System Settings</h1><p class="page-sub">Configure your LulaSecSystem deployment</p></div>
      </div>

      <div class="dash-grid">
        <div>
          <div class="card mb-16">
            <div class="card-header"><h3 class="card-title">🏢 Organization</h3></div>
            <div class="form-grid">
              <label><span>Organization Name</span><input value="LulaSec Demo Corp" /></label>
              <label><span>Timezone</span><select><option>Africa/Johannesburg (UTC+2)</option><option>UTC</option></select></label>
              <label><span>Default Language</span><select><option>English</option><option>isiZulu</option><option>Afrikaans</option></select></label>
              <label><span>Date Format</span><select><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></label>
            </div>
          </div>

          <div class="card mb-16">
            <div class="card-header"><h3 class="card-title">🔔 Notifications</h3></div>
            <div class="item-list">
              ${[
                { label: 'Email alerts for high-severity incidents', on: true },
                { label: 'SMS notifications for after-hours incidents', on: true },
                { label: 'Push notifications for mobile app', on: true },
                { label: 'Daily digest email', on: false },
                { label: 'Weekly performance report', on: true }
              ].map(s => `
                <div class="item">
                  <div class="item-body"><p class="item-title">${s.label}</p></div>
                  <label style="position:relative;display:inline-block;width:44px;height:24px">
                    <input type="checkbox" ${s.on ? 'checked' : ''} style="opacity:0;width:0;height:0">
                    <span style="position:absolute;cursor:pointer;inset:0;background:${s.on ? 'var(--brand-2)' : 'var(--bg-3)'};border-radius:24px;transition:.2s"></span>
                    <span style="position:absolute;height:18px;width:18px;left:${s.on?'22':'3'}px;top:3px;background:white;border-radius:50%;transition:.2s"></span>
                  </label>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="card mb-16">
            <div class="card-header"><h3 class="card-title">🤖 AI Engine</h3></div>
            <div class="item-list">
              <div class="item success">
                <div class="item-icon">🧠</div>
                <div class="item-body"><p class="item-title">Threat Scoring</p><p class="item-meta">Model: LulaAI v3.2 • Last trained 2 days ago</p></div>
                <span class="badge success">Active</span>
              </div>
              <div class="item success">
                <div class="item-icon">👁️</div>
                <div class="item-body"><p class="item-title">Computer Vision</p><p class="item-meta">Object detection, motion, face recognition</p></div>
                <span class="badge success">Active</span>
              </div>
              <div class="item success">
                <div class="item-icon">🔊</div>
                <div class="item-body"><p class="item-title">Audio Analysis</p><p class="item-meta">Gunshot, scream, glass break detection</p></div>
                <span class="badge success">Active</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3 class="card-title">🛡️ Security</h3></div>
            <div class="form-grid">
              <label><span>2-Factor Auth</span><select><option>Required for all</option><option>Admins only</option><option>Optional</option></select></label>
              <label><span>Session Timeout (min)</span><input type="number" value="30" /></label>
              <label><span>Password Min Length</span><input type="number" value="12" /></label>
              <label><span>Audit Log Retention (days)</span><input type="number" value="365" /></label>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // ---- DISPATCH ----
  pages.dispatch = () => {
    return `
      <div class="page-header">
        <div><h1 class="page-title">📡 Dispatch Center</h1><p class="page-sub">Active radio channels & unit deployment</p></div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm">📻 Open All Channels</button>
          <button class="btn btn-primary">📢 Broadcast</button>
        </div>
      </div>

      <div class="dash-grid">
        <div class="card">
          <div class="card-header"><h3 class="card-title">Active Channels</h3></div>
          <div class="item-list">
            ${[
              { ch: 'CH-1', name: 'Main Ops', users: 8, status: 'active' },
              { ch: 'CH-2', name: 'Patrol A — Sandton', users: 4, status: 'active' },
              { ch: 'CH-3', name: 'Patrol B — Cape Town', users: 3, status: 'active' },
              { ch: 'CH-4', name: 'Patrol C — Durban', users: 2, status: 'active' },
              { ch: 'EMERGENCY', name: 'Emergency Broadcast', users: 12, status: 'standby' }
            ].map(c => `
              <div class="item ${c.status === 'active' ? 'success' : 'warning'}">
                <div class="item-icon">📻</div>
                <div class="item-body">
                  <p class="item-title">${c.ch} — ${c.name}</p>
                  <p class="item-meta">${c.users} units listening</p>
                </div>
                <span class="badge ${c.status === 'active' ? 'success' : 'warning'}">${c.status}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3 class="card-title">Live Transcript</h3></div>
          <div class="item-list" style="max-height:400px;overflow-y:auto">
            <div class="item"><div class="item-body"><p class="item-title">Guard T. Ndlovu <span class="text-muted text-small">CH-2</span></p><p class="item-meta">"Reached checkpoint 8, all clear on Floor 4 server corridor."</p></div><p class="item-time">09:42</p></div>
            <div class="item"><div class="item-body"><p class="item-title">Officer J. Molefe <span class="text-muted text-small">CH-1</span></p><p class="item-meta">"Copy that. Continue route, dispatch notified of INC-2404 status."</p></div><p class="item-time">09:43</p></div>
            <div class="item warning"><div class="item-body"><p class="item-title">Guard S. Dlamini <span class="text-muted text-small">CH-3</span></p><p class="item-meta">"Perimeter sensor triggered. Deploying drone for visual."</p></div><p class="item-time">09:45</p></div>
            <div class="item"><div class="item-body"><p class="item-title">AI Assistant <span class="text-muted text-small">SYSTEM</span></p><p class="item-meta">"Threat score for INC-2404 updated: 78/100. Recommendation: deploy K9 unit."</p></div><p class="item-time">09:46</p></div>
            <div class="item success"><div class="item-body"><p class="item-title">Guard T. Ndlovu <span class="text-muted text-small">CH-2</span></p><p class="item-meta">"Checkpoint 9 scanned. Floor 4 - Server Corridor complete."</p></div><p class="item-time">09:48</p></div>
          </div>
        </div>
      </div>
    `;
  };

  // ---- COMMUNICATIONS (guard) ----
  pages.communications = () => {
    return `
      <div class="page-header">
        <div><h1 class="page-title">📞 Communications</h1><p class="page-sub">Stay connected with dispatch and team</p></div>
      </div>

      <div class="card mb-16">
        <div class="card-header"><h3 class="card-title">📻 Radio Channels</h3></div>
        <div class="item-list">
          ${['CH-1 Main Ops', 'CH-2 Patrol A', 'CH-3 Patrol B', 'CH-4 Patrol C', 'EMERGENCY'].map(ch => `
            <div class="item">
              <div class="item-icon">📻</div>
              <div class="item-body"><p class="item-title">${ch}</p></div>
              <button class="btn btn-primary btn-sm">Tune In</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">📞 Quick Call</h3></div>
        <div class="item-list">
          <div class="item"><div class="item-icon">🎯</div><div class="item-body"><p class="item-title">Officer J. Molefe (Direct Supervisor)</p><p class="item-meta">+27 11 555 0101</p></div><button class="btn btn-success btn-sm">📞 Call</button></div>
          <div class="item"><div class="item-icon">🏢</div><div class="item-body"><p class="item-title">Dispatch Center</p><p class="item-meta">+27 11 555 0000</p></div><button class="btn btn-success btn-sm">📞 Call</button></div>
          <div class="item"><div class="item-icon">🚑</div><div class="item-body"><p class="item-title">Emergency Services</p><p class="item-meta">10111 (Police) • 10177 (Ambulance)</p></div><button class="btn btn-danger btn-sm">🆘 Emergency</button></div>
        </div>
      </div>
    `;
  };

  // ---- TRAINING ----
  pages.training = () => {
    return `
      <div class="page-header">
        <div><h1 class="page-title">🎓 Training & Resources</h1><p class="page-sub">Continue your professional development</p></div>
      </div>

      <div class="stats-grid">
        <div class="stat-card success"><div class="stat-icon">✅</div><p class="stat-label">Completed</p><p class="stat-value">12</p></div>
        <div class="stat-card warning"><div class="stat-icon">📚</div><p class="stat-label">In Progress</p><p class="stat-value">3</p></div>
        <div class="stat-card info"><div class="stat-icon">🏆</div><p class="stat-label">Certifications</p><p class="stat-value">5</p></div>
        <div class="stat-card success"><div class="stat-icon">⭐</div><p class="stat-label">Training Score</p><p class="stat-value">96%</p></div>
      </div>

      <div class="card">
        <div class="card-header"><h3 class="card-title">📚 Available Courses</h3></div>
        <div class="item-list">
          ${[
            { t: 'Conflict De-escalation', d: '40 min • Intermediate', s: 'in-progress', p: 65 },
            { t: 'First Aid & CPR', d: '60 min • Required annually', s: 'in-progress', p: 30 },
            { t: 'Fire Safety & Evacuation', d: '45 min • Required', s: 'new', p: 0 },
            { t: 'Active Shooter Response', d: '50 min • Critical', s: 'in-progress', p: 80 },
            { t: 'Cybersecurity Awareness', d: '30 min • Recommended', s: 'completed', p: 100 },
            { t: 'Customer Service for Guards', d: '35 min • Recommended', s: 'new', p: 0 }
          ].map(c => `
            <div class="item ${c.s === 'in-progress' ? 'warning' : c.s === 'completed' ? 'success' : ''}">
              <div class="item-icon">${c.s === 'completed' ? '✅' : c.s === 'in-progress' ? '📖' : '📚'}</div>
              <div class="item-body">
                <p class="item-title">${c.t}</p>
                <p class="item-meta">${c.d} • ${c.p}% complete</p>
                <div class="progress mt-8" style="height:4px;width:200px"><div class="progress-bar ${c.s==='completed'?'success':''}" style="width:${c.p}%"></div></div>
              </div>
              <button class="btn btn-${c.s === 'completed' ? 'ghost' : 'primary'} btn-sm">${c.s === 'completed' ? 'Review' : c.s === 'in-progress' ? 'Continue' : 'Start'}</button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // ---- COMMUNITY (resident) ----
  pages.community = () => {
    return `
      <div class="page-header">
        <div><h1 class="page-title">👥 Community Watch</h1><p class="page-sub">Stay connected with your neighbors</p></div>
        <div class="page-actions">
          <button class="btn btn-primary">+ New Post</button>
        </div>
      </div>

      <div class="card">
        <div class="item-list">
          ${window.LulaDB.communityPosts.map(p => `
            <div class="item ${p.type === 'warning' ? 'warning' : p.type === 'positive' ? 'success' : ''}">
              <div class="item-icon">${p.author === 'Security Team' ? '🛡️' : '👤'}</div>
              <div class="item-body">
                <p class="item-title">${p.author} <span class="text-muted text-small" style="font-weight:400">• ${p.unit} • ${p.time}</span></p>
                <p class="item-meta" style="color:var(--text-1);margin:4px 0;font-size:14px">${p.text}</p>
                <div class="flex gap-12 mt-8" style="margin-top:8px">
                  <button class="btn btn-ghost btn-sm">👍 ${p.likes}</button>
                  <button class="btn btn-ghost btn-sm">💬 ${p.comments}</button>
                  <button class="btn btn-ghost btn-sm">↗️ Share</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // ---- NOTIFICATIONS (resident) ----
  pages.notifications = () => {
    return `
      <div class="page-header">
        <div><h1 class="page-title">🔔 My Notifications</h1><p class="page-sub">All alerts & updates</p></div>
        <div class="page-actions">
          <button class="btn btn-ghost btn-sm" data-action="mark-all-read">Mark all read</button>
        </div>
      </div>

      <div class="card">
        <div class="item-list">
          ${window.LulaDB.notifications.map(n => `
            <div class="item ${n.unread ? 'unread' : ''} ${n.type}">
              <div class="item-icon">${n.icon}</div>
              <div class="item-body">
                <p class="item-title">${n.title}</p>
                <p class="item-meta">${n.text}</p>
              </div>
              <p class="item-time">${n.time}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  // ---- PROFILE ----
  pages.profile = () => {
    const session = window.LulaAuth.getSession();
    return `
      <div class="page-header">
        <div><h1 class="page-title">👤 My Profile</h1><p class="page-sub">Manage your account & preferences</p></div>
      </div>

      <div class="dash-grid">
        <div class="card">
          <div style="text-align:center;padding:20px 0">
            <div class="avatar" style="width:96px;height:96px;font-size:36px;margin:0 auto 16px;background:${session.color}">${session.avatar}</div>
            <h2 style="margin:0">${session.name}</h2>
            <p class="text-muted">${session.title}</p>
            <p class="text-small text-muted">${session.email}</p>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-header"><h3 class="card-title">Account Information</h3></div>
            <div class="form-grid">
              <label><span>Full Name</span><input value="${session.name}" /></label>
              <label><span>Email</span><input value="${session.email}" /></label>
              <label><span>Phone</span><input value="+27 11 555 0100" /></label>
              <label><span>Role</span><input value="${window.LulaDB.roles[session.role].label}" disabled /></label>
              <label><span>Site</span><input value="${session.site}" disabled /></label>
            </div>
            <div class="form-actions">
              <button class="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  // =========================================================
  // CHART HELPERS
  // =========================================================
  function renderBarChart(data) {
    const max = Math.max(...data.map(d => d.value)) * 1.2;
    const w = 100 / data.length;
    return `
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style="width:100%;height:100%">
        ${data.map((d, i) => {
          const h = (d.value / max) * 50;
          const x = i * w + w * 0.15;
          const bw = w * 0.7;
          return `
            <rect x="${x}" y="${55 - h}" width="${bw}" height="${h}" rx="1" fill="url(#barGrad)" opacity="0.9" />
            <text x="${x + bw/2}" y="${55 - h - 2}" font-size="2.5" fill="var(--text-1)" text-anchor="middle" font-weight="600">${d.value}</text>
            <text x="${x + bw/2}" y="${59}" font-size="2.5" fill="var(--text-3)" text-anchor="middle">${d.day}</text>
          `;
        }).join('')}
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0ea5e9" />
            <stop offset="100%" stop-color="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
    `;
  }

  function renderLineChart(data) {
    const max = Math.max(...data.map(d => d.value)) * 1.2;
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 95 + 2.5;
      const y = 55 - (d.value / max) * 45;
      return { x, y, ...d };
    });
    const path = points.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ' ' + p.y).join(' ');
    const area = path + ` L ${points[points.length-1].x} 55 L ${points[0].x} 55 Z`;
    return `
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style="width:100%;height:100%">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#22c55e" stop-opacity="0.4" />
            <stop offset="100%" stop-color="#22c55e" stop-opacity="0" />
          </linearGradient>
        </defs>
        ${[0,1,2,3].map(i => `<line x1="0" y1="${15 + i*13}" x2="100" y2="${15 + i*13}" stroke="var(--line)" stroke-width="0.2" stroke-dasharray="1,1"/>`).join('')}
        <path d="${area}" fill="url(#lineGrad)" />
        <path d="${path}" stroke="#22c55e" stroke-width="0.5" fill="none" />
        ${points.map(p => `
          <circle cx="${p.x}" cy="${p.y}" r="0.8" fill="#22c55e" />
          <text x="${p.x}" y="${p.y - 2}" font-size="2.5" fill="var(--text-1)" text-anchor="middle">${p.value}s</text>
          <text x="${p.x}" y="59" font-size="2.5" fill="var(--text-3)" text-anchor="middle">${p.month}</text>
        `).join('')}
      </svg>
    `;
  }

  function renderDonutChart(data) {
    const total = data.reduce((s, d) => s + d.count, 0);
    let cumPct = 0;
    const cx = 50, cy = 30, r = 22, ir = 13;
    const arcs = data.map(d => {
      const pct = d.count / total;
      const startAngle = cumPct * 360;
      const endAngle = (cumPct + pct) * 360;
      cumPct += pct;
      const start = polarToCartesian(cx, cy, r, startAngle);
      const end = polarToCartesian(cx, cy, r, endAngle);
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
      const startI = polarToCartesian(cx, cy, ir, startAngle);
      const endI = polarToCartesian(cx, cy, ir, endAngle);
      return `<path d="M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} L ${endI.x} ${endI.y} A ${ir} ${ir} 0 ${largeArc} 0 ${startI.x} ${startI.y} Z" fill="${d.color}" />`;
    }).join('');
    return `
      <div style="display:flex;align-items:center;gap:24px;height:100%">
        <svg viewBox="0 0 100 60" style="flex:0 0 50%;max-width:50%">
          ${arcs}
          <text x="50" y="32" font-size="6" fill="var(--text-0)" text-anchor="middle" font-weight="700">${total}</text>
          <text x="50" y="38" font-size="3" fill="var(--text-2)" text-anchor="middle">Total</text>
        </svg>
        <div style="flex:1;display:flex;flex-direction:column;gap:8px;font-size:12px">
          ${data.map(d => `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="width:10px;height:10px;background:${d.color};border-radius:2px;flex-shrink:0"></span>
              <span style="flex:1;color:var(--text-1)">${d.type}</span>
              <strong>${d.count}</strong>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function polarToCartesian(cx, cy, r, angleDeg) {
    const a = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  // =========================================================
  // MODAL ACTIONS
  // =========================================================
  function openGenericModal(html, raw = false) {
    const body = $('#generic-modal-body');
    body.innerHTML = html;
    if (raw) {
      body.style.maxHeight = '70vh';
      body.style.overflowY = 'auto';
    } else {
      body.style.maxHeight = '';
      body.style.overflowY = '';
    }
    $('#generic-modal').hidden = false;
  }
  function closeGenericModal() { $('#generic-modal').hidden = true; }

  function newIncidentModal() {
    openGenericModal(`
      <h2 style="margin-top:0">🚨 Report New Incident</h2>
      <form id="incident-form" class="form-grid" style="margin-top:16px">
        <label style="grid-column:1/-1"><span>Title</span><input name="title" required placeholder="Brief description" /></label>
        <label><span>Type</span>
          <select name="type">
            <option>Access Violation</option>
            <option>Suspicious Activity</option>
            <option>Perimeter Breach</option>
            <option>Medical / Safety</option>
            <option>Dispute</option>
            <option>Infrastructure</option>
            <option>Other</option>
          </select>
        </label>
        <label><span>Severity</span>
          <select name="severity">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label><span>Site</span>
          <select name="site">${window.LulaDB.sites.map(s => `<option>${s.name}</option>`).join('')}</select>
        </label>
        <label><span>Zone / Location</span><input name="zone" required placeholder="e.g. Floor 4, Main Lobby" /></label>
        <label style="grid-column:1/-1"><span>Description</span><textarea name="description" placeholder="What happened? Who was involved? Any witnesses?"></textarea></label>
        <div class="form-actions" style="grid-column:1/-1">
          <button type="button" class="btn btn-ghost" data-action="close-generic">Cancel</button>
          <button type="submit" class="btn btn-danger">🚨 Submit Incident Report</button>
        </div>
      </form>
    `);
    $('#incident-form').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      const inc = window.LulaDB.addIncident({
        ...data,
        reportedBy: window.LulaAuth.getSession().name,
        threatScore: data.severity === 'high' ? 75 : data.severity === 'medium' ? 50 : 25
      });
      window.LulaDB.addNotification({ type: 'danger', icon: '🚨', title: 'New incident reported', text: `${inc.id}: ${inc.title}` });
      closeGenericModal();
      toast('Incident reported', `${inc.id} has been logged and dispatch notified.`, 'danger');
      renderSidebar();
      if (currentPage === 'incidents' || currentPage === 'dashboard') renderPage();
    });
  }

  function submitIncident(target) {
    // unused — handled in form submit
  }

  function newVisitorModal() {
    const session = window.LulaAuth.getSession();
    openGenericModal(`
      <h2 style="margin-top:0">🪪 Pre-Register Visitor</h2>
      <form id="visitor-form" class="form-grid" style="margin-top:16px">
        <label><span>Full Name</span><input name="name" required /></label>
        <label><span>Company</span><input name="company" /></label>
        <label><span>ID Type</span>
          <select name="idType"><option>SA ID</option><option>Passport</option><option>Driver License</option></select>
        </label>
        <label><span>ID Number</span><input name="idNumber" required /></label>
        <label><span>Host</span><input name="host" value="${session.name}" /></label>
        <label><span>Site</span>
          <select name="site">${window.LulaDB.sites.map(s => `<option ${s.name === session.site ? 'selected' : ''}>${s.name}</option>`).join('')}</select>
        </label>
        <label><span>Purpose</span><input name="purpose" placeholder="Meeting, delivery, etc." /></label>
        <label><span>Vehicle</span><input name="vehicle" placeholder="Optional" /></label>
        <div class="form-actions" style="grid-column:1/-1">
          <button type="button" class="btn btn-ghost" data-action="close-generic">Cancel</button>
          <button type="submit" class="btn btn-primary">Generate Visitor Pass</button>
        </div>
      </form>
    `);
    $('#visitor-form').addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      const v = window.LulaDB.addVisitor(data);
      window.LulaDB.addNotification({ type: 'info', icon: '🪪', title: 'Visitor pre-registered', text: `${v.name} (${v.passCode})` });
      closeGenericModal();
      toast('Visitor pass created', `${v.name} — Pass ${v.passCode} sent to ${v.host}.`, 'success');
      renderSidebar();
      if (currentPage === 'visitors' || currentPage === 'dashboard') renderPage();
    });
  }

  function viewIncident(id) {
    const i = window.LulaDB.incidents.find(x => x.id === id);
    if (!i) return;
    openGenericModal(`
      <div class="flex between center mb-16">
        <div>
          <h2 style="margin:0">${i.title}</h2>
          <p class="text-muted text-small" style="margin:4px 0 0">${i.id} • Reported ${formatDateTime(i.reportedAt)}</p>
        </div>
        <div class="flex gap-8">
          <span class="badge ${i.severity}">${i.severity}</span>
          <span class="badge ${i.status}">${i.status}</span>
        </div>
      </div>

      <div class="stat-card ${i.severity === 'high' ? 'danger' : i.severity === 'medium' ? 'warning' : 'info'}" style="margin-bottom:16px">
        <div class="flex between center">
          <div>
            <p class="stat-label">AI Threat Score</p>
            <p class="stat-value" style="color:${i.threatScore > 70 ? 'var(--danger)' : i.threatScore > 40 ? 'var(--warning)' : 'var(--success)'}">${i.threatScore}<small style="font-size:14px">/100</small></p>
          </div>
          <div class="text-right">
            <p class="text-muted text-small">Recommendation</p>
            <strong>${i.threatScore > 70 ? 'Immediate dispatch' : i.threatScore > 40 ? 'Monitor closely' : 'Standard handling'}</strong>
          </div>
        </div>
      </div>

      <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;font-size:14px;margin-bottom:16px">
        <div><span class="text-muted text-small">Type</span><br><strong>${i.type}</strong></div>
        <div><span class="text-muted text-small">Site</span><br><strong>${i.site}</strong></div>
        <div><span class="text-muted text-small">Zone</span><br><strong>${i.zone}</strong></div>
        <div><span class="text-muted text-small">Reported By</span><br><strong>${i.reportedBy}</strong></div>
        <div><span class="text-muted text-small">Assigned To</span><br><strong>${i.assignedTo}</strong></div>
        <div><span class="text-muted text-small">Last Update</span><br><strong>${formatTime(i.updatedAt)}</strong></div>
      </div>

      <div style="background:var(--bg-2);padding:12px;border-radius:8px;margin-bottom:16px">
        <strong>Description</strong>
        <p style="margin:8px 0 0;color:var(--text-1)">${i.description}</p>
      </div>

      ${i.evidence && i.evidence.length ? `
        <div style="margin-bottom:16px">
          <strong>📎 Evidence (${i.evidence.length})</strong>
          <div class="flex gap-8 mt-8" style="margin-top:8px;flex-wrap:wrap">
            ${i.evidence.map(e => `<span class="badge info">📄 ${e}</span>`).join('')}
          </div>
        </div>
      ` : ''}

      <div class="form-actions">
        ${i.status !== 'resolved' && i.status !== 'closed' ? `<button class="btn btn-ghost" data-action="assign-incident" data-id="${i.id}">👤 Reassign</button>` : ''}
        ${i.status !== 'resolved' && i.status !== 'closed' ? `<button class="btn btn-success" data-action="resolve-incident" data-id="${i.id}">✅ Mark Resolved</button>` : ''}
        ${i.status !== 'closed' ? `<button class="btn btn-ghost" data-action="close-incident" data-id="${i.id}">🔒 Close</button>` : ''}
        <button class="btn btn-ghost" data-action="close-generic">Close</button>
      </div>
    `);
  }

  function viewGuard(id) {
    const g = window.LulaDB.guards.find(x => x.id === id);
    if (!g) return;
    openGenericModal(`
      <div class="flex gap-16 center" style="margin-bottom:20px">
        <div class="avatar" style="width:72px;height:72px;font-size:24px;background:${window.LulaDB.users.find(u=>u.name===g.name)?.color || 'linear-gradient(135deg,#0ea5e9,#6366f1)'}">${g.name.split(' ').map(s=>s[0]).join('')}</div>
        <div>
          <h2 style="margin:0">${g.name}</h2>
          <p class="text-muted">${g.badge} • ${g.site}</p>
          <span class="badge ${g.status === 'on-duty' ? 'success' : g.status === 'on-break' ? 'warning' : 'muted'}">${g.status}</span>
        </div>
      </div>

      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
        <div class="stat-card"><div class="stat-icon">⭐</div><p class="stat-label">Rating</p><p class="stat-value">${g.rating}</p></div>
        <div class="stat-card"><div class="stat-icon">📍</div><p class="stat-label">Patrol</p><p class="stat-value">${g.patrol}%</p></div>
        <div class="stat-card"><div class="stat-icon">📅</div><p class="stat-label">Shifts</p><p class="stat-value">142</p></div>
      </div>

      <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:12px;font-size:14px">
        <div><span class="text-muted text-small">Phone</span><br><strong>${g.phone}</strong></div>
        <div><span class="text-muted text-small">Shift</span><br><strong>${g.shift}</strong></div>
        <div><span class="text-muted text-small">Last Check-In</span><br><strong>${formatTime(g.lastCheckIn)}</strong></div>
        <div><span class="text-muted text-small">Current Location</span><br><strong>${g.location}</strong></div>
      </div>

      <div class="form-actions">
        <button class="btn btn-ghost" data-action="close-generic">Close</button>
        <button class="btn btn-primary">📞 Call</button>
        <button class="btn btn-success">💬 Message</button>
      </div>
    `);
  }

  function viewCamera(id) {
    const c = window.LulaDB.cameras.find(x => x.id === id);
    if (!c) return;
    openGenericModal(`
      <h2 style="margin-top:0">📹 ${c.name}</h2>
      <p class="text-muted">${c.zone} • ${c.site}</p>
      <div class="camera-card" style="margin:16px 0;height:360px">
        <div class="camera-feed">
          ${c.status === 'online' ? '<div class="scan-line"></div>' : '<div style="color:#ef4444">⚠️ SIGNAL LOST</div>'}
        </div>
        <div class="camera-overlay">
          ${c.status === 'online' ? `<span class="camera-rec">REC</span><span class="camera-meta">${c.id.toUpperCase()}</span>` : '<span class="camera-meta">OFFLINE</span>'}
        </div>
      </div>
      <div class="form-grid" style="grid-template-columns:repeat(3,1fr);font-size:14px">
        <div><span class="text-muted text-small">Status</span><br><span class="badge ${c.status === 'online' ? 'success' : 'danger'}">${c.status}</span></div>
        <div><span class="text-muted text-small">AI Detection</span><br><span class="badge ${c.ai ? 'success' : 'muted'}">${c.ai ? 'Active' : 'Disabled'}</span></div>
        <div><span class="text-muted text-small">Alerts Today</span><br><strong>${c.alerts}</strong></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost" data-action="close-generic">Close</button>
        <button class="btn btn-warning">⏸ Pause Feed</button>
        <button class="btn btn-primary">📸 Snapshot</button>
        <button class="btn btn-success">🎬 Start Recording</button>
      </div>
    `);
  }

  function assignIncidentModal(id) {
    openGenericModal(`
      <h2 style="margin-top:0">👤 Assign Incident ${id}</h2>
      <p class="text-muted">Reassign to an available guard or officer</p>
      <div class="item-list" style="margin-top:16px">
        ${window.LulaDB.getOnDutyGuards().map(g => `
          <div class="item">
            <div class="item-icon">👮</div>
            <div class="item-body"><p class="item-title">${g.name}</p><p class="item-meta">${g.badge} • ${g.location}</p></div>
            <button class="btn btn-primary btn-sm" onclick="document.querySelector('#generic-modal').hidden=true;setTimeout(()=>{window.LulaApp && window.LulaApp.toast('Assigned','${g.name} assigned to ${id}','success')},100)">Assign</button>
          </div>
        `).join('')}
      </div>
    `);
  }

  // =========================================================
  // ACTIONS
  // =========================================================
  function doLogout() {
    if (confirm('Are you sure you want to sign out?')) {
      window.LulaAuth.logout();
      showLanding();
      toast('Signed out', 'You have been securely signed out.', 'info');
    }
  }

  function toggleTheme() {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    localStorage.setItem('lula_theme', theme);
  }
  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    $('#theme-btn').textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  function toggleNotifications() {
    notifOpen = !notifOpen;
    const panel = $('#notif-panel');
    if (notifOpen) {
      renderNotifications();
      panel.hidden = false;
    } else {
      panel.hidden = true;
    }
  }
  function renderNotifications() {
    const list = $('#notif-list');
    list.innerHTML = window.LulaDB.notifications.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}">
        <div class="notif-icon">${n.icon}</div>
        <div class="notif-body">
          <p class="notif-title">${n.title}</p>
          <p class="notif-text">${n.text}</p>
          <p class="notif-time">${n.time}</p>
        </div>
      </div>
    `).join('');
  }
  function markAllRead() {
    window.LulaDB.notifications.forEach(n => n.unread = false);
    $('#notif-dot').hidden = true;
    renderNotifications();
    if (currentPage === 'notifications') renderPage();
    toast('Notifications cleared', 'All notifications marked as read.', 'info');
  }

  function triggerPanic() {
    if (!confirm('🆘 ACTIVATE EMERGENCY PANIC?\n\nThis will immediately alert dispatch and stream your live location.')) return;
    $('#panic-overlay').hidden = false;
    setTimeout(() => {
      $('#panic-status').textContent = 'Unit dispatched';
    }, 2000);
    setTimeout(() => {
      $('#panic-eta').textContent = '2 min 04 s';
    }, 4000);
  }
  function cancelPanic() {
    $('#panic-overlay').hidden = true;
    toast('Panic cancelled', 'Emergency cancelled — dispatch notified.', 'info');
  }

  function toggleAccess(id) {
    const a = window.LulaDB.accessPoints.find(x => x.id === id);
    if (a) {
      a.status = a.status === 'locked' ? 'unlocked' : 'locked';
      toast('Access updated', `${a.name} is now ${a.status}.`, a.status === 'locked' ? 'success' : 'warning');
      renderPage();
    }
  }

  function checkpointScan() {
    toast('Checkpoint scanned', 'Checkpoint 9 confirmed at ' + new Date().toLocaleTimeString(), 'success');
  }

  function requestBackup() {
    toast('Backup requested', 'Dispatch has been notified — backup unit en route.', 'warning');
  }

  // =========================================================
  // TOAST
  // =========================================================
  function toast(title, msg, type = 'info') {
    const container = $('#toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'danger' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <div class="toast-body">
        <p class="toast-title">${title}</p>
        <p class="toast-msg">${msg}</p>
      </div>
    `;
    container.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'all .3s';
      t.style.opacity = '0';
      t.style.transform = 'translateX(120%)';
      setTimeout(() => t.remove(), 300);
    }, 4000);
  }

  // =========================================================
  // HELPERS
  // =========================================================
  function formatTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(d) {
    return d.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function formatDateTime(iso) {
    const d = typeof iso === 'string' ? new Date(iso) : iso;
    return d.toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
  }

  // Expose for global access
  window.LulaApp = { showLanding, toast, navigate };

})();
