/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ANNEXURE I â€” SAND SOURCES
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

// --- 1. TEMPLATE DOWNLOAD ---
function downloadSectionTemplate(sectionType) {
  let csvContent = "";
  let filename = "";

  switch(sectionType) {
    case 'A':
      csvContent = "River Name/M-Sand Plant,Total Stretch of River (in KM),Type of River (Perennial or Non Perennial)\n";
      filename = "Table_A_Rivers_Template.csv";
      break;
    case 'B':
      csvContent = "b) De-Siltation Location (Lakes/Ponds/Dams etc.),,,,,,,\n,,,,,,,\nName of Reservoir/Dams,Maintain/Controlled by State Govt./PSU etc.,Latitude,Longitude,District,Tehsil,Village,Size (Ha)\n";
      filename = "Table_B_DeSiltation_Template.csv";
      break;
    case 'C':
      csvContent = "Owner,SL. No,Area (Ha),District,Tehsil,Village,Agricultural Land (Yes/No)\n";
      filename = "Table_C_Patta_Lands_Template.csv";
      break;
    case 'D':
      csvContent = "Plant Name,Owner,District,Tehsil,Village,Geo-location,Quantity Tonnes/Annum\n";
      filename = "Table_D_MSand_Template.csv";
      break;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- 2. EXCEL UPLOAD PARSING ---
function handleSectionUpload(event, sectionType) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      
      if (rows.length === 0) {
        toast("The uploaded file is empty.", "warn");
        return;
      }

      processExcelData(rows, sectionType);
    } catch (error) {
      toast("Error parsing file. Please ensure it is a valid Excel or CSV file.", "error");
      console.error(error);
    }
    event.target.value = ''; 
  };
  reader.readAsArrayBuffer(file);
}

function processExcelData(rows, sectionType) {
  const validRows = rows.filter(row => row.some(cell => String(cell !== undefined && cell !== null ? cell : "").trim() !== ""));
  let startIndex = 0; 

  const headerIdx = validRows.findIndex(row => {
    const rowStr = row.map(c => String(c || '')).join(' ').toLowerCase();
    if (sectionType === 'A') return rowStr.includes('river');
    if (sectionType === 'B') return rowStr.includes('reservoir');
    if (sectionType === 'C') return rowStr.includes('owner');
    if (sectionType === 'D') return rowStr.includes('plant');
    return false;
  });

  if (headerIdx >= 0) {
    startIndex = headerIdx + 1;
  }

  const dataRows = validRows.slice(startIndex);
  
  if(dataRows.length === 0) {
    toast("No data found after the header in the uploaded file.", "warn");
    return;
  }
  
  let tableId = '';
  if (sectionType === 'A') tableId = 'anx1-rivers';
  if (sectionType === 'B') tableId = 'anx1-desilt';
  if (sectionType === 'C') tableId = 'anx1-patta';
  if (sectionType === 'D') tableId = 'anx1-msand';

  const tbody = document.getElementById(tableId).querySelector('tbody');
  tbody.innerHTML = ''; 

  dataRows.forEach(rowData => {
    while (rowData.length < 8) rowData.push(""); 

    let cellDataArray = [];
    const isReadOnly = S.role !== 'user';
    const actionBtn = `<button class='btn btn-xs btn-danger' onclick='delRow(this)' style='display:${isReadOnly ? 'none' : 'inline-flex'};align-items:center;justify-content:center;padding:4px;'><i data-lucide='trash-2' style='width:12px;height:12px;'></i></button>`;

    if (sectionType === 'A') {
      let typeVal = String(rowData[2] || "").trim();
      let isNonPerennial = typeVal.toLowerCase().includes("non");
      let typeSelect = `<select ${isReadOnly ? 'disabled' : ''}><option ${!isNonPerennial ? 'selected' : ''}>Perennial</option><option ${isNonPerennial ? 'selected' : ''}>Non-Perennial</option></select>`;
      cellDataArray = [rowData[0], rowData[1], typeSelect, actionBtn];
    } 
    else if (sectionType === 'B') {
      cellDataArray = [rowData[0], rowData[1], rowData[2], rowData[3], rowData[4], rowData[5], rowData[6], rowData[7], actionBtn];
    } 
    else if (sectionType === 'C') {
      let agVal = String(rowData[6] || "").trim().toLowerCase();
      let agSelect = `<select ${isReadOnly ? 'disabled' : ''}><option ${agVal === 'yes' ? 'selected' : ''}>Yes</option><option ${agVal === 'no' ? 'selected' : ''}>No</option></select>`;
      cellDataArray = [rowData[0], rowData[1], rowData[2], rowData[3], rowData[4], rowData[5], agSelect, actionBtn];
    } 
    else if (sectionType === 'D') {
      cellDataArray = [rowData[0], rowData[1], rowData[2], rowData[3], rowData[4], rowData[5], rowData[6], actionBtn];
    }
    addRowAnx1(tableId, cellDataArray);
  });
  toast(`Uploaded section ${sectionType} data successfully`, 'success');
}

