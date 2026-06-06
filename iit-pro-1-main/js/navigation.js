/* ══════════════════════════════════════
   NAVIGATION & UTILS
 ══════════════════════════════════════ */
let viewHistory = [];
let currentViewId = 'dashboard';
let isSidebarPinned = false;
let sidebarTimer;

function toggleSidebar() {
  isSidebarPinned = !isSidebarPinned;
  if (isSidebarPinned) {
    document.body.classList.remove('sidebar-hidden');
  } else {
    document.body.classList.add('sidebar-hidden');
  }
  if (window.initLucide) initLucide();
}

function expandSidebar() {
  if (isSidebarPinned) return;
  clearTimeout(sidebarTimer);
  document.body.classList.remove('sidebar-hidden');
}

function collapseSidebar() {
  if (isSidebarPinned) return;
  sidebarTimer = setTimeout(() => {
    document.body.classList.add('sidebar-hidden');
  }, 200);
}

// Initialize history state on load
if (history.state === null) {
  history.replaceState({ viewId: currentViewId }, '', '#' + currentViewId);
}

window.addEventListener('popstate', (event) => {
  if (event.state && event.state.viewId) {
    const idx = viewHistory.indexOf(event.state.viewId);
    if (idx !== -1) {
      viewHistory = viewHistory.slice(0, idx);
    }
    showView(event.state.viewId, null, false);
  } else {
    viewHistory = [];
    showView('dashboard', null, false);
  }
});

