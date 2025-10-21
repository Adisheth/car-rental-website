const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const Database = require('better-sqlite3');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();

// Serve static files (CSS, JS, images) from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Initialize database
const db = new Database(path.join(__dirname, 'rental.db'));
db.pragma('journal_mode = WAL');


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    createParentPath: true
}));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/image', express.static(path.join(__dirname, 'image')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to check auth status for views
app.use((req, res, next) => {
    const token = req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = db.prepare('SELECT id, email, first_name, last_name, is_admin FROM users WHERE id = ?').get(decoded.userId);
            if (user) {
                res.locals.user = {
                    userId: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    isAdmin: Boolean(user.is_admin)
                };
            } else {
                res.locals.user = null;
            }
        } catch (err) {
            res.locals.user = null;
        }
    } else {
        res.locals.user = null;
    }
    next();
});

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Serve a dynamic placeholder SVG for missing placeholder.svg requests
app.get('/placeholder.svg', (req, res) => {
  const width = parseInt(req.query.width) || 1200;
  const height = parseInt(req.query.height) || 400;
  const text = (req.query.text && decodeURIComponent(req.query.text)) || '';
  const opacity = parseFloat(req.query.opacity) || 0.06;

  res.setHeader('Content-Type', 'image/svg+xml');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>\
  <svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>\
    <rect width='100%' height='100%' fill='#f3f4f6' />\
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' opacity='${opacity}' font-family='Arial, Helvetica, sans-serif' font-size='24'>${text}</text>\
  </svg>`;

  res.send(svg);
});

// --- DATABASE SETUP ---
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password TEXT NOT NULL,
      is_admin BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS cars (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price NUMERIC NOT NULL,
      rating REAL,
      seats INTEGER,
      transmission TEXT,
      fuel TEXT,
      image TEXT,
      badge TEXT,
      features TEXT,
      available BOOLEAN DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      car_id TEXT,
      user_id TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_price NUMERIC NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  // Create image directory if it doesn't exist
  const imageDir = path.join(__dirname, 'public', 'image', 'cars');
  if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
  }

  console.log('✓ Database tables ready');
} catch (error) {
  console.error('Error creating tables:', error);
}

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Authentication required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// --- ADMIN MIDDLEWARE ---
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.redirect('/');
  }
  next();
};

// --- REGISTER ---
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = db.prepare('SELECT lower(hex(randomblob(16))) as id').get().id;

    db.prepare(`
      INSERT INTO users (id, first_name, last_name, email, phone, password)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, firstName, lastName, email, phone, hashedPassword);

    const userData = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(userId);

    const token = jwt.sign({ 
      userId, 
      email, 
      firstName, 
      lastName,
      isAdmin: userData.is_admin 
    }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    console.log(`✓ User registered: ${email}`);
    res.redirect('/signin');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// --- LOGIN ---
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.render('signin', { error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.render('signin', { error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        firstName: user.first_name, 
        lastName: user.last_name,
        isAdmin: user.is_admin
      },
      JWT_SECRET,
      { expiresIn: remember ? '30d' : '24h' }
    );

    const maxAge = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge
    });

    if (user.is_admin) {
      res.redirect('/dashboard');
    } else {
      res.redirect('/');
    }
  } catch (error) {
    console.error('Login error:', error);
    res.render('signin', { error: 'An error occurred during login. Please try again.' });
  }
});

// --- LOGOUT ---
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/signin');
});

// --- PROTECTED PROFILE ---
app.get('/api/profile', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, email, first_name, last_name, phone FROM users WHERE id = ?').get(req.user.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ user });
});

// --- CAR MANAGEMENT API ---

// Get all cars (public)
app.get('/api/cars', (req, res) => {
    try {
        const cars = db.prepare('SELECT * FROM cars ORDER BY created_at DESC').all();
        res.json(cars);
    } catch (error) {
        console.error('Error fetching cars:', error);
        res.status(500).json({ error: 'Failed to fetch cars' });
    }
});

// Get single car
app.get('/api/cars/:id', (req, res) => {
    try {
        const { id } = req.params;
        const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        res.json(car);
    } catch (error) {
        console.error('Error fetching car:', error);
        res.status(500).json({ error: 'Failed to fetch car' });
    }
});

// Add new car (admin only)
app.post('/api/cars', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, category, price, rating, seats, transmission, fuel, badge, features } = req.body;
        
        if (!name || !price || !seats || !transmission || !fuel) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const carId = db.prepare('SELECT lower(hex(randomblob(16))) as id').get().id;
        
        // Handle image upload
        let imagePath = null;
        if (req.files && req.files.image) {
            const image = req.files.image;
            const fileName = `${carId}-${Date.now()}-${image.name}`;
            imagePath = `/image/cars/${fileName}`;
            const uploadPath = path.join(__dirname, 'public', 'image', 'cars', fileName);
            await image.mv(uploadPath);
        }

        db.prepare(`
            INSERT INTO cars (id, name, category, price, rating, seats, transmission, fuel, image, badge, features, available)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(carId, name, category, price, rating || null, seats, transmission, fuel, imagePath, badge || null, features || null);

        console.log(`✓ Car added: ${name}`);
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error adding car:', error);
        res.status(500).json({ error: 'Failed to add car', details: error.message });
    }
});

