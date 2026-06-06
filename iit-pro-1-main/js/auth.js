/* ══════════════════════════════════════
   AUTH
 ══════════════════════════════════════ */
function switchAuthMode(mode) {
  const facultyTab = document.getElementById('tab-btn-faculty');
  const authorityTab = document.getElementById('tab-btn-authority');
  const sdlcTab = document.getElementById('tab-btn-sdlc');
  const facultyForm = document.getElementById('auth-form-faculty');
  const authorityForm = document.getElementById('auth-form-authority');
  const sdlcForm = document.getElementById('auth-form-sdlc');

  if (facultyTab && authorityTab && facultyForm && authorityForm) {
    facultyTab.classList.toggle('active', mode === 'faculty');
    authorityTab.classList.toggle('active', mode === 'authority');
    if (sdlcTab) sdlcTab.classList.toggle('active', mode === 'sdlc');
    
    facultyForm.classList.toggle('active', mode === 'faculty');
    authorityForm.classList.toggle('active', mode === 'authority');
    if (sdlcForm) sdlcForm.classList.toggle('active', mode === 'sdlc');
  }
  
  if (window.initLucide) initLucide();
}

function toggleSignUp(show) {
  const tabs = document.querySelector('.auth-tabs');
  const facultyForm = document.getElementById('auth-form-faculty');
  const authorityForm = document.getElementById('auth-form-authority');
  const sdlcForm = document.getElementById('auth-form-sdlc');
  const signupForm = document.getElementById('auth-form-signup');

  if (show) {
    if (tabs) tabs.style.display = 'none';
    if (facultyForm) facultyForm.classList.remove('active');
    if (authorityForm) authorityForm.classList.remove('active');
    if (sdlcForm) sdlcForm.classList.remove('active');
    if (signupForm) {
      signupForm.style.display = 'flex';
      signupForm.classList.add('active');
    }
  } else {
    if (tabs) tabs.style.display = 'flex';
    if (signupForm) {
      signupForm.style.display = 'none';
      signupForm.classList.remove('active');
    }
    switchAuthMode('faculty');
  }
}

async function doSdlcLogin() {
  const user = document.getElementById('auth-sdlc-user').value.trim();
  const pass = document.getElementById('auth-sdlc-pass').value;
  const err = document.getElementById('auth-sdlc-error');
  if (!user || !pass) {
    if (err) {
      err.style.display = 'block';
      err.textContent = 'Please fill all fields.';
    }
    return;
  }
  if (err) err.style.display = 'none';
  
  if (user === 'sdlc' && pass === 'sdlc123') {
    S.user = { name: 'SDLC Review Team', email: 'sdlc@iitropar.ac.in', role: 'sdlc' };
    S.role = 'sdlc';
    showSdlcScreen();
  } else {
    if (err) {
      err.style.display = 'block';
      err.textContent = 'Invalid credentials. Use sdlc / sdlc123.';
    }
  }
}

function showSdlcScreen() {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  const sdlcScreen = document.getElementById('screen-sdlc');
  if (sdlcScreen) sdlcScreen.classList.add('active');
  if (typeof initSdlcDashboard === 'function') {
    initSdlcDashboard();
  }
  if (window.initLucide) initLucide();
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const distEl = document.getElementById('login-district');
  const district = distEl ? distEl.value : 'ALL';
  const err = document.getElementById('login-error');
  if (!email || !pass) { err.style.display='block'; err.textContent='Please fill all fields.'; return; }
  err.style.display='none';
  
  try {
      const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: email, password: pass })
      });
      localStorage.setItem('dsr_token', data.token);
      
      const backendRole = data.role || 'ROLE_OFFICER';
      S.backendRole = backendRole;
      
      let uiRole = 'user';
      const roleSelect = document.getElementById('login-role');
      const selectedDropdownRole = roleSelect ? roleSelect.value : '';

      if (selectedDropdownRole.includes('Reviewer')) {
          uiRole = 'reviewer';
      } else if (selectedDropdownRole.includes('Administrator') || backendRole.includes('ADMIN') || backendRole.includes('DISTRICT_OWNER')) {
          uiRole = 'authority';
      } else if (backendRole.includes('REVIEWER')) {
          uiRole = 'reviewer';
      }
      
      S.user = { name: data.username, email: email, role: uiRole, district: district };
      S.role = uiRole;
      
      if (uiRole === 'authority') {
          showAppScreen();
      } else {
          showAppScreen();
          if (district && district !== 'ALL') {
              setTimeout(() => {
                  const filterDropdown = document.getElementById('dash-district-filter');
                  if (filterDropdown) {
                      filterDropdown.value = district;
                      if (typeof filterDashboardByDistrict === 'function') {
                          filterDashboardByDistrict(district);
                      }
                  }
              }, 100);
          }
      }
  } catch (error) {
      err.style.display='block'; 
      err.textContent = error.message || 'Login failed. Please check credentials.';
  }
}

