/* =========================================================
   BENTA Q, SEE U — ADMIN AUTH
   Shared by the login page and every protected admin page.

   ⚠️  SECURITY NOTE
   The credentials below are a DEMO MOCK. Passwords must never
   be checked in the browser in production. Replace `attemptLogin`
   with a fetch() to your server, which must hash passwords
   (bcrypt/argon2) and return a short-lived token.
   ========================================================= */

const SESSION_KEY = 'bq_admin_session';

const DEMO_ADMIN = {
  email: 'admin@bentaqseeu.com',
  password: 'bentaq2026'
};

/**
 * Resolve with a session object on success; reject with a
 * user-facing Error on failure.
 */
async function attemptLogin(email, password) {
  // Simulated network delay so the spinner is visible
  await new Promise((resolve) => setTimeout(resolve, 600));

  // ---- REPLACE THIS BLOCK WITH A REAL BACKEND CALL ----
  const ok =
    email.trim().toLowerCase() === DEMO_ADMIN.email &&
    password === DEMO_ADMIN.password;

  if (!ok) throw new Error('Incorrect email or password.');

  return {
    email: DEMO_ADMIN.email,
    token: crypto.randomUUID(),
    issuedAt: Date.now()
  };
  // -----------------------------------------------------
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function getSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Call at the top of any protected page. Redirects if not signed in. */
function requireAdmin() {
  const session = getSession();
  if (!session) {
    location.replace('AdminLogin.html');
    return null;
  }
  return session;
}

/** Call on the login page so a signed-in admin skips straight to the dashboard. */
function redirectIfSignedIn() {
  if (getSession()) location.replace('AdminDashboard.html');
}

/* =========================================================
   LOGIN PAGE WIRING
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (!form) return; // we're not on the login page

  redirectIfSignedIn();

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('password-toggle');
  const errorBox = document.getElementById('login-error');
  const submitBtn = document.getElementById('signin-btn');
  const spinner = submitBtn.querySelector('.btn-spinner');
  const btnLabel = submitBtn.querySelector('.btn-label');

  // ----- Password visibility toggle -----
  toggleBtn.addEventListener('click', () => {
    const isShowing = passwordInput.type === 'text';
    const willShow = !isShowing;

    passwordInput.type = willShow ? 'text' : 'password';
    toggleBtn.classList.toggle('is-visible', willShow);
    toggleBtn.setAttribute('aria-label', willShow ? 'Hide password' : 'Show password');
  });

  // ----- Submit -----
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Client-side validation
    if (!email) return showError('Please enter your email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showError('Please enter a valid email address.');
    }
    if (!password) return showError('Please enter your password.');
    if (password.length < 6) return showError('Password must be at least 6 characters.');

    // Loading state
    submitBtn.disabled = true;
    spinner.hidden = false;
    btnLabel.textContent = 'Signing in…';

    try {
      const session = await attemptLogin(email, password);
      saveSession(session);
      location.replace('AdminDashboard.html');
    } catch (err) {
      showError(err.message || 'Sign in failed. Please try again.');
      submitBtn.disabled = false;
      spinner.hidden = true;
      btnLabel.textContent = 'Sign In';
      passwordInput.focus();
      passwordInput.select();
    }
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});