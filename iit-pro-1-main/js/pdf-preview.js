/* ══════════════════════════════════════
   PDF PREVIEW PANEL
   Split workspace for Front Matter,
   Chapters, and Plate Section.
══════════════════════════════════════ */
const pdfPreview = {
  scale: 1.0,
  currentView: null,
  panel: null,
  body: null,
  scrollEl: null,
  viewerEl: null,
  titleEl: null,
  zoomLabels: [],
  currentPage: 1,
  totalPages: 0,
  _scrollRaf: null,
  _textRefreshTimer: null,

  SECTION_TITLES: {
    'front-matter': 'PDF Preview',
    'chapters': 'PDF Preview',
    'plates': 'PDF Preview'
  },

  FM_ORDER: ['cover', 'toc', 'pref', 'ack', 'cert'],

  FM_LABELS: {
    cover: 'Cover Page',
    toc: 'Content Page',
    pref: 'Preface',
    ack: 'Acknowledgement',
    cert: 'Certificate of Compliance'
  },

  init() {
    this.panel = document.getElementById('pdf-preview-panel');
    if (!this.panel) return;
    
    // Auto-fix HTML layout issues by forcing panel into workspace
    const workspace = document.querySelector('.app-workspace');
    if (workspace && this.panel.parentElement !== workspace) {
      workspace.appendChild(this.panel);
    }
    
    this.body = this.panel.querySelector('.pdf-preview-body');
    this.scrollEl = document.getElementById('pdf-preview-scroll') || this.body;
    this.viewerEl = document.getElementById('pdf-preview-viewer');
    this.titleEl = document.getElementById('pdf-preview-title');
    this.zoomLabels = [
      document.getElementById('pdf-preview-zoom-lbl'),
      document.getElementById('pdf-preview-float-zoom-lbl')
    ].filter(Boolean);
    this.bindEvents();
    this.bindMobileTabs();
  },

  bindEvents() {
    const el = (id) => document.getElementById(id);
    const zoomIn = () => this.zoomIn();
    const zoomOut = () => this.zoomOut();

    el('pdf-preview-zoom-in')?.addEventListener('click', zoomIn);
    el('pdf-preview-zoom-out')?.addEventListener('click', zoomOut);
    el('pdf-preview-inner-zoom-in')?.addEventListener('click', zoomIn);
    el('pdf-preview-inner-zoom-out')?.addEventListener('click', zoomOut);
    el('pdf-preview-float-zoom-in')?.addEventListener('click', zoomIn);
    el('pdf-preview-float-zoom-out')?.addEventListener('click', zoomOut);

    el('pdf-preview-refresh')?.addEventListener('click', () => this.refresh());
    el('pdf-preview-fullscreen')?.addEventListener('click', () => this.fullScreen());
    el('pdf-preview-inner-fullscreen')?.addEventListener('click', () => this.fullScreen());
    el('pdf-preview-download')?.addEventListener('click', () => this.download());

    if (this.scrollEl) {
      this.scrollEl.addEventListener('scroll', () => {
        if (this._scrollRaf) cancelAnimationFrame(this._scrollRaf);
        this._scrollRaf = requestAnimationFrame(() => this.updateVisiblePage());
      });
    }
  },

  bindMobileTabs() {
    const tabs = document.getElementById('pdf-preview-mobile-tabs');
    if (!tabs) return;
    tabs.querySelectorAll('.pdf-preview-mobile-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        document.body.classList.remove('preview-mobile-tab-editor', 'preview-mobile-tab-preview');
        if (tab === 'preview') document.body.classList.add('preview-mobile-tab-preview');
        else document.body.classList.add('preview-mobile-tab-editor');
        tabs.querySelectorAll('.pdf-preview-mobile-tab').forEach(b => b.classList.toggle('active', b === btn));
      });
    });
  },

  show(viewId) {
    this.currentView = viewId;
    document.body.classList.add('preview-open');
    document.body.classList.add('preview-mobile-tab-editor');
    document.body.classList.remove('preview-mobile-tab-preview');
    if (this.panel) {
      this.panel.hidden = false;
      this.panel.classList.add('open');
    }
    const mobileTabs = document.getElementById('pdf-preview-mobile-tabs');
    if (mobileTabs) mobileTabs.setAttribute('aria-hidden', 'false');
    if (this.titleEl) this.titleEl.textContent = this.SECTION_TITLES[viewId] || 'PDF Preview';
    this.scale = 1.0;
    this.refresh();
    if (window.initLucide) initLucide();
  },

  hide() {
    this.currentView = null;
    document.body.classList.remove('preview-open', 'preview-mobile-tab-editor', 'preview-mobile-tab-preview');
    if (this.panel) {
      this.panel.classList.remove('open');
      this.panel.hidden = true;
      this.panel.style.transform = '';
    }
    const mobileTabs = document.getElementById('pdf-preview-mobile-tabs');
    if (mobileTabs) mobileTabs.setAttribute('aria-hidden', 'true');
    const fsTarget = this.viewerEl || this.panel;
    if (document.fullscreenElement === fsTarget) {
      document.exitFullscreen().catch(() => {});
    }
  },

  notifyUpdate(viewId) {
    if (this.currentView === viewId) {
      if (viewId === 'front-matter') {
        clearTimeout(this._textRefreshTimer);
        this._textRefreshTimer = setTimeout(() => this.refresh(), 180);
      } else {
        this.refresh();
      }
    }
  },

  refresh() {
    if (!this.body || !this.currentView) return;
    switch (this.currentView) {
      case 'front-matter': this.renderFrontMatter(); break;
      case 'chapters': this.renderChapters(); break;
      case 'plates': this.renderPlates(); break;
    }
    if (window.initLucide) initLucide();
  },

  /** Build a simple A4-style page image from title + body text */
  renderTextPageCanvas(title, bodyText, subtitle) {
    const canvas = document.createElement('canvas');
    const W = 620;
    const H = 880;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#0a2540';
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText(title, W / 2, 120);

    if (subtitle) {
      ctx.font = '12px Georgia, serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(subtitle, W / 2, 150);
    }

    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.font = '14px Georgia, serif';
    const margin = 56;
    const maxWidth = W - margin * 2;
    const words = (bodyText || '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);

    let y = 200;
    const lineHeight = 22;
    lines.forEach(l => {
      if (y > H - 80) return;
      ctx.fillText(l, margin, y);
      y += lineHeight;
    });

    return canvas.toDataURL('image/jpeg', 0.92);
  },

  renderCoverPageCanvas() {
    const fm = S.frontMatter || {};
    const canvas = document.createElement('canvas');
    const W = 620;
    const H = 880;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    const navy = '#0a2540';
    const accent = '#e07b00';

    ctx.strokeStyle = navy;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(W / 2, 100, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = navy;
    ctx.textAlign = 'center';
    ctx.font = '11px Georgia, serif';
    ctx.fillText('GOVERNMENT OF PUNJAB', W / 2, 160);

    ctx.font = 'bold 20px Georgia, serif';
    const title = (fm.title || 'District Survey Report').toUpperCase();
    this._wrapCenteredText(ctx, title, W / 2, 220, W - 80, 26);

    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = accent;
    ctx.fillText(`${(fm.district || 'District').toUpperCase()} DISTRICT`, W / 2, 310);

    ctx.fillStyle = navy;
    ctx.font = '13px Georgia, serif';
    ctx.fillText(`${fm.state || 'Punjab'} · ${fm.year || ''}`, W / 2, 340);

    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = '#475569';
    const prep = `Prepared by: ${fm.preparedBy || ''}`;
    this._wrapCenteredText(ctx, prep, W / 2, 420, W - 80, 18);
    const assist = `Assisted by: ${fm.assistedBy || ''}`;
    this._wrapCenteredText(ctx, assist, W / 2, 460, W - 80, 18);

    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = navy;
    ctx.fillText(fm.version || '', W / 2, H - 60);

    return canvas.toDataURL('image/jpeg', 0.92);
  },

  _wrapCenteredText(ctx, text, cx, startY, maxWidth, lineHeight) {
    const words = (text || '').split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    let y = startY;
    lines.forEach(l => {
      ctx.fillText(l, cx, y);
      y += lineHeight;
    });
  },

  getFrontMatterPages() {
    const pages = [];
    const pdfs = S.uploadedPDFs || {};

    this.FM_ORDER.forEach(type => {
      const sectionLabel = this.FM_LABELS[type] || type;
      const uploaded = pdfs[type];

      if (uploaded && uploaded.length) {
        uploaded.forEach((img, idx) => {
          pages.push({
            src: img,
            label: uploaded.length > 1 ? `${sectionLabel} — Page ${idx + 1}` : sectionLabel
          });
        });
        return;
      }

      if (type === 'cover') {
        pages.push({ src: this.renderCoverPageCanvas(), label: sectionLabel, generated: true });
      } else if (type === 'pref' && S.frontMatter && S.frontMatter.preface) {
        pages.push({
          src: this.renderTextPageCanvas('PREFACE', S.frontMatter.preface, 'District Survey Report'),
          label: sectionLabel,
          generated: true
        });
      } else if (type === 'ack' && S.frontMatter && S.frontMatter.acknowledgement) {
        pages.push({
          src: this.renderTextPageCanvas('ACKNOWLEDGEMENT', S.frontMatter.acknowledgement, 'District Survey Report'),
          label: sectionLabel,
          generated: true
        });
      }
    });

    return pages;
  },

  getChapterPages() {
    const pages = [];
    S.chapters.forEach((ch, i) => {
      const imgs = S.chapterPDFs && S.chapterPDFs[ch.id];
      if (imgs && imgs.length) {
        imgs.forEach((img, idx) => {
          pages.push({
            src: img,
            label: imgs.length > 1
              ? `Chapter ${i + 1} — Page ${idx + 1}`
              : `Chapter ${i + 1}: ${ch.name}`
          });
        });
      }
    });
    return pages;
  },

  getPlatePages() {
    const pages = [];
    S.plates.forEach((p, i) => {
      if (p.pages && p.pages.length) {
        p.pages.forEach((img, idx) => {
          pages.push({
            src: img,
            label: p.pages.length > 1
              ? `Plate ${i + 1} — Page ${idx + 1}`
              : `Plate ${i + 1}: ${p.name}`
          });
        });
      }
    });
    return pages;
  },

  renderFrontMatter() {
    this.renderPages(this.getFrontMatterPages());
  },

  renderChapters() {
    this.renderPages(this.getChapterPages());
  },

  renderPlates() {
    this.renderPages(this.getPlatePages());
  },

  renderPages(pages) {
    if (!this.body) return;
    if (!pages || !pages.length) {
      this.body.innerHTML = `
        <div class="pdf-preview-empty">
          <div class="pdf-preview-empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="pdf-preview-empty-title">No pages yet</div>
          <div class="pdf-preview-empty-sub">Upload PDFs on the left or fill in front matter fields to see a live combined preview here.</div>
        </div>`;
      this.totalPages = 0;
      this.currentPage = 0;
      this.updatePageIndicators();
      return;
    }

    this.body.innerHTML = pages.map((page, i) => {
      const src = typeof page === 'string' ? page : page.src;
      const label = typeof page === 'string' ? `Page ${i + 1}` : (page.label || `Page ${i + 1}`);
      const safeLabel = String(label).replace(/"/g, '&quot;');
      return `
        <div class="pdf-preview-page-wrap" data-page="${i + 1}">
          <img src="${src}" class="pdf-preview-page" alt="${safeLabel}" loading="lazy">
        </div>`;
    }).join('');

    this.totalPages = pages.length;
    this.currentPage = 1;
    this.applyScale();
    this.updatePageIndicators();
    requestAnimationFrame(() => this.updateVisiblePage());
  },

  updatePageIndicators() {
    const indicator = document.getElementById('pdf-preview-page-indicator');
    const floatPage = document.getElementById('pdf-preview-float-page');
    const cur = this.totalPages ? this.currentPage : 0;
    const total = this.totalPages;
    if (indicator) indicator.textContent = total ? `${cur} / ${total}` : '0 / 0';
    if (floatPage) floatPage.textContent = total ? `Page ${cur} of ${total}` : 'Page 0 of 0';
  },

  updateVisiblePage() {
    if (!this.scrollEl || !this.totalPages) return;
    const wraps = this.scrollEl.querySelectorAll('.pdf-preview-page-wrap');
    if (!wraps.length) return;
    const scrollMid = this.scrollEl.scrollTop + this.scrollEl.clientHeight / 2;
    let active = 1;
    wraps.forEach((wrap, idx) => {
      const top = wrap.offsetTop;
      const bottom = top + wrap.offsetHeight;
      if (scrollMid >= top && scrollMid < bottom) active = idx + 1;
    });
    if (active !== this.currentPage) {
      this.currentPage = active;
      this.updatePageIndicators();
    }
  },

  zoomIn() {
    this.scale = Math.min(this.scale + 0.25, 3);
    this.applyScale();
  },

  zoomOut() {
    this.scale = Math.max(this.scale - 0.25, 0.25);
    this.applyScale();
  },

  applyScale() {
    if (!this.body) return;
    const pct = `${Math.round(this.scale * 100)}%`;
    this.body.querySelectorAll('.pdf-preview-page').forEach(el => {
      el.style.width = `${this.scale * 100}%`;
      el.style.maxWidth = `${620 * this.scale}px`;
    });
    this.zoomLabels.forEach(el => { el.textContent = pct; });
  },

  fullScreen() {
    const target = this.viewerEl || this.panel;
    if (!target) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      target.requestFullscreen().catch(() => {});
    }
  },

  download() {
    const allPages = this.body ? this.body.querySelectorAll('.pdf-preview-page') : [];
    if (!allPages.length) {
      toast('No pages to download', 'info');
      return;
    }
    try {
      this.generateMergedPDF(allPages);
    } catch (e) {
      toast('Failed to generate merged PDF: ' + e.message, 'error');
    }
  },

  getDownloadFilename() {
    const dist = (S.frontMatter && S.frontMatter.district) || 'District';
    const yr = ((S.frontMatter && S.frontMatter.year) || 'year').replace('/', '-');
    const section = this.currentView === 'front-matter' ? 'front-matter'
      : this.currentView === 'chapters' ? 'chapters'
      : this.currentView === 'plates' ? 'plates' : 'preview';
    return `DSR-${dist}-${yr}-${section}.pdf`;
  },

  generateMergedPDF(images) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    images.forEach((img, i) => {
      if (i > 0) doc.addPage();
      const src = img.getAttribute('src');
      if (!src) return;
      try { doc.addImage(src, 'JPEG', 0, 0, W, H); }
      catch (e) { try { doc.addImage(src, 'PNG', 0, 0, W, H); } catch (_) {} }
    });
    const fname = this.getDownloadFilename();
    doc.save(fname);
    toast(`Merged PDF saved: ${fname}`, 'success');
  }
};

window.pdfPreview = pdfPreview;

window.addEventListener('DOMContentLoaded', () => {
  pdfPreview.init();
});