async function initApp() {
  try {
    const data = await apiFetch('/projects');
    // Map backend project entities to frontend S.projects format
    S.projects = data.map(p => ({
      id: p.id,
      title: p.projectName,
      district: p.district,
      year: '2025-26', // Default or parse from backend if added
      mineral: 'Sand',
      rivers: 'Not specified',
      progress: 0,
      status: p.status === 'IN_PROGRESS' ? 'In Progress' : p.status,
      createdAt: p.createdAt ? new Date(p.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      signatures: 0
    }));
  } catch (err) {
    console.error('Failed to load projects from backend:', err);
  }

  // Fetch reports for Notifications and Workflow
  try {
    const reports = await apiFetch('/reports');
    if (reports && Array.isArray(reports)) {
      S.projects.forEach(p => {
        const rep = reports.find(r => r.projectId === p.id);
        if (rep) p.reportStatus = rep.status;
      });

      if (S.role === 'user') { // DEO / OFFICER
        const returned = reports.filter(r => r.status === 'RETURNED' || r.status === 'REJECTED');
        updateNotificationUI(returned);
      }
    }
  } catch (err) {
    console.error('Failed to load reports for notifications', err);
  }

  renderDashboard(); renderProjects(); renderChapters(); renderPlates();
  initDemandTable(); initSummaryTable(); initAuctionTable();
  renderSignatures(); renderFinalChecklist();
  renderGraphs(); // Ensure graphs exist so plates can link to them
  document.getElementById('badge-projs').textContent = S.projects.length;
  document.getElementById('sb-pending-sigs').textContent = S.signatures.filter(s => !s.signed).length;
}

window.scrollToSection = function (viewId, sectionId, parentBtn) {
  showView(viewId, parentBtn);
  setTimeout(() => {
    const el = document.getElementById(sectionId);
    if (el) {
      const card = el.closest('.card') || el;
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const oldBg = card.style.backgroundColor;
      card.style.transition = 'background-color 0.5s ease';
      card.style.backgroundColor = 'var(--yellow-lt)';
      setTimeout(() => {
        card.style.backgroundColor = oldBg;
      }, 1500);
    }
  }, 150);
};

window.toggleSubMenu = function (id) {
  const el = document.getElementById(id);
  if (!el) return;
  const isVisible = el.style.display === 'block';

  // Close all flyouts
  document.querySelectorAll('.flyout-menu').forEach(m => m.style.display = 'none');

  // Toggle the clicked one
  if (!isVisible) {
    el.style.display = 'block';
  }
};

function showView(id, btn, push = true) {
  // Hide flyout menus whenever a main view changes
  document.querySelectorAll('.flyout-menu').forEach(m => m.style.display = 'none');

  if (push && currentViewId && currentViewId !== id) {
    viewHistory.push(currentViewId);
    history.pushState({ viewId: id }, '', '#' + id);
  }
  currentViewId = id;

  // Toggle display of back button based on history
  const backBtn = document.getElementById('tb-back-btn');
  if (backBtn) {
    backBtn.style.display = viewHistory.length > 0 ? 'flex' : 'none';
  }

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sb-item').forEach(b => b.classList.remove('active'));

  const el = document.getElementById('view-' + id);
  if (el) el.classList.add('active');

  // Highlight active sidebar item
  if (btn) {
    btn.classList.add('active');
  } else {
    // Attempt to locate and highlight matching button in sidebar
    const targetBtn = Array.from(document.querySelectorAll('.sb-item')).find(b => {
      const onclickAttr = b.getAttribute('onclick');
      return onclickAttr && onclickAttr.includes(`'${id}'`);
    });
    if (targetBtn) targetBtn.classList.add('active');
  }

  const titles = {
    'dashboard': 'Dashboard', 'projects': 'My DSR Projects', 'workflow': 'Report Workflow',
    'front-matter': 'Front Matter', 'chapters': 'Chapters (10)', 'plates': 'Plate Section',
    'graphs': 'Cross Section Graph Generator', 'anx1': 'Annexure I — Sand Sources',
    'anx2': 'Annexure II — Mining Leases', 'anx3': 'Annexure III — Cluster Details',
    'anx4': 'Annexure IV — Transportation Routes', 'anx5': 'Annexure V — Bench Mark & CORS',
    'anx6': 'Annexure VI — Final Cluster Details', 'anx7': 'Annexure VII — Transportation Routes',
    'annexures-extra': 'Additional Annexures', 'demand-table': 'Projected Demand Table',
    'auction-table': 'Auctioned Sites', 'summary-table': 'Source Summary Table', 'benchmark-table': 'Bench Mark & CORS',
    'esign': 'E-Signature Panel', 'generate': 'Generate Final PDF', 'history': 'Report History', 'users': 'User Management'
  };

  const titleEl = document.getElementById('topbar-title');
  if (titleEl) titleEl.textContent = titles[id] || id;

  if (id === 'esign') renderSignatures();
  if (id === 'generate') renderFinalChecklist();
  if (id === 'plates') renderPlates(); // Re-render in case new graphs were added
  if (id === 'workflow') updateWorkflowDistrictUI();
  if (id === 'anx1' && typeof renderPdfUploadUIAnx1 === 'function') renderPdfUploadUIAnx1();
  if (id === 'anx2' && typeof renderPdfUploadUIAnx2 === 'function') renderPdfUploadUIAnx2();
  if (id === 'anx3' && typeof renderPdfUploadUI === 'function') renderPdfUploadUI();
  if (id === 'anx4') {
    if (typeof initRoutesTable === 'function') initRoutesTable();
    if (typeof initClustersTable === 'function') initClustersTable();
    if (typeof renderPdfUploadUIAnx4 === 'function') renderPdfUploadUIAnx4();
  }
  if (id === 'anx5') {
    if (typeof renderPdfUploadUIAnx5 === 'function') renderPdfUploadUIAnx5();
    if (typeof renderAnx5SavedTables === 'function') renderAnx5SavedTables();
  }
  if (id === 'anx6') {
    if (typeof renderAnx6 === 'function') renderAnx6();
    if (typeof renderPdfUploadUIAnx6 === 'function') renderPdfUploadUIAnx6();
  }
  if (id === 'anx7') {
    if (typeof initAnx7 === 'function') initAnx7();
    else if (typeof renderPdfUploadUIAnx7 === 'function') renderPdfUploadUIAnx7();
  }
  if (id === 'history' && typeof renderHistoryTable === 'function') renderHistoryTable();
  if (id === 'dashboard' && S.activeProject && typeof checkReviewStatus === 'function') checkReviewStatus(S.activeProject.id);
  if (S.activeProject && typeof updateActiveProjectCardUI === 'function') updateActiveProjectCardUI();

  if (['front-matter', 'chapters', 'plates'].includes(id)) {
    if (window.pdfPreview) window.pdfPreview.show(id);
  } else {
    if (window.pdfPreview) window.pdfPreview.hide();
  }

  renderDistrictLegends();
  initLucide();

  if (typeof enforceReviewerReadOnly === 'function') {
    setTimeout(enforceReviewerReadOnly, 100);
    setTimeout(enforceReviewerReadOnly, 500); // safety net for slower renders
  }

  if (typeof loadReviewerNoteForView === 'function') {
    loadReviewerNoteForView(id, titles[id] || id);
  }
}

function goBackView() {
  if (viewHistory.length > 0) {
    history.back();
  }
}

function initLucide() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function clearActiveProject() {
  if (typeof S !== 'undefined') {
    S.activeProject = null;
    ['report-nav', 'annexure-nav', 'tables-nav', 'finalize-nav'].forEach(n => {
      const el = document.getElementById(n);
      if (el) el.style.display = 'none';
    });
    if (typeof updateActiveDistrictUI === 'function') updateActiveDistrictUI('Punjab');
    if (typeof updateActiveProjectCardUI === 'function') updateActiveProjectCardUI();
    if (typeof filterDashboardByDistrict === 'function') filterDashboardByDistrict('ALL');
  }
}

/* Theme logic lives in js/theme.js (loaded in <head> for instant light default) */

let confirmCallback = null;

function customConfirm(msg, cb) {
  document.getElementById('confirm-msg').textContent = msg;
  confirmCallback = cb;
  document.getElementById('modal-confirm').classList.add('open');
}

function doConfirm() {
  closeModal('modal-confirm');
  if (confirmCallback) confirmCallback();
}

function closeModal(id) { document.getElementById(id).classList.remove('open'); }

// Bind close modal on clicking overlay background
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('open'); });
  });
  if (typeof updateDarkModeIcon === 'function') updateDarkModeIcon();
});

