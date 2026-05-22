import { DatabaseSync } from 'node:sqlite';
import express from 'express';
import crypto from 'node:crypto';

const app = express();
app.use(express.json());

// Initialize SQLite database
const db = new DatabaseSync('mess_manager.db');

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// 1. Create tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    staffId TEXT NOT NULL UNIQUE,
    role TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS meals (
    id TEXT PRIMARY KEY,
    staffId TEXT NOT NULL,
    date TEXT NOT NULL,
    mealType TEXT NOT NULL CHECK (mealType IN ('breakfast', 'lunch', 'dinner')),
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(staffId, date, mealType)
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('groceries', 'cooking', 'other')),
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// 2. Pre-populate database with some sample data if staff is empty
const countStaffStmt = db.prepare('SELECT COUNT(*) as count FROM staff');
const staffCountResult = countStaffStmt.get() as { count: number };
if (staffCountResult.count === 0) {
  console.log('Pre-populating database with sample data...');
  
  // Insert sample staff
  const insertStaff = db.prepare('INSERT INTO staff (id, name, staffId, role) VALUES (?, ?, ?, ?)');
  const staff1 = crypto.randomUUID();
  const staff2 = crypto.randomUUID();
  const staff3 = crypto.randomUUID();
  insertStaff.run(staff1, 'Shoaib Ullah', 'STF001', 'Admin');
  insertStaff.run(staff2, 'Zikriya', 'STF002', 'Manager');
  insertStaff.run(staff3, 'Muhammad', 'STF003', 'Staff');

  // Insert sample expenses
  const insertExpense = db.prepare('INSERT INTO expenses (id, date, description, amount, category) VALUES (?, ?, ?, ?, ?)');
  const todayStr = new Date().toISOString().split('T')[0];
  insertExpense.run(crypto.randomUUID(), todayStr, 'Vegetables & Chicken', 2450.00, 'groceries');
  insertExpense.run(crypto.randomUUID(), todayStr, 'Cooking Gas Refill', 1800.00, 'cooking');
  insertExpense.run(crypto.randomUUID(), todayStr, 'Cleaning Supplies', 350.00, 'other');

  // Insert sample meals
  const insertMeal = db.prepare('INSERT INTO meals (id, staffId, date, mealType) VALUES (?, ?, ?, ?)');
  insertMeal.run(crypto.randomUUID(), 'STF001', todayStr, 'lunch');
  insertMeal.run(crypto.randomUUID(), 'STF002', todayStr, 'lunch');
  insertMeal.run(crypto.randomUUID(), 'STF003', todayStr, 'breakfast');
  insertMeal.run(crypto.randomUUID(), 'STF001', todayStr, 'dinner');
}

// --- API ROUTES ---

// --- STAFF ---
app.get('/api/staff', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM staff ORDER BY name ASC');
    const data = stmt.all();
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.post('/api/staff', (req, res) => {
  try {
    const { name, staffId, role } = req.body;
    const id = crypto.randomUUID();
    const stmt = db.prepare('INSERT INTO staff (id, name, staffId, role) VALUES (?, ?, ?, ?)');
    stmt.run(id, name, staffId, role || null);
    
    // Fetch inserted record
    const fetchStmt = db.prepare('SELECT * FROM staff WHERE id = ?');
    const data = fetchStmt.get(id);
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.put('/api/staff/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, staffId, role } = req.body;
    const stmt = db.prepare('UPDATE staff SET name = ?, staffId = ?, role = ? WHERE id = ?');
    stmt.run(name, staffId, role || null, id);
    
    const fetchStmt = db.prepare('SELECT * FROM staff WHERE id = ?');
    const data = fetchStmt.get(id);
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.delete('/api/staff/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM staff WHERE id = ?');
    stmt.run(id);
    res.json({ data: null, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});


// --- MEALS ---
app.get('/api/meals', (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    let data;
    if (date) {
      const stmt = db.prepare('SELECT * FROM meals WHERE date = ?');
      data = stmt.all(date as string);
    } else if (startDate && endDate) {
      const stmt = db.prepare('SELECT * FROM meals WHERE date >= ? AND date <= ?');
      data = stmt.all(startDate as string, endDate as string);
    } else {
      const stmt = db.prepare('SELECT * FROM meals ORDER BY date DESC');
      data = stmt.all();
    }
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.post('/api/meals', (req, res) => {
  try {
    const { staffId, date, mealType } = req.body;
    const id = crypto.randomUUID();
    const stmt = db.prepare('INSERT INTO meals (id, staffId, date, mealType) VALUES (?, ?, ?, ?)');
    stmt.run(id, staffId, date, mealType);
    
    const fetchStmt = db.prepare('SELECT * FROM meals WHERE id = ?');
    const data = fetchStmt.get(id);
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.delete('/api/meals', (req, res) => {
  try {
    const { staffId, date, mealType } = req.query;
    if (staffId && date && mealType) {
      const stmt = db.prepare('DELETE FROM meals WHERE staffId = ? AND date = ? AND mealType = ?');
      stmt.run(staffId as string, date as string, mealType as string);
    } else if (staffId) {
      const stmt = db.prepare('DELETE FROM meals WHERE staffId = ?');
      stmt.run(staffId as string);
    } else {
      throw new Error('Missing filters for delete meals');
    }
    res.json({ data: null, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});


// --- EXPENSES ---
app.get('/api/expenses', (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    let data;
    if (startDate && endDate) {
      const stmt = db.prepare('SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date DESC');
      data = stmt.all(startDate as string, endDate as string);
    } else {
      let queryStr = 'SELECT * FROM expenses ORDER BY date DESC';
      if (limit) {
        queryStr += ` LIMIT ${Number(limit)}`;
      }
      const stmt = db.prepare(queryStr);
      data = stmt.all();
    }
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const { date, description, amount, category } = req.body;
    const id = crypto.randomUUID();
    const stmt = db.prepare('INSERT INTO expenses (id, date, description, amount, category) VALUES (?, ?, ?, ?, ?)');
    stmt.run(id, date, description, Number(amount), category);
    
    const fetchStmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
    const data = fetchStmt.get(id);
    res.json({ data, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    stmt.run(id);
    res.json({ data: null, error: null });
  } catch (err: any) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

export { app as expressApp };
