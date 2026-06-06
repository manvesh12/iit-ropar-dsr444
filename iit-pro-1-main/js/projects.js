/* ══════════════════════════════════════
   PROJECTS & DASHBOARD
══════════════════════════════════════ */
let currentDistrictFilter = 'ALL';

function updateProjectBadgeCount() {
  const badgeEl = document.getElementById('badge-projs');
  if (badgeEl) badgeEl.textContent = S.projects.length;
}

function updateTopBarProjectsDropdown() {
  const dropdown = document.getElementById('tb-projects-dropdown');
  if (!dropdown) return;
  
  let html = `
    <a href="#" onclick="showView('projects',null); return false;">View All Projects</a>
    <a href="#" onclick="newProjectModal(); return false;">+ Add New Project</a>
  `;
  
  if (S.projects && S.projects.length > 0) {
    html += `<div style="height:1px; background:var(--border); margin:4px 0;"></div>`;
    html += `<div style="padding: 4px 20px; font-size:11px; font-weight:700; color:var(--text-soft); text-transform:uppercase; letter-spacing:.05em;">Recent Projects</div>`;
    // Show up to 5 recent projects
    S.projects.slice(0, 5).forEach(p => {
      html += `<a href="#" onclick="openProject(${p.id}); return false;" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;" title="${p.title}">
        ${p.title} <span style="color:var(--text-soft); font-size:11px;">(${p.district})</span>
      </a>`;
    });
  }
  
  dropdown.innerHTML = html;
}

function filterDashboardByDistrict(val) {
  currentDistrictFilter = val;
  
  // Update selector UI value if it is changed programmatically
  const selector = document.getElementById('dash-district-filter');
  if (selector && selector.value !== val) selector.value = val;
  
  renderDashboard();
  renderProjects();
}

async function renderDashboard() {
  const filteredProjs = currentDistrictFilter === 'ALL'
    ? S.projects
    : S.projects.filter(p => p.district === currentDistrictFilter);

  const done = filteredProjs.filter(p=>p.progress===100).length;
  const pend = S.signatures.filter(s=>!s.signed).length;
  
  const totalEl = document.getElementById('d-total');
  const doneEl = document.getElementById('d-done');
  const sigsEl = document.getElementById('d-sigs');
  const pdfsEl = document.getElementById('d-pdfs');
  
  try {
    const stats = await apiFetch('/dashboard/stats');
    if (totalEl) totalEl.textContent = stats.totalProjects || 0;
    if (doneEl) doneEl.textContent = stats.completedReports || 0;
    if (sigsEl) sigsEl.textContent = stats.pendingReports || 0;
    if (pdfsEl) pdfsEl.textContent = stats.completedReports || 0;
  } catch (err) {
    // Fallback to local dummy data if not connected
    if (totalEl) totalEl.textContent = filteredProjs.length;
    if (doneEl) doneEl.textContent = done;
    if (sigsEl) sigsEl.textContent = pend;
    if (pdfsEl) pdfsEl.textContent = done + (filteredProjs.length > 0 ? 1 : 0);
  }
  
  const el = document.getElementById('dash-recent');
  if (el) {
    if (filteredProjs.length === 0) {
      el.innerHTML = `<div style="text-align:center; padding: 24px; color:var(--text-soft); font-size:13px;">No projects yet. Use <strong>+ Create New DSR Project</strong> to add one${currentDistrictFilter !== 'ALL' ? ` for ${currentDistrictFilter}` : ''}.</div>`;
    } else {
      el.innerHTML = filteredProjs.slice(0,3).map(p=>`
        <div class="file-item" style="margin-bottom:8px;cursor:pointer" onclick="openProject(${p.id})">
          <div class="file-icon" style="background:${p.progress===100?'rgba(22,163,74,0.12)':'rgba(37,99,235,0.12)'}; color:${p.progress===100?'var(--green)':'var(--primary)'}"><i data-lucide="${p.progress===100?'check-circle':'file-text'}"></i></div>
          <div class="file-info" style="flex:1; min-width:0;">
            <div class="file-name" style="display:flex; align-items:center; gap:8px;">
              ${p.title}
              ${getDistrictBadgeHTML(p.district)}
            </div>
            <div class="file-meta">${p.district} District · ${p.year}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px; flex-shrink:0;">
            <span class="badge ${p.status==='Completed'?'badge-green':p.status==='In Progress'?'badge-amber':'badge-red'}">${p.status}</span>
            <span style="font-size:10px;color:var(--text-faint)">${p.progress}%</span>
            <button type="button" class="btn btn-danger btn-xs" onclick="deleteProject(${p.id}, event)" title="Delete project">Delete</button>
          </div>
        </div>`).join('');
    }
  }
  
  // Sync active district highlights on dashboard
  updateActiveDistrictUI(S.activeProject ? S.activeProject.district : 'Punjab');
  renderDistrictLegends();
  if (typeof refreshDistrictBadgesInDOM === 'function') refreshDistrictBadgesInDOM();
  initLucide();
}

