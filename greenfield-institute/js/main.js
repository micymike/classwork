/* ==============================================================
   Greenfield Institute - Course Registration System
   Client-side application logic
   ============================================================== */

// ---- State -------------------------------------------------------
let currentUser = null;
let loginCarouselTimer = null;
let registerCarouselTimer = null;

// ---- DOM References ----------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const views = {
    login:    document.getElementById('view-login'),
    register: document.getElementById('view-register'),
    student:  document.getElementById('view-student'),
    admin:    document.getElementById('view-admin'),
};

const nav     = document.getElementById('main-nav');
const modal   = document.getElementById('modal-overlay');
const modalContent = document.getElementById('modal-content');

// ---- API Helper --------------------------------------------------
async function api(action, data = {}) {
    data.action = action;
    const res = await fetch('php/api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    const json = await res.json();

    if (res.status === 401 && currentUser) {
        setUser(null);
        showView('login');
        showAlert('loginError', 'Your session has expired. Please log in again.', 'error');
        throw new Error(json.error);
    }

    if (!res.ok) {
        throw new Error(json.error || 'An unexpected error occurred.');
    }

    return json;
}

// ---- Alert Helper ------------------------------------------------
function showAlert(id, message, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = message;
    el.className = `alert alert-${type}`;
    el.classList.remove('hidden');

    if (type === 'success') {
        setTimeout(() => {
            el.classList.add('hidden');
        }, 5000);
    }
}

function clearAlert(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

// ---- View Management ---------------------------------------------
function showView(name) {
    Object.keys(views).forEach(k => {
        views[k].classList.remove('active');
    });
    if (views[name]) views[name].classList.add('active');
}

const headerEl = document.getElementById('mainHeader');

function setUser(user) {
    currentUser = user;
    if (headerEl) headerEl.style.display = user ? '' : 'none';
    renderNav();
}

// ---- Navigation --------------------------------------------------
function renderNav() {
    if (!currentUser) {
        nav.innerHTML = `
            <button class="btn btn-ghost btn-sm" onclick="showView('login')">Log In</button>
            <button class="btn btn-primary btn-sm" onclick="showView('register')">Register</button>
        `;
        return;
    }

    const initial = (currentUser.full_name || currentUser.username).charAt(0).toUpperCase();

    const streak = currentUser.current_streak || 0;

    nav.innerHTML = `
        <div class="nav-streak" title="Longest streak: ${currentUser.longest_streak || 0} days" onclick="showStreakPopup()">
            <svg class="streak-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span class="streak-count">${streak}</span>
        </div>
        <div class="nav-user" onclick="showProfile()" title="Edit profile" style="cursor:pointer">
            <span class="avatar">${initial}</span>
            <div>
                <div class="user-name">${escapeHtml(currentUser.full_name)}</div>
                <div class="user-role">${currentUser.role}</div>
            </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Log Out</button>
    `;
}

function showStreakPopup() {
    const s = currentUser;
    if (!s) return;
    const current = s.current_streak || 0;
    const longest = s.longest_streak || 0;

    modalContent.innerHTML = `
        <div style="text-align:center;padding:8px 0">
            <div style="font-size:3rem;margin-bottom:8px">🔥</div>
            <h2 style="font-size:1.5rem;font-weight:800;color:var(--emerald-700);font-style:normal;margin-bottom:2px">${current}-Day Streak</h2>
            <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:16px">Keep learning every day to maintain your streak!</p>
            <div style="display:flex;gap:24px;justify-content:center">
                <div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--emerald-500)">${current}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Current</div>
                </div>
                <div style="width:1px;background:var(--emerald-100)"></div>
                <div>
                    <div style="font-size:1.8rem;font-weight:800;color:var(--emerald-500)">${longest}</div>
                    <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px">Longest</div>
                </div>
            </div>
            <p style="margin-top:16px;font-size:0.8rem;color:var(--text-muted)">Viewing course details counts as daily activity.</p>
        </div>
    `;
    modalContent.className = 'modal';
    modal.classList.remove('hidden');
}

// ---- Logout ------------------------------------------------------
async function handleLogout() {
    try {
        await api('logout');
    } catch (_) { /* ignore */ }
    setUser(null);
    renderLoginView();
    showView('login');
}

// ---- Escape HTML -------------------------------------------------
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ================================================================
// LOGIN VIEW
// ================================================================

function renderLoginView() {
    if (loginCarouselTimer)    { clearInterval(loginCarouselTimer);    loginCarouselTimer    = null; }
    if (registerCarouselTimer) { clearInterval(registerCarouselTimer); registerCarouselTimer = null; }

    const carouselImages = [
        'https://images.unsplash.com/photo-1562774053-701939374585?w=900&h=800&fit=crop',
        'https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=900&h=800&fit=crop',
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&h=800&fit=crop',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&h=800&fit=crop',
    ];

    const carouselQuotes = [
        { text: 'Empowering minds, shaping futures since 1985', author: '— Greenfield Institute' },
        { text: 'Where knowledge meets opportunity',             author: '— Dr. Sarah Mitchell, President' },
        { text: 'Building the leaders of tomorrow',              author: '— Academic Excellence Division' },
        { text: 'Innovation starts here',                        author: '— Greenfield Research Center' },
    ];

    views.login.innerHTML = `
        <div class="split-layout">
            <div class="split-hero" id="splitHero">
                <div class="carousel">
                    ${carouselImages.map((img, i) => `
                        <div class="carousel-slide${i === 0 ? ' active' : ''}" style="background-image:url('${img}')" data-index="${i}"></div>
                    `).join('')}
                    <div class="carousel-overlay">
                        <div class="carousel-overlay-content">
                            <div class="carousel-badge">Since 1985</div>
                            <h2 class="carousel-title" id="carouselTitle">${carouselQuotes[0].text}</h2>
                            <p class="carousel-author" id="carouselAuthor">${carouselQuotes[0].author}</p>
                        </div>
                    </div>
                    <div class="carousel-gradient"></div>
                    <div class="carousel-dots">
                        ${carouselImages.map((_, i) => `
                            <span class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="split-form">
                <div class="login-brand">
                    <div class="login-brand-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 .6.4 1 1 1h3"/><path d="M18 12v5c0 .6-.4 1-1 1h-3"/></svg>
                    </div>
                    <span>Greenfield Institute</span>
                </div>
                <div class="login-card">
                    <h2>Welcome back</h2>
                    <p class="login-subtitle">Sign in to manage your courses.</p>
                    <div id="loginError" class="alert hidden"></div>
                    <form id="loginForm" onsubmit="handleLogin(event)">
                        <div class="form-group">
                            <label for="loginUsername">Username or Email</label>
                            <input type="text" id="loginUsername" class="form-control"
                                   placeholder="jdoe" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label for="loginPassword">Password</label>
                            <input type="password" id="loginPassword" class="form-control"
                                   placeholder="········" required autocomplete="current-password">
                        </div>
                        <button type="submit" class="btn btn-primary btn-full" id="loginBtn">
                            Sign In
                        </button>
                    </form>
                    <div class="login-footer">
                        Don't have an account?
                        <a onclick="showView('register'); renderRegisterView()">Create one</a>
                    </div>
                </div>
                <p class="login-copy">&copy; 2026 Greenfield Institute. All rights reserved.</p>
            </div>
        </div>
    `;

    // ---- Carousel engine ----
    const slides = views.login.querySelectorAll('.carousel-slide');
    const dots   = views.login.querySelectorAll('.carousel-dot');
    const title  = document.getElementById('carouselTitle');
    const author = document.getElementById('carouselAuthor');
    let idx = 0;

    function goTo(n) {
        slides.forEach((el, i) => el.classList.toggle('active', i === n));
        dots.forEach((el, i)   => el.classList.toggle('active', i === n));
        title.textContent  = carouselQuotes[n].text;
        author.textContent = carouselQuotes[n].author;
        idx = n;
    }

    function next() { goTo((idx + 1) % slides.length); }

    function resetTimer() {
        if (loginCarouselTimer) clearInterval(loginCarouselTimer);
        loginCarouselTimer = setInterval(next, 4800);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            goTo(parseInt(dot.dataset.index));
            resetTimer();
        });
    });

    resetTimer();
}

async function handleLogin(e) {
    e.preventDefault();
    clearAlert('loginError');

    const btn = document.getElementById('loginBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> Signing in…';

    try {
        const data = await api('login', {
            username: document.getElementById('loginUsername').value.trim(),
            password: document.getElementById('loginPassword').value,
        });
        setUser(data.user);
        enterDashboard(data.user);
    } catch (err) {
        showAlert('loginError', err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Sign In';
    }
}

// ================================================================
// REGISTER VIEW
// ================================================================

function renderRegisterView() {
    if (registerCarouselTimer) { clearInterval(registerCarouselTimer); registerCarouselTimer = null; }
    if (loginCarouselTimer)    { clearInterval(loginCarouselTimer);    loginCarouselTimer    = null; }

    const carouselImages = [
        'https://images.unsplash.com/photo-1523050854058-8df90110c7f1?w=900&h=800&fit=crop',
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=900&h=800&fit=crop',
        'https://images.unsplash.com/photo-1562774053-701939374585?w=900&h=800&fit=crop',
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&h=800&fit=crop',
    ];

    const carouselQuotes = [
        { text: 'Every expert was once a beginner',                author: '— Greenfield Institute' },
        { text: 'Your journey to excellence starts today',          author: '— Office of Admissions' },
        { text: 'Learn without limits, grow without boundaries',    author: '— Academic Affairs' },
        { text: 'Join a community of dreamers and achievers',       author: '— Student Life' },
    ];

    views.register.innerHTML = `
        <div class="split-layout">
            <div class="split-hero" id="splitHero">
                <div class="carousel">
                    ${carouselImages.map((img, i) => `
                        <div class="carousel-slide${i === 0 ? ' active' : ''}" style="background-image:url('${img}')" data-index="${i}"></div>
                    `).join('')}
                    <div class="carousel-overlay">
                        <div class="carousel-overlay-content">
                            <div class="carousel-badge">Begin Your Journey</div>
                            <h2 class="carousel-title" id="regCarouselTitle">${carouselQuotes[0].text}</h2>
                            <p class="carousel-author" id="regCarouselAuthor">${carouselQuotes[0].author}</p>
                        </div>
                    </div>
                    <div class="carousel-gradient"></div>
                    <div class="carousel-dots">
                        ${carouselImages.map((_, i) => `
                            <span class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="split-form">
                <div class="login-brand">
                    <div class="login-brand-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <span>Greenfield Institute</span>
                </div>
                <div class="login-card">
                    <h2>Create Account</h2>
                    <p class="login-subtitle">Join Greenfield Institute's learning community.</p>
                    <div id="registerError" class="alert hidden"></div>
                    <form id="registerForm" onsubmit="handleRegister(event)">
                        <div class="form-group">
                            <label for="regFullName">Full Name</label>
                            <input type="text" id="regFullName" class="form-control"
                                   placeholder="John Doe" required>
                        </div>
                        <div class="form-group">
                            <label for="regUsername">Username</label>
                            <input type="text" id="regUsername" class="form-control"
                                   placeholder="jdoe" required autocomplete="username">
                        </div>
                        <div class="form-group">
                            <label for="regEmail">Email</label>
                            <input type="email" id="regEmail" class="form-control"
                                   placeholder="jdoe@greenfield.edu" required autocomplete="email">
                        </div>
                        <div class="form-group">
                            <label for="regPassword">Password (min 8 characters)</label>
                            <input type="password" id="regPassword" class="form-control"
                                   placeholder="········" required autocomplete="new-password" minlength="8">
                        </div>
                        <button type="submit" class="btn btn-primary btn-full" id="registerBtn">
                            Create Account
                        </button>
                    </form>
                    <div class="login-footer">
                        Already have an account?
                        <a onclick="showView('login'); renderLoginView()">Sign in</a>
                    </div>
                </div>
                <p class="login-copy">&copy; 2026 Greenfield Institute. All rights reserved.</p>
            </div>
        </div>
    `;

    // ---- Carousel engine ----
    const slides = views.register.querySelectorAll('.carousel-slide');
    const dots   = views.register.querySelectorAll('.carousel-dot');
    const title  = document.getElementById('regCarouselTitle');
    const author = document.getElementById('regCarouselAuthor');
    let idx = 0;

    function goTo(n) {
        slides.forEach((el, i) => el.classList.toggle('active', i === n));
        dots.forEach((el, i)   => el.classList.toggle('active', i === n));
        title.textContent  = carouselQuotes[n].text;
        author.textContent = carouselQuotes[n].author;
        idx = n;
    }

    function next() { goTo((idx + 1) % slides.length); }

    function resetTimer() {
        if (registerCarouselTimer) clearInterval(registerCarouselTimer);
        registerCarouselTimer = setInterval(next, 4800);
    }

    dots.forEach(dot => {
        dot.addEventListener('click', () => {
            goTo(parseInt(dot.dataset.index));
            resetTimer();
        });
    });

    resetTimer();
}

async function handleRegister(e) {
    e.preventDefault();
    clearAlert('registerError');

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-sm"></span> Creating account…';

    try {
        const data = await api('register', {
            full_name: document.getElementById('regFullName').value.trim(),
            username:  document.getElementById('regUsername').value.trim(),
            email:     document.getElementById('regEmail').value.trim(),
            password:  document.getElementById('regPassword').value,
        });
        setUser(data.user);
        enterDashboard(data.user);
    } catch (err) {
        showAlert('registerError', err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Create Account';
    }
}

// ================================================================
// DASHBOARD ENTRY
// ================================================================

function enterDashboard(user) {
    if (user.role === 'admin') {
        renderAdminView();
        showView('admin');
    } else {
        renderStudentView();
        showView('student');
    }
}

// ---- Pagination Helper ------------------------------------------
function renderPagination(current, total, pageFn, searchFn) {
    if (total <= 1) return '';
    let html = '<div class="pagination">';

    html += `<button class="btn btn-ghost btn-sm pag-prev" onclick="${pageFn}(${current - 1})" ${current <= 1 ? 'disabled' : ''}>← Prev</button>`;
    html += '<div class="pag-pages">';
    for (let i = 1; i <= total; i++) {
        if (i === current) {
            html += `<span class="pag-page active">${i}</span>`;
        } else {
            html += `<button class="pag-page" onclick="${pageFn}(${i})">${i}</button>`;
        }
    }
    html += '</div>';
    html += `<button class="btn btn-ghost btn-sm pag-next" onclick="${pageFn}(${current + 1})" ${current >= total ? 'disabled' : ''}>Next →</button>`;
    html += '</div>';
    return html;
}

// ================================================================
// STUDENT VIEW
// ================================================================

function renderStudentView() {
    views.student.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-streak">
                <div class="streak-card" onclick="showStreakPopup()">
                    <div class="streak-card-left">
                        <svg class="streak-icon-lg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                        <div>
                            <div class="streak-label">Learning Streak</div>
                            <div class="streak-sub">Keep going! View courses daily.</div>
                        </div>
                    </div>
                    <div class="streak-card-right">
                        <span class="streak-big">${currentUser.current_streak || 0}</span>
                        <span class="streak-unit">days</span>
                    </div>
                </div>
            </div>
            <div class="dashboard-full">
                <div class="card">
                    <div class="card-header">
                        <h2>Available Courses</h2>
                    </div>
                    <div class="search-bar">
                        <input type="text" id="courseSearch" class="form-control"
                               placeholder="Search by code, title, or instructor…"
                               oninput="coursePage=1; loadCourses()">
                        <button class="btn btn-primary" onclick="coursePage=1; loadCourses()">Search</button>
                    </div>
                    <div id="courseCatalog"><div class="spinner"></div></div>
                </div>
            </div>
            <div class="dashboard-full">
                <div class="card">
                    <div class="card-header">
                        <h2>My Enrollments</h2>
                    </div>
                    <div id="myEnrollments"><div class="spinner"></div></div>
                </div>
            </div>
        </div>
    `;

    loadCourses();
    loadMyEnrollments();
}

let coursePage = 1;

async function loadCourses(page) {
    if (page) coursePage = page;
    const container = document.getElementById('courseCatalog');
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const search = document.getElementById('courseSearch')?.value || '';
        const data   = await api('get_courses', { search, page: coursePage, per_page: 6 });

        if (data.courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No courses found.</p>
                    <p class="sub">Try adjusting your search criteria.</p>
                </div>
            `;
            return;
        }

        let html = `<div class="course-grid">${
            data.courses.map(c => buildCourseCard(c, false)).join('')
        }</div>`;
        html += renderPagination(data.page, data.pages, 'loadCourses');

        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
}

async function loadMyEnrollments() {
    const container = document.getElementById('myEnrollments');
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const data = await api('get_my_courses');

        if (data.courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>You are not enrolled in any courses.</p>
                    <p class="sub">Browse the catalog above and register for courses.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `<div class="course-grid">${
            data.courses.map(c => buildCourseCard(c, true)).join('')
        }</div>`;
    } catch (err) {
        container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
}

function buildCourseCard(course, enrolled) {
    const pct     = Math.min(100, Math.round((course.enrolled / course.capacity) * 100));
    const full    = course.enrolled >= course.capacity;
    const fillCls = full ? 'full' : (pct >= 80 ? 'warning' : '');

    return `
        <div class="course-card">
            <div class="course-code">${escapeHtml(course.code)} · ${course.credits} cr.</div>
            <div class="course-title">${escapeHtml(course.title)}</div>
            <div class="course-desc">${escapeHtml(course.description || '')}</div>
            <div class="course-meta">
                <span class="course-meta-item"><strong>Instructor:</strong> ${escapeHtml(course.instructor)}</span>
                <span class="course-meta-item"><strong>Schedule:</strong> ${escapeHtml(course.schedule)}</span>
                <span class="course-meta-item"><strong>Capacity:</strong> ${course.enrolled} / ${course.capacity}</span>
            </div>
            <div class="course-capacity-bar">
                <div class="course-capacity-fill ${fillCls}" style="width:${pct}%"></div>
            </div>
            <div class="course-card-actions">
                ${enrolled
                    ? `
                    <button class="btn btn-primary btn-sm" onclick="showCourseDetail(${course.id})">View Course</button>
                    <button class="btn btn-danger btn-sm" onclick="dropCourse(${course.id})">Drop</button>
                    `
                    : (full
                        ? `<button class="btn btn-secondary btn-sm btn-full" disabled>Full</button>`
                        : `<button class="btn btn-primary btn-sm btn-full" onclick="enrollCourse(${course.id})">Register</button>`)
                }
            </div>
        </div>
    `;
}

async function enrollCourse(courseId) {
    try {
        const data = await api('enroll', { course_id: courseId });
        showAlertMessage(data.message, 'success');
        loadCourses();
        loadMyEnrollments();
    } catch (err) {
        showAlertMessage(err.message, 'error');
    }
}

async function dropCourse(courseId) {
    if (!confirm('Are you sure you want to drop this course?')) return;

    try {
        const data = await api('drop', { course_id: courseId });
        showAlertMessage(data.message, 'success');
        loadCourses();
        loadMyEnrollments();
    } catch (err) {
        showAlertMessage(err.message, 'error');
    }
}

// ================================================================
// PROFILE MODAL
// ================================================================

function showProfile() {
    const u = currentUser;
    if (!u) return;

    modalContent.innerHTML = `
        <button class="modal-close-btn" onclick="closeModal()">&times;</button>
        <div style="padding:4px 0">
            <h2 style="font-size:1.25rem;font-weight:700;color:var(--emerald-700);margin-bottom:16px;font-style:normal">Edit Profile</h2>
            <div id="profileError" class="alert hidden"></div>
            <form id="profileForm" onsubmit="handleUpdateProfile(event)">
                <div class="form-group">
                    <label for="profName">Full Name</label>
                    <input type="text" id="profName" class="form-control" value="${escapeHtml(u.full_name || '')}" required>
                </div>
                <div class="form-group">
                    <label for="profEmail">Email</label>
                    <input type="email" id="profEmail" class="form-control" value="${escapeHtml(u.email || '')}" required>
                </div>
                <hr style="border:none;border-top:1px solid rgba(0,0,0,0.06);margin:16px 0">
                <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:12px">Leave blank to keep current password.</p>
                <div class="form-group">
                    <label for="profCurPw">Current Password</label>
                    <input type="password" id="profCurPw" class="form-control" placeholder="········" autocomplete="current-password">
                </div>
                <div class="form-group">
                    <label for="profNewPw">New Password (min 8 characters)</label>
                    <input type="password" id="profNewPw" class="form-control" placeholder="········" autocomplete="new-password">
                </div>
                <div class="modal-actions" style="border-top:none;padding-top:0">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="profileBtn">Save Changes</button>
                </div>
            </form>
        </div>
    `;
    modalContent.className = 'modal';
    modal.classList.remove('hidden');
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    clearAlert('profileError');

    const btn = document.getElementById('profileBtn');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
        const data = await api('update_profile', {
            full_name:        document.getElementById('profName').value.trim(),
            email:            document.getElementById('profEmail').value.trim(),
            current_password: document.getElementById('profCurPw').value,
            new_password:     document.getElementById('profNewPw').value,
        });
        setUser(data.user);
        closeModal();
        showAlertMessage('Profile updated successfully.', 'success');
    } catch (err) {
        showAlert('profileError', err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
}

// ================================================================
// COURSE DETAIL MODAL
// ================================================================

const courseResources = {
    CS101: {
        youtube: '8mAITcNt710',
        playlist: 'PL8dPuuaLjXtNlUrzyH5r6jN9ulIgZBpdo',
        playlistLabel: 'CrashCourse Computer Science',
        external: 'https://www.khanacademy.org/computing/computer-science',
        externalLabel: 'Khan Academy — Computer Science',
    },
    MATH201: {
        youtube: 'WUvTyaaNkzM',
        playlist: 'PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
        playlistLabel: '3Blue1Brown — Essence of Calculus',
        external: 'https://www.khanacademy.org/math/calculus-2',
        externalLabel: 'Khan Academy — Calculus II',
    },
    ENG101: {
        youtube: 'OiD9FbFhR3A',
        playlist: 'PL8dPuuaLjXtM_LPcEKvF6qF1eWHOdrz-6',
        playlistLabel: 'CrashCourse English Literature',
        external: 'https://www.coursera.org/learn/academic-english',
        externalLabel: 'Coursera — Academic English',
    },
    PHY101: {
        youtube: 'ZIHhHAiMQbk',
        playlist: 'PLybgPDzRHBajLgGxJZ1mMvSgPvXjM2YjV',
        playlistLabel: 'Physics Lectures',
        external: 'https://www.khanacademy.org/science/physics',
        externalLabel: 'Khan Academy — Physics',
    },
    BIO201: {
        youtube: 'yVf_1WjLGVA',
        playlist: 'PL8dPuuaLjXtNd2-VnQ4BNnGvNq5q46LwS',
        playlistLabel: 'CrashCourse Biology',
        external: 'https://www.khanacademy.org/science/biology',
        externalLabel: 'Khan Academy — Biology',
    },
    CHEM101: {
        youtube: 'FSyAehMdpyI',
        playlist: 'PL8dPuuaLjXtONXALVk6h8rMXq6_W92iDn',
        playlistLabel: 'CrashCourse Chemistry',
        external: 'https://www.khanacademy.org/science/chemistry',
        externalLabel: 'Khan Academy — Chemistry',
    },
    HIST101: {
        youtube: 'Yocja_N5s1I',
        playlist: 'PL8dPuuaLjXtMwmepBjTSG593eP7Wk5V2s',
        playlistLabel: 'CrashCourse World History',
        external: 'https://www.khanacademy.org/humanities/world-history',
        externalLabel: 'Khan Academy — World History',
    },
    PSY101: {
        youtube: 'vo4pMVb0R6M',
        playlist: 'PL8dPuuaLjXtOPRKzVLY4jj2Nf7Dn4mWlD',
        playlistLabel: 'CrashCourse Psychology',
        external: 'https://www.khanacademy.org/science/health-and-medicine',
        externalLabel: 'Khan Academy — Psychology',
    },
};

async function showCourseDetail(courseId) {
    try {
        const data = await api('get_course', { id: courseId });
        const course = data.course;
        const res    = courseResources[course.code];

        const ytSrc = res
            ? `https://www.youtube.com/embed/${res.youtube}?rel=0&modestbranding=1`
            : '';

        modalContent.innerHTML = `
            <button class="modal-close-btn" onclick="closeModal()">&times;</button>
            <div class="course-detail">
                <div class="course-detail-header">
                    <div>
                        <span class="course-code">${escapeHtml(course.code)} · ${course.credits} credits</span>
                        <h2>${escapeHtml(course.title)}</h2>
                    </div>
                    <span class="badge ${course.status === 'active' ? 'badge-success' : 'badge-warning'}">${course.status}</span>
                </div>

                <div class="course-detail-body">
                    <div class="course-detail-info">
                        <div class="course-detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Instructor</span>
                                <span class="detail-value">${escapeHtml(course.instructor)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Schedule</span>
                                <span class="detail-value">${escapeHtml(course.schedule)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Capacity</span>
                                <span class="detail-value">${course.enrolled} / ${course.capacity} enrolled</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Course Code</span>
                                <span class="detail-value">${escapeHtml(course.code)}</span>
                            </div>
                        </div>
                        <div class="detail-description">
                            <span class="detail-label">Description</span>
                            <p>${escapeHtml(course.description || 'No description available.')}</p>
                        </div>
                    </div>

                    ${res ? `
                    <div class="course-detail-resources">
                        <h3>Learning Resources</h3>

                        <div class="resource-video">
                            <div class="resource-video-header">
                                <span class="resource-label">Featured Video</span>
                                <a href="https://youtu.be/${res.youtube}" target="_blank" class="btn btn-ghost btn-sm">Open on YouTube ↗</a>
                            </div>
                            <div class="video-wrapper">
                                <iframe src="${ytSrc}"
                                        title="Course video"
                                        frameborder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowfullscreen>
                                </iframe>
                            </div>
                        </div>

                        <div class="resource-external">
                            <span class="resource-label">Full Playlist</span>
                            <a href="https://www.youtube.com/playlist?list=${res.playlist}" target="_blank" class="btn btn-accent btn-full" rel="noopener">
                                ▶ Open ${res.playlistLabel} on YouTube ↗
                            </a>
                        </div>

                        <div class="resource-external">
                            <span class="resource-label">Additional Learning</span>
                            <a href="${res.external}" target="_blank" class="btn btn-secondary btn-full" rel="noopener">
                                Open ${res.externalLabel} ↗
                            </a>
                        </div>
                    </div>
                    ` : `
                    <div class="course-detail-resources">
                        <div class="empty-state">
                            <p>Learning resources are being prepared for this course.</p>
                        </div>
                    </div>
                    `}

                    ${data.enrollment ? `
                    <div class="course-notes-section">
                        <h3>My Notes</h3>
                        <textarea class="form-control course-notes-ta" id="courseNotes" 
                                  placeholder="Write your notes for this course…" 
                                  oninput="scheduleSaveNotes(${course.id})">${escapeHtml(data.enrollment.notes || '')}</textarea>
                        <span class="notes-saved" id="notesStatus">All changes saved</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        modalContent.className = 'modal modal-course';
        modal.classList.remove('hidden');
    } catch (err) {
        showAlertMessage(err.message, 'error');
    }
}

// ---- Notes auto-save --------------------------------------------
let notesTimer = null;

function scheduleSaveNotes(courseId) {
    const status = document.getElementById('notesStatus');
    if (status) status.textContent = 'Unsaved changes…';
    if (notesTimer) clearTimeout(notesTimer);
    notesTimer = setTimeout(() => saveNotes(courseId), 800);
}

async function saveNotes(courseId) {
    const ta   = document.getElementById('courseNotes');
    const status = document.getElementById('notesStatus');
    if (!ta || !status) return;
    try {
        await api('save_notes', { course_id: courseId, notes: ta.value });
        status.textContent = 'All changes saved';
    } catch (err) {
        status.textContent = 'Failed to save';
        status.style.color = '#dc2626';
    }
}

function showAlertMessage(message, type) {
    const existing = document.querySelector('.alert-toast');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = `alert alert-${type} alert-toast`;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4500);
}

// ================================================================
// ADMIN VIEW
// ================================================================

function renderAdminView() {
    views.admin.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-full">
                <div class="card">
                    <div class="card-header">
                        <h2>Administrator Dashboard</h2>
                        <button class="btn btn-primary" onclick="showAddCourseModal()">
                            + Add Course
                        </button>
                    </div>
                    <div id="adminStats"></div>
                    <div id="adminCourseList"><div class="spinner"></div></div>
                </div>
            </div>
            <div class="dashboard-full">
                <div class="card">
                    <div class="card-header">
                        <h2>Registration Records</h2>
                    </div>
                    <div id="adminRegistrations"><div class="spinner"></div></div>
                </div>
            </div>
            <div class="dashboard-full">
                <div class="card">
                    <div class="card-header">
                        <h2>Student Management</h2>
                    </div>
                    <div id="adminStudents"><div class="spinner"></div></div>
                </div>
            </div>
        </div>
    `;

    loadAdminDashboard();
}

async function loadAdminDashboard() {
    await Promise.all([
        loadAdminCourses(),
        loadAdminRegistrations(),
        loadAdminStudents(),
    ]);
}

let adminCoursePage = 1;

async function loadAdminCourses(page) {
    if (page) adminCoursePage = page;
    const container = document.getElementById('adminCourseList');

    try {
        const data = await api('get_all_courses', { page: adminCoursePage, per_page: 8 });

        // Stats (fetch all for accurate totals)
        const allData = adminCoursePage === 1 ? data : await api('get_all_courses', { per_page: 500 });
        const allCourses = adminCoursePage === 1 ? data.courses : allData.courses;

        const total    = allCourses.length;
        const active   = allCourses.filter(c => c.status === 'active').length;
        const totalCap = allCourses.reduce((s, c) => s + parseInt(c.capacity), 0);
        const totalEnr = allCourses.reduce((s, c) => s + parseInt(c.enrolled), 0);

        document.getElementById('adminStats').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total Courses</div></div>
                <div class="stat-card"><div class="stat-value">${active}</div><div class="stat-label">Active</div></div>
                <div class="stat-card"><div class="stat-value">${totalEnr}</div><div class="stat-label">Enrolled</div></div>
                <div class="stat-card"><div class="stat-value">${totalCap - totalEnr}</div><div class="stat-label">Seats Open</div></div>
            </div>
        `;

        if (data.courses.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>No courses have been created yet.</p></div>`;
            return;
        }

        const tbody = data.courses.map(c => `
            <tr>
                <td><strong>${escapeHtml(c.code)}</strong></td>
                <td>${escapeHtml(c.title)}</td>
                <td>${escapeHtml(c.instructor)}</td>
                <td>${c.enrolled} / ${c.capacity}</td>
                <td><span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}">${c.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="showEditCourseModal(${c.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCourse(${c.id})">Delete</button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="table-wrapper">
                <table>
                    <thead><tr>
                        <th>Code</th><th>Title</th><th>Instructor</th><th>Enrolled</th><th>Status</th><th>Actions</th>
                    </tr></thead>
                    <tbody>${tbody}</tbody>
                </table>
            </div>
        ` + renderPagination(data.page, data.pages, 'loadAdminCourses');
    } catch (err) {
        container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
}

async function loadAdminRegistrations() {
    const container = document.getElementById('adminRegistrations');

    try {
        const data = await api('get_registrations');

        if (data.registrations.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>No registrations yet.</p></div>`;
            return;
        }

        const tbody = data.registrations.map(r => `
            <tr>
                <td>${escapeHtml(r.student_name)}</td>
                <td>${escapeHtml(r.course_code)}</td>
                <td>${escapeHtml(r.course_title)}</td>
                <td><span class="badge ${r.reg_status === 'enrolled' ? 'badge-success' : 'badge-warning'}">${r.reg_status}</span></td>
                <td>${new Date(r.registered_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>Student</th><th>Course</th><th>Title</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>${tbody}</tbody>
                </table>
            </div>
            <div style="margin-top:12px">
                <a href="php/export_xml.php" class="btn btn-secondary btn-sm">Export Courses as XML</a>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
}

// ---- Admin: Student Management -----------------------------------

async function loadAdminStudents() {
    const container = document.getElementById('adminStudents');

    try {
        const [students, courses] = await Promise.all([
            api('get_students'),
            api('get_all_courses', { per_page: 100 }),
        ]);

        if (students.students.length === 0) {
            container.innerHTML = `<div class="empty-state"><p>No students registered yet.</p></div>`;
            return;
        }

        const rows = students.students.map(s => `
            <tr>
                <td><strong>${escapeHtml(s.full_name)}</strong></td>
                <td>${escapeHtml(s.username)}</td>
                <td>${escapeHtml(s.email)}</td>
                <td><span class="badge badge-success">${s.enrolled_count} enrolled</span></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="adminManageStudent(${s.id}, '${escapeHtml(s.full_name)}')">Manage</button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="table-wrapper">
                <table>
                    <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    } catch (err) {
        container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
}

async function adminManageStudent(userId, studentName) {
    try {
        const [courses, registrations] = await Promise.all([
            api('get_all_courses', { per_page: 100 }),
            api('get_registrations'),
        ]);

        const studentRegs = registrations.registrations.filter(r => r.user_id === userId);
        const enrolledIds  = studentRegs.filter(r => r.reg_status === 'enrolled').map(r => parseInt(r.reg_id));
        const courseEnrollMap = {};

        studentRegs.forEach(r => {
            if (r.reg_status === 'enrolled') {
                courseEnrollMap[r.course_code] = r;
            }
        });

        const courseRows = courses.courses.map(c => {
            const isEnrolled = courseEnrollMap[c.code];
            return `
                <tr>
                    <td><strong>${escapeHtml(c.code)}</strong></td>
                    <td>${escapeHtml(c.title)}</td>
                    <td>${c.enrolled}/${c.capacity}</td>
                    <td><span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-warning'}">${c.status}</span></td>
                    <td>
                        ${isEnrolled
                            ? `<button class="btn btn-danger btn-sm" onclick="adminDropStudent(${userId}, ${c.id}, '${escapeHtml(studentName)}', '${escapeHtml(c.code)}')">Drop</button>`
                            : (c.status === 'active' && c.enrolled < c.capacity
                                ? `<button class="btn btn-primary btn-sm" onclick="adminEnrollStudent(${userId}, ${c.id}, '${escapeHtml(studentName)}', '${escapeHtml(c.code)}')">Enroll</button>`
                                : `<span class="badge badge-warning">${c.status !== 'active' ? 'Inactive' : 'Full'}</span>`)
                        }
                    </td>
                </tr>
            `;
        }).join('');

        modalContent.innerHTML = `
            <button class="modal-close-btn" onclick="closeModal()">&times;</button>
            <div>
                <h2 style="font-size:1.15rem;font-weight:700;color:var(--emerald-700);margin-bottom:4px;font-style:normal">${escapeHtml(studentName)}</h2>
                <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:16px">Manage course enrollments</p>
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Code</th><th>Title</th><th>Capacity</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>${courseRows}</tbody>
                    </table>
                </div>
            </div>
        `;
        modalContent.className = 'modal modal-course';
        modal.classList.remove('hidden');
    } catch (err) {
        showAlertMessage(err.message, 'error');
    }
}

async function adminEnrollStudent(userId, courseId, studentName, courseCode) {
    if (!confirm(`Enroll ${studentName} in ${courseCode}?`)) return;
    try {
        await api('admin_enroll_student', { user_id: userId, course_id: courseId });
        showAlertMessage(`${studentName} enrolled in ${courseCode}.`, 'success');
        closeModal();
        loadAdminDashboard();
    } catch (err) {
        showAlertMessage(err.message, 'error');
    }
}

async function adminDropStudent(userId, courseId, studentName, courseCode) {
    if (!confirm(`Drop ${studentName} from ${courseCode}?`)) return;
    try {
        await api('admin_drop_student', { user_id: userId, course_id: courseId });
        showAlertMessage(`${studentName} dropped from ${courseCode}.`, 'success');
        closeModal();
        loadAdminDashboard();
    } catch (err) {
        showAlertMessage(err.message, 'error');
    }
}

// ---- Admin: Course CRUD Modals ----------------------------------

function showAddCourseModal() {
    modalContent.innerHTML = `
        <h2>Add New Course</h2>
        <div id="modalAlert" class="alert hidden"></div>
        <form id="courseForm" onsubmit="handleAddCourse(event)">
            <div class="form-group">
                <label for="courseCode">Course Code</label>
                <input type="text" id="courseCode" class="form-control" placeholder="CS101" required>
            </div>
            <div class="form-group">
                <label for="courseTitle">Title</label>
                <input type="text" id="courseTitle" class="form-control" placeholder="Introduction to Computer Science" required>
            </div>
            <div class="form-group">
                <label for="courseDesc">Description</label>
                <textarea id="courseDesc" class="form-control" placeholder="Course description…"></textarea>
            </div>
            <div class="form-group">
                <label for="courseInstructor">Instructor</label>
                <input type="text" id="courseInstructor" class="form-control" placeholder="Dr. Sarah Chen" required>
            </div>
            <div class="form-group">
                <label for="courseSchedule">Schedule</label>
                <input type="text" id="courseSchedule" class="form-control" placeholder="Mon/Wed 10:00-11:30" required>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div class="form-group">
                    <label for="courseCapacity">Capacity</label>
                    <input type="number" id="courseCapacity" class="form-control" value="30" min="1" required>
                </div>
                <div class="form-group">
                    <label for="courseCredits">Credits</label>
                    <input type="number" id="courseCredits" class="form-control" value="3" min="1" required>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Add Course</button>
            </div>
        </form>
    `;
    modal.classList.remove('hidden');
}

async function handleAddCourse(e) {
    e.preventDefault();
    clearAlert('modalAlert');

    const btn = document.getElementById('modalSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
        await api('add_course', {
            code:        document.getElementById('courseCode').value.trim(),
            title:       document.getElementById('courseTitle').value.trim(),
            description: document.getElementById('courseDesc').value.trim(),
            instructor:  document.getElementById('courseInstructor').value.trim(),
            schedule:    document.getElementById('courseSchedule').value.trim(),
            capacity:    parseInt(document.getElementById('courseCapacity').value),
            credits:     parseInt(document.getElementById('courseCredits').value),
        });
        closeModal();
        loadAdminDashboard();
        showAlertMessage('Course added successfully.', 'success');
    } catch (err) {
        showAlert('modalAlert', err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Add Course';
    }
}

async function showEditCourseModal(courseId) {
    closeModal();

    try {
        const data = await api('get_all_courses');
        const course = data.courses.find(c => c.id === courseId);
        if (!course) { showAlertMessage('Course not found.', 'error'); return; }

        modalContent.innerHTML = `
            <h2>Edit Course: ${escapeHtml(course.code)}</h2>
            <div id="modalAlert" class="alert hidden"></div>
            <form id="courseForm" onsubmit="handleEditCourse(event, ${courseId})">
                <div class="form-group">
                    <label for="courseTitle">Title</label>
                    <input type="text" id="courseTitle" class="form-control"
                           value="${escapeHtml(course.title)}" required>
                </div>
                <div class="form-group">
                    <label for="courseDesc">Description</label>
                    <textarea id="courseDesc" class="form-control">${escapeHtml(course.description || '')}</textarea>
                </div>
                <div class="form-group">
                    <label for="courseInstructor">Instructor</label>
                    <input type="text" id="courseInstructor" class="form-control"
                           value="${escapeHtml(course.instructor)}" required>
                </div>
                <div class="form-group">
                    <label for="courseSchedule">Schedule</label>
                    <input type="text" id="courseSchedule" class="form-control"
                           value="${escapeHtml(course.schedule)}" required>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div class="form-group">
                        <label for="courseCapacity">Capacity</label>
                        <input type="number" id="courseCapacity" class="form-control"
                               value="${course.capacity}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="courseCredits">Credits</label>
                        <input type="number" id="courseCredits" class="form-control"
                               value="${course.credits}" min="1" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="courseStatus">Status</label>
                    <select id="courseStatus" class="form-control">
                        <option value="active" ${course.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${course.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="modalSubmitBtn">Save Changes</button>
                </div>
            </form>
        `;
        modal.classList.remove('hidden');
    } catch (err) {
        showAlertMessage(err.message, 'error');
    }
}

async function handleEditCourse(e, courseId) {
    e.preventDefault();
    clearAlert('modalAlert');

    const btn = document.getElementById('modalSubmitBtn');
    btn.disabled = true;
    btn.textContent = 'Saving…';

    try {
        await api('update_course', {
            id:          courseId,
            title:       document.getElementById('courseTitle').value.trim(),
            description: document.getElementById('courseDesc').value.trim(),
            instructor:  document.getElementById('courseInstructor').value.trim(),
            schedule:    document.getElementById('courseSchedule').value.trim(),
            capacity:    parseInt(document.getElementById('courseCapacity').value),
            credits:     parseInt(document.getElementById('courseCredits').value),
            status:      document.getElementById('courseStatus').value,
        });
        closeModal();
        loadAdminDashboard();
        showAlertMessage('Course updated successfully.', 'success');
    } catch (err) {
        showAlert('modalAlert', err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to permanently delete this course? This action cannot be undone.')) return;

    try {
        await api('delete_course', { id: courseId });
        loadAdminDashboard();
        showAlertMessage('Course deleted successfully.', 'success');
    } catch (err) {
        showAlertMessage(err.message, 'error');
    }
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.classList.remove('modal-open');
}

// Close modal on overlay click
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Auto-lock body scroll when any modal opens
const modalObserver = new MutationObserver(() => {
    if (!modal.classList.contains('hidden')) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
});
modalObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });

// ================================================================
// INITIALIZATION
// ================================================================

function init() {
    const initialUser = window.__INITIAL_USER__;

    if (initialUser) {
        setUser(initialUser);
        enterDashboard(initialUser);
    } else {
        renderLoginView();
        showView('login');
    }
}

document.addEventListener('DOMContentLoaded', init);
