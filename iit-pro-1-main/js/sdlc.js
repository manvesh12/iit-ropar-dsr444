/* ══════════════════════════════════════
   SDLC DASHBOARD CONTROLLER
══════════════════════════════════════ */
let sdlcSelectedProjId = '';
let sdlcActiveTab = 4;
let sdlcParsedData = null; // Holds parsed Excel data ready to save

// Initialize Dashboard dropdown on load
function initSdlcDashboard() {
  const select = document.getElementById('sdlc-project-select');
  if (!select) return;

  // Save current selection if valid
  const currentSel = select.value;
  select.innerHTML = '<option value="">-- Select DSR Project --</option>';
  
  if (S.projects && S.projects.length > 0) {
    S.projects.forEach(p => {
      select.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.title} (${p.district})</option>`);
    });
  }

  // Restore selection
  if (currentSel && S.projects.some(p => String(p.id) === currentSel)) {
    select.value = currentSel;
    onSdlcProjectChange(currentSel);
  } else {
    document.getElementById('sdlc-workspace').style.display = 'none';
    document.getElementById('sdlc-empty-state').style.display = 'flex';
  }
}
window.initSdlcDashboard = initSdlcDashboard;

function onSdlcProjectChange(projId) {
  sdlcSelectedProjId = projId;
  const workspace = document.getElementById('sdlc-workspace');
  const emptyState = document.getElementById('sdlc-empty-state');
  const badgeContainer = document.getElementById('sdlc-project-badge-container');
  const savePanel = document.getElementById('sdlc-save-panel');
  const alertContainer = document.getElementById('sdlc-comparison-alert');

  // Clear previous comparison status
  savePanel.style.display = 'none';
  alertContainer.style.display = 'none';
  sdlcParsedData = null;

  if (!projId) {
    if (workspace) workspace.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    if (badgeContainer) badgeContainer.innerHTML = '';
    return;
  }

  // Set active project context in S
  const proj = S.projects.find(p => String(p.id) === String(projId));
  if (proj) {
    S.activeProject = proj;
    // Load backend state snapshot if not loaded
    loadActiveProjectState(proj.id).then(() => {
      if (workspace) workspace.style.display = 'block';
      if (emptyState) emptyState.style.display = 'none';
      
      if (badgeContainer) {
        badgeContainer.innerHTML = `
          <span class="badge" style="background:var(--teal-lt); color:var(--teal); font-weight:700; border:1.5px solid var(--teal); padding:6px 12px; border-radius:8px;">${proj.district} District</span>
          <span class="badge badge-navy" style="padding:6px 12px; border-radius:8px;">${proj.mineral} Mining</span>
        `;
      }
      renderSdlcComparison();
    });
  }
}
window.onSdlcProjectChange = onSdlcProjectChange;

// Load active project state snapshot from backend
async function loadActiveProjectState(id) {
  try {
    const projData = await apiFetch(`/projects/${id}`);
    if (projData.projectState) {
      const stateSnapshot = JSON.parse(projData.projectState);
      if (stateSnapshot.anx4Data) S.activeProject.anx4Data = stateSnapshot.anx4Data;
      if (stateSnapshot.anx5Data) S.activeProject.anx5Data = stateSnapshot.anx5Data;
      if (stateSnapshot.anx6Data) S.activeProject.anx6Data = stateSnapshot.anx6Data;
      if (stateSnapshot.anx7Data) S.activeProject.anx7Data = stateSnapshot.anx7Data;
    }
  } catch (err) {
    console.error('Could not load project state:', err);
  }
}

function switchSdlcTab(tabNum, btn) {
  sdlcActiveTab = tabNum;
  document.querySelectorAll('.sdlc-nav-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const titles = {
    4: 'Annexure IV — Transportation Routes Comparison',
    5: 'Annexure V — Sand Mining Report Comparison',
    6: 'Annexure VI — Final Cluster Details Comparison',
    7: 'Annexure VII — Transportation Routes (Cont.) Comparison'
  };

  const descriptions = {
    4: 'Upload SDLC survey report in Excel format to align and verify Individual & Cluster routes.',
    5: 'Verify potential Mining leases, Patta lands, De-siltation sites, and M-Sand plants.',
    6: 'Verify and align Final Cluster details and Contiguous Cluster parameters.',
    7: 'Compare and verify individual and cluster routes matching Annexure 7 standards.'
  };

  document.getElementById('sdlc-annexure-title').textContent = titles[tabNum];
  document.getElementById('sdlc-annexure-desc').textContent = descriptions[tabNum];
  
  // Clear previous upload preview
  document.getElementById('sdlc-save-panel').style.display = 'none';
  document.getElementById('sdlc-comparison-alert').style.display = 'none';
  sdlcParsedData = null;

  renderSdlcComparison();
}
window.switchSdlcTab = switchSdlcTab;

/* ══════════════════════════════════════
   EXCEL TEMPLATE GENERATORS
══════════════════════════════════════ */
function downloadSdlcTemplate() {
  const wb = XLSX.utils.book_new();

  if (sdlcActiveTab === 4 || sdlcActiveTab === 7) {
    const routeHeaders = [
      'Lease No.', 'Transportation Route No.', 'Number of Tippers/day (of lease)',
      'Number of tippers/day (of all leases on route)', 'Length of Route (Km)',
      'Type of Road', 'Recommendation for road', 'The road will be constructed by', 'Route Map & Location'
    ];
    const clusterHeaders = [
      'Cluster No', 'Transportation Route No', 'Number of tippers/day (of cluster)',
      'Number of tippers/day (of all clusters on route)', 'Length of Route in KM',
      'Type of Road', 'Recommendation for road', 'The road will be constructed by', 'Route Map & Location'
    ];
    const routeRows = [
      ['Kadiana Vill, Phillaur Block', "A-A'", '43', '358', '0.73', 'Unpaved', 'Unpaved', 'Lease Owner', 'Route Map attached'],
      ['Chhaula Vill, Phillaur Block', "B-B'", '127', '343', '2.1', 'Unpaved', 'Unpaved', 'Lease Owner', 'Route Map attached']
    ];
    const clusterRows = [
      ['Cluster Sutlej-1', "A-A', B-B'", '358', '358', '0.73', 'Unpaved', 'Unpaved', 'Lease Owner', 'Route Map attached']
    ];
    
    const ws1 = XLSX.utils.aoa_to_sheet([routeHeaders, ...routeRows]);
    const ws2 = XLSX.utils.aoa_to_sheet([clusterHeaders, ...clusterRows]);
    XLSX.utils.book_append_sheet(wb, ws1, 'Individual_Routes');
    XLSX.utils.book_append_sheet(wb, ws2, 'Cluster_Routes');
    XLSX.writeFile(wb, `SDLC_Annexure_${sdlcActiveTab}_Template.xlsx`);

  } else if (sdlcActiveTab === 5) {
    const miningHeaders = ['River Details', 'Sand Bar Code', 'Lease Details', 'Area (Ha.)', 'Latitude', 'Longitude', 'Forest Distance (KM)', 'Bulk Density', 'Depth (m)'];
    const pattaHeaders = ['Owner', 'Sy.No (khasra No)', 'Area', 'Latitude', 'Longitude', 'Tehsil', 'Village'];
    const desiltHeaders = ['Name of Reservoir/Dams', 'Maintain/Controlled by', 'Latitude', 'Longitude', 'Size (Ha)', 'Quantity (MT/Year)'];
    const msandHeaders = ['Plant Name', 'Owner', 'Tehsil', 'Village', 'Geo-location', 'Quantity'];

    const miningRows = [['Sutlej', 'PO_JL_PL_ST_1B', 'Kadiana Phillaur', '4.8', "31°0'48\"N", "75°53'39\"E", 'NA', '1.54', '1.74']];
    const pattaRows = [['Raj Kumar S/O Divan', '8/21,8/22', '2.77', "30°59'37\"N", "75°27'9\"E", 'Shahkot', 'Bangiwal']];
    const desiltRows = [['Sutlej Dam', 'State Govt', "31°00'56\"N", "75°54'59\"E", '10.93', '-']];
    const msandRows = [['Phillaur Plant', 'Not Available', 'Phillaur', 'Not Available', 'Not Available', 'Not Available']];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([miningHeaders, ...miningRows]), 'Mining_Leases');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([pattaHeaders, ...pattaRows]), 'Patta_Lands');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([desiltHeaders, ...desiltRows]), 'De_Siltation');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([msandHeaders, ...msandRows]), 'M_Sand_Plants');
    XLSX.writeFile(wb, 'SDLC_Annexure_5_Template.xlsx');

  } else if (sdlcActiveTab === 6) {
    const clusterHeaders = ['River Name', 'Cluster No.', 'Lease No', 'Location (Riverbed/Patta Land)', 'Village', 'Area (in Ha.)', 'Total Excavation (MT)'];
    const contiguousHeaders = ['River Name', 'Contiguous Cluster No.', 'Cluster No', 'Number of leases', 'Location', 'Distance', 'Village', 'Area Of Cluster (Ha)'];

    const clusterRows = [['Sutlej', '1', 'Jalandhar Sutlej 1,2', 'Riverbed', 'Kadiana', '25.27', '1074334.80']];
    const contiguousRows = [['Sutlej', '1', '10,11', '10', 'Riverbed', '0.55km', 'Minwal', '71.01']];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([clusterHeaders, ...clusterRows]), 'Cluster_Details');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([contiguousHeaders, ...contiguousRows]), 'Contiguous_Clusters');
    XLSX.writeFile(wb, 'SDLC_Annexure_6_Template.xlsx');
  }

  toast(`Annexure ${sdlcActiveTab} template downloaded`, 'success');
}
window.downloadSdlcTemplate = downloadSdlcTemplate;

/* ══════════════════════════════════════
   EXCEL UPLOAD PARSER & MAPPING
══════════════════════════════════════ */
function handleSdlcExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      parseExcelByTab(workbook, file.name);
    } catch (err) {
      toast('Failed to parse Excel file: ' + err.message, 'error');
      console.error(err);
    }
    event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
}
window.handleSdlcExcelUpload = handleSdlcExcelUpload;

// Helper to normalize strings for comparison keys
function norm(val) {
  return String(val || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Main Tab Parser Router
function parseExcelByTab(workbook, filename) {
  if (sdlcActiveTab === 4 || sdlcActiveTab === 7) {
    const ws1 = workbook.Sheets['Individual_Routes'] || workbook.Sheets[workbook.SheetNames[0]];
    const ws2 = workbook.Sheets['Cluster_Routes'] || workbook.Sheets[workbook.SheetNames[1]];

    if (!ws1) throw new Error("Missing 'Individual_Routes' worksheet.");
    const routesRows = XLSX.utils.sheet_to_json(ws1, { header: 1, defval: '' });
    const clusterRows = ws2 ? XLSX.utils.sheet_to_json(ws2, { header: 1, defval: '' }) : [];

    sdlcParsedData = {
      individual: parseRouteRows(routesRows),
      cluster: parseClusterRouteRows(clusterRows)
    };
  } 
  else if (sdlcActiveTab === 5) {
    const ws1 = workbook.Sheets['Mining_Leases'] || workbook.Sheets[workbook.SheetNames[0]];
    const ws2 = workbook.Sheets['Patta_Lands'] || workbook.Sheets[workbook.SheetNames[1]];
    const ws3 = workbook.Sheets['De_Siltation'] || workbook.Sheets[workbook.SheetNames[2]];
    const ws4 = workbook.Sheets['M_Sand_Plants'] || workbook.Sheets[workbook.SheetNames[3]];

    sdlcParsedData = {
      mining: ws1 ? parseMiningRows(XLSX.utils.sheet_to_json(ws1, { header: 1, defval: '' })) : [],
      patta: ws2 ? parsePattaRows(XLSX.utils.sheet_to_json(ws2, { header: 1, defval: '' })) : [],
      desilt: ws3 ? parseDesiltRows(XLSX.utils.sheet_to_json(ws3, { header: 1, defval: '' })) : [],
      msand: ws4 ? parseMsandRows(XLSX.utils.sheet_to_json(ws4, { header: 1, defval: '' })) : []
    };
  } 
  else if (sdlcActiveTab === 6) {
    const ws1 = workbook.Sheets['Cluster_Details'] || workbook.Sheets[workbook.SheetNames[0]];
    const ws2 = workbook.Sheets['Contiguous_Clusters'] || workbook.Sheets[workbook.SheetNames[1]];

    sdlcParsedData = {
      cluster: ws1 ? parseAnx6ClusterRows(XLSX.utils.sheet_to_json(ws1, { header: 1, defval: '' })) : [],
      contiguous: ws2 ? parseAnx6ContiguousRows(XLSX.utils.sheet_to_json(ws2, { header: 1, defval: '' })) : []
    };
  }

  showUploadFeedback(filename);
  renderSdlcComparison();
}

// Row Parsers for Annexures 4 & 7 (Routes)
function parseRouteRows(rows) {
  if (rows.length < 2) return [];
  const body = rows.slice(1).filter(r => r.some(cell => String(cell).trim()));
  return body.map((r, i) => ({
    sl: i + 1,
    lease: String(r[0] || 'NA'),
    route: String(r[1] || 'NA'),
    tippersLease: String(r[2] || '0'),
    tippersAll: String(r[3] || '0'),
    length: String(r[4] || '0'),
    roadType: String(r[5] || 'Unpaved'),
    recom: String(r[6] || 'Unpaved'),
    constructedBy: String(r[7] || 'Lease Owner'),
    map: String(r[8] || 'Route Map attached')
  }));
}

function parseClusterRouteRows(rows) {
  if (rows.length < 2) return [];
  const body = rows.slice(1).filter(r => r.some(cell => String(cell).trim()));
  return body.map(r => ({
    cluster: String(r[0] || 'NA'),
    route: String(r[1] || 'NA'),
    tippersCluster: String(r[2] || '0'),
    tippersAll: String(r[3] || '0'),
    length: String(r[4] || '0'),
    roadType: String(r[5] || 'Unpaved'),
    recom: String(r[6] || 'Unpaved'),
    constructedBy: String(r[7] || 'Lease Owner'),
    map: String(r[8] || 'Route Map attached')
  }));
}

// Row Parsers for Annexure 5 (Mining, Patta, De-silt, M-Sand)
function parseMiningRows(rows) {
  if (rows.length < 2) return [];
  return rows.slice(1).filter(r => r.some(cell => String(cell).trim())).map((r, i) => ({
    sl: i + 1,
    river: String(r[0] || 'NA'),
    barCode: String(r[1] || 'NA'),
    details: String(r[2] || 'NA'),
    area: parseFloat(r[3]) || 0,
    lat: String(r[4] || 'NA'),
    lng: String(r[5] || 'NA'),
    forestDist: String(r[6] || 'NA'),
    bulkDensity: parseFloat(r[7]) || 1.54,
    depth: parseFloat(r[8]) || 1.74
  }));
}

function parsePattaRows(rows) {
  if (rows.length < 2) return [];
  return rows.slice(1).filter(r => r.some(cell => String(cell).trim())).map((r, i) => ({
    sl: i + 1,
    owner: String(r[0] || 'NA'),
    khasra: String(r[1] || 'NA'),
    area: parseFloat(r[2]) || 0,
    lat: String(r[3] || 'NA'),
    lng: String(r[4] || 'NA'),
    tehsil: String(r[5] || 'NA'),
    village: String(r[6] || 'NA')
  }));
}

function parseDesiltRows(rows) {
  if (rows.length < 2) return [];
  return rows.slice(1).filter(r => r.some(cell => String(cell).trim())).map(r => ({
    dam: String(r[0] || 'NA'),
    controlledBy: String(r[1] || 'NA'),
    lat: String(r[2] || 'NA'),
    lng: String(r[3] || 'NA'),
    size: String(r[4] || '0'),
    qty: String(r[5] || '-')
  }));
}

function parseMsandRows(rows) {
  if (rows.length < 2) return [];
  return rows.slice(1).filter(r => r.some(cell => String(cell).trim())).map(r => ({
    name: String(r[0] || 'NA'),
    owner: String(r[1] || 'NA'),
    tehsil: String(r[2] || 'NA'),
    village: String(r[3] || 'NA'),
    geo: String(r[4] || 'NA'),
    qty: String(r[5] || 'NA')
  }));
}

// Row Parsers for Annexure 6 (Cluster details)
function parseAnx6ClusterRows(rows) {
  if (rows.length < 2) return [];
  return rows.slice(1).filter(r => r.some(cell => String(cell).trim())).map(r => ({
    river: String(r[0] || 'NA'),
    cluster: String(r[1] || 'NA'),
    lease: String(r[2] || 'NA'),
    location: String(r[3] || 'Riverbed'),
    village: String(r[4] || 'NA'),
    area: parseFloat(r[5]) || 0,
    excavation: parseFloat(r[6]) || 0
  }));
}

function parseAnx6ContiguousRows(rows) {
  if (rows.length < 2) return [];
  return rows.slice(1).filter(r => r.some(cell => String(cell).trim())).map(r => ({
    river: String(r[0] || 'NA'),
    contiguous: String(r[1] || 'NA'),
    cluster: String(r[2] || 'NA'),
    leases: String(r[3] || 'NA'),
    location: String(r[4] || 'Riverbed'),
    distance: String(r[5] || 'NA'),
    village: String(r[6] || 'NA'),
    area: parseFloat(r[7]) || 0
  }));
}

// Show validation panel on success
function showUploadFeedback(filename) {
  const savePanel = document.getElementById('sdlc-save-panel');
  const statusMsg = document.getElementById('sdlc-parsed-status-msg');
  if (savePanel && statusMsg) {
    savePanel.style.display = 'flex';
    statusMsg.innerHTML = `<i data-lucide="file-check" style="width:16px; height:16px; color:#10b981; display:inline-block; vertical-align:middle; margin-right:6px;"></i>Successfully parsed Excel: <strong>${filename}</strong>`;
  }
}

/* ══════════════════════════════════════
   VISUAL COMPARISON ENGINE
══════════════════════════════════════ */
function renderSdlcComparison() {
  const table = document.getElementById('sdlc-comparison-table');
  const alertContainer = document.getElementById('sdlc-comparison-alert');
  if (!table) return;

  table.innerHTML = '';
  
  if (!S.activeProject) return;

  let originalData = getOriginalProjectData();
  let uploadedData = sdlcParsedData;

  // Let's compute differences
  let comparisonResults = computeTabComparison(originalData, uploadedData);
  
  // Set alert banner
  if (uploadedData) {
    alertContainer.style.display = 'block';
    if (comparisonResults.mismatches > 0) {
      alertContainer.innerHTML = `
        <div class="notif notif-warn" style="margin:0; border: 1.5px solid var(--amber); display:flex; align-items:center; gap:12px;">
          <i data-lucide="alert-triangle" style="color:var(--amber); flex-shrink:0;"></i>
          <div>
            <strong>Verification Warning:</strong> Found <strong>${comparisonResults.mismatches} mismatching parameter(s)</strong> between the DSR values and SDLC Excel survey.
          </div>
        </div>
      `;
    } else {
      alertContainer.innerHTML = `
        <div class="notif notif-success" style="margin:0; border: 1.5px solid var(--green); display:flex; align-items:center; gap:12px; background: rgba(16,185,129,0.05);">
          <i data-lucide="check-circle-2" style="color:var(--green); flex-shrink:0;"></i>
          <div>
            <strong>Verification Success:</strong> All data aligns perfectly with the current DSR project records.
          </div>
        </div>
      `;
    }
  } else {
    alertContainer.style.display = 'none';
  }

  // Draw table based on Active Tab columns
  drawComparisonTable(table, comparisonResults.rows);
  initLucide();
}

// Get original DSR values from the project context
function getOriginalProjectData() {
  if (sdlcActiveTab === 4) {
    if (S.activeProject.anx4Data) return S.activeProject.anx4Data;
    // Fallback to coordinates / routes inside DOM tables or default routes
    return {
      individual: [
        { sl: 1, lease: 'Jalandhar Sutlej - 1 Vill- Kadiana', route: "A-A'", tippersLease: '43', tippersAll: '358', length: '0.73', roadType: 'Unpaved', recom: 'Unpaved', constructedBy: 'Lease Owner', map: 'Route Map attached' }
      ],
      cluster: [
        { cluster: 'Cluster Jalandhar Sutlej - 1,2', route: "A-A', B-B'", tippersCluster: '358', tippersAll: '358', length: '0.73', roadType: 'Unpaved', recom: 'Unpaved', constructedBy: 'Lease Owner', map: 'Route Map attached' }
      ]
    };
  } 
  else if (sdlcActiveTab === 5) {
    if (S.activeProject.anx5Data) return S.activeProject.anx5Data;
    return {
      mining: [{ sl: 1, river: 'Sutlej', barCode: 'PO_JL_PL_ST_1B', details: 'Kadiana', area: 4.8, lat: "31°0'48\"N", lng: "75°53'39\"E", forestDist: 'NA', bulkDensity: 1.54, depth: 1.74 }],
      patta: [{ sl: 1, owner: 'Raj Kumar', khasra: '8/21', area: 2.77, lat: "30°59'37\"N", lng: "75°27'9\"E", tehsil: 'Shahkot', village: 'Bangiwal' }],
      desilt: [{ dam: 'Sutlej Dam', controlledBy: 'State Govt', lat: "31°00'56\"N", lng: "75°54'59\"E", size: '10.93', qty: '-' }],
      msand: [{ name: 'Not Available', owner: 'Not Available', tehsil: 'Phillaur', village: 'Not Available', geo: 'Not Available', qty: 'Not Available' }]
    };
  } 
  else if (sdlcActiveTab === 6) {
    if (S.activeProject.anx6Data) return S.activeProject.anx6Data;
    return {
      cluster: [{ river: 'Sutlej', cluster: '1', lease: 'Jalandhar Sutlej 1,2', location: 'Riverbed', village: 'Kadiana', area: 25.27, excavation: 1074334.80 }],
      contiguous: [{ river: 'Sutlej', contiguous: '1', cluster: '10,11', leases: '10', location: 'Riverbed', distance: '0.55km', village: 'Minwal', area: 71.01 }]
    };
  }
}

// Side-by-Side Verification Engine
function computeTabComparison(orig, upload) {
  let mismatches = 0;
  let tableRows = [];

  if (sdlcActiveTab === 4 || sdlcActiveTab === 7) {
    // Individual routes comparison
    const origList = orig.individual || [];
    const uploadList = upload ? (upload.individual || []) : [];

    // Header fields
    tableRows.push({
      isHeader: true,
      cells: ['Type', 'Route/Lease ID', 'Route Number', 'Tippers / Day (Lease)', 'Road Length (Km)', 'Road Construction By', 'Verification']
    });

    const maxLength = Math.max(origList.length, uploadList.length);
    for (let i = 0; i < maxLength; i++) {
      const o = origList[i];
      const u = uploadList[i];

      if (o && u) {
        const isMatch = norm(o.route) === norm(u.route) && norm(o.length) === norm(u.length);
        if (!isMatch) mismatches++;

        tableRows.push({
          status: isMatch ? 'match' : 'mismatch',
          cells: [
            'Individual',
            diffCell(o.lease, u.lease),
            diffCell(o.route, u.route),
            diffCell(o.tippersLease, u.tippersLease),
            diffCell(o.length, u.length),
            diffCell(o.constructedBy, u.constructedBy),
            isMatch ? '<span class="sdlc-cell-same">✓ Verified</span>' : '<span style="color:#b91c1c; font-weight:700;">⚠ Value Mismatch</span>'
          ]
        });
      } else if (o) {
        tableRows.push({
          status: 'removed',
          cells: ['Individual', o.lease, o.route, o.tippersLease, o.length, o.constructedBy, '<span style="color:var(--text-soft)">DSR Only</span>']
        });
      } else if (u) {
        tableRows.push({
          status: 'added',
          cells: ['Individual', u.lease, u.route, u.tippersLease, u.length, u.constructedBy, '<span style="color:var(--primary); font-weight:700;">+ New Survey</span>']
        });
      }
    }
  } 
  else if (sdlcActiveTab === 5) {
    // Mining lease comparison
    const origList = orig.mining || [];
    const uploadList = upload ? (upload.mining || []) : [];

    tableRows.push({
      isHeader: true,
      cells: ['River Details', 'Sand Bar Code', 'Lease Details', 'Area (Ha.)', 'Latitude', 'Longitude', 'Bulk Density', 'Depth (m)', 'Verification']
    });

    const maxLength = Math.max(origList.length, uploadList.length);
    for (let i = 0; i < maxLength; i++) {
      const o = origList[i];
      const u = uploadList[i];

      if (o && u) {
        const isMatch = norm(o.barCode) === norm(u.barCode) && parseFloat(o.area) === parseFloat(u.area);
        if (!isMatch) mismatches++;

        tableRows.push({
          status: isMatch ? 'match' : 'mismatch',
          cells: [
            diffCell(o.river, u.river),
            diffCell(o.barCode, u.barCode),
            diffCell(o.details, u.details),
            diffCell(o.area, u.area),
            diffCell(o.lat, u.lat),
            diffCell(o.lng, u.lng),
            diffCell(o.bulkDensity, u.bulkDensity),
            diffCell(o.depth, u.depth),
            isMatch ? '<span class="sdlc-cell-same">✓ Verified</span>' : '<span style="color:#b91c1c; font-weight:700;">⚠ Mismatch</span>'
          ]
        });
      } else if (o) {
        tableRows.push({
          status: 'removed',
          cells: [o.river, o.barCode, o.details, o.area, o.lat, o.lng, o.bulkDensity, o.depth, '<span style="color:var(--text-soft)">DSR Only</span>']
        });
      } else if (u) {
        tableRows.push({
          status: 'added',
          cells: [u.river, u.barCode, u.details, u.area, u.lat, u.lng, u.bulkDensity, u.depth, '<span style="color:var(--primary); font-weight:700;">+ New Survey</span>']
        });
      }
    }
  } 
  else if (sdlcActiveTab === 6) {
    // Cluster comparison
    const origList = orig.cluster || [];
    const uploadList = upload ? (upload.cluster || []) : [];

    tableRows.push({
      isHeader: true,
      cells: ['River Name', 'Cluster No', 'Lease details', 'Location Type', 'Village Name', 'Area (Ha.)', 'Excavation Target (MT)', 'Verification']
    });

    const maxLength = Math.max(origList.length, uploadList.length);
    for (let i = 0; i < maxLength; i++) {
      const o = origList[i];
      const u = uploadList[i];

      if (o && u) {
        const isMatch = norm(o.cluster) === norm(u.cluster) && parseFloat(o.area) === parseFloat(u.area);
        if (!isMatch) mismatches++;

        tableRows.push({
          status: isMatch ? 'match' : 'mismatch',
          cells: [
            diffCell(o.river, u.river),
            diffCell(o.cluster, u.cluster),
            diffCell(o.lease, u.lease),
            diffCell(o.location, u.location),
            diffCell(o.village, u.village),
            diffCell(o.area, u.area),
            diffCell(o.excavation, u.excavation),
            isMatch ? '<span class="sdlc-cell-same">✓ Verified</span>' : '<span style="color:#b91c1c; font-weight:700;">⚠ Mismatch</span>'
          ]
        });
      } else if (o) {
        tableRows.push({
          status: 'removed',
          cells: [o.river, o.cluster, o.lease, o.location, o.village, o.area, o.excavation, '<span style="color:var(--text-soft)">DSR Only</span>']
        });
      } else if (u) {
        tableRows.push({
          status: 'added',
          cells: [u.river, u.cluster, u.lease, u.location, u.village, u.area, u.excavation, '<span style="color:var(--primary); font-weight:700;">+ New Survey</span>']
        });
      }
    }
  }

  return { mismatches, rows: tableRows };
}

// Side-by-Side Diff Cell Highlighter
function diffCell(origVal, uploadVal) {
  if (uploadVal === undefined || uploadVal === null) return `<span>${origVal}</span>`;
  const match = norm(origVal) === norm(uploadVal);
  if (match) {
    return `<span class="sdlc-cell-same">${origVal}</span>`;
  } else {
    return `
      <div style="display:flex; flex-direction:column; font-size:12px;">
        <span style="color:var(--text-soft); text-decoration:line-through; font-size:11px;">${origVal}</span>
        <span class="sdlc-cell-diff">${uploadVal}</span>
      </div>
    `;
  }
}

// Helper to draw the comparison visual tables
function drawComparisonTable(table, rows) {
  let html = '';
  rows.forEach(r => {
    if (r.isHeader) {
      html += '<thead><tr>';
      r.cells.forEach(c => html += `<th>${c}</th>`);
      html += '</tr></thead><tbody>';
    } else {
      let rowClass = '';
      if (r.status === 'match') rowClass = 'sdlc-row-match';
      else if (r.status === 'mismatch') rowClass = 'sdlc-row-mismatch';
      else if (r.status === 'added') rowClass = 'sdlc-row-added';

      html += `<tr class="${rowClass}">`;
      r.cells.forEach(c => html += `<td>${c}</td>`);
      html += '</tr>';
    }
  });
  if (rows.length > 1) {
    html += '</tbody>';
  } else {
    html += '<tbody><tr><td colspan="100%" style="text-align:center; padding: 30px; color:var(--text-soft);"><i data-lucide="upload" style="width:20px; height:20px; display:block; margin: 0 auto 10px; opacity:0.6;"></i>Upload SDLC Survey Excel to start side-by-side comparison</td></tr></tbody>';
  }
  table.innerHTML = html;
}

/* ══════════════════════════════════════
   SAVE & STATE PERSISTENCE
══════════════════════════════════════ */
async function applySdlcUpdatesToProject() {
  if (!S.activeProject || !sdlcParsedData) return;

  try {
    if (sdlcActiveTab === 4 || sdlcActiveTab === 7) {
      S.activeProject.anx4Data = sdlcParsedData;
      if (sdlcActiveTab === 7) S.activeProject.anx7Data = sdlcParsedData;
    } 
    else if (sdlcActiveTab === 5) {
      S.activeProject.anx5Data = sdlcParsedData;
    } 
    else if (sdlcActiveTab === 6) {
      S.activeProject.anx6Data = sdlcParsedData;
    }

    // Call global auto-save framework
    if (typeof persistProjectState === 'function') {
      await persistProjectState();
    }

    toast('Project Annexure data updated successfully from SDLC reports!', 'success');
    
    // Hide verification save panel since changes are committed
    document.getElementById('sdlc-save-panel').style.display = 'none';
    
    // Refresh visual comparison grid to show matching alignment
    sdlcParsedData = null;
    renderSdlcComparison();

  } catch (err) {
    toast('Error updating project: ' + err.message, 'error');
    console.error(err);
  }
}
window.applySdlcUpdatesToProject = applySdlcUpdatesToProject;