function renderProjects() {
  updateTopBarProjectsDropdown();
  const grid = document.getElementById('projects-grid');
  if (!grid) return;
  
  const filteredProjs = currentDistrictFilter === 'ALL'
    ? S.projects
    : S.projects.filter(p => p.district === currentDistrictFilter);

  if (filteredProjs.length === 0) {
    const districtHint = currentDistrictFilter === 'ALL' ? '' : ` for ${currentDistrictFilter}`;
    grid.innerHTML = `<div class="card" style="grid-column: span 2; text-align:center; padding: 48px 24px; border:1px solid var(--border);"><h3 style="color:var(--text-mid); margin-bottom:8px;">No DSR Projects Yet</h3><p style="color:var(--text-soft); font-size:13.5px;">Click <strong>+ New Project</strong> to create your first district survey report${districtHint}.</p></div>`;
    return;
  }

  function getLiveProgressStatus(p) {
    if (p.status === 'Completed') return '<span style="color:var(--green)">✓ Fully Approved & Generated</span>';
    if (p.progress === 100) return '<span style="color:var(--teal)">Pending Authority E-Signatures</span>';
    if (p.progress > 80) return '<span style="color:var(--saffron)">Finalizing Annexures & Tables</span>';
    if (p.progress > 40) return '<span style="color:var(--saffron)">Uploading Chapters & Plates</span>';
    return '<span style="color:var(--text-soft)">Initial Project Setup</span>';
  }

  grid.innerHTML = filteredProjs.map(p=>`
    <div class="proj-card">
      <div class="proj-card-top" style="cursor:pointer" onclick="openProject(${p.id})">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:8px;">
          <h3 style="font-size:14px; font-weight:700; color:var(--text);">${p.title}</h3>
          ${getDistrictBadgeHTML(p.district)}
        </div>
        <p style="font-size:12px; color:var(--text-soft);">${p.district} District · ${p.year}</p>
      </div>
      <div class="proj-card-bd">
        <div class="proj-meta">
          <span class="badge badge-navy">${p.mineral}</span>
          ${renderRiverTags(p.rivers)}
          <span class="badge ${p.status==='Completed'?'badge-green':p.status==='In Progress'?'badge-amber':'badge-red'}">${p.status}</span>
        </div>
        <div style="font-size:10.5px;color:var(--text-faint);margin-bottom:10px">Created: ${p.createdAt} · Sigs: ${p.signatures}/5</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${p.progress}%;background:${p.progress===100?'var(--green)':'linear-gradient(90deg,var(--teal),var(--teal-2))'}"></div></div>
          <span style="font-size:12px;font-weight:700;color:var(--text)">${p.progress}%</span>
        </div>
        
        <div style="background:var(--bg); padding:10px 12px; border-radius:var(--r-md); margin-bottom:16px; font-size:13px; border:1px solid var(--border-2);">
          <div style="font-weight:800; margin-bottom:6px; color:var(--text); display:flex; align-items:center; gap:6px;">
            <i data-lucide="activity" style="width:14px; height:14px; color:var(--primary);"></i> Live Progress Report
          </div>
          <div style="color:var(--text-mid); font-weight:500;">
            Current Stage: <strong>${getLiveProgressStatus(p)}</strong>
          </div>
        </div>

        <div class="proj-card-actions">
          <button type="button" class="btn btn-outline btn-sm" style="flex:1" onclick="openProject(${p.id})">Open Project</button>
          ${S.role === 'authority' ? `<button type="button" class="btn btn-danger btn-sm" onclick="deleteProject(${p.id}, event)"><i data-lucide="trash-2"></i> Delete</button>` : ''}
        </div>
      </div>
    </div>`).join('');
  renderDistrictLegends();
  if (typeof refreshDistrictBadgesInDOM === 'function') refreshDistrictBadgesInDOM();
  initLucide();
}

