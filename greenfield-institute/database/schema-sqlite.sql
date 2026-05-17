CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT NOT NULL UNIQUE,
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student','admin')),
    current_streak  INTEGER NOT NULL DEFAULT 0,
    longest_streak  INTEGER NOT NULL DEFAULT 0,
    last_active_date TEXT DEFAULT NULL,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS courses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    code        TEXT NOT NULL UNIQUE,
    title       TEXT NOT NULL,
    description TEXT,
    instructor  TEXT NOT NULL,
    capacity    INTEGER NOT NULL DEFAULT 30,
    enrolled    INTEGER NOT NULL DEFAULT 0,
    schedule    TEXT NOT NULL,
    credits     INTEGER NOT NULL DEFAULT 3,
    status      TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);

CREATE TABLE IF NOT EXISTS registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    course_id     INTEGER NOT NULL,
    registered_at TEXT DEFAULT (datetime('now')),
    status        TEXT NOT NULL DEFAULT 'enrolled' CHECK(status IN ('enrolled','dropped')),
    notes         TEXT,

    UNIQUE (user_id, course_id),

    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reg_user_status ON registrations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reg_course_status ON registrations(course_id, status);

INSERT OR IGNORE INTO users (username, email, password_hash, full_name, role) VALUES
('admin',  'admin@greenfield.edu',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'System Administrator', 'admin'),
('jdoe',   'jdoe@greenfield.edu',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'John Doe',  'student'),
('asmith',  'asmith@greenfield.edu',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Alice Smith', 'student');

INSERT OR IGNORE INTO courses (code, title, description, instructor, capacity, enrolled, schedule, credits) VALUES
('CS101', 'Introduction to Computer Science',
 'Fundamentals of programming, algorithms, and computational thinking.',
 'Dr. Sarah Chen',   30, 25, 'Mon/Wed 10:00-11:30', 4),
('MATH201', 'Calculus II',
 'Advanced integration techniques, sequences and series.',
 'Prof. Robert Miller', 25, 10, 'Tue/Thu 09:00-10:30', 4),
('ENG101', 'English Composition',
 'Develop academic writing skills including thesis development.',
 'Dr. Emily Watson',  35, 8,  'Mon/Wed/Fri 08:00-09:00', 3),
('PHY101', 'Physics I',
 'Classical mechanics, thermodynamics, and wave phenomena.',
 'Dr. James Park',    30, 20, 'Tue/Thu 10:30-12:00', 4),
('BIO201', 'Molecular Biology',
 'Cellular processes, DNA replication, transcription, translation.',
 'Prof. Lisa Thompson', 20, 12, 'Wed/Fri 13:00-14:30', 3),
('CHEM101', 'General Chemistry',
 'Atomic structure, chemical bonding, stoichiometry.',
 'Dr. David Kim',     28, 5,  'Mon/Wed 14:00-15:30', 4),
('HIST101', 'World History',
 'Survey of major world civilizations from ancient times.',
 'Prof. Maria Garcia', 40, 15, 'Tue/Thu 13:00-14:15', 3),
('PSY101', 'Introduction to Psychology',
 'Overview of major psychological theories.',
 'Dr. Karen White',   35, 18, 'Mon/Wed/Fri 10:00-11:00', 3);

INSERT OR IGNORE INTO registrations (user_id, course_id, status) VALUES
(2, 1, 'enrolled'),
(2, 2, 'enrolled'),
(3, 1, 'enrolled'),
(3, 4, 'enrolled'),
(3, 5, 'enrolled');
