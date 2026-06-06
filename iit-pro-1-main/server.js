const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8080;

// Start build.js in watch mode as a child process
console.log('Starting compilation watcher...');
const watcher = spawn('node', ['build.js', '--watch'], { stdio: 'inherit' });

watcher.on('error', (err) => {
  console.error('Failed to start build watcher:', err);
});

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

function readProjects() {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading projects.json:', err);
  }
  return [];
}

function writeProjects(projects) {
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing projects.json:', err);
    return false;
  }
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => { resolve(body); });
    req.on('error', (err) => { reject(err); });
  });
}

function deleteFileWithRetries(filePath, retries = 5, delay = 100) {
  return new Promise((resolve) => {
    function attempt(n) {
      if (!fs.existsSync(filePath)) {
        resolve(true);
        return;
      }
      try {
        fs.unlinkSync(filePath);
        console.log(`Successfully deleted file: ${filePath}`);
        resolve(true);
      } catch (err) {
        if (n > 0) {
          console.warn(`File ${filePath} locked, retrying deletion in ${delay}ms... (attempts left: ${n})`);
          setTimeout(() => attempt(n - 1), delay);
        } else {
          console.error(`Failed to delete file ${filePath} after multiple attempts:`, err);
          resolve(false);
        }
      }
    }
    attempt(retries);
  });
}

const server = http.createServer((req, res) => {
  const urlObj = req.url.split('?');
  const pathname = decodeURIComponent(urlObj[0]);
  const queryParams = new URLSearchParams(urlObj[1] || '');

  // 1. Handle API routes
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/projects') {
      if (req.method === 'GET') {
        const projects = readProjects();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(projects));
        return;
      } else if (req.method === 'POST') {
        readRequestBody(req).then(body => {
          try {
            const projects = JSON.parse(body);
            if (Array.isArray(projects)) {
              writeProjects(projects);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } else {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Invalid data format' }));
            }
          } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
          }
        }).catch(err => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        });
        return;
      }
    }

    if (pathname === '/api/upload-pdf' && req.method === 'POST') {
      readRequestBody(req).then(async body => {
        try {
          const { projectId, fileName, pdf, annexureId = 'anx3' } = JSON.parse(body);
          if (!projectId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Missing projectId' }));
            return;
          }

          if (fileName === null || pdf === null) {
            // Delete PDF file if exists
            const destPath = path.join(UPLOADS_DIR, `${projectId}_${annexureId}.pdf`);
            await deleteFileWithRetries(destPath);
            
            if (annexureId === 'anx3') {
              const legacyPath = path.join(UPLOADS_DIR, `${projectId}.pdf`);
              await deleteFileWithRetries(legacyPath);
            }
            // Update projects.json to clear PDF metadata
            const projects = readProjects();
            const pIdx = projects.findIndex(p => p.id == projectId);
            if (pIdx !== -1) {
              const fieldName = annexureId === 'anx3' ? 'annexure3PdfName' : `${annexureId}PdfName`;
              delete projects[pIdx][fieldName];
              if (annexureId === 'anx3') {
                delete projects[pIdx]['anx3PdfName'];
              }
              writeProjects(projects);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
          }

          if (!fileName || !pdf) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
            return;
          }

          // Ensure uploads directory exists
          if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
          }

          const fileBuffer = Buffer.from(pdf, 'base64');
          const destPath = path.join(UPLOADS_DIR, `${projectId}_${annexureId}.pdf`);
          fs.writeFileSync(destPath, fileBuffer);

          // Update projects.json
          const projects = readProjects();
          const pIdx = projects.findIndex(p => p.id == projectId);
          if (pIdx !== -1) {
            const fieldName = annexureId === 'anx3' ? 'annexure3PdfName' : `${annexureId}PdfName`;
            projects[pIdx][fieldName] = fileName;
            writeProjects(projects);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      }).catch(err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
      return;
    }

    if (pathname === '/api/download-pdf' && req.method === 'GET') {
      const projectId = queryParams.get('projectId');
      const annexureId = queryParams.get('annexureId') || 'anx3';
      const inline = queryParams.get('inline') === 'true';

      if (!projectId) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing projectId');
        return;
      }

      let filePath = path.join(UPLOADS_DIR, `${projectId}_${annexureId}.pdf`);

      // Fallback for old anx3 uploads that were saved as projectId.pdf
      if (annexureId === 'anx3' && !fs.existsSync(filePath)) {
        const oldFilePath = path.join(UPLOADS_DIR, `${projectId}.pdf`);
        if (fs.existsSync(oldFilePath)) {
          filePath = oldFilePath;
        }
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('PDF not found');
        return;
      }

      // Try to find the original filename from projects
      const projects = readProjects();
      const proj = projects.find(p => p.id == projectId);
      const fieldName = annexureId === 'anx3' ? 'annexure3PdfName' : `${annexureId}PdfName`;
      const originalName = proj ? (proj[fieldName] || proj['anx3PdfName'] || `${annexureId}.pdf`) : `${projectId}.pdf`;

      const headers = {
        'Content-Type': 'application/pdf'
      };

      if (inline) {
        headers['Content-Disposition'] = `inline; filename="${encodeURIComponent(originalName)}"`;
      } else {
        headers['Content-Disposition'] = `attachment; filename="${encodeURIComponent(originalName)}"`;
      }

      res.writeHead(200, headers);
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
    return;
  }

  // 2. Handle static files
  let filePath = pathname;
  if (filePath === '/') {
    filePath = '/index.html';
  }

  const fullPath = path.join(__dirname, filePath);

  // Basic security check to prevent directory traversal
  if (!fullPath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    
    const stream = fs.createReadStream(fullPath);
    stream.on('error', (streamErr) => {
      console.error(`Error reading file ${fullPath}:`, streamErr);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('\n==================================================');
  console.log(`🚀 Smart DSR Portal is running at:`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log('==================================================\n');
});

// Ensure compiler child process is killed when the server shuts down
process.on('SIGINT', () => {
  watcher.kill();
  process.exit();
});
process.on('SIGTERM', () => {
  watcher.kill();
  process.exit();
});