// Update car (admin only)
app.put('/api/cars/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, price, rating, seats, transmission, fuel, badge, features } = req.body;
        
        // Check if car exists
        const existingCar = db.prepare('SELECT * FROM cars WHERE id = ?').get(id);
        if (!existingCar) {
            return res.status(404).json({ error: 'Car not found' });
        }

        let updates = [];
        let values = [];
        
        if (name) { updates.push('name = ?'); values.push(name); }
        if (category) { updates.push('category = ?'); values.push(category); }
        if (price) { updates.push('price = ?'); values.push(price); }
        if (rating !== undefined) { updates.push('rating = ?'); values.push(rating || null); }
        if (seats) { updates.push('seats = ?'); values.push(seats); }
        if (transmission) { updates.push('transmission = ?'); values.push(transmission); }
        if (fuel) { updates.push('fuel = ?'); values.push(fuel); }
        if (badge !== undefined) { updates.push('badge = ?'); values.push(badge || null); }
        if (features !== undefined) { updates.push('features = ?'); values.push(features || null); }
        
        // Handle image upload
        if (req.files && req.files.image) {
            const image = req.files.image;
            const fileName = `${id}-${Date.now()}-${image.name}`;
            const imagePath = `/image/cars/${fileName}`;
            const uploadPath = path.join(__dirname, 'public', 'image', 'cars', fileName);
            await image.mv(uploadPath);
            
            // Delete old image if exists
            if (existingCar.image) {
                const oldImagePath = path.join(__dirname, 'public', existingCar.image);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            
            updates.push('image = ?');
            values.push(imagePath);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        
        db.prepare(`
            UPDATE cars 
            SET ${updates.join(', ')}
            WHERE id = ?
        `).run(...values);
        
        console.log(`✓ Car updated: ${id}`);
        res.json({ message: 'Car updated successfully' });
    } catch (error) {
        console.error('Error updating car:', error);
        res.status(500).json({ error: 'Failed to update car', details: error.message });
    }
});

// Toggle car availability (admin only)
app.put('/api/cars/:id/availability', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        const { available } = req.body;
        
        const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        db.prepare('UPDATE cars SET available = ? WHERE id = ?').run(available ? 1 : 0, id);
        
        console.log(`✓ Car availability updated: ${id} -> ${available}`);
        res.json({ message: 'Availability updated successfully' });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ error: 'Failed to update availability' });
    }
});

