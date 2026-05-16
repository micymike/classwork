/* ==============================================================
   Greenfield Institute - Course Registration System
   Client-side application logic
   ============================================================== */

// ---- State -------------------------------------------------------
let currentUser = null;
let loginCarouselTimer = null;

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

    nav.innerHTML = `
        <div class="nav-user">
            <span class="avatar">${initial}</span>
            <div>
                <div class="user-name">${escapeHtml(currentUser.full_name)}</div>
                <div class="user-role">${currentUser.role}</div>
            </div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="handleLogout()">Log Out</button>
    `;
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
    if (loginCarouselTimer) { clearInterval(loginCarouselTimer); loginCarouselTimer = null; }

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
    views.register.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-card">
                <h2>Create Account</h2>
                <p class="subtitle">Join Greenfield Institute's registration system.</p>
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
                <div class="auth-footer">
                    Already have an account? <a onclick="showView('login'); renderLoginView()">Log in</a>
                </div>
            </div>
        </div>
    `;
}

async function handleRegister(e) {
    e.preventDefault();
    clearAlert('registerError');

    const btn = document.getElementById('registerBtn');
    btn.disabled = true;
    btn.textContent = 'Creating account…';

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

// ================================================================
// STUDENT VIEW
// ================================================================

function renderStudentView() {
    views.student.innerHTML = `
        <div class="dashboard">
            <div class="dashboard-full">
                <div class="card">
                    <div class="card-header">
                        <h2>Available Courses</h2>
                    </div>
                    <div class="search-bar">
                        <input type="text" id="courseSearch" class="form-control"
                               placeholder="Search by code, title, or instructor…"
                               oninput="loadCourses()">
                        <button class="btn btn-primary" onclick="loadCourses()">Search</button>
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

async function loadCourses() {
    const container = document.getElementById('courseCatalog');
    container.innerHTML = '<div class="spinner"></div>';

    try {
        const search = document.getElementById('courseSearch')?.value || '';
        const data   = await api('get_courses', { search });

        if (data.courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No courses found.</p>
                    <p class="sub">Try adjusting your search criteria.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `<div class="course-grid">${
            data.courses.map(c => buildCourseCard(c, false)).join('')
        }</div>`;
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
                    ? `<button class="btn btn-danger btn-sm btn-full" onclick="dropCourse(${course.id})">Drop Course</button>`
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
        </div>
    `;

    loadAdminDashboard();
}

async function loadAdminDashboard() {
    await Promise.all([
        loadAdminCourses(),
        loadAdminRegistrations(),
    ]);
}

async function loadAdminCourses() {
    const container = document.getElementById('adminCourseList');

    try {
        const data = await api('get_all_courses');

        // Stats
        const total    = data.courses.length;
        const active   = data.courses.filter(c => c.status === 'active').length;
        const totalCap = data.courses.reduce((s, c) => s + parseInt(c.capacity), 0);
        const totalEnr = data.courses.reduce((s, c) => s + parseInt(c.enrolled), 0);

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
        `;
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
}

// Close modal on overlay click
modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

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
