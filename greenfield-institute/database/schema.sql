-- ==============================================================
-- Greenfield Institute - Course Registration System
-- Database Schema & Seed Data
-- ==============================================================

-- ------------------------------------------------------------
-- Users: stores both students and administrators
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT           AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)   NOT NULL UNIQUE,
    email         VARCHAR(100)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    full_name       VARCHAR(100)  NOT NULL,
    role            ENUM('student','admin') NOT NULL DEFAULT 'student',
    current_streak  INT           NOT NULL DEFAULT 0,
    longest_streak  INT           NOT NULL DEFAULT 0,
    last_active_date DATE         DEFAULT NULL,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_role  (role),
    INDEX idx_email (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Courses: available course offerings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
    id          INT            AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(20)    NOT NULL UNIQUE,
    title       VARCHAR(200)   NOT NULL,
    description TEXT,
    instructor  VARCHAR(100)   NOT NULL,
    capacity    INT            NOT NULL DEFAULT 30,
    enrolled    INT            NOT NULL DEFAULT 0,
    schedule    VARCHAR(150)   NOT NULL,
    credits     INT            NOT NULL DEFAULT 3,
    status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_status (status),
    INDEX idx_code   (code)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Registrations: links users to courses
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
    id            INT       AUTO_INCREMENT PRIMARY KEY,
    user_id       INT       NOT NULL,
    course_id     INT       NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status        ENUM('enrolled','dropped') NOT NULL DEFAULT 'enrolled',
    notes         TEXT,

    UNIQUE KEY uk_user_course (user_id, course_id),

    INDEX idx_user_status   (user_id, status),
    INDEX idx_course_status (course_id, status),

    FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================================================
-- Seed Data
-- ==============================================================

-- Default password for all sample accounts: "password"
-- Verify via PHP: password_verify('password', hash) === true

INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin',  'admin@greenfield.edu',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'System Administrator', 'admin'),
('jdoe',   'jdoe@greenfield.edu',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'John Doe',  'student'),
('asmith',  'asmith@greenfield.edu',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'Alice Smith', 'student');

INSERT INTO courses (code, title, description, instructor, capacity, enrolled, schedule, credits) VALUES
('CS101',
 'Introduction to Computer Science',
 'Fundamentals of programming, algorithms, and computational thinking. Topics include variables, control structures, functions, and an introduction to object-oriented programming.',
 'Dr. Sarah Chen',   30, 25, 'Mon/Wed 10:00-11:30', 4),

('MATH201',
 'Calculus II',
 'Advanced integration techniques, sequences and series, parametric equations, and polar coordinates. Applications in physics and engineering.',
 'Prof. Robert Miller', 25, 10, 'Tue/Thu 09:00-10:30', 4),

('ENG101',
 'English Composition',
 'Develop academic writing skills including thesis development, argumentation, research methods, and critical analysis of texts.',
 'Dr. Emily Watson',  35, 8,  'Mon/Wed/Fri 08:00-09:00', 3),

('PHY101',
 'Physics I',
 'Classical mechanics, thermodynamics, and wave phenomena. Laboratory sessions complement theoretical concepts.',
 'Dr. James Park',    30, 20, 'Tue/Thu 10:30-12:00', 4),

('BIO201',
 'Molecular Biology',
 'Cellular processes, DNA replication, transcription, translation, and genetic engineering techniques.',
 'Prof. Lisa Thompson', 20, 12, 'Wed/Fri 13:00-14:30', 3),

('CHEM101',
 'General Chemistry',
 'Atomic structure, chemical bonding, stoichiometry, and introductory organic chemistry. Includes weekly lab.',
 'Dr. David Kim',     28, 5,  'Mon/Wed 14:00-15:30', 4),

('HIST101',
 'World History',
 'Survey of major world civilizations from ancient times to the modern era, focusing on cultural exchange and global connections.',
 'Prof. Maria Garcia', 40, 15, 'Tue/Thu 13:00-14:15', 3),

('PSY101',
 'Introduction to Psychology',
 'Overview of major psychological theories, research methods, and applications in understanding human behavior.',
 'Dr. Karen White',   35, 18, 'Mon/Wed/Fri 10:00-11:00', 3);

-- Sample enrollments
INSERT INTO registrations (user_id, course_id, status) VALUES
(2, 1, 'enrolled'),  -- John Doe -> CS101
(2, 2, 'enrolled'),  -- John Doe -> MATH201
(3, 1, 'enrolled'),  -- Alice Smith -> CS101
(3, 4, 'enrolled'),  -- Alice Smith -> PHY101
(3, 5, 'enrolled');  -- Alice Smith -> BIO201