function doAuthorityVerify() {
  const nicId = document.getElementById('auth-nic-id').value.trim();
  const pin = document.getElementById('auth-security-pin').value;
  const err = document.getElementById('auth-error');
  if (!nicId || !pin) {
    err.style.display = 'block';
    err.textContent = 'Please enter both NIC ID and Security PIN.';
    return;
  }
  err.style.display = 'none';
  // Demo Login verification - sets authority credentials
  S.user = { name: 'Dr. Suresh Verma', email: 'dmo@punjab.gov.in', role: 'authority' };
  S.role = 'authority';
  showAuthorityScreen();
}

function doAuthorityQuickLogin() {
  S.user = { name:'Dr. Suresh Verma', email:'dmo@punjab.gov.in', role:'authority' };
  S.role = 'authority';
  showAuthorityScreen();
}

function togglePinReveal() {
  const pinInput = document.getElementById('auth-security-pin');
  if (pinInput) {
    pinInput.type = pinInput.type === 'password' ? 'text' : 'password';
  }
}

async function doSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass = document.getElementById('signup-pass').value;
  const err = document.getElementById('signup-error');
  const ok = document.getElementById('signup-success');
  if (!name||!email||!pass) { err.style.display='block'; err.textContent='Please fill all required fields.'; return; }
  if (pass.length<6) { err.style.display='block'; err.textContent='Password must be at least 6 characters.'; return; }
  err.style.display='none'; 

  try {
      await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ fullName: name, username: email, email: email, password: pass })
      });
      ok.style.display='block'; 
      ok.textContent='Account created! You can now log in.';
      setTimeout(()=>switchAuthMode('faculty'),1500);
  } catch (error) {
      err.style.display='block'; 
      err.textContent = error.message || 'Signup failed.';
  }
}

function doLogout() {
  S.user=null; S.role='user';
  viewHistory = [];
  currentViewId = 'dashboard';
  const backBtn = document.getElementById('tb-back-btn');
  if (backBtn) backBtn.style.display = 'none';
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-auth').classList.add('active');
  switchAuthMode('faculty');
  if (typeof applyTheme === 'function') {
    applyTheme('light', false);
  }
  if (typeof updateDarkModeIcon === 'function') {
    updateDarkModeIcon();
  }
}

function showAppScreen() {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-app').classList.add('active');
  if (typeof initThemeFromStorage === 'function') {
    initThemeFromStorage();
  }
  if (typeof updateDarkModeIcon === 'function') updateDarkModeIcon();
  const init = S.user.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('sb-avatar').textContent = init;
  document.getElementById('sb-uname').textContent = S.user.name;
  document.getElementById('sb-urole').textContent = S.role==='admin'?'System Admin':S.role==='reviewer'?'Section Reviewer':'Report Coordinator';
  initApp();
  if (window.initLucide) initLucide();
}

function showAuthorityScreen() {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-authority').classList.add('active');
  document.getElementById('auth-user-label').textContent = S.user.name + ' · Authority';
  renderAuthorityReports();
  if (typeof initThemeFromStorage === 'function') {
    initThemeFromStorage();
  }
  if (typeof updateDarkModeIcon === 'function') updateDarkModeIcon();
  if (window.initLucide) initLucide();
}
