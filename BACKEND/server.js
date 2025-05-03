require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'medical_services',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

// Set up file uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, 'user']
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// User routes
app.get('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const emailCheck = await pool.query(
        'SELECT * FROM users WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email is already in use' });
      }
    }
    
    // Update user
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
      [name, email, req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Service routes
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM services ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/services/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Get provider info if available
    const service = result.rows[0];
    if (service.provider_id) {
      const providerResult = await pool.query(
        'SELECT id, name, specialty FROM users WHERE id = $1',
        [service.provider_id]
      );
      
      if (providerResult.rows.length > 0) {
        service.provider = providerResult.rows[0];
      }
    }
    
    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/services', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { name, description, price, duration, requirements, imageUrl } = req.body;
    
    const result = await pool.query(
      'INSERT INTO services (name, description, price, duration, requirements, image_url, provider_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, description, price, duration, requirements, imageUrl, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/services/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, duration, requirements, imageUrl } = req.body;
    
    // Check if service exists and belongs to the admin
    const serviceCheck = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );
    
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    const result = await pool.query(
      'UPDATE services SET name = $1, description = $2, price = $3, duration = $4, requirements = $5, image_url = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
      [name, description, price, duration, requirements, imageUrl, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/services/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if service exists
    const serviceCheck = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );
    
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Delete service
    await pool.query('DELETE FROM services WHERE id = $1', [id]);
    
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Appointment routes
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    let query;
    let params;
    
    if (req.user.role === 'admin') {
      // Admins can see all appointments
      query = `
        SELECT a.*, s.name as service_name, s.price, s.duration, s.image_url,
        u.name as user_name, u.email as user_email
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        JOIN users u ON a.user_id = u.id
        ORDER BY a.date DESC, a.time ASC
      `;
      params = [];
    } else {
      // Regular users can only see their own appointments
      query = `
        SELECT a.*, s.name as service_name, s.price, s.duration, s.image_url
        FROM appointments a
        JOIN services s ON a.service_id = s.id
        WHERE a.user_id = $1
        ORDER BY a.date DESC, a.time ASC
      `;
      params = [req.user.id];
    }
    
    const result = await pool.query(query, params);
    
    // Format the response
    const appointments = result.rows.map(row => ({
      id: row.id,
      date: row.date,
      time: row.time,
      status: row.status,
      notes: row.notes,
      service: {
        id: row.service_id,
        name: row.service_name,
        price: row.price,
        duration: row.duration,
        imageUrl: row.image_url
      },
      user: req.user.role === 'admin' ? {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email
      } : undefined
    }));
    
    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { serviceId, date, time, notes } = req.body;
    
    // Check if service exists
    const serviceCheck = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [serviceId]
    );
    
    if (serviceCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    // Check if time slot is available
    const timeCheck = await pool.query(
      'SELECT * FROM appointments WHERE service_id = $1 AND date = $2 AND time = $3 AND status != $4',
      [serviceId, date, time, 'cancelled']
    );
    
    if (timeCheck.rows.length > 0) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }
    
    // Create appointment
    const result = await pool.query(
      'INSERT INTO appointments (user_id, service_id, date, time, status, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.user.id, serviceId, date, time, 'pending', notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/appointments/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if appointment exists and belongs to the user
    let appointmentCheck;
    
    if (req.user.role === 'admin') {
      appointmentCheck = await pool.query(
        'SELECT * FROM appointments WHERE id = $1',
        [id]
      );
    } else {
      appointmentCheck = await pool.query(
        'SELECT * FROM appointments WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );
    }
    
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Cancel appointment
    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['cancelled', id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/appointments/:id/confirm', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if appointment exists
    const appointmentCheck = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );
    
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Confirm appointment
    const result = await pool.query(
      'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['confirmed', id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Available time slots endpoint
app.get('/api/appointments/available-slots', authenticateToken, async (req, res) => {
  try {
    const { date, serviceId } = req.query;
    
    if (!date || !serviceId) {
      return res.status(400).json({ message: 'Date and serviceId are required' });
    }
    
    // Get all time slots
    const allTimeSlots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ];
    
    // Get booked slots
    const bookedSlotsResult = await pool.query(
      'SELECT time FROM appointments WHERE service_id = $1 AND date = $2 AND status != $3',
      [serviceId, date, 'cancelled']
    );
    
    const bookedSlots = bookedSlotsResult.rows.map(row => row.time);
    
    // Filter out booked slots
    const availableSlots = allTimeSlots.filter(slot => !bookedSlots.includes(slot));
    
    res.json({ availableSlots });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// File upload endpoint
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Server error during file upload' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});