// Delete car (admin only)
app.delete('/api/cars/:id', authenticateToken, requireAdmin, (req, res) => {
    try {
        const { id } = req.params;
        
        const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(id);
        if (!car) {
            return res.status(404).json({ error: 'Car not found' });
        }
        
        // Delete image file if exists
        if (car.image) {
            const imagePath = path.join(__dirname, 'public', car.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Check if car has active bookings
        const activeBookings = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE car_id = ? AND status != ?').get(id, 'cancelled');
        if (activeBookings.count > 0) {
            return res.status(400).json({ error: 'Cannot delete car with active bookings' });
        }
        
        db.prepare('DELETE FROM cars WHERE id = ?').run(id);
        
        console.log(`✓ Car deleted: ${id}`);
        res.json({ message: 'Car deleted successfully' });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({ error: 'Failed to delete car' });
    }
});

// --- EJS ROUTES ---
app.get('/', (req, res) => {
  const featuredCars = db.prepare(`
    SELECT * FROM cars
    WHERE available = 1
    ORDER BY created_at DESC
    LIMIT 6
  `).all();
  res.render('index', { featuredCars });
});
app.get('/signup', (req, res) => res.render('signup'));
app.get('/signin', (req, res) => res.render('signin'));
app.get('/dashboard', authenticateToken, requireAdmin, (req, res) => res.render('admin-dashboard'));

// Public Pages
app.get('/cars', (req, res) => {
    const cars = db.prepare(`
        SELECT * FROM cars 
        WHERE available = 1
        ORDER BY created_at DESC
    `).all();
    res.render('cars', { cars });
});

app.get('/locations', (req, res) => res.render('locations'));
app.get('/insurance', (req, res) => res.render('insurance'));
app.get('/support', (req, res) => res.render('support'));

// Protected Routes
app.get('/profile', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT id, email, first_name, last_name, phone FROM users WHERE id = ?').get(req.user.userId);
    res.render('profile', { user });
});

app.get('/bookings', authenticateToken, (req, res) => {
    const bookings = db.prepare(`
        SELECT b.*, c.name as car_name, c.image as car_image 
        FROM bookings b 
        JOIN cars c ON b.car_id = c.id 
        WHERE b.user_id = ?
        ORDER BY b.created_at DESC
    `).all(req.user.userId);
    res.render('bookings', { bookings });
});

// Logout Route
app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/signin');
});

// Legal Pages
app.get('/privacy-policy', (req, res) => res.render('privacy-policy'));
app.get('/terms-of-service', (req, res) => res.render('terms-of-service'));
app.get('/cookie-policy', (req, res) => res.render('cookie-policy'));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});


app.post('/book', (req, res) => {
  const { car_id, start_date, end_date, location, name, phone, email } = req.body;

  // Get car details to calculate total price
  const car = db.prepare('SELECT * FROM cars WHERE id = ?').get(car_id);
  if (!car) return res.status(404).send('Car not found');

  // Calculate total days
  const start = new Date(start_date);
  const end = new Date(end_date);
  const diffTime = Math.abs(end - start);
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const total_price = totalDays * car.price_per_day;

  // Insert booking into database
  const stmt = db.prepare(`
    INSERT INTO bookings (car_id, user_id, start_date, end_date, total_price, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  // store customer's name in user_id column (schema remains unchanged)
  stmt.run(car_id, name || null, start_date, end_date, total_price, 'Pending');

  res.redirect('/book-success'); // redirect to success page
});

app.get('/book-success', (req, res) => {
  res.render('book-success');
});


app.post('/bookings', (req, res) => {
  const { carId, name, email, phone, location, startDate, endDate } = req.body;

  try {
    const stmt = db.prepare(`
      INSERT INTO bookings (car_id, user_id, start_date, end_date, total_price, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    // Store provided name into user_id column to avoid schema changes
    stmt.run(carId, name || null, startDate, endDate, 0, 'Pending');
    res.status(200).send('Booking saved');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving booking');
  }
});

app.get('/booking', (req, res) => {
  res.render('booking'); // booking.ejs
});



module.exports = db;