// api.js - Centralized Backend Communication

var API_BASE_URL = 'http://localhost:8080/api';

async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('dsr_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        var bodyText = '';
        try { bodyText = await response.text(); } catch (e) {}
        var data = {};
        try { data = JSON.parse(bodyText); } catch (e) {}

        if (!response.ok) {
            var msg = data.message || data.error || '';
            if (!msg && bodyText && !bodyText.startsWith('{')) msg = bodyText.slice(0, 200);
            if (!msg) msg = 'HTTP ' + response.status + ' ' + response.statusText;
            var prefix = !localStorage.getItem('dsr_token') ? 'Not logged in — ' : '';
            
            var err = new Error(prefix + msg);
            if (response.status === 409 && data.warning) {
                err.isWarning = true;
                err.warningData = data;
            }
            throw err;
        }
        return data;
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

async function apiUploadFile(file) {
    const token = localStorage.getItem('dsr_token');
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            body: formData,
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            var bodyText = '';
            try { bodyText = await response.text(); } catch (e) {}
            var errData = {};
            try { errData = JSON.parse(bodyText); } catch (e) {}
            var msg = errData.message || errData.error || '';
            if (!msg && bodyText && !bodyText.startsWith('{')) msg = bodyText.slice(0, 200);
            if (!msg) msg = 'HTTP ' + response.status + ' ' + response.statusText;
            var prefix = !localStorage.getItem('dsr_token') ? 'Not logged in — ' : '';
            throw new Error(prefix + msg);
        }
        return data;
    } catch (error) {
        console.error("API Upload Error:", error);
        throw error;
    }
}

async function apiSubmitWorkflowAction(reportId, action, remarks) {
    return apiFetch(`/reports/${reportId}/workflow`, {
        method: 'POST',
        body: JSON.stringify({ action, remarks })
    });
}

async function apiFetchReportHistory(reportId) {
    return apiFetch(`/reports/${reportId}/history`, {
        method: 'GET'
    });
}
