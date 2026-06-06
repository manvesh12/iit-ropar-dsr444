/* ══════════════════════════════════════
   ENTRY POINT / BOOTSTRAP
══════════════════════════════════════ */
window.addEventListener('DOMContentLoaded',()=>{
  // Initialize workflow checklist listener when section is clicked
  const workflowView = document.getElementById('view-workflow');
  if (workflowView) {
    workflowView.addEventListener('click', renderWorkflowChecklist, {once:true});
  }
  
  // Clean up overlays and other elements on load
  console.log("DSR Portal initialized successfully.");
  if (window.initLucide) initLucide();

  // Global listener to default empty cells to 'NUL' on blur/focusout
  document.body.addEventListener('focusout', function(e) {
    if (e.target.tagName === 'TD' && (e.target.contentEditable === 'true' || e.target.hasAttribute('contenteditable'))) {
      const text = e.target.innerText.trim();
      if (text === '') {
        e.target.innerText = 'NUL';
        // Dispatch input event to trigger any calculation bindings attached
        const inputEvent = new Event('input', { bubbles: true });
        e.target.dispatchEvent(inputEvent);
      }
    }
  });
});

function enforceReviewerReadOnly() {
    if (typeof S === 'undefined' || S.role !== 'reviewer') return;
    
    // Find the currently active view
    const activeView = document.querySelector('.view.active');
    if (!activeView) return;
    
    // Disable inputs, selects, textareas
    const formElements = activeView.querySelectorAll('input, textarea, select');
    formElements.forEach(el => {
        if (el.closest('#modal-review') || el.id === 'dash-district-filter') return;
        el.disabled = true;
        el.style.backgroundColor = 'var(--off)';
        el.style.cursor = 'not-allowed';
    });

    // Disable content-editable elements
    const editables = activeView.querySelectorAll('[contenteditable="true"]');
    editables.forEach(el => {
        el.setAttribute('contenteditable', 'false');
        el.style.backgroundColor = 'var(--off)';
        el.style.cursor = 'not-allowed';
    });

    // Hide action buttons (Add, Delete, Save, Upload, Edit, etc)
    const buttons = activeView.querySelectorAll('button');
    buttons.forEach(btn => {
        if (btn.closest('#reviewer-actions') || btn.closest('.top-nav') || btn.classList.contains('modal-close') || btn.closest('.header-row')) return;
        
        const txt = btn.textContent.toLowerCase();
        if (txt.includes('add') || txt.includes('upload') || txt.includes('save') || 
            txt.includes('delete') || txt.includes('remove') || txt.includes('submit') || 
            txt.includes('edit') || txt.includes('clear')) {
            btn.style.display = 'none';
        }
    });
}

window.reviewerNotes = {};

function loadReviewerNoteForView(viewId, viewTitle) {
    if (typeof S === 'undefined' || S.role !== 'reviewer' || !S.activeProject) {
        document.getElementById('reviewer-floating-notes').style.display = 'none';
        return;
    }
    // Only show for content views
    if (['dashboard', 'workflow', 'users', 'history'].includes(viewId)) {
        document.getElementById('reviewer-floating-notes').style.display = 'none';
        return;
    }
    document.getElementById('reviewer-floating-notes').style.display = 'flex';
    document.getElementById('reviewer-notes-section-title').textContent = viewTitle || viewId;
    document.getElementById('reviewer-section-note').value = window.reviewerNotes[viewId] || '';
    document.getElementById('reviewer-section-note').dataset.viewId = viewId;
    
    if (window.lucide) window.lucide.createIcons();
}

function saveReviewerNote() {
    const el = document.getElementById('reviewer-section-note');
    const viewId = el.dataset.viewId;
    if (viewId) {
        window.reviewerNotes[viewId] = el.value;
    }
}

function openReviewModal() {
    // Auto-populate from reviewerNotes
    let aggregated = '';
    for (let [viewId, note] of Object.entries(window.reviewerNotes)) {
        if (note.trim()) {
            aggregated += `[${viewId.toUpperCase()}]\n${note.trim()}\n\n`;
        }
    }
    document.getElementById('review-aggregated-notes').value = aggregated.trim();
    document.getElementById('modal-review').classList.add('open');
}

async function submitReviewReturn() {
    const comments = document.getElementById('review-aggregated-notes').value.trim();
    if (!comments) { toast('Please enter review comments', 'error'); return; }
    if (!S.activeProject) { toast('No active project', 'error'); return; }

    try {
        await apiSubmitWorkflowAction(S.activeProject.id, 'RETURN', comments);
        toast('Report returned to Data Entry', 'success');
        
        // Clear notes
        window.reviewerNotes = {};
        if (S.activeProject) {
            localStorage.removeItem(`reviewerNotes_${S.activeProject.id}`);
        }
        const noteArea = document.getElementById('reviewer-section-note');
        if (noteArea) noteArea.value = '';
        
        closeModal('modal-review');
        if (typeof renderProjects === 'function') renderProjects();
        showView('dashboard', null);
    } catch (e) {
        toast('Error returning report: ' + e.message, 'error');
    }
}

async function submitReviewApprove() {
    if (!S.activeProject) return;
    try {
        await apiSubmitWorkflowAction(S.activeProject.id, 'APPROVE', 'Section review approved');
        toast('Sections Approved!', 'success');
        if (typeof renderProjects === 'function') renderProjects();
        showView('dashboard', null);
    } catch (e) {
        toast('Error approving report: ' + e.message, 'error');
    }
}