async function openProject(id) {
  S.activeProject = S.projects.find(p=>p.id===id);
  if (!S.activeProject) return;
  
  try {
    const projData = await apiFetch(`/projects/${id}`);
    if (projData.projectState) {
      const stateSnapshot = JSON.parse(projData.projectState);
      if (stateSnapshot.frontMatter) S.frontMatter = stateSnapshot.frontMatter;
      if (stateSnapshot.chapters) S.chapters = stateSnapshot.chapters;
      if (stateSnapshot.plates) S.plates = stateSnapshot.plates;
      if (stateSnapshot.graphs) S.graphs = stateSnapshot.graphs;
      if (stateSnapshot.graphCharts) S.graphCharts = stateSnapshot.graphCharts;
      if (stateSnapshot.signatures) S.signatures = stateSnapshot.signatures;
      if (stateSnapshot.demandDistricts) S.demandDistricts = stateSnapshot.demandDistricts;
      if (stateSnapshot.summarySources) S.summarySources = stateSnapshot.summarySources;
      if (stateSnapshot.auctionData) S.auctionData = stateSnapshot.auctionData;
      if (stateSnapshot.uploadedPDFs) S.uploadedPDFs = stateSnapshot.uploadedPDFs;
      if (stateSnapshot.chapterPDFs) S.chapterPDFs = stateSnapshot.chapterPDFs;
      if (stateSnapshot.anx4Data) S.activeProject.anx4Data = stateSnapshot.anx4Data;
      if (stateSnapshot.anx5Data) S.activeProject.anx5Data = stateSnapshot.anx5Data;
      if (stateSnapshot.anx6Data) S.activeProject.anx6Data = stateSnapshot.anx6Data;
      if (stateSnapshot.anx7Data) S.activeProject.anx7Data = stateSnapshot.anx7Data;
      if (stateSnapshot.anx6PdfName) {
        S.activeProject.anx6PdfName = stateSnapshot.anx6PdfName;
        const index = S.projects.findIndex(p => p.id === S.activeProject.id);
        if (index >= 0) S.projects[index].anx6PdfName = stateSnapshot.anx6PdfName;
      }
      if (stateSnapshot.anx7PdfName) {
        S.activeProject.anx7PdfName = stateSnapshot.anx7PdfName;
        const index = S.projects.findIndex(p => p.id === S.activeProject.id);
        if (index >= 0) S.projects[index].anx7PdfName = stateSnapshot.anx7PdfName;
      }
    }
  } catch (err) {
    console.error('Could not load project state:', err);
  }

  ['report-nav','annexure-nav','tables-nav','finalize-nav'].forEach(n=>{
    const el=document.getElementById(n); if(el) el.style.display='block';
  });
  const dist = S.activeProject.district;
  
  // Update active district highlights globally
  updateActiveDistrictUI(dist);
  if (typeof updateActiveProjectCardUI === 'function') updateActiveProjectCardUI();
  
  // Filter context to active district
  filterDashboardByDistrict(dist);
  
  const fmDistEl = document.getElementById('fm-district');
  if (fmDistEl) fmDistEl.value=dist;
  
  // Fetch reviewer history and populate floating notes if any
  if (typeof checkReviewStatus === 'function') {
      checkReviewStatus(id);
  }
  
  showView('front-matter',null);
  toast('Opened: '+dist+' DSR Project','info');
}

