// db.js — Shared SQLite database via sql.js
// All pages include this script. DB is stored in sessionStorage so it persists across pages in the same session.

const SQLJSCDN = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js";
const DB_KEY   = "utms_db_v1";

const INIT_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS Student (
  student_id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_num TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive'))
);

CREATE TABLE IF NOT EXISTS Route (
  route_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','suspended'))
);

CREATE TABLE IF NOT EXISTS Stop (
  stop_id INTEGER PRIMARY KEY AUTOINCREMENT,
  stop_name TEXT NOT NULL,
  address TEXT
);

CREATE TABLE IF NOT EXISTS Covers_Route (
  route_id INTEGER NOT NULL,
  stop_id  INTEGER NOT NULL,
  sequence_order INTEGER NOT NULL,
  estimated_passing_time TEXT,
  PRIMARY KEY (route_id, stop_id),
  FOREIGN KEY (route_id) REFERENCES Route(route_id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id)  REFERENCES Stop(stop_id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Bus (
  bus_id INTEGER PRIMARY KEY AUTOINCREMENT,
  max_capacity INTEGER NOT NULL CHECK(max_capacity > 0),
  bus_brand TEXT,
  year_of_service INTEGER,
  bus_status TEXT NOT NULL DEFAULT 'available' CHECK(bus_status IN ('available','in_service','maintenance','out_of_service'))
);

CREATE TABLE IF NOT EXISTS Bus_Assignment (
  assignment_id INTEGER PRIMARY KEY AUTOINCREMENT,
  bus_id   INTEGER NOT NULL,
  route_id INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date   TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','ended','cancelled')),
  FOREIGN KEY (bus_id)   REFERENCES Bus(bus_id)   ON DELETE RESTRICT,
  FOREIGN KEY (route_id) REFERENCES Route(route_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Subscription (
  subscription_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  route_id   INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date   TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','cancelled')),
  FOREIGN KEY (student_id) REFERENCES Student(student_id) ON DELETE CASCADE,
  FOREIGN KEY (route_id)   REFERENCES Route(route_id)    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Schedule (
  schedule_id INTEGER PRIMARY KEY AUTOINCREMENT,
  route_id INTEGER NOT NULL,
  day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  departure_time TEXT NOT NULL,
  estimated_arrival_time TEXT NOT NULL,
  UNIQUE(route_id, day_of_week, departure_time),
  FOREIGN KEY (route_id) REFERENCES Route(route_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Trip (
  trip_id INTEGER PRIMARY KEY AUTOINCREMENT,
  schedule_id INTEGER NOT NULL,
  bus_id   INTEGER NOT NULL,
  route_id INTEGER NOT NULL,
  trip_date TEXT NOT NULL,
  actual_departure_time TEXT,
  actual_arrival_time TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','in_progress','completed','cancelled','delayed')),
  FOREIGN KEY (schedule_id) REFERENCES Schedule(schedule_id) ON DELETE RESTRICT,
  FOREIGN KEY (bus_id)      REFERENCES Bus(bus_id)           ON DELETE RESTRICT,
  FOREIGN KEY (route_id)    REFERENCES Route(route_id)       ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Incident (
  incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL,
  incident_type TEXT NOT NULL,
  description TEXT,
  date_incident TEXT NOT NULL,
  incident_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open','resolved','closed')),
  FOREIGN KEY (trip_id) REFERENCES Trip(trip_id) ON DELETE RESTRICT
);

-- ── SEED DATA ──
INSERT OR IGNORE INTO Route (route_name, description, status) VALUES
('Ligne 1 - Bab Ezzouar → Ben Aknoun',  'Main western line',  'active'),
('Ligne 2 - Bab Ezzouar → Kouba',        'Main eastern line',  'active'),
('Ligne 3 - Bab Ezzouar → Dar El Beida', 'Airport line',       'active');

INSERT OR IGNORE INTO Stop (stop_name, address) VALUES
('USTHB',           'Bab Ezzouar, Alger'),
('Bordj El Kiffan', 'Bordj El Kiffan, Alger'),
('Ben Aknoun',      'Ben Aknoun, Alger'),
('Kouba',           'Kouba, Alger'),
('Dar El Beida',    'Dar El Beida, Alger'),
('Hussein Dey',     'Hussein Dey, Alger');

INSERT OR IGNORE INTO Covers_Route (route_id, stop_id, sequence_order, estimated_passing_time) VALUES
(1,1,1,'07:00'),(1,6,2,'07:20'),(1,3,3,'07:45'),
(2,1,1,'07:15'),(2,2,2,'07:35'),(2,4,3,'08:00'),
(3,1,1,'06:45'),(3,2,2,'07:05'),(3,5,3,'07:30');

INSERT OR IGNORE INTO Bus (max_capacity, bus_brand, year_of_service, bus_status) VALUES
(50,'Mercedes',2018,'in_service'),
(45,'Irisbus',2019,'in_service'),
(55,'Mercedes',2020,'in_service'),
(40,'Karosa',2016,'maintenance');

INSERT OR IGNORE INTO Bus_Assignment (bus_id, route_id, start_date, end_date, status) VALUES
(1,1,'2026-01-01',NULL,'active'),
(2,2,'2026-01-01',NULL,'active'),
(3,3,'2026-01-01',NULL,'active'),
(4,1,'2025-09-01','2025-12-31','ended');

INSERT OR IGNORE INTO Student (last_name, first_name, email, phone_num, address, status) VALUES
('Benali',   'Mohamed', 'mbenali@usthb.dz',   '0551234567', 'Alger',     'active'),
('Kara',     'Fatima',  'fkara@usthb.dz',     '0662345678', 'Blida',     'active'),
('Mansouri', 'Yacine',  'ymansouri@usthb.dz', '0773456789', 'Boumerdes', 'active'),
('Bouzid',   'Amina',   'abouzid@usthb.dz',   '0554567890', 'Alger',     'active'),
('Hadj',     'Karim',   'khadj@usthb.dz',     '0665678901', 'Tipaza',    'active');

INSERT OR IGNORE INTO Subscription (student_id, route_id, start_date, end_date, status) VALUES
(1,1,'2026-01-01',NULL,'active'),
(2,2,'2026-01-01',NULL,'active'),
(3,3,'2026-01-01',NULL,'active'),
(4,1,'2025-09-01','2025-12-31','expired'),
(4,2,'2026-01-01',NULL,'active'),
(5,1,'2026-02-01',NULL,'active');

INSERT OR IGNORE INTO Schedule (route_id, day_of_week, departure_time, estimated_arrival_time) VALUES
(1,'Monday',   '07:00','07:45'),
(1,'Monday',   '12:00','12:45'),
(1,'Tuesday',  '07:00','07:45'),
(1,'Wednesday','07:00','07:45'),
(1,'Thursday', '07:00','07:45'),
(1,'Friday',   '07:00','07:45'),
(2,'Monday',   '07:15','08:00'),
(2,'Tuesday',  '07:15','08:00'),
(2,'Wednesday','07:15','08:00'),
(2,'Thursday', '07:15','08:00'),
(2,'Friday',   '07:15','08:00'),
(3,'Monday',   '06:45','07:30'),
(3,'Tuesday',  '06:45','07:30'),
(3,'Wednesday','06:45','07:30'),
(3,'Thursday', '06:45','07:30'),
(3,'Friday',   '06:45','07:30');

INSERT OR IGNORE INTO Trip (schedule_id, bus_id, route_id, trip_date, actual_departure_time, actual_arrival_time, status) VALUES
(1,1,1,'2026-04-28','07:05','07:50','completed'),
(2,1,1,'2026-04-28','12:00','12:45','completed'),
(7,2,2,'2026-04-28','07:30','08:20','delayed'),
(12,3,3,'2026-04-28','06:45','07:30','completed');

INSERT OR IGNORE INTO Incident (trip_id, incident_type, description, date_incident, incident_time, status) VALUES
(3,'delay',     'Traffic jam on RN5',            '2026-04-28','07:30','resolved'),
(1,'breakdown', 'Minor engine failure, resolved', '2026-04-28','07:05','closed');
`;

// ─── Load sql.js and initialize or restore DB ───
window.DB = null;

async function initDB() {
  if (window.DB) return window.DB;

  // Load sql.js from CDN
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SQLJSCDN;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

  const SQL = await initSqlJs({
    locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`
  });

  const saved = sessionStorage.getItem(DB_KEY);
  if (saved) {
    const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
    window.DB = new SQL.Database(buf);
  } else {
    window.DB = new SQL.Database();
    window.DB.run(INIT_SQL);
    saveDB();
  }
  return window.DB;
}

function saveDB() {
  const data = window.DB.export();
  const b64  = btoa(String.fromCharCode(...data));
  sessionStorage.setItem(DB_KEY, b64);
}

// ─── Query helpers ───
function dbQuery(sql, params = []) {
  const res = window.DB.exec(sql, params);
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]])));
}

function dbRun(sql, params = []) {
  window.DB.run(sql, params);
  saveDB();
}

// ─── Business rule: only one active subscription per student ───
function subscribeStudent(studentId, routeId, startDate) {
  // Close any existing active subscription
  dbRun(`UPDATE Subscription SET status='expired', end_date=? WHERE student_id=? AND status='active'`,
    [startDate, studentId]);
  // Insert new
  dbRun(`INSERT INTO Subscription (student_id, route_id, start_date, status) VALUES (?,?,?,'active')`,
    [studentId, routeId, startDate]);
}

window.dbQuery   = dbQuery;
window.dbRun     = dbRun;
window.saveDB    = saveDB;
window.initDB    = initDB;
window.subscribeStudent = subscribeStudent;