function addRowAnx1(tableId, cellDataArray) {
  const tbody = document.querySelector('#' + tableId + ' tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  
  cellDataArray.forEach((data) => {
    const td = document.createElement('td');
    let dataStr = String(data !== undefined && data !== null ? data : '').trim();

    if (dataStr === '' && !dataStr.includes('<button') && !dataStr.includes('<select')) {
      dataStr = 'NUL';
    }

    if (!dataStr.includes('<button') && !dataStr.includes('<select')) {
      if (S.role !== 'user') {
        td.contentEditable = "false";
        td.style.backgroundColor = 'var(--off)';
        td.style.cursor = 'not-allowed';
      } else {
        td.contentEditable = "true";
      }
      td.textContent = dataStr;
    } else {
      td.innerHTML = dataStr;
    }
    tr.appendChild(td);
  });
  
  tbody.appendChild(tr);
  if (window.initLucide) window.initLucide();
}

// --- 3. FLAWLESS PAGINATED PDF GENERATOR ---
function exportAnx1PDF(btn, isLivePreview = false) {
  if (typeof html2pdf === 'undefined') {
    const originalText = btn ? btn.innerText : 'Loading...';
    if (btn) btn.innerText = "Loading PDF Engine...";
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    
    script.onload = () => {
      if (btn) btn.innerText = originalText;
      executePDFExport(isLivePreview);
    };
    
    script.onerror = () => {
      if (btn) btn.innerText = originalText;
      toast("Failed to load PDF engine. Please check your internet connection.", "error");
    };
    
    document.head.appendChild(script);
  } else {
    executePDFExport(isLivePreview);
  }
}

function executePDFExport(isLivePreview) {
  const mainView = document.getElementById('view-anx1');
  const printElement = document.createElement('div');
  printElement.id = 'pdf-render-container';
  printElement.style.width = '100%';
  printElement.style.maxWidth = '1000px'; 
  printElement.style.margin = '0 auto';
  printElement.style.fontFamily = 'Arial, Helvetica, sans-serif';
  printElement.style.color = '#000000';
  printElement.style.backgroundColor = '#ffffff';

  let html = `
    <div style="text-align: center; margin-bottom: 20px; padding-top: 10px;">
      <h2 style="margin: 0 0 5px 0; font-size: 22px; font-weight: bold; text-decoration: underline;">Annexure-I</h2>
      <h3 style="margin: 0; font-size: 16px; font-weight: normal;">Details of Sand/M-Sand Sources</h3>
    </div>
  `;

  const addTable = (tableId, sectionTitle, headers) => {
    let tableHtml = `<div style="margin-bottom: 25px; page-break-inside: avoid;">
      <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">${sectionTitle}</h4>
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #000;">
        <thead>
          <tr style="page-break-inside: avoid;">`;
    
    headers.forEach(h => {
      tableHtml += `<th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold; background-color: #f5f5f5;">${h}</th>`;
    });
    
    tableHtml += `</tr></thead><tbody>`;
    
    const rows = document.querySelectorAll(`#${tableId} tbody tr`);
    if(rows.length === 0) {
       tableHtml += `<tr style="page-break-inside: avoid;"><td colspan="${headers.length}" style="border: 1px solid #000; padding: 6px; text-align: center;">Data not provided</td></tr>`;
    } else {
      rows.forEach(row => {
        tableHtml += `<tr style="page-break-inside: avoid;">`;
        const cells = row.querySelectorAll('td');
        
        for(let i = 0; i < cells.length - 1; i++) {
           let val = "";
           const select = cells[i].querySelector('select');
           if (select) {
              val = select.value;
           } else {
              val = cells[i].innerText.trim();
           }
           tableHtml += `<td style="border: 1px solid #000; padding: 6px;">${val}</td>`;
        }
        tableHtml += `</tr>`;
      });
    }
    
    tableHtml += `</tbody></table></div>`;
    return tableHtml;
  };

  html += addTable('anx1-rivers', 'a) Rivers:', ['River Name/M-Sand Plant', 'Total Stretch of River (in KM)', 'Type of River (Perennial or Non Perennial)']);
  html += addTable('anx1-desilt', 'b) De-Siltation Location (Lakes/Ponds/Dams etc.):', ['Name of Reservoir/Dams', 'Maintain/Controlled by State Govt./PSU etc.', 'Latitude', 'Longitude', 'District', 'Tehsil', 'Village', 'Size (Ha)']);
  html += addTable('anx1-patta', 'c) Patta lands/Khatedari land:', ['Owner', 'SL. No', 'Area (Ha)', 'District', 'Tehsil', 'Village', 'Agricultural Land (Yes/No)']);
  html += addTable('anx1-msand', 'd) M-Sand Plants:', ['Plant Name', 'Owner', 'District', 'Tehsil', 'Village', 'Geo-location', 'Quantity Tonnes/Annum']);
  
  printElement.innerHTML = html;
  
  // We attach it invisibly so html2pdf can process it
  printElement.style.position = 'absolute';
  printElement.style.top = '0';
  printElement.style.left = '0';
  printElement.style.zIndex = '-9999';
  printElement.style.opacity = '0';
  document.body.appendChild(printElement);

  const opt = {
    margin:       10,
    filename:     'Annexure_1_Sources.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, windowWidth: document.body.scrollWidth },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'h4'] }
  };

  if (isLivePreview) {
    html2pdf().set(opt).from(printElement).toPdf().get('pdf').then(function(pdf) {
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Page " + i, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
      
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      
      document.body.removeChild(printElement);
      const iframe = document.getElementById('pdf-iframe');
      if (iframe) iframe.src = blobUrl;
    }).catch(err => {
      if(document.body.contains(printElement)) document.body.removeChild(printElement);
      console.error(err);
    });
  } else {
    // Generate and download
    let originalBodyPadding = document.body.style.padding;
    let originalBodyBg = document.body.style.backgroundColor;
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#ffffff';
    
    html2pdf().set(opt).from(printElement).toPdf().get('pdf').then(function(pdf) {
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        pdf.text("Page " + i, pdf.internal.pageSize.getWidth() / 2, pdf.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
    }).save().then(() => {
      document.body.removeChild(printElement);
      document.body.style.padding = originalBodyPadding;
      document.body.style.backgroundColor = originalBodyBg;
      toast('PDF downloaded successfully!', 'success');
    }).catch(err => {
      console.error("PDF Error: ", err);
      if(document.body.contains(printElement)) document.body.removeChild(printElement);
      document.body.style.padding = originalBodyPadding;
      document.body.style.backgroundColor = originalBodyBg;
      toast('Failed to generate PDF', 'error');
    });
  }
}

// Auto Live Preview whenever the table changes
document.addEventListener('input', (e) => {
  if (e.target.closest('#anx1-rivers, #anx1-desilt, #anx1-patta, #anx1-msand')) {
    if (window.anx1DebounceTimer) clearTimeout(window.anx1DebounceTimer);
    window.anx1DebounceTimer = setTimeout(() => {
       exportAnx1PDF(null, true);
    }, 1500); // 1.5 seconds after typing stops
  }
});

// --- 4. HANDLE PDF UPLOAD & PREVIEW ---
function renderPdfUploadUIAnx1() {
  const nameEl = document.getElementById('anx1-uploaded-filename');
  const dlBtn = document.getElementById('anx1-download-btn');
  const delBtn = document.getElementById('anx1-delete-btn');
  const previewBtn = document.getElementById('anx1-preview-btn');
  const previewSection = document.getElementById('pdf-preview-section');
  const iframe = document.getElementById('pdf-iframe');
  
  if (!nameEl || !dlBtn) return;

  if (!S.activeProject) {
    nameEl.style.display = 'none';
    dlBtn.style.display = 'none';
    if (delBtn) delBtn.style.display = 'none';
    if (previewBtn) previewBtn.style.display = 'none';
    return;
  }

  const pdfName = S.activeProject.anx1PdfName;

  // Role-based restrictions: Only officers (user) can upload/delete
  const canEdit = (S.role === 'user');
  const uploadInput = document.getElementById('anx1-upload');
  if (uploadInput) {
    uploadInput.disabled = !canEdit;
    uploadInput.parentElement.style.display = canEdit ? 'inline-block' : 'none';
  }

  if (!pdfName) {
    nameEl.style.display = 'none';
    dlBtn.style.display = 'none';
    if (delBtn) delBtn.style.display = 'none';
    if (previewBtn) previewBtn.style.display = 'none';
    // Do NOT hide the previewSection here anymore, as it's a live preview now.
  } else {
    nameEl.textContent = pdfName;
    nameEl.style.display = 'inline-block';
    dlBtn.style.display = 'inline-flex';
    if (delBtn) delBtn.style.display = canEdit ? 'inline-flex' : 'none';
    if (previewBtn) previewBtn.style.display = 'inline-flex';
    
    // Trigger live preview auto-generation when this UI is rendered
    if (previewSection && previewSection.style.display !== 'none' && iframe) {
      if (S.activeProject.pdfData && S.activeProject.pdfData.anx1) {
        if (iframe.src !== S.activeProject.pdfData.anx1) {
          iframe.src = S.activeProject.pdfData.anx1;
        }
      } else {
        // Automatically generate live preview if no uploaded PDF exists
        if (!window.anx1InitialPreviewGenerated) {
           setTimeout(() => { exportAnx1PDF(null, true); }, 500);
           window.anx1InitialPreviewGenerated = true;
        }
      }
    }
  }

  if (window.initLucide) window.initLucide();
}

function togglePDFPreviewAnx1() {
  exportAnx1PDF(null, true);
}

async function deletePdfAnx1() {
  if (!S.activeProject) return;
  
  if (!confirm("Are you sure you want to delete the uploaded PDF? This will remove the file from the server.")) {
    return;
  }
  
  // Hide preview and clear iframe first to release Windows file lock
  const iframe = document.getElementById('pdf-iframe');
  if (iframe) {
    if (iframe.src.startsWith('blob:')) {
      URL.revokeObjectURL(iframe.src);
    }
    iframe.src = 'about:blank';
  }

  toast("Deleting PDF...", "info");
  
  S.activeProject.anx1PdfName = null;
  if (S.activeProject.pdfData) {
    if (S.activeProject.pdfData.anx1 && S.activeProject.pdfData.anx1.startsWith('blob:')) {
       URL.revokeObjectURL(S.activeProject.pdfData.anx1);
    }
    S.activeProject.pdfData.anx1 = null;
  }
  
  const pIdx = S.projects.findIndex(p => p.id === S.activeProject.id);
  if (pIdx !== -1) {
    S.projects[pIdx].anx1PdfName = null;
    if (S.projects[pIdx].pdfData) S.projects[pIdx].pdfData.anx1 = null;
  }
  
  renderPdfUploadUIAnx1();
  toast("PDF deleted successfully.", "success");
}

function handlePDFUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    toast('Error: Only PDF files are allowed.', 'danger');
    event.target.value = '';
    return;
  }

  toast('Uploading PDF...', 'info');

  const fileURL = URL.createObjectURL(file);
  S.activeProject.anx1PdfName = file.name;
  if (!S.activeProject.pdfData) S.activeProject.pdfData = {};
  S.activeProject.pdfData.anx1 = fileURL;

  if (window.renderPdfToImages) {
    window.renderPdfToImages(file, (err, imgs) => {
      if (!err && imgs) {
        if (!S.uploadedPDFs) S.uploadedPDFs = {};
        S.uploadedPDFs.anx1 = imgs;
        if (window.debouncedSaveState) window.debouncedSaveState();
      }
    });
  }

  const pIdx = S.projects.findIndex(p => p.id === S.activeProject.id);
  if (pIdx !== -1) {
    S.projects[pIdx].anx1PdfName = file.name;
    if (!S.projects[pIdx].pdfData) S.projects[pIdx].pdfData = {};
    S.projects[pIdx].pdfData.anx1 = fileURL;
  }
  
  const iframe = document.getElementById('pdf-iframe');
  const previewSection = document.getElementById('pdf-preview-section');
  if (iframe && previewSection) {
    iframe.src = fileURL;
  }
  
  renderPdfUploadUIAnx1();
  toast('PDF uploaded and preview loaded!', 'success');
  event.target.value = '';
}

function closePDFPreview() {
  const iframe = document.getElementById('pdf-iframe');
  if (iframe) {
    if (iframe.src.startsWith('blob:')) {
      URL.revokeObjectURL(iframe.src);
    }
    iframe.src = 'about:blank';
  }
}

function downloadPdfAnx1() {
  if (!S.activeProject) {
    toast('Please select and open a project first.', 'warn');
    return;
  }
  if (!S.activeProject.anx1PdfName) {
    toast('No PDF has been uploaded for this project yet. Please upload a PDF first.', 'warn');
    return;
  }
  const a = document.createElement('a');
  a.href = S.activeProject.pdfData.anx1;
  a.download = S.activeProject.anx1PdfName;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

