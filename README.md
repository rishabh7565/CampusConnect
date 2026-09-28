# CampusConnect — College Club Event Management Website

A complete recruitment-task project built with Node.js, Express, HTML, CSS and vanilla JavaScript. Data is persisted in `data/db.json`, so no database setup is required.

## Features
- Responsive student-facing Home and Events pages
- Club introduction and featured event
- Search events by name
- Filter events by category
- Event registration form
- Duplicate-registration protection by email per event
- Admin login
- Add, edit and delete events
- Featured event management
- View, search and filter registered students
- Responsive mobile layout

## Run locally
1. Install Node.js (LTS).
2. Open this folder in VS Code.
3. Open the terminal and run:
   ```bash
   npm install
   npm start
   ```
4. Open `http://localhost:3000`.

## Demo admin login
Username: `admin`
Password: `admin123`

For a real deployment, replace the demo authentication with hashed passwords, sessions/JWT, validation, CSRF protection and a production database.