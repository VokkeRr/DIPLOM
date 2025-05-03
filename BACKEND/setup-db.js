require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'medical_services',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

const setupDatabase = async () => {
  try {
    // Create tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        specialty VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        duration INTEGER,
        requirements TEXT,
        image_url TEXT,
        provider_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        service_id INTEGER REFERENCES services(id) NOT NULL,
        date DATE NOT NULL,
        time VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create admin user
    const adminExists = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
    
    if (adminExists.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Admin User', 'admin@example.com', hashedPassword, 'admin']
      );
      
      console.log('Admin user created: admin@example.com / admin123');
    }

    // Create regular user
    const userExists = await pool.query('SELECT * FROM users WHERE email = $1', ['user@example.com']);
    
    if (userExists.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('user123', salt);
      
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Regular User', 'user@example.com', hashedPassword, 'user']
      );
      
      console.log('Regular user created: user@example.com / user123');
    }

    // Create sample services
    const servicesExist = await pool.query('SELECT * FROM services LIMIT 1');
    
    if (servicesExist.rows.length === 0) {
      const adminResult = await pool.query('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
      const adminId = adminResult.rows[0].id;
      
      const sampleServices = [
        {
          name: 'COVID-19 Vaccination',
          description: 'Get your COVID-19 vaccine administered by our certified healthcare professionals. We offer various approved vaccines.',
          price: 0.00,
          duration: 30,
          requirements: 'Please bring your ID and any previous vaccination records. Wear clothing that allows easy access to your upper arm.',
          image_url: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?q=80&w=2072&auto=format&fit=crop',
          provider_id: adminId
        },
        {
          name: 'Flu Vaccination',
          description: 'Annual flu vaccination to protect against seasonal influenza. Recommended for everyone 6 months and older.',
          price: 25.00,
          duration: 15,
          requirements: 'No special requirements. Please inform us of any allergies before the appointment.',
          image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop',
          provider_id: adminId
        },
        {
          name: 'General Health Checkup',
          description: 'Comprehensive health assessment including vital signs, blood tests, and consultation with a physician.',
          price: 120.00,
          duration: 60,
          requirements: 'Please fast for 8 hours before the appointment if blood tests are required.',
          image_url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=2070&auto=format&fit=crop',
          provider_id: adminId
        },
        {
          name: 'Dental Cleaning',
          description: 'Professional dental cleaning service to maintain oral hygiene and prevent dental issues.',
          price: 80.00,
          duration: 45,
          requirements: 'Brush and floss before your appointment. Bring any dental appliances you use.',
          image_url: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?q=80&w=2074&auto=format&fit=crop',
          provider_id: adminId
        },
        {
          name: 'Physical Therapy Session',
          description: 'Personalized physical therapy session to address injuries, chronic pain, or mobility issues.',
          price: 90.00,
          duration: 60,
          requirements: 'Wear comfortable clothing that allows movement. Bring any previous medical records related to your condition.',
          image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop',
          provider_id: adminId
        }
      ];
      
      for (const service of sampleServices) {
        await pool.query(
          'INSERT INTO services (name, description, price, duration, requirements, image_url, provider_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [service.name, service.description, service.price, service.duration, service.requirements, service.image_url, service.provider_id]
        );
      }
      
      console.log('Sample services created');
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Database setup error:', error);
  } finally {
    await pool.end();
  }
};

setupDatabase();