function newProjectModal() { 
  const el = document.getElementById('modal-project');
  if (el) el.classList.add('open'); 
}

async function persistProjectState() {
  if (!S.activeProject || !S.activeProject.id) return;
  
  // Disable auto-save for users who only have view/comment permissions
  if (S.role === 'reviewer' || S.role === 'authority') return;

  // Create a snapshot of the current state for this project
  const stateSnapshot = {
    frontMatter: S.frontMatter,
    chapters: S.chapters,
    plates: S.plates,
    graphs: S.graphs,
    graphCharts: S.graphCharts,
    signatures: S.signatures,
    demandDistricts: S.demandDistricts,
    summarySources: S.summarySources,
    auctionData: S.auctionData,
    uploadedPDFs: S.uploadedPDFs,
    chapterPDFs: S.chapterPDFs,
    anx4Data: S.activeProject.anx4Data,
    anx5Data: S.activeProject.anx5Data,
    anx6Data: S.activeProject.anx6Data,
    anx7Data: S.activeProject.anx7Data,
    anx6PdfName: S.activeProject.anx6PdfName,
    anx7PdfName: S.activeProject.anx7PdfName
  };
  
  try {
    await apiFetch(`/projects/${S.activeProject.id}/state`, {
      method: 'PUT',
      body: JSON.stringify({ state: JSON.stringify(stateSnapshot) })
    });
  } catch (err) {
    console.error('Failed to persist project state:', err);
  }
}

async function createProject() {
  const title = document.getElementById('proj-title').value || `District Survey Report — ${document.getElementById('proj-district').value}`;
  
  const payload = {
    projectName: title,
    district: document.getElementById('proj-district').value,
    status: 'ACTIVE'
  };

  try {
    // 1. Create project in backend
    const createdProject = await apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    // 2. Format it for the frontend
    const proj = {
      id: createdProject.id, 
      title: createdProject.projectName,
      district: createdProject.district,
      year: document.getElementById('proj-year').value,
      mineral: document.getElementById('proj-mineral').value,
      rivers: document.getElementById('proj-rivers').value || 'Not specified',
      progress: 0, 
      status: 'In Progress', 
      createdAt: new Date().toLocaleString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}), 
      signatures: 0
    };
    
    S.projects.unshift(proj);
    closeModal('modal-project');
    
    document.getElementById('proj-title').value = '';
    document.getElementById('proj-rivers').value = '';
    
    renderProjects();
    renderDashboard();
    updateProjectBadgeCount();
    openProject(proj.id);
    toast('DSR Project created successfully!','success');
    
    // 3. Persist its initial state
    await persistProjectState();

  } catch (err) {
    toast('Failed to create project: ' + err.message, 'error');
  }
}

let saveStateTimeout = null;
function debouncedSaveState() {
  if (!S.activeProject || !S.activeProject.id) return;
  if (saveStateTimeout) clearTimeout(saveStateTimeout);
  saveStateTimeout = setTimeout(() => {
    persistProjectState();
  }, 1000);
}

// Global auto-save listener for any input changes on the form fields
document.addEventListener('input', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
    debouncedSaveState();
  }
});
document.addEventListener('change', (e) => {
  debouncedSaveState();
});

function deleteProject(id, event) {
  // Not fully implemented on backend yet, just local for now
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const proj = S.projects.find(p => p.id === id);
  if (!proj) return;

  customConfirm(
    `Permanently delete "${proj.title}" (${proj.district} District)? This action cannot be undone.`,
    () => {
      const wasActive = S.activeProject && S.activeProject.id === id;
      S.projects = S.projects.filter(p => p.id !== id);

      if (wasActive) {
        clearActiveProject();
      }

      renderProjects();
      renderDashboard();
      updateProjectBadgeCount();
      renderDistrictLegends();
      toast(`Project "${proj.title}" has been deleted.`, 'success');
    }
  );
}
