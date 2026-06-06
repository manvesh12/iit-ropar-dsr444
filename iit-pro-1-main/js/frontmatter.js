/* ══════════════════════════════════════
   FRONT MATTER HANDLING
   ══════════════════════════════════════ */

// Ensure state property exists
if (!S.frontMatter) {
  S.frontMatter = {
    title: 'District Survey Report for Sand Mining',
    district: 'Jalandhar',
    state: 'Punjab',
    year: '2025-26',
    version: 'Final Draft',
    preparedBy: 'Sub-Divisional Committee, Jalandhar District',
    assistedBy: 'RSP Green Development and Laboratories Pvt. Ltd.',
    preface: 'This District Survey Report (DSR) for Jalandhar District has been prepared in compliance with the Enforcement and Monitoring Guidelines for Sand Mining (EMGSM) 2020. The report provides a comprehensive assessment of sand mining activities, river morphology, mineral deposits, replenishment studies, and transportation routes within the district.',
    acknowledgement: 'The Sub-Divisional Committee of Jalandhar District acknowledges the support of the Punjab State Government, Department of Geology and Mining, and all field surveyors who contributed to this report.'
  };
}

// Global functions matching inline HTML onclick/onchange handlers
function trigUp(id) {
  const el = document.getElementById(id);
  if (el) el.click();
}

function syncPreview() {
  console.log("Front Matter preview synced.");
}

/**
 * Converts a PDF file into an array of image data URLs using PDF.js.
 * @param {File} file 
 * @param {Function} callback 
 */
function renderPdfToImages(file, callback) {
  const fileReader = new FileReader();
  fileReader.onload = function () {
    const typedarray = new Uint8Array(this.result);
    if (typeof pdfjsLib === 'undefined') {
      callback(new Error('PDF.js library is not loaded on this page.'), null);
      return;
    }

    // Set up PDF.js worker if not already set
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }

    pdfjsLib.getDocument(typedarray).promise.then(function (pdf) {
      const pageImages = [];
      let pagesRendered = 0;
      const numPages = pdf.numPages;

      function renderPage(pageNum) {
        pdf.getPage(pageNum).then(function (page) {
          const viewport = page.getViewport({ scale: 1.5 }); // High quality preview scale
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };

          page.render(renderContext).promise.then(function () {
            // Convert page canvas to high-quality JPEG to minimize final PDF size
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            pageImages.push(imgData);
            pagesRendered++;
            if (pagesRendered === numPages) {
              callback(null, pageImages);
            } else {
              renderPage(pageNum + 1);
            }
          }).catch(err => callback(err, null));
        }).catch(err => callback(err, null));
      }

      renderPage(1);
    }).catch(err => callback(err, null));
  };
  fileReader.readAsArrayBuffer(file);
}

function handleFMUpload(e, type) {
  const f = e.target.files[0];
  if (!f) return;

  const el = document.getElementById(`fm-${type}-file`);
  if (el) {
    el.innerHTML = `
      <div class="file-item" style="margin-top:10px">
        <div class="file-icon" style="background:#fee2e2">📄</div>
        <div class="file-info">
          <div class="file-name">${f.name}</div>
          <div class="file-meta">${(f.size / 1024).toFixed(1)} KB</div>
        </div>
        <span class="badge badge-green">✓ Ready</span>
      </div>`;
  }

  // If PDF, convert pages to images and store in S.uploadedPDFs
  if (f.type === 'application/pdf') {
    renderPdfToImages(f, (err, imgs) => {
      if (err) {
        console.error(err);
        toast('⚠️ PDF render failed, falling back to basic preview', 'error');
        // Fallback: Store the blob URL
        const url = URL.createObjectURL(f);
        if (!S.uploadedPDFs) S.uploadedPDFs = {};
        S.uploadedPDFs[type] = [url];
        if (window.pdfPreview) window.pdfPreview.notifyUpdate('front-matter');
        if (window.debouncedSaveState) window.debouncedSaveState();
        return;
      }
      if (!S.uploadedPDFs) S.uploadedPDFs = {};
      S.uploadedPDFs[type] = imgs;
      toast(`📄 ${f.name} uploaded and processed successfully!`, 'success');
      if (window.pdfPreview) window.pdfPreview.notifyUpdate('front-matter');
      if (window.debouncedSaveState) window.debouncedSaveState();
    });
  } else {
    // Non-PDF files: store as object URL for preview
    const url = URL.createObjectURL(f);
    if (!S.uploadedPDFs) S.uploadedPDFs = {};
    S.uploadedPDFs[type] = [url];
    toast(`📄 ${f.name} uploaded`, 'success');
    if (window.pdfPreview) window.pdfPreview.notifyUpdate('front-matter');
    if (window.debouncedSaveState) window.debouncedSaveState();
  }
}