let toastTimer;
function toast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.className = `toast toast-${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 4200);
}

// Global utility for formatting numbers
function fmtN(v, dec = 2) {
  const n = Number(v);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

/* ── District Management System ── */
const DISTRICT_COLORS = {
  'Jalandhar': {
    // Indigo Blue (#4F46E5)
    light: { bg: 'rgba(79, 70, 229, 0.15)', border: '#4F46E5', text: '#3730a3', glow: 'rgba(79, 70, 229, 0.25)' },
    dark: { bg: 'rgba(99, 102, 241, 0.25)', border: '#818cf8', text: '#e0e7ff', glow: 'rgba(129, 140, 248, 0.4)' }
  },
  'Ludhiana': {
    // Cyan (#06B6D4)
    light: { bg: 'rgba(6, 182, 212, 0.15)', border: '#0891b2', text: '#155e75', glow: 'rgba(6, 182, 212, 0.25)' },
    dark: { bg: 'rgba(6, 182, 212, 0.25)', border: '#22d3ee', text: '#ecfeff', glow: 'rgba(34, 211, 238, 0.4)' }
  },
  'Mansa': {
    // Purple Violet (#9333EA)
    light: { bg: 'rgba(147, 51, 234, 0.15)', border: '#9333EA', text: '#6b21a8', glow: 'rgba(147, 51, 234, 0.25)' },
    dark: { bg: 'rgba(168, 85, 247, 0.25)', border: '#c084fc', text: '#faf5ff', glow: 'rgba(192, 132, 252, 0.4)' }
  },
  'Hoshiarpur': {
    // Teal (#0F766E)
    light: { bg: 'rgba(15, 118, 110, 0.15)', border: '#0F766E', text: '#115e59', glow: 'rgba(15, 118, 110, 0.25)' },
    dark: { bg: 'rgba(20, 184, 166, 0.25)', border: '#2dd4bf', text: '#f0fdfa', glow: 'rgba(45, 212, 191, 0.4)' }
  },
  'Pathankot': {
    // Orange Amber (#EA580C)
    light: { bg: 'rgba(234, 88, 12, 0.15)', border: '#EA580C', text: '#9a3412', glow: 'rgba(234, 88, 12, 0.25)' },
    dark: { bg: 'rgba(249, 115, 22, 0.25)', border: '#fb923c', text: '#fff7ed', glow: 'rgba(251, 146, 60, 0.4)' }
  },
  'Rupnagar': {
    // Rose Pink (#E11D48)
    light: { bg: 'rgba(225, 29, 72, 0.15)', border: '#E11D48', text: '#9f1239', glow: 'rgba(225, 29, 72, 0.25)' },
    dark: { bg: 'rgba(244, 63, 94, 0.25)', border: '#fda4af', text: '#fff1f2', glow: 'rgba(253, 164, 175, 0.4)' }
  },
  'Tarn Taran': {
    // Sky Blue (#0284C7)
    light: { bg: 'rgba(2, 132, 199, 0.15)', border: '#0284C7', text: '#075985', glow: 'rgba(2, 132, 199, 0.25)' },
    dark: { bg: 'rgba(14, 165, 233, 0.25)', border: '#38bdf8', text: '#f0f9ff', glow: 'rgba(56, 189, 248, 0.4)' }
  }
};

function getDistrictStyle(name, forceDark = false) {
  const cleanName = (name || '').trim();
  const isDark = forceDark || document.documentElement.classList.contains('dark');
  const dist = DISTRICT_COLORS[cleanName] || {
    light: { bg: 'rgba(79, 70, 229, 0.15)', border: '#4F46E5', text: '#3730a3', glow: 'rgba(79, 70, 229, 0.25)' },
    dark: { bg: 'rgba(99, 102, 241, 0.25)', border: '#818cf8', text: '#e0e7ff', glow: 'rgba(129, 140, 248, 0.4)' }
  };
  const themeStyle = isDark ? dist.dark : dist.light;

  // Custom topbar style overrides for high contrast on navy navbar
  const topbarBg = (isDark || forceDark) ? themeStyle.bg : 'rgba(255, 255, 255, 0.95)';
  const topbarColor = themeStyle.text;
  const topbarBorder = themeStyle.border;
  const topbarGlow = themeStyle.glow;

  return {
    bg: themeStyle.bg,
    color: themeStyle.text,
    border: themeStyle.border,
    glow: themeStyle.glow,
    topbarBg,
    topbarColor,
    topbarBorder,
    topbarGlow
  };
}

function paintDistrictThemeOnElement(el, districtName) {
  if (!el || !districtName) return;
  const style = getDistrictStyle(districtName);
  el.style.setProperty('--district-border', style.border);
  el.style.setProperty('--district-accent', style.color);
  el.style.setProperty('--district-bg', style.bg);
  el.style.setProperty('--district-glow', style.glow);
  el.dataset.district = districtName;
}

function applyDistrictBadgeStyles(el, districtName) {
  if (!el || !districtName) return;
  const style = getDistrictStyle(districtName);
  el.classList.add('district-badge');
  el.dataset.district = districtName;
  el.style.background = style.bg;
  el.style.color = style.color;
  el.style.border = `2px solid ${style.border}`;
  el.style.boxShadow = `0 1px 3px ${style.glow}`;
}

function getDistrictBadgeHTML(districtName) {
  const safe = (districtName || '').replace(/"/g, '&quot;');
  return `<span class="badge district-badge" data-district="${safe}">${districtName}</span>`;
}

function refreshDistrictBadgesInDOM() {
  document.querySelectorAll('.district-badge[data-district]').forEach((el) => {
    applyDistrictBadgeStyles(el, el.dataset.district);
  });
}

function ensureActiveProjectCardHost(containerEl) {
  if (!containerEl) return null;
  let host = containerEl.querySelector(':scope > .active-dsr-project-card-host');
  if (!host) {
    host = document.createElement('div');
    host.className = 'active-dsr-project-card-host';
    containerEl.insertBefore(host, containerEl.firstChild);
  }
  return host;
}

function ensureDistrictManagementHost(containerEl) {
  if (!containerEl) return null;
  let panel = containerEl.querySelector(':scope > #district-management-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'district-management-panel';
    containerEl.appendChild(panel);
  }
  return panel;
}

function ensureActiveProjectCardStructure(hostEl) {
  if (!hostEl) return null;
  let card = hostEl.querySelector('.active-dsr-project-card');
  if (!card) {
    hostEl.innerHTML = `
      <div class="active-dsr-project-card card" hidden>
        <div class="active-dsr-project-card__body">
          <div class="active-dsr-project-card__label">Currently Editing DSR Project</div>
          <div class="active-dsr-project-card__title"></div>
        </div>
        <span class="active-dsr-project-card__badge district-badge"></span>
      </div>`;
    card = hostEl.querySelector('.active-dsr-project-card');
  }
  return card;
}

function paintActiveProjectCard(card, project) {
  if (!card || !project) return;
  const dist = project.district;
  const titleEl = card.querySelector('.active-dsr-project-card__title');
  const badgeEl = card.querySelector('.active-dsr-project-card__badge');
  if (titleEl) titleEl.textContent = project.title;
  if (badgeEl) badgeEl.textContent = `${dist} DISTRICT`;
  paintDistrictThemeOnElement(card, dist);
  if (badgeEl) applyDistrictBadgeStyles(badgeEl, dist);
}

function updateActiveProjectCardUI() {
  const containers = [
    document.getElementById('workflow-active-district-header'),
    document.getElementById('dash-right-sidebar')
  ];

  containers.forEach((container) => {
    if (!container) return;
    const host = container.id === 'workflow-active-district-header'
      ? container
      : ensureActiveProjectCardHost(container);

    if (!S.activeProject) {
      if (container.id === 'workflow-active-district-header') {
        container.style.display = 'none';
        container.innerHTML = '';
      } else {
        const card = host.querySelector('.active-dsr-project-card');
        if (card) card.hidden = true;
      }
      return;
    }

    if (container.id === 'workflow-active-district-header') {
      container.style.display = 'block';
    }

    const card = ensureActiveProjectCardStructure(host);
    if (!card) return;
    card.hidden = false;
    paintActiveProjectCard(card, S.activeProject);
  });
}

/** Re-apply district + project themed UI after light/dark toggle (no page reload). */
function refreshThemeDependentUI() {
  if (typeof S === 'undefined' || !S) return;

  const dist = S.activeProject ? S.activeProject.district : 'Punjab';
  updateActiveDistrictUI(dist);
  updateActiveProjectCardUI();
  renderDistrictLegends();
  refreshDistrictBadgesInDOM();

  if (typeof renderDashboard === 'function') renderDashboard();
  if (typeof renderProjects === 'function') renderProjects();
  if (window.initLucide) initLucide();
  /* Charts are heavy — defer so district/project cards repaint first */
  if (typeof renderGraphs === 'function') {
    requestAnimationFrame(() => renderGraphs());
  }
}

function updateActiveDistrictUI(districtName) {
  const badgeEl = document.getElementById('tb-district-badge');
  if (!badgeEl) return;

  if (districtName && districtName !== 'Punjab' && districtName !== 'ALL') {
    const style = getDistrictStyle(districtName);
    badgeEl.textContent = districtName;
    badgeEl.style.backgroundColor = style.topbarBg;
    badgeEl.style.color = style.topbarColor;
    badgeEl.style.borderColor = style.topbarBorder;
    badgeEl.style.borderWidth = '2.5px';
    badgeEl.style.borderStyle = 'solid';
    badgeEl.style.borderRadius = '99px';
    badgeEl.style.padding = '6px 14px';
    badgeEl.style.fontSize = '12.5px';
    badgeEl.style.boxShadow = `0 4px 12px ${style.topbarGlow}, 0 0 0 1.5px ${style.topbarBorder}`;
    badgeEl.style.transform = 'translateY(-1px)';
    badgeEl.style.fontWeight = '700';
    badgeEl.style.textTransform = 'uppercase';
    badgeEl.style.letterSpacing = '0.04em';
    badgeEl.style.transition = 'all 0.3s ease';
    badgeEl.style.display = 'inline-flex';
    badgeEl.style.alignItems = 'center';

    badgeEl.onmouseover = () => {
      badgeEl.style.transform = 'translateY(-2px)';
      badgeEl.style.boxShadow = `0 6px 16px ${style.topbarGlow}, 0 0 0 2px ${style.topbarBorder}`;
    };
    badgeEl.onmouseout = () => {
      badgeEl.style.transform = 'translateY(-1px)';
      badgeEl.style.boxShadow = `0 4px 12px ${style.topbarGlow}, 0 0 0 1.5px ${style.topbarBorder}`;
    };

    // Update dashboard indicator badge if it exists
    const dashIndicator = document.getElementById('dash-active-district-badge');
    if (dashIndicator) {
      dashIndicator.id = 'dash-active-district-badge';
      dashIndicator.className = 'badge district-badge';
      dashIndicator.textContent = districtName;
      dashIndicator.style.fontWeight = '800';
      dashIndicator.style.transform = 'translateY(-1px)';
      applyDistrictBadgeStyles(dashIndicator, districtName);
    }
  } else {
    // Reset to default Punjab styling
    badgeEl.textContent = 'Punjab';
    badgeEl.style.backgroundColor = '';
    badgeEl.style.color = '';
    badgeEl.style.borderColor = '';
    badgeEl.style.borderWidth = '';
    badgeEl.style.borderStyle = '';
    badgeEl.style.borderRadius = '';
    badgeEl.style.padding = '';
    badgeEl.style.fontSize = '';
    badgeEl.style.boxShadow = '';
    badgeEl.style.transform = '';
    badgeEl.style.fontWeight = '';
    badgeEl.style.textTransform = '';
    badgeEl.style.letterSpacing = '';
    badgeEl.style.transition = '';
    badgeEl.style.display = '';
    badgeEl.style.alignItems = '';
    badgeEl.onmouseover = null;
    badgeEl.onmouseout = null;

    const dashIndicator = document.getElementById('dash-active-district-badge');
    if (dashIndicator) {
      dashIndicator.outerHTML = `<span id="dash-active-district-badge" class="badge" style="background:var(--off); color:var(--text-soft);">None</span>`;
    }
  }
}

function updateWorkflowDistrictUI() {
  updateActiveProjectCardUI();
  const reviewerActions = document.getElementById('reviewer-actions');
  if (reviewerActions) {
    reviewerActions.style.display = (S.role === 'reviewer' && S.activeProject) ? 'flex' : 'none';
  }
}

function renderDistrictLegends() {
  const sidebarEl = document.getElementById('sidebar-districts-legend');
  const dashEl = document.getElementById('dash-right-sidebar');
  const projectsEl = document.getElementById('projects-right-sidebar');

  const districts = ['Jalandhar', 'Ludhiana', 'Mansa', 'Hoshiarpur', 'Pathankot', 'Rupnagar', 'Tarn Taran'];

  // 1. Sidebar rendering
  if (sidebarEl) {
    let html = '';
    districts.forEach(d => {
      const style = getDistrictStyle(d);
      const isActiveFilter = currentDistrictFilter === d;
      const isActiveProj = S.activeProject && S.activeProject.district === d;
      const isSelected = isActiveFilter || isActiveProj;

      const itemStyle = isSelected
        ? `background: ${style.bg}; color: ${style.color}; border: 2px solid ${style.border}; font-weight: 700; box-shadow: 0 2px 8px ${style.glow}; transform: translateY(-1px);`
        : `border: 2px solid transparent; color: var(--text);`;

      const hoverEvents = isSelected
        ? `onmouseover="this.style.transform='translateY(-1px)', this.style.boxShadow='0 4px 12px ${style.glow}'" onmouseout="this.style.transform='translateY(-1px)', this.style.boxShadow='0 2px 8px ${style.glow}'"`
        : `onmouseover="this.style.background='var(--off)', this.style.color='var(--primary)'" onmouseout="this.style.background='transparent', this.style.color='var(--text)'"`;

      html += `
        <div onclick="filterDashboardByDistrict('${d}')" ${hoverEvents} style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 12px; cursor: pointer; transition: all 0.2s ease; font-size: 13px; font-weight: 600; margin-bottom: 4px; ${itemStyle}">
          <span style="width: 10px; height: 10px; border-radius: 50%; background: ${style.border}; border: 1.5px solid var(--card); flex-shrink: 0; box-shadow: 0 0 4px ${style.glow};"></span>
          <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${d}</span>
          ${isActiveProj ? `<span style="font-size: 9px; font-weight: 800; text-transform: uppercase; background: ${style.border}; color: #fff; padding: 1px 5px; border-radius: 3px; box-shadow: 0 1px 3px ${style.glow};">Active</span>` : ''}
        </div>
      `;
    });
    sidebarEl.innerHTML = html;
  }

  // 2. Right Sidebars rendering (detailed cards)
  const renderDetailedCard = (containerEl) => {
    if (!containerEl) return;

    let listHtml = '';

    // Add "All Districts" option at the top of the detailed legend
    const isAllSelected = currentDistrictFilter === 'ALL';
    const allStyle = isAllSelected
      ? `background: var(--primary-lt); color: var(--primary); border: 2px solid var(--primary); font-weight: 700; box-shadow: 0 4px 12px var(--primary-lt); transform: translateY(-1px);`
      : `background: var(--off); border: 2px solid var(--border); color: var(--text-mid);`;

    const allHover = isAllSelected
      ? `onmouseover="this.style.transform='translateY(-1px)', this.style.boxShadow='0 6px 16px var(--primary-lt)'" onmouseout="this.style.transform='translateY(-1px)', this.style.boxShadow='0 4px 12px var(--primary-lt)'"`
      : `onmouseover="this.style.background='var(--border)', this.style.transform='translateY(-1px)'" onmouseout="this.style.background='var(--off)', this.style.transform='none'"`;

    listHtml += `
      <div onclick="filterDashboardByDistrict('ALL')" ${allHover} style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: var(--r-md); cursor: pointer; transition: all 0.2s ease; font-size: 13px; margin-bottom: 8px; ${allStyle}">
        <span style="width: 12px; height: 12px; border-radius: 50%; background: var(--primary); border: 2px solid var(--card); flex-shrink: 0;"></span>
        <span style="flex: 1; font-weight: 700;">All Districts (Punjab)</span>
      </div>
    `;

    districts.forEach(d => {
      const style = getDistrictStyle(d);
      const isActiveFilter = currentDistrictFilter === d;
      const isActiveProj = S.activeProject && S.activeProject.district === d;
      const isSelected = isActiveFilter || isActiveProj;

      const itemStyle = isSelected
        ? `background: ${style.bg}; color: ${style.color}; border: 2px solid ${style.border}; font-weight: 700; box-shadow: 0 4px 12px ${style.glow}; transform: translateY(-1px);`
        : `background: var(--off); border: 2px solid var(--border); color: var(--text-mid);`;

      const hoverEvents = isSelected
        ? `onmouseover="this.style.transform='translateY(-1px)', this.style.boxShadow='0 6px 18px ${style.glow}'" onmouseout="this.style.transform='translateY(-1px)', this.style.boxShadow='0 4px 12px ${style.glow}'"`
        : `onmouseover="this.style.background='var(--border)', this.style.transform='translateY(-1px)', this.style.borderColor='${style.border}'" onmouseout="this.style.background='var(--off)', this.style.transform='none', this.style.borderColor='var(--border)'"`;

      listHtml += `
        <div onclick="filterDashboardByDistrict('${d}')" ${hoverEvents} style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: var(--r-md); cursor: pointer; transition: all 0.2s ease; font-size: 13px; margin-bottom: 8px; ${itemStyle}">
          <span style="width: 12px; height: 12px; border-radius: 50%; background: ${style.border}; border: 2px solid var(--card); box-shadow: 0 0 4px ${style.glow}; flex-shrink: 0;"></span>
          <span style="flex: 1; font-weight: 600;">${d} District</span>
          ${isActiveProj ? `<span style="font-size: 9px; font-weight: 800; text-transform: uppercase; background: ${style.border}; color: #fff; padding: 2px 8px; border-radius: var(--r-xs); box-shadow: 0 1px 3px ${style.glow};">Editing</span>` : ''}
        </div>
      `;
    });

    containerEl.innerHTML = `
      <div class="card" style="border: 1px solid var(--border); padding: 20px; background: var(--card); box-shadow: var(--sh-sm);">
        <div style="font-size: 14.5px; font-weight: 800; color: var(--text); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
          <i data-lucide="map" style="width:18px; height:18px; color: var(--primary);"></i>
          <span>District Management</span>
        </div>
        <p style="font-size: 12px; color: var(--text-soft); margin-bottom: 16px; line-height: 1.5;">
          Select a district to filter context-specific surveys. The active project's district is highlighted with a shadow.
        </p>
        <div style="display: flex; flex-direction: column;">
          ${listHtml}
        </div>
      </div>
    `;
  };

  renderDetailedCard(ensureDistrictManagementHost(dashEl));
  renderDetailedCard(ensureDistrictManagementHost(projectsEl));
  if (typeof updateActiveProjectCardUI === 'function') updateActiveProjectCardUI();
  initLucide();
}

/* ── River Color Identity System ── */
const RIVER_COLORS = {
  'Sutlej': {
    light: { bg: 'rgba(16, 185, 129, 0.15)', border: '#10B981', text: '#065f46', glow: 'rgba(16, 185, 129, 0.25)' },
    dark: { bg: 'rgba(16, 185, 129, 0.25)', border: '#34d399', text: '#ecfdf5', glow: 'rgba(52, 211, 153, 0.4)' }
  },
  'Beas': {
    light: { bg: 'rgba(6, 182, 212, 0.15)', border: '#06B6D4', text: '#155e75', glow: 'rgba(6, 182, 212, 0.25)' },
    dark: { bg: 'rgba(6, 182, 212, 0.25)', border: '#22d3ee', text: '#ecfeff', glow: 'rgba(34, 211, 238, 0.4)' }
  },
  'Ghaggar': {
    light: { bg: 'rgba(15, 118, 110, 0.15)', border: '#0F766E', text: '#115e59', glow: 'rgba(15, 118, 110, 0.25)' },
    dark: { bg: 'rgba(15, 118, 110, 0.25)', border: '#2dd4bf', text: '#f0fdfa', glow: 'rgba(45, 212, 191, 0.4)' }
  },
  'Ravi': {
    light: { bg: 'rgba(249, 115, 22, 0.15)', border: '#F97316', text: '#9a3412', glow: 'rgba(249, 115, 22, 0.25)' },
    dark: { bg: 'rgba(249, 115, 22, 0.25)', border: '#fb923c', text: '#fff7ed', glow: 'rgba(251, 146, 60, 0.4)' }
  },
  'Yamuna': {
    light: { bg: 'rgba(37, 99, 235, 0.15)', border: '#2563EB', text: '#1e40af', glow: 'rgba(37, 99, 235, 0.25)' },
    dark: { bg: 'rgba(37, 99, 235, 0.25)', border: '#60a5fa', text: '#eff6ff', glow: 'rgba(96, 165, 250, 0.4)' }
  },
  'Chenab': {
    light: { bg: 'rgba(124, 58, 237, 0.15)', border: '#7C3AED', text: '#5b21b6', glow: 'rgba(124, 58, 237, 0.25)' },
    dark: { bg: 'rgba(124, 58, 237, 0.25)', border: '#a78bfa', text: '#faf5ff', glow: 'rgba(167, 139, 250, 0.4)' }
  },
  'Jhelum': {
    light: { bg: 'rgba(71, 85, 105, 0.15)', border: '#475569', text: '#334155', glow: 'rgba(71, 85, 105, 0.25)' },
    dark: { bg: 'rgba(71, 85, 105, 0.25)', border: '#94a3b8', text: '#cbd5e1', glow: 'rgba(148, 163, 184, 0.4)' }
  }
};

function getRiverStyle(name) {
  const cleanName = (name || '').trim();
  const isDark = document.documentElement.classList.contains('dark');
  const style = RIVER_COLORS[cleanName] || {
    light: { bg: 'rgba(71, 85, 105, 0.15)', border: '#64748b', text: '#334155', glow: 'rgba(71, 85, 105, 0.25)' },
    dark: { bg: 'rgba(71, 85, 105, 0.25)', border: '#94a3b8', text: '#cbd5e1', glow: 'rgba(148, 163, 184, 0.4)' }
  };
  const themeStyle = isDark ? style.dark : style.light;
  return {
    bg: themeStyle.bg,
    color: themeStyle.text,
    border: themeStyle.border,
    glow: themeStyle.glow
  };
}

function getRiverBadgeHTML(riverName) {
  const style = getRiverStyle(riverName);
  return `<span class="badge river-badge" style="background:${style.bg}; color:${style.color}; border: 1.5px solid ${style.border}; box-shadow: 0 1px 2px ${style.glow}; font-weight:700; transition: all 0.2s ease; cursor: pointer; display: inline-flex; align-items: center;" onmouseover="this.style.boxShadow='0 0 6px ${style.border}', this.style.transform='scale(1.03)'" onmouseout="this.style.boxShadow='0 1px 2px ${style.glow}', this.style.transform='scale(1)'">${riverName}</span>`;
}

function renderRiverTags(riversString) {
  if (!riversString || riversString === 'Not specified') return `<span class="badge" style="background:var(--off); color:var(--text-soft); border: 1px solid var(--border);">No River</span>`;
  const rivers = riversString.split(',').map(r => r.trim()).filter(r => r !== '');
  return rivers.map(r => getRiverBadgeHTML(r)).join(' ');
}

