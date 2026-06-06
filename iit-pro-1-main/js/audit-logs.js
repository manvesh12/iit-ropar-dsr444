async function loadAuditLogs() {
  try {
    const logs = await apiFetch('/api/reports/audit-logs');
    const tbody = document.getElementById('audit-logs-tbody');
    
    
    if (!logs || logs.length === 0) {
      const emptyHtml = '<tr><td colspan="5" style="text-align: center; padding: 20px;">No audit logs found.</td></tr>';
      const tb1 = document.getElementById('audit-logs-tbody');
      const tb2 = document.getElementById('auth-audit-logs-tbody');
      if (tb1) tb1.innerHTML = emptyHtml;
      if (tb2) tb2.innerHTML = emptyHtml;
      return;
    }
    
    let html = '';
    logs.forEach(log => {
      const date = new Date(log.performedAt).toLocaleString();
      
      let badgeColor = '#6b7280';
      if (log.action === 'APPROVE') badgeColor = '#10b981';
      else if (log.action === 'REJECT') badgeColor = '#ef4444';
      else if (log.action === 'RETURN') badgeColor = '#f59e0b';
      else if (log.action === 'FORWARD' || log.action === 'SUBMIT') badgeColor = '#3b82f6';
      
      html += `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 12px; font-size: 13px;">${date}</td>
          <td style="padding: 12px; font-weight: 500;">${log.projectName}</td>
          <td style="padding: 12px;">${log.performedBy}</td>
          <td style="padding: 12px;">
            <span style="background: ${badgeColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${log.action}</span>
          </td>
          <td style="padding: 12px; color: var(--text-soft); font-size: 13px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${log.remarks || ''}">
            ${log.remarks || '-'}
          </td>
        </tr>
      `;
    });
    
    
  const tb1 = document.getElementById('audit-logs-tbody');
  const tb2 = document.getElementById('auth-audit-logs-tbody');
  if (tb1) tb1.innerHTML = html;
  if (tb2) tb2.innerHTML = html;

  } catch (err) {
    console.error('Failed to load audit logs:', err);
    toast('Error loading audit logs', 'error');
  }
}

// Intercept showView to load audit logs when opened
const originalShowView = window.showView;
window.showView = function(id, btn, push) {
  if (id === 'audit-logs') {
    loadAuditLogs();
  }
  
  if (originalShowView) {
    originalShowView(id, btn, push);
  }
};
