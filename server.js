const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'data', 'db.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function nextId(items) {
  return items.length ? Math.max(...items.map(x => Number(x.id))) + 1 : 1;
}

app.get('/api/events', (req, res) => {
  const db = readDB();
  let events = db.events;
  const q = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '').trim().toLowerCase();
  if (q) events = events.filter(e => e.name.toLowerCase().includes(q));
  if (category && category !== 'all') events = events.filter(e => e.category.toLowerCase() === category);
  events.sort((a,b) => new Date(a.date) - new Date(b.date));
  res.json(events);
});

app.get('/api/events/:id', (req, res) => {
  const event = readDB().events.find(e => e.id === Number(req.params.id));
  if (!event) return res.status(404).json({error:'Event not found'});
  res.json(event);
});

app.post('/api/registrations', (req, res) => {
  const { name, email, collegeYear, phone, eventId } = req.body;
  if (!name || !email || !collegeYear || !phone || !eventId) return res.status(400).json({error:'All fields are required'});
  const db = readDB();
  const event = db.events.find(e => e.id === Number(eventId));
  if (!event) return res.status(404).json({error:'Event not found'});
  const duplicate = db.registrations.find(r => r.eventId === Number(eventId) && r.email.toLowerCase() === email.toLowerCase());
  if (duplicate) return res.status(409).json({error:'This email is already registered for this event.'});
  const registration = {
    id: nextId(db.registrations), eventId: Number(eventId), eventName: event.name,
    name: String(name).trim(), email: String(email).trim(), collegeYear: String(collegeYear).trim(), phone: String(phone).trim(),
    registeredAt: new Date().toISOString()
  };
  db.registrations.push(registration);
  writeDB(db);
  res.status(201).json({message:'Registration successful', registration});
});

function admin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (token !== 'campusconnect-admin-2026') return res.status(401).json({error:'Unauthorized'});
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') return res.json({token:'campusconnect-admin-2026'});
  res.status(401).json({error:'Invalid username or password'});
});

app.get('/api/admin/registrations', admin, (req, res) => {
  let rows = readDB().registrations;
  const q = String(req.query.q || '').trim().toLowerCase();
  const eventId = String(req.query.eventId || '').trim();
  if (q) rows = rows.filter(r => [r.name,r.email,r.collegeYear,r.phone,r.eventName].some(v => String(v).toLowerCase().includes(q)));
  if (eventId && eventId !== 'all') rows = rows.filter(r => r.eventId === Number(eventId));
  rows.sort((a,b) => new Date(b.registeredAt) - new Date(a.registeredAt));
  res.json(rows);
});

app.post('/api/admin/events', admin, (req, res) => {
  const { name, category, date, time, venue, description, featured } = req.body;
  if (!name || !category || !date || !time || !venue || !description) return res.status(400).json({error:'All event fields are required'});
  const db = readDB();
  if (featured) db.events.forEach(e => e.featured = false);
  const event = { id: nextId(db.events), name, category, date, time, venue, description, featured: !!featured };
  db.events.push(event); writeDB(db); res.status(201).json(event);
});

app.put('/api/admin/events/:id', admin, (req, res) => {
  const db = readDB();
  const event = db.events.find(e => e.id === Number(req.params.id));
  if (!event) return res.status(404).json({error:'Event not found'});
  const { name, category, date, time, venue, description, featured } = req.body;
  if (!name || !category || !date || !time || !venue || !description) return res.status(400).json({error:'All event fields are required'});
  if (featured) db.events.forEach(e => e.featured = false);
  Object.assign(event, {name, category, date, time, venue, description, featured: !!featured});
  writeDB(db); res.json(event);
});

app.delete('/api/admin/events/:id', admin, (req, res) => {
  const db = readDB();
  const id = Number(req.params.id);
  const exists = db.events.some(e => e.id === id);
  if (!exists) return res.status(404).json({error:'Event not found'});
  db.events = db.events.filter(e => e.id !== id);
  db.registrations = db.registrations.filter(r => r.eventId !== id);
  writeDB(db); res.json({message:'Event deleted'});
});

app.get('*', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT, () => console.log(`CampusConnect running at http://localhost:${PORT}`));