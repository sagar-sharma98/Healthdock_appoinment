import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '84@#$Sagar'),
};

const targetDb = process.env.DB_NAME || 'healthdock_db';

async function ensureDatabaseExists() {
  const rootClient = new Client({
    ...dbConfig,
    database: 'postgres',
  });

  try {
    await rootClient.connect();
    const res = await rootClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (res.rowCount === 0) {
      console.log(`Database "${targetDb}" does not exist. Creating...`);
      await rootClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`Database "${targetDb}" created successfully.`);
    } else {
      console.log(`Database "${targetDb}" already exists.`);
    }
  } catch (err) {
    console.error('Error verifying database existence:', err.message);
    throw err;
  } finally {
    await rootClient.end();
  }
}

async function initializeSchema() {
  const client = new Client({
    ...dbConfig,
    database: targetDb,
  });

  try {
    await client.connect();
    console.log(`Connected to database "${targetDb}". Removing previous data and tables...`);

    // Reset public schema to cleanly remove old tables & data
    await client.query(`DROP SCHEMA IF EXISTS public CASCADE;`);
    await client.query(`CREATE SCHEMA public;`);
    await client.query(`GRANT ALL ON SCHEMA public TO postgres;`);
    await client.query(`GRANT ALL ON SCHEMA public TO public;`);

    console.log('Previous tables and schema cleared. Creating clean HealthDock structure...');

    const schemaSql = `
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- 1. USERS & AUTH
      CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(30),
          password_hash VARCHAR(255),
          full_name VARCHAR(150) NOT NULL,
          avatar_url TEXT,
          is_email_verified BOOLEAN DEFAULT FALSE,
          is_phone_verified BOOLEAN DEFAULT FALSE,
          account_status VARCHAR(30) DEFAULT 'ACTIVE',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE email_otps (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) NOT NULL,
          otp_code VARCHAR(10) NOT NULL,
          purpose VARCHAR(30) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          attempts INT DEFAULT 0,
          is_used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_email_otps_lookup ON email_otps(email, purpose, is_used, expires_at);

      CREATE TABLE refresh_tokens (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          revoked BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. ORGANIZATIONS / CLINICS
      CREATE TABLE organizations (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(200) NOT NULL,
          legal_name VARCHAR(200),
          slug VARCHAR(100) UNIQUE NOT NULL,
          logo_url TEXT,
          phone VARCHAR(30),
          email VARCHAR(255),
          address_street TEXT,
          city VARCHAR(100),
          state VARCHAR(100),
          pincode VARCHAR(20),
          country VARCHAR(100) DEFAULT 'India',
          plan_tier VARCHAR(50) DEFAULT 'SINGLE_PRACTICE',
          created_by UUID REFERENCES users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. PERMISSIONS & ROLES
      CREATE TABLE permissions (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL
      );

      CREATE TABLE roles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(50) NOT NULL,
          is_system_role BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(organization_id, name)
      );

      CREATE TABLE role_permissions (
          role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
          permission_id VARCHAR(50) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          PRIMARY KEY(role_id, permission_id)
      );

      CREATE TABLE organization_members (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role_id UUID NOT NULL REFERENCES roles(id),
          status VARCHAR(20) DEFAULT 'ACTIVE',
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(organization_id, user_id)
      );

      -- 4. DOCTOR PROFILES & BOOKING PAGES
      CREATE TABLE doctor_profiles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          council_registration_no VARCHAR(100),
          specialty VARCHAR(150),
          qualification VARCHAR(200),
          experience_years INT DEFAULT 0,
          consultation_fee NUMERIC(10, 2) DEFAULT 0.00,
          bio TEXT,
          is_accepting_patients BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE booking_pages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          doctor_profile_id UUID UNIQUE NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          page_name VARCHAR(150) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          logo_url TEXT,
          theme VARCHAR(50) DEFAULT 'Modern Minimal',
          timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
          slot_duration_minutes INT DEFAULT 30,
          buffer_before_minutes INT DEFAULT 0,
          buffer_after_minutes INT DEFAULT 5,
          advance_booking_days INT DEFAULT 30,
          min_notice_hours INT DEFAULT 2,
          is_live BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_booking_pages_slug ON booking_pages(slug);

      CREATE TABLE services (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
          name VARCHAR(150) NOT NULL,
          type VARCHAR(30) DEFAULT 'IN_PERSON',
          duration_minutes INT NOT NULL DEFAULT 30,
          price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 5. AVAILABILITY SCHEDULES
      CREATE TABLE availability_schedules (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
          day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(doctor_profile_id, day_of_week)
      );

      CREATE TABLE schedule_time_blocks (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          schedule_id UUID NOT NULL REFERENCES availability_schedules(id) ON DELETE CASCADE,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          max_tokens_per_slot INT DEFAULT 1,
          CONSTRAINT check_valid_time_range CHECK (start_time < end_time)
      );

      CREATE TABLE date_overrides (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
          override_date DATE NOT NULL,
          is_available BOOLEAN DEFAULT FALSE,
          custom_start_time TIME,
          custom_end_time TIME,
          reason VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(doctor_profile_id, override_date)
      );

      -- 6. PATIENTS & APPOINTMENTS
      CREATE TABLE patients (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          phone VARCHAR(30) NOT NULL,
          email VARCHAR(255),
          full_name VARCHAR(150) NOT NULL,
          gender VARCHAR(20),
          age INT,
          blood_group VARCHAR(10),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_patients_phone ON patients(phone);

      CREATE TABLE appointments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          booking_reference VARCHAR(30) UNIQUE NOT NULL,
          daily_token VARCHAR(10) NOT NULL,
          organization_id UUID NOT NULL REFERENCES organizations(id),
          doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id),
          service_id UUID REFERENCES services(id),
          patient_id UUID NOT NULL REFERENCES patients(id),
          appointment_date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          status VARCHAR(30) DEFAULT 'CONFIRMED',
          patient_notes TEXT,
          doctor_prescription TEXT,
          cancellation_reason TEXT,
          consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
          is_paid BOOLEAN DEFAULT FALSE,
          payment_method VARCHAR(50) DEFAULT 'PAY_AT_CLINIC',
          booked_channel VARCHAR(30) DEFAULT 'ONLINE_BOOKING_LINK',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_profile_id, appointment_date, status);
      CREATE INDEX idx_appointments_org_date ON appointments(organization_id, appointment_date);

      CREATE TABLE appointment_audit_logs (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
          previous_status VARCHAR(30),
          new_status VARCHAR(30) NOT NULL,
          changed_by_user_id UUID REFERENCES users(id),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. ANALYTICS
      CREATE TABLE page_daily_analytics (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          booking_page_id UUID NOT NULL REFERENCES booking_pages(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          total_visits INT DEFAULT 0,
          unique_visitors INT DEFAULT 0,
          total_bookings INT DEFAULT 0,
          cancellations INT DEFAULT 0,
          reschedules INT DEFAULT 0,
          UNIQUE(booking_page_id, date)
      );
    `;

    await client.query(schemaSql);
    console.log('Database tables successfully created!');

    // Seed default permissions
    const permissions = [
      ['appointments:read_own', 'View Own Appointments', 'DOCTOR', 'APPOINTMENTS'],
      ['appointments:manage_own', 'Manage Own Appointments', 'DOCTOR', 'APPOINTMENTS'],
      ['appointments:manage_all', 'Manage All Clinic Appointments', 'ADMIN', 'APPOINTMENTS'],
      ['slots:manage_own', 'Configure Own Availability Slots', 'DOCTOR', 'SLOTS'],
      ['page:manage_own', 'Customize Own Booking Page', 'DOCTOR', 'PAGE'],
      ['team:invite', 'Invite Team Members and Doctors', 'ADMIN', 'TEAM'],
      ['clinic:manage', 'Manage Clinic Profile and Settings', 'ADMIN', 'CLINIC'],
    ];

    for (const [id, name, desc, cat] of permissions) {
      await client.query(
        `INSERT INTO permissions (id, name, description, category) 
         VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [id, name, desc, cat]
      );
    }

    console.log('Default permissions seeded successfully.');
  } catch (err) {
    console.error('Error initializing schema:', err);
    throw err;
  } finally {
    await client.end();
  }
}

async function run() {
  try {
    await ensureDatabaseExists();
    await initializeSchema();
    console.log('✅ HealthDock database initialized completely!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
    process.exit(1);
  }
}

run();
