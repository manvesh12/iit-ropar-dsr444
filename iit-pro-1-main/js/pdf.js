/* ══════════════════════════════════════
   PDF GENERATION & REVIEW
 ══════════════════════════════════════ */
function generateFinalPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
  const W=210, pad=15;
  let y=20;

  const dist=document.getElementById('pdf-district')?.value||'Jalandhar';
  const yr=document.getElementById('pdf-year')?.value||'2025-26';

  const govBlue=[26,51,102];
  const navyArr=[11,29,58];
  const saffron=[224,123,0];

  // Helper
  const addPageHeader=(section)=>{
    doc.setFillColor(...navyArr); doc.rect(0,0,W,14,'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(255,255,255);
    doc.text('DISTRICT SURVEY REPORT — GOVERNMENT OF PUNJAB · EMGSM 2020',W/2,8,{align:'center'});
    doc.text(section,W-pad,8,{align:'right'});
    doc.setDrawColor(224,123,0); doc.setLineWidth(0.8); doc.line(pad,15,W-pad,15);
  };

  // COVER PAGE or uploaded front-matter PDFs
  let coverInserted = false;
  if (S.uploadedPDFs && S.uploadedPDFs.cover && S.uploadedPDFs.cover.length) {
    // Use uploaded cover PDF pages (rendered to images)
    S.uploadedPDFs.cover.forEach((img, idx) => {
      if (idx > 0) doc.addPage();
      try { doc.addImage(img, 'PNG', 0, 0, W, 297); } catch(e) { try { doc.addImage(img, 'JPEG', 0, 0, W, 297); } catch(_){} }
    });
    coverInserted = true;
  }
  if (!coverInserted) {
    addPageHeader('COVER PAGE');
    doc.setTextColor(...govBlue); doc.setFont('helvetica','bold'); doc.setFontSize(11);
    doc.text('Enforcement & Monitoring Guidelines for Sand Mining', W/2, 30, {align:'center'});
    doc.setDrawColor(...govBlue); doc.setLineWidth(0.5); doc.line(pad,33,W-pad,33);
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...navyArr);
    doc.text(S.frontMatter.title.toUpperCase(), W/2, 55, {align:'center', maxWidth: W - 2*pad});
    doc.setFontSize(14); doc.text('FOR SAND MINING', W/2, 65, {align:'center'});
    doc.setFontSize(20); doc.setTextColor(...saffron);
    doc.text(S.frontMatter.district.toUpperCase() + ' DISTRICT', W/2, 80, {align:'center'});
    doc.setFontSize(13); doc.setTextColor(...navyArr); doc.text(S.frontMatter.state + ' · ' + S.frontMatter.year, W/2, 90, {align:'center'});
    doc.setFontSize(10); doc.setTextColor(...govBlue);
    
    // Split long Prepared By and Assisted By texts if needed
    const prepLines = doc.splitTextToSize('PREPARED BY: ' + S.frontMatter.preparedBy.toUpperCase(), W - 2*pad);
    doc.text(prepLines, W/2, 130, {align:'center'});
    const assistLines = doc.splitTextToSize('ASSISTED BY: ' + S.frontMatter.assistedBy.toUpperCase(), W - 2*pad);
    doc.text(assistLines, W/2, 130 + (prepLines.length * 6), {align:'center'});
  }

  // Include other front-matter uploads (certificate, toc) after cover
  ['cert','toc'].forEach(type => {
    const pages = S.uploadedPDFs && S.uploadedPDFs[type];
    if (pages && pages.length) {
      pages.forEach(img => { doc.addPage(); try { doc.addImage(img, 'PNG', 0, 0, W, 297); } catch(e) { try { doc.addImage(img, 'JPEG', 0, 0, W, 297); } catch(_){} } });
    }
  });

  // PREFACE PAGE
  let prefaceInserted = false;
  if (S.uploadedPDFs && S.uploadedPDFs.pref && S.uploadedPDFs.pref.length) {
    S.uploadedPDFs.pref.forEach(img => { doc.addPage(); try { doc.addImage(img, 'PNG', 0, 0, W, 297); } catch(e) { try { doc.addImage(img, 'JPEG', 0, 0, W, 297); } catch(_){} } });
    prefaceInserted = true;
  }
  if (!prefaceInserted && S.frontMatter.preface) {
    doc.addPage(); y = 25; addPageHeader('PREFACE');
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...navyArr);
    doc.text('PREFACE', W/2, y, {align:'center'}); y += 15;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(50,50,70);
    const prefLines = doc.splitTextToSize(S.frontMatter.preface, W - 2*pad);
    doc.text(prefLines, pad, y);
  }

  // ACKNOWLEDGEMENT PAGE
  if (S.frontMatter.acknowledgement) {
    doc.addPage(); y = 25; addPageHeader('ACKNOWLEDGEMENT');
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(...navyArr);
    doc.text('ACKNOWLEDGEMENT', W/2, y, {align:'center'}); y += 15;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(50,50,70);
    const ackLines = doc.splitTextToSize(S.frontMatter.acknowledgement, W - 2*pad);
    doc.text(ackLines, pad, y);
  }

  // TABLE OF CONTENTS
  doc.addPage(); y=25; addPageHeader('CONTENTS');
  doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...navyArr);
  doc.text('TABLE OF CONTENTS', W/2, y, {align:'center'}); y+=12;
  S.chapters.forEach((ch,i)=>{
    if (y>265){doc.addPage();y=20;addPageHeader('CONTENTS');}
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(50,50,80);
    doc.text(`${i+1}.  ${ch.name}`, pad, y); y+=7;
  });

  // CHAPTERS
  S.chapters.forEach((ch,i)=>{
    doc.addPage(); addPageHeader('CHAPTER '+(i+1));
    y=25;
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(...navyArr);
    doc.text(ch.name, pad, y, {maxWidth:W-2*pad}); y+=14;
    doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(60,60,80);
    const lines=doc.splitTextToSize(ch.summary, W-2*pad);
    doc.text(lines, pad, y); y+=lines.length*6+8;
    const chapterPages = S.chapterPDFs && S.chapterPDFs[ch.id];
    if (chapterPages && chapterPages.length) {
      doc.setFontSize(9); doc.setTextColor(120,120,140);
      doc.text(`[Chapter content appended from uploaded file: ${ch.fileName || 'document.pdf'}]`, pad, y);

      chapterPages.forEach((img, pageIdx) => {
        doc.addPage();
        doc.setFillColor(...navyArr); doc.rect(0, 0, W, 14, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
        doc.text(`DISTRICT SURVEY REPORT — ${dist.toUpperCase()} · EMGSM 2020`, W/2, 8, {align:'center'});
        doc.text(`CHAPTER ${i+1} — UPLOADED CONTENT (Pg ${pageIdx + 1}/${chapterPages.length})`, W-pad, 8, {align:'right'});
        doc.setDrawColor(224,123,0); doc.setLineWidth(0.8); doc.line(pad,15,W-pad,15);

        doc.setDrawColor(200,200,200); doc.setLineWidth(0.5);
        doc.rect(pad, 20, W - 2*pad, 260); // Frame

        try {
          doc.addImage(img, 'PNG', pad + 1, 21, W - 2*pad - 2, 258);
        } catch(e) {
          try { doc.addImage(img, 'JPEG', pad + 1, 21, W - 2*pad - 2, 258); } catch(_){}
        }
      });
    } else {
      doc.setFontSize(9); doc.setTextColor(120,120,140);
      doc.text('[Full chapter content to be included from uploaded PDF or text data]', pad, y);
    }
  });

  // GRAPHS DATA WITH CANVAS EXTRACTION
  if (S.graphs.length) {
    doc.addPage(); addPageHeader('CROSS SECTION ANALYSIS'); y=25;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...navyArr);
    doc.text('CROSS SECTION ANALYSIS & SANDBAR CALCULATIONS', W/2, y, {align:'center'}); y+=12;
    S.graphs.forEach(g=>{
      if (y>220){doc.addPage();y=20;addPageHeader('CROSS SECTION');}
      const o=calcGraph(g);
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...navyArr);
      doc.text(g.name, pad, y); y+=7;
      doc.autoTable({
        startY:y,margin:{left:pad,right:pad},styles:{fontSize:9},
        headStyles:{fillColor:navyArr},
        head:[['Metric','Value','Unit']],
        body:[
          ['Average Thickness',o.avgThick.toFixed(3),'m'],
          ['Potential Area',o.pArea.toFixed(2),'Ha'],
          ['Volume',fmtN(o.volume,0),'m³'],
          ['Allowed Excavation',fmtN(o.allowed,0),'MT'],
          ['Bulk Density',g.bulk,'g/cc'],
          ['Mining %',g.pct+'%','EMGSM 2020']
        ]
      });
      y=doc.lastAutoTable.finalY+10;

      // Draw the actual Canvas Graph
      const canvas = document.getElementById('canvas-' + g.id + '-post') || document.getElementById('canvas-' + g.id);
      if (canvas) {
        if (y > 200) { doc.addPage(); y=20; addPageHeader('CROSS SECTION GRAPH'); }
        try {
          const imgData = canvas.toDataURL('image/png', 1.0);
          doc.addImage(imgData, 'PNG', pad, y, W - 2*pad, 65);
          y += 75;
        } catch(e) { console.error('Canvas capture failed', e); }
      }
    });
  }

  // PLATES
  if (S.plates.length) {
    doc.addPage(); addPageHeader('PLATE SECTION'); y=25;
    doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...navyArr);
    doc.text('PLATE SECTION — MAPS & SITE PHOTOGRAPHS', W/2, y, {align:'center'}); y+=10;
    S.plates.forEach((p,i)=>{
      if (y>250){doc.addPage();y=20;addPageHeader('PLATES');}
      doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(60,60,80);
      const fileStatus = p.fileName ? `[File: ${p.fileName}]` : '[No file uploaded]';
      doc.text(`Plate ${i+1}: ${p.name}  ${fileStatus}`, pad, y); y+=7;
    });

    // Append the visual plates
    S.plates.forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, pageIdx) => {
          doc.addPage();
          doc.setFillColor(...navyArr); doc.rect(0, 0, W, 12, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
          doc.text(`PLATE ${i+1}: ${p.name.toUpperCase()} (Page ${pageIdx + 1}/${p.pages.length})`, pad, 8);
          try {
            doc.addImage(img, 'JPEG', 0, 12, W, 285);
          } catch(e) {
            try {
              doc.addImage(img, 'PNG', 0, 12, W, 285);
            } catch(e2) {
              console.error(`Failed to add plate ${i+1} page to PDF:`, e2);
            }
          }
        });
      }
    });
  }

  // ALL TABLES (ANNEXURES & DATA TABLES)
  const allTablesData = [
    { title: 'ANNEXURE I(a) — RIVERS', id: '#anx1-rivers' },
    { title: 'ANNEXURE I(b) — DE-SILTATION', id: '#anx1-desilt' },
    { title: 'ANNEXURE I(c) — PATTA LANDS', id: '#anx1-patta' },
    { title: 'ANNEXURE I(d) — M-SAND PLANTS', id: '#anx1-msand' },
    { title: 'ANNEXURE II(a) — MINING LEASES', id: '#anx2-leases' },
    { title: 'ANNEXURE II(b) — PATTA LANDS', id: '#anx2-patta' },
    { title: 'ANNEXURE II(c) — DE-SILTATION', id: '#anx2-desilt' },
    { title: 'ANNEXURE II(d) — M-SAND PLANTS', id: '#anx2-msand' },
    { title: 'ANNEXURE III(a) — CLUSTERS', id: '#anx3-clusters' },
    { title: 'ANNEXURE III(b) — CONTIGUOUS CLUSTERS', id: '#anx3-contiguous' },
    { title: 'ANNEXURE IV(a) — LEASE ROUTES', id: '#anx4-routes' },
    { title: 'ANNEXURE IV(b) — CLUSTER ROUTES', id: '#anx4-cluster-routes' },
    { title: 'ANNEXURE V — BENCH MARK & CORS', id: '#anx5-benchmarks' },
    { title: 'ANNEXURE VI — FINAL CLUSTERS', id: '#anx6-final-clusters' },
    { title: 'ANNEXURE VII — FINAL PATTA LANDS', id: '#anx7-patta-final' },
    { title: 'ADDITIONAL — SAND GHATS COORDS', id: '#anx-coords-tbl' },
    { title: 'ADDITIONAL — BENCH MARKS', id: '#anx-benchmark-tbl' },
    { title: 'ADDITIONAL — CORS STATIONS', id: '#anx-cors-tbl' },
    { title: 'ADDITIONAL — FINAL CLUSTERS', id: '#anx-final-clusters-tbl' },
    { title: 'ADDITIONAL — FINAL PATTA LANDS', id: '#anx-patta-final-tbl' },
    { title: 'ADDITIONAL — FINAL DE-SILTATION', id: '#anx-desilt-final-tbl' },
    { title: 'DATA TABLE — PROJECTED DEMAND', id: '#demand-tbl' },
    { title: 'DATA TABLE — AUCTIONED SITES', id: '#auction-tbl' },
    { title: 'DATA TABLE — SOURCE SUMMARY', id: '#summary-tbl' }
  ];

  allTablesData.forEach((tblConfig, index) => {
    let tables = [];
    if (tblConfig.id === '#anx2-leases') {
      tables = Array.from(document.querySelectorAll('table[id^="anx2-leases"]'));
    } else {
      const el = document.querySelector(tblConfig.id);
      if (el) tables.push(el);
    }

    tables.forEach((tableEl, tblIdx) => {
      if (tableEl && tableEl.rows.length > 1) { // ensure it has rows beyond header
        doc.addPage(); addPageHeader(tblConfig.title.split(' — ')[0]); y=25;
        doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...navyArr);
        
        let title = tblConfig.title;
        if (tblConfig.id === '#anx2-leases' && tables.length > 1) {
          title += ` (Table ${tblIdx + 1})`;
        }
        doc.text(title, W/2, y, {align:'center'}); y+=10;

        const head = []; const body = []; const foot = [];
        let hasActionCol = false;

        // Extract Headers
        tableEl.querySelectorAll('thead tr').forEach(tr => {
          const rowData = [];
          tr.querySelectorAll('th, td').forEach(cell => rowData.push(cell.innerText.trim()));
          if (rowData[rowData.length - 1] === 'Action') {
            hasActionCol = true;
            rowData.pop();
          }
          head.push(rowData);
        });

        // Extract Body
        tableEl.querySelectorAll('tbody tr').forEach(tr => {
          const rowData = [];
          tr.querySelectorAll('th, td').forEach(cell => {
            const select = cell.querySelector('select');
            rowData.push(select ? select.value : cell.innerText.trim().replace('✕',''));
          });
          if (hasActionCol) rowData.pop();
          body.push(rowData);
        });

        // Extract Footer (if any)
        tableEl.querySelectorAll('tfoot tr').forEach(tr => {
          const rowData = [];
          tr.querySelectorAll('th, td').forEach(cell => {
            const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
            rowData.push({ content: cell.innerText.trim(), colSpan: colspan });
          });
          if (hasActionCol && rowData.length > 0 && (rowData[rowData.length - 1].content === '' || rowData[rowData.length - 1].content === '✕')) {
            rowData.pop();
          }
          foot.push(rowData);
        });

        // Render the extracted table structure natively into PDF
        doc.autoTable({
          startY: y, margin: {left:pad, right:pad}, styles: {fontSize: 7, cellPadding: 2},
          headStyles: {fillColor: navyArr},
          footStyles: {fillColor: [240,240,245], textColor: navyArr, fontStyle: 'bold'},
          head: head,
          body: body,
          foot: foot.length > 0 ? foot : false,
          theme: 'grid'
        });
      }
    });

    // Check if this is the last table of the current Annexure group
    const currentPrefix = tblConfig.title.split('(')[0].trim().split(' ')[0] + ' ' + tblConfig.title.split('(')[0].trim().split(' ')[1]; // E.g. "ANNEXURE I"
    const nextTblConfig = allTablesData[index + 1];
    let nextPrefix = '';
    if (nextTblConfig) {
      nextPrefix = nextTblConfig.title.split('(')[0].trim().split(' ')[0] + ' ' + nextTblConfig.title.split('(')[0].trim().split(' ')[1];
    }
    
    // Inject uploaded PDFs if the Annexure group is changing
    if (currentPrefix !== nextPrefix && currentPrefix.startsWith('ANNEXURE')) {
      let uploadKey = '';
      if (currentPrefix === 'ANNEXURE I') uploadKey = 'anx1';
      else if (currentPrefix === 'ANNEXURE II') uploadKey = 'anx2';
      else if (currentPrefix === 'ANNEXURE III') uploadKey = 'anx3';
      else if (currentPrefix === 'ANNEXURE IV') uploadKey = 'anx4';
      
      if (uploadKey && S.uploadedPDFs && S.uploadedPDFs[uploadKey] && S.uploadedPDFs[uploadKey].length > 0) {
        S.uploadedPDFs[uploadKey].forEach((img, pageIdx) => {
          doc.addPage();
          doc.setFillColor(...navyArr); doc.rect(0, 0, W, 14, 'F');
          doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
          doc.text(`DISTRICT SURVEY REPORT — ${dist.toUpperCase()} · EMGSM 2020`, W/2, 8, {align:'center'});
          doc.text(`${currentPrefix} — UPLOADED DOCUMENT (Pg ${pageIdx + 1}/${S.uploadedPDFs[uploadKey].length})`, W-pad, 8, {align:'right'});
          doc.setDrawColor(224,123,0); doc.setLineWidth(0.8); doc.line(pad,15,W-pad,15);
          
          // Draw a clean border for the uploaded image
          doc.setDrawColor(200,200,200); doc.setLineWidth(0.5);
          doc.rect(pad, 20, W - 2*pad, 260); // Frame
          
          try { 
            doc.addImage(img, 'PNG', pad + 1, 21, W - 2*pad - 2, 258); 
          } catch(e) { 
            try { doc.addImage(img, 'JPEG', pad + 1, 21, W - 2*pad - 2, 258); } catch(_){} 
          }
        });
      }
    }
  });

  // SIGNATURE PAGE
  doc.addPage(); addPageHeader('DIGITAL SIGNATURES'); y=25;
  doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(...navyArr);
  doc.text('DIGITAL SIGNATURE REGISTER', W/2, y, {align:'center'}); y+=12;
  doc.autoTable({
    startY:y, margin:{left:pad,right:pad}, styles:{fontSize:9},
    headStyles:{fillColor:navyArr},
    head:[['#','Role','Officer','Status','Signed At','Method']],
    body:S.signatures.map(s=>[s.order,s.role,s.name,s.signed?'SIGNED':'PENDING',s.signedAt||'—',s.method||'—'])
  });

  // FOOTER ON ALL PAGES
  const total=doc.getNumberOfPages();
  for (let p=1;p<=total;p++) {
    doc.setPage(p);
    doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(120,120,140);
    doc.setDrawColor(200,200,200); doc.line(pad,287,W-pad,287);
    doc.text(`PREPARED BY: SUB-DIVISIONAL COMMITTEE, ${dist.toUpperCase()} | ASSISTED BY: RSP GREEN DEVELOPMENT AND LABORATORIES PVT. LTD`, pad, 291);
    doc.text(`Page ${p} of ${total}`, W-pad, 291, {align:'right'});
  }

  const fname=`DSR-${dist}-${yr.replace('/','-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fname);
  toast('PDF generated: '+fname,'success');
}

async function submitForReview(ignoreWarning = false) {
  if (!S.activeProject) return;
  try {
    let deoRemarks = 'Submitted by DEO';
    // If it's a regular submission, ask for a reply note (optional)
    if (!ignoreWarning) {
        const reply = prompt('Enter your reply / remarks for the reviewer (Optional):', '');
        if (reply !== null && reply.trim() !== '') {
            deoRemarks = reply.trim();
        } else if (reply === null) {
            return; // Cancelled
        }
    }

    const payload = { action: 'SUBMIT', remarks: deoRemarks, ignoreWarning: ignoreWarning };
    await apiFetch(`/reports/${S.activeProject.id}/workflow`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    toast('Report submitted to authority dashboard!', 'success');
    if (typeof renderProjects === 'function') renderProjects();
    showView('dashboard', null);
  } catch (e) {
    if (e.isWarning) {
       if (confirm(e.warningData.message || "You are submitting the same data. Do you want to proceed?")) {
           submitForReview(true);
       }
    } else {
       toast('Error submitting report: ' + e.message, 'error');
    }
  }
}

/* ══════════════════════════════════════
   AUTHORITY DASHBOARD
 ══════════════════════════════════════ */
function renderAuthorityReports() {
  const el=document.getElementById('authority-reports'); if(!el) return;
  const reports=[
    { id:1, title:'DSR — Jalandhar Sand Mining 2025-26', district:'Jalandhar', by:'Rajinder Kumar, SDO', at:'May 21, 2026 · 11:42 AM', status:'Awaiting Your Signature', done:1, sections:12 },
    { id:2, title:'DSR — Ludhiana Sand Mining 2025-26', district:'Ludhiana', by:'Priya Sharma, SDO', at:'May 20, 2026 · 3:15 PM', status:'Under Review', done:1, sections:10 },
    { id:3, title:'DSR — Patiala Sand Mining 2025-26', district:'Patiala', by:'Harjinder Singh, SDO', at:'May 19, 2026 · 9:00 AM', status:'Awaiting Your Signature', done:1, sections:11 }
  ];
  el.innerHTML=reports.map(r=>`
    <div class="review-card">
      <div class="review-card-hd">
        <div><div style="font-size:14.5px;font-weight:700;color:var(--text)">${r.title}</div>
          <div style="font-size:11px;color:var(--text-soft);margin-top:2px">Submitted by ${r.by} · ${r.at}</div></div>
        <span class="badge ${r.status.includes('Awaiting')?'badge-saffron':'badge-amber'}">${r.status}</span>
      </div>
      <div class="review-card-bd">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">
          <span class="badge badge-navy" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="map-pin" style="width:12px;height:12px;"></i>${r.district}</span>
          <span class="badge badge-teal" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="check-circle-2" style="width:12px;height:12px;"></i>${r.done}/5 signed</span>
          <span class="badge badge-navy" style="display:inline-flex;align-items:center;gap:4px;"><i data-lucide="file-text" style="width:12px;height:12px;"></i>${r.sections} sections</span>
          <div style="flex:1"></div>
          <button class="btn btn-outline btn-sm" onclick="toast('PDF preview opened','info')">👁 Preview</button>
          <button class="btn btn-navy btn-sm" onclick="toast('DSR-${r.district}-2025-26.pdf downloading...','info')">Download</button>
          <button class="btn btn-saffron btn-sm" onclick="openAuthoritySign(${r.id},'${r.title}')">Sign Now</button>
        </div>
        <div style="font-size:11px;font-weight:600;color:var(--text-soft);margin-bottom:7px">Signature Progress:</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${['SDO','DMO','DC','Director','Pr. Secy'].map((role,i)=>`
            <div style="display:flex;align-items:center;gap:4px;background:${i<r.done?'var(--green-lt)':i===r.done?'var(--saffron-lt)':'var(--bg)'};border:1px solid ${i<r.done?'var(--green)':i===r.done?'var(--saffron)':'var(--border)'};border-radius:99px;padding:4px 10px;font-size:11px;font-weight:600;color:${i<r.done?'var(--green)':i===r.done?'var(--saffron)':'var(--text-faint)'}">
              <i data-lucide="${i<r.done?'check-circle-2':i===r.done?'clock':'minus-circle'}" style="width:12px;height:12px;"></i>
              ${role}
            </div>`).join('')}
        </div>
      </div>
    </div>`).join('');
  initLucide();
}

function openAuthoritySign(id, title) {
  document.getElementById('auth-sign-content').innerHTML=`
    <div style="background:var(--off);border:1px solid var(--border);border-radius:var(--r-md);padding:14px;margin-bottom:14px">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-faint);margin-bottom:4px">Report to Sign</div>
      <div style="font-size:14px;font-weight:700;color:var(--text)">${title}</div>
      <div style="font-size:11.5px;color:var(--text-soft);margin-top:3px">Your position: District Mining Officer (Authority #2)</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:9px">
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px"><input type="checkbox" checked> I have reviewed the complete DSR report</label>
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px"><input type="checkbox" checked> I certify data accuracy and EMGSM 2020 compliance</label>
      <label style="display:flex;align-items:center;gap:9px;cursor:pointer;font-size:12.5px"><input type="checkbox" checked> I authorize forwarding to the next authority</label>
    </div>`;
  document.getElementById('auth-otp').value='';
  document.getElementById('modal-auth-sign').classList.add('open');
  if (typeof initSignaturePad === 'function') {
    initSignaturePad('auth-signature-pad');
  }
  initLucide();
}

function authoritySign() {
  if (document.getElementById('auth-otp').value!=='123456') { toast('Invalid OTP. Demo: 123456','error'); return; }
  closeModal('modal-auth-sign');
  toast('Report signed! Deputy Commissioner has been notified.','success');
}