// Populate UI form inputs from state
function loadFrontMatter() {
  // Sync from S.activeProject if selected
  if (S.activeProject) {
    S.frontMatter.district = S.activeProject.district || S.frontMatter.district;
    S.frontMatter.year = S.activeProject.year || S.frontMatter.year;
    S.frontMatter.title = S.activeProject.title || S.frontMatter.title;
  }

  const f = S.frontMatter;

  // Hook up inputs directly with their explicit IDs
  const titleEl = document.getElementById('fm-title');
  if (titleEl) titleEl.value = f.title || '';

  const distEl = document.getElementById('fm-district');
  if (distEl) distEl.value = f.district || '';

  const yearEl = document.getElementById('fm-year');
  if (yearEl) yearEl.value = f.year || '';

  const prefaceEl = document.getElementById('fm-preface');
  if (prefaceEl) prefaceEl.value = f.preface || '';

  const stateEl = document.getElementById('fm-state');
  if (stateEl) stateEl.value = f.state || '';

  const versionEl = document.getElementById('fm-version');
  if (versionEl) versionEl.value = f.version || '';

  const prepEl = document.getElementById('fm-prepared-by');
  if (prepEl) prepEl.value = f.preparedBy || '';

  const assistEl = document.getElementById('fm-assisted-by');
  if (assistEl) assistEl.value = f.assistedBy || '';

  const ackEl = document.getElementById('fm-acknowledgement');
  if (ackEl) ackEl.value = f.acknowledgement || '';

  // Clean up any old upload previews when reloading a project
  ['cover', 'cert', 'toc', 'pref'].forEach(type => {
    const el = document.getElementById(`fm-${type}-file`);
    if (el) {
      if (S.uploadedPDFs && S.uploadedPDFs[type]) {
        el.innerHTML = `
          <div class="file-item" style="margin-top:10px">
            <div class="file-icon" style="background:#fee2e2">📄</div>
            <div class="file-info">
              <div class="file-name">Previously Uploaded ${type.toUpperCase()} PDF</div>
              <div class="file-meta">${S.uploadedPDFs[type].length} Page(s)</div>
            </div>
            <span class="badge badge-green">✓ Ready</span>
          </div>`;
      } else {
        el.innerHTML = '';
      }
    }
  });
}

// Sync back changes in UI fields to state
function bindFrontMatterEvents() {
  const notifyFmPreview = () => {
    if (window.pdfPreview) window.pdfPreview.notifyUpdate('front-matter');
  };

  const titleEl = document.getElementById('fm-title');
  if (titleEl) {
    titleEl.addEventListener('input', (e) => {
      S.frontMatter.title = e.target.value;
      if (S.activeProject) S.activeProject.title = e.target.value;
      notifyFmPreview();
    });
  }

  const distEl = document.getElementById('fm-district');
  if (distEl) {
    distEl.addEventListener('input', (e) => {
      S.frontMatter.district = e.target.value;
      // Sync with topbar and active project
      const topBadge = document.getElementById('tb-district-badge');
      if (topBadge) topBadge.textContent = e.target.value;
      if (S.activeProject) S.activeProject.district = e.target.value;
      notifyFmPreview();
    });
  }

  const yearEl = document.getElementById('fm-year');
  if (yearEl) {
    yearEl.addEventListener('input', (e) => {
      S.frontMatter.year = e.target.value;
      if (S.activeProject) S.activeProject.year = e.target.value;
      notifyFmPreview();
    });
  }

  const prefaceEl = document.getElementById('fm-preface');
  if (prefaceEl) {
    prefaceEl.addEventListener('input', (e) => {
      S.frontMatter.preface = e.target.value;
      notifyFmPreview();
    });
  }

  const stateEl = document.getElementById('fm-state');
  if (stateEl) {
    stateEl.addEventListener('input', (e) => {
      S.frontMatter.state = e.target.value;
      notifyFmPreview();
    });
  }

  const versionEl = document.getElementById('fm-version');
  if (versionEl) {
    versionEl.addEventListener('input', (e) => {
      S.frontMatter.version = e.target.value;
      notifyFmPreview();
    });
  }

  const prepEl = document.getElementById('fm-prepared-by');
  if (prepEl) {
    prepEl.addEventListener('input', (e) => {
      S.frontMatter.preparedBy = e.target.value;
      notifyFmPreview();
    });
  }

  const assistEl = document.getElementById('fm-assisted-by');
  if (assistEl) {
    assistEl.addEventListener('input', (e) => {
      S.frontMatter.assistedBy = e.target.value;
      notifyFmPreview();
    });
  }

  const ackEl = document.getElementById('fm-acknowledgement');
  if (ackEl) {
    ackEl.addEventListener('input', (e) => {
      S.frontMatter.acknowledgement = e.target.value;
      notifyFmPreview();
    });
  }
}

// Hook into DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  // Bind inputs
  bindFrontMatterEvents();

  // Hook loadFrontMatter to openProject using async/await to prevent race conditions
  const originalOpenProject = window.openProject;
  if (typeof originalOpenProject === 'function') {
    window.openProject = async function (id) {
      await originalOpenProject(id);
      loadFrontMatter();
    };
  }

  // Hook loadFrontMatter to showView
  const originalShowView = window.showView;
  if (typeof originalShowView === 'function') {
    window.showView = function (id, btn, push) {
      originalShowView(id, btn, push);
      if (id === 'front-matter') {
        loadFrontMatter();
      }
    };
  }
});