// Automatically check history when dashboard loads or project opens
async function checkReviewStatus(projectId) {
    if (S.role !== 'user') return; // Only show alert to data entry
    try {
        const history = await apiFetchReportHistory(projectId);
        if (history && history.length > 0) {
            const latest = history[0];
            if (latest.action === 'RETURN') {
                const banner = document.getElementById('dash-review-banner');
                if (banner) {
                    banner.innerHTML = `
                        <div style="background:var(--amber-lt); border:1px solid var(--amber); border-radius:var(--r-md); padding:16px; display:flex; align-items:start; gap:12px;">
                            <i data-lucide="alert-circle" style="color:var(--amber); width:20px; height:20px; flex-shrink:0; margin-top:2px;"></i>
                            <div>
                                <div style="font-weight:700; color:var(--text); font-size:14px; margin-bottom:4px;">Report Returned for Review</div>
                                <div style="font-size:13px; color:var(--text-mid);">${latest.remarks || 'No comments provided.'}</div>
                            </div>
                        </div>
                    `;
                    banner.style.display = 'block';
                    if (window.initLucide) initLucide();
                }
                const notifDot = document.getElementById('tb-notif-dot');
                if (notifDot) notifDot.style.display = 'block';
                
                // Parse the aggregated remarks and populate reviewerNotes so DEO can see them in floating boxes!
                if (latest.remarks) {
                    window.reviewerNotes = {};
                    const sections = latest.remarks.split('[');
                    for (let sec of sections) {
                        if (!sec.trim()) continue;
                        const endIdx = sec.indexOf(']');
                        if (endIdx !== -1) {
                            const key = sec.substring(0, endIdx).toLowerCase().trim();
                            const val = sec.substring(endIdx + 1).trim();
                            if (val) window.reviewerNotes[key] = val;
                        }
                    }
                    if (window.renderReviewerNotes) renderReviewerNotes();
                }
            }
        }
    } catch (e) {
        console.error('Error fetching review status:', e);
    }
}

async function renderHistoryTable() {
    if (!S.activeProject) return;
    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Loading history...</td></tr>';
    try {
        const history = await apiFetchReportHistory(S.activeProject.id);
        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No history available</td></tr>';
            return;
        }
        
        let html = '';
        history.forEach(log => {
            const dateStr = new Date(log.performedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
            let badgeCls = 'badge-gray';
            if (log.action === 'APPROVE') badgeCls = 'badge-green';
            if (log.action === 'RETURN' || log.action === 'REJECT') badgeCls = 'badge-amber';
            if (log.action === 'SUBMIT') badgeCls = 'badge-blue';
            if (log.action === 'WARNING_IGNORED' || log.action === 'WARNING_IGNORED_SAME_CONTENT') badgeCls = 'badge-red';
            
            html += `<tr>
                <td>${dateStr}</td>
                <td><span class="badge ${badgeCls}">${log.action}</span></td>
                <td>User ID: ${log.performedBy}</td>
                <td>${log.remarks || '-'}</td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:red;">Failed to load history</td></tr>`;
    }
}

function showAnxTab(anxId, tabName) {
  const btnEditor = document.getElementById('btn-tab-editor-' + anxId);
  const btnPreview = document.getElementById('btn-tab-preview-' + anxId);
  const tabEditor = document.getElementById(anxId + '-editor-tab');
  const tabPreview = document.getElementById(anxId + '-preview-tab');

  if (tabName === 'editor') {
    if(btnEditor) btnEditor.className = 'btn btn-primary btn-sm';
    if(btnPreview) btnPreview.className = 'btn btn-outline btn-sm';
    if(tabEditor) tabEditor.style.display = 'block';
    if(tabPreview) tabPreview.style.display = 'none';
  } else {
    if(btnEditor) btnEditor.className = 'btn btn-outline btn-sm';
    if(btnPreview) btnPreview.className = 'btn btn-primary btn-sm';
    if(tabEditor) tabEditor.style.display = 'none';
    if(tabPreview) tabPreview.style.display = 'block';

    // Trigger PDF generation if live preview
    const exportFnName = 'exportAnx' + anxId.replace('anx','') + 'PDF';
    if (typeof window[exportFnName] === 'function') {
      window[exportFnName](null, true);
    }
  }
}


function toggleNotificationDropdown() {
  const dd = document.getElementById('tb-notif-dropdown');
  if (dd) {
    dd.classList.toggle('show');
  }
}

function updateNotificationUI(returnedReports) {
  const dot = document.getElementById('tb-notif-dot');
  const list = document.getElementById('tb-notif-list');
  if (!dot || !list) return;
  if (returnedReports && returnedReports.length > 0) {
    dot.style.display = 'block';
    let html = '';
    returnedReports.forEach(r => {
      html += `<div style="padding: 10px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="openProjectAndWorkflow(${r.projectId})">
        <div style="font-size: 13px; font-weight: 600; color: #b91c1c;">Project Returned</div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">Project ID: ${r.projectId} needs revision.</div>
      </div>`;
    });
    list.innerHTML = html;
  } else {
    dot.style.display = 'none';
    list.innerHTML = '<div style="padding: 8px; color: #666; font-size: 13px; text-align: center;">No new notifications</div>';
  }
}

function openProjectAndWorkflow(projectId) {
  toggleNotificationDropdown();
  const proj = S.projects.find(p => p.id === projectId);
  if (proj) {
    S.activeProject = proj;
    showView('workflow', null);
  }
}
