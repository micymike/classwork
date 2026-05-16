# Greenfield Institute — Course Registration System

## Project Report

### 1. Introduction

Greenfield Institute needed a modern, centralized web-based course registration system to replace its manual process of email requests and spreadsheets. The new system eliminates duplicate registrations, provides real-time course availability, and offers a seamless experience for both students and administrators.

This report documents the system's architecture, technology choices, and implementation details.

---

### 2. Three-Tier Architecture

The application follows a classic **three-tier architecture**, separating concerns into distinct layers:

```
┌─────────────────────────────────────────────────────┐
│  Presentation Tier (Client)                         │
│  HTML · CSS · JavaScript                            │
│  index.php · style.css · main.js                    │
├─────────────────────────────────────────────────────┤
│  Business Logic Tier (Server)                       │
│  PHP                                                │
│  api.php · db.php · config.php · export_xml.php     │
├─────────────────────────────────────────────────────┤
│  Data Tier (Database)                               │
│  MySQL                                              │
│  schema.sql                                         │
└─────────────────────────────────────────────────────┘
```

#### 2.1 Presentation Tier (Frontend)

- **`index.php`** — Serves the single-page application shell. PHP evaluates the session state to embed the initial user object as JSON, enabling immediate dashboard rendering without an extra API call.
- **`css/style.css`** — Responsive, modern stylesheet using CSS custom properties, Flexbox, and Grid. Supports mobile, tablet, and desktop viewports via media queries.
- **`js/main.js`** — All client-side logic: view routing, API communication via `fetch()`, dynamic HTML rendering, form validation, event handling, and AJAX-powered search.

Key frontend features:
- Real-time course search without page reload
- Dynamic course cards with capacity progress bars
- Modal forms for admin CRUD operations
- Toast-style success/error notifications

#### 2.2 Business Logic Tier (Backend)

- **`php/config.php`** — Central configuration for database credentials and PHP settings. Supports environment variables for flexible deployment.
- **`php/db.php`** — Singleton PDO connection manager with prepared statement defaults, exception error mode, and utf8mb4 charset.
- **`php/api.php`** — Unified REST-like JSON API handling all operations: authentication, course management, enrollment, and registration reporting. All database queries use prepared statements to prevent SQL injection.
- **`php/export_xml.php`** — Generates an XML representation of active courses using DOMDocument, linked to the XSD schema.

#### 2.3 Data Tier (Database)

- **`database/schema.sql`** — MySQL schema with three tables: `users`, `courses`, and `registrations`. Includes foreign key constraints, composite indexes, and seed data for testing.

**Entity-Relationship Summary:**

```
users (1) ──────────── (N) registrations (N) ──────────── (1) courses
  │                                                            │
  ├─ id (PK)                                                   ├─ id (PK)
  ├─ username (UNIQUE)                                         ├─ code (UNIQUE)
  ├─ email (UNIQUE)                                            ├─ title
  ├─ password_hash                                             ├─ capacity
  ├─ full_name                                                 ├─ enrolled
  ├─ role (student | admin)                                    └─ status (active | inactive)
  └─ created_at
```

---

### 3. Technology Stack & Contributions

| Technology | Role | Contribution |
|---|---|---|
| **HTML5** | Structure | Semantic markup for views, forms, tables, and modals |
| **CSS3** | Styling | Responsive layout, custom properties, animations, capacity bars |
| **JavaScript (ES6+)** | Interactivity | SPA routing, AJAX, DOM manipulation, async/await API calls |
| **PHP 8.x** | Server logic | Session management, PDO database access, input validation, password hashing |
| **MySQL** | Persistence | Relational storage with constraints, indexes, and foreign keys |
| **XML + XSD** | Data exchange | Course catalog export with a formal schema definition |

---

### 4. Security Measures

| Measure | Implementation |
|---|---|
| **Password hashing** | `password_hash()` with bcrypt (cost 12) |
| **SQL injection prevention** | All queries use PDO prepared statements with parameterized values |
| **Session security** | `session_regenerate_id()` on login; `HttpOnly` cookies on logout |
| **XSS prevention** | `htmlspecialchars()` in PHP; custom `escapeHtml()` in JavaScript |
| **Input validation** | Username pattern `[a-zA-Z0-9_]{3,50}`, email filter, password minimum length |
| **Role-based access** | Server-side `require_admin()` guard on all admin endpoints |
| **Error handling** | Generic error messages in production; logging enabled |

---

### 5. XML Feature

The system exports a course catalog as XML via `php/export_xml.php`. The generated XML conforms to `xml/courses.xsd`, which defines a formal schema with:

- Root `<courseCatalog>` with `institution` and `generated` attributes
- Multiple `<course>` elements containing `id`, `code`, `title`, `description`, `instructor`, `capacity`, `enrolled`, `schedule`, and `credits`
- Namespace declaration for W3C XML Schema Instance validation

The export is accessible from the admin dashboard and triggers a file download.

---

### 6. Setup Instructions

1. **Database Setup**
   - Ensure MySQL is running
   - Execute `database/schema.sql` to create the database, tables, and seed data

2. **Configuration**
   - Open `php/config.php` and update `DB_HOST`, `DB_USER`, `DB_PASS` if needed
   - Default credentials assume a local MySQL instance with root access

3. **Web Server**
   - Place the `greenfield-institute/` folder in your web server's document root
   - Ensure the server has PHP 8.0+ with PDO MySQL extension enabled
   - Navigate to `http://localhost/greenfield-institute/`

4. **Sample Accounts**
   | Role | Username | Password |
   |---|---|---|
   | Admin | `admin` | `password` |
   | Student | `jdoe` | `password` |
   | Student | `asmith` | `password` |

---

### 7. File Manifest

```
greenfield-institute/
├── index.php                    # Entry point — serves the SPA shell
├── css/
│   └── style.css                # All styles (responsive, theming)
├── js/
│   └── main.js                  # Client-side application logic
├── php/
│   ├── config.php               # Database configuration
│   ├── db.php                   # PDO connection singleton
│   ├── api.php                  # Unified JSON API endpoint
│   └── export_xml.php           # XML course catalog export
├── xml/
│   └── courses.xsd              # XML Schema Definition for course data
├── database/
│   └── schema.sql               # Full schema with seed data
├── screenshots/                 # Screenshots directory
├── report.md                    # This report
```

---

### 8. Conclusion

The Greenfield Institute Course Registration System successfully demonstrates:

- A clean **three-tier architecture** with clear separation of concerns
- **Secure authentication** and role-based access control
- **Real-time AJAX interactions** for course search and enrollment
- **Responsive design** for mobile and desktop users
- **XML data exchange** with formal schema validation
- A **production-ready** codebase with error handling, input validation, and prepared statements

The system is ready for deployment and can be extended with additional features such as waitlisting, prerequisite checking, or semester-based scheduling.
