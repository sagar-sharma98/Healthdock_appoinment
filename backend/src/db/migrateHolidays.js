import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pkg;
const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || '84@#$Sagar'),
  database: process.env.DB_NAME || 'healthdock_db',
});

async function migrateHolidays() {
  try {
    await client.connect();
    console.log('Connected to DB. Creating holiday and doctor leave tables if not exist...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS hospital_holidays (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        holiday_type VARCHAR(50) DEFAULT 'PUBLIC',
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS doctor_leaves (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        leave_type VARCHAR(50) DEFAULT 'CASUAL',
        session VARCHAR(20) DEFAULT 'FULL_DAY',
        reason TEXT,
        status VARCHAR(30) DEFAULT 'APPROVED',
        substitute_doctor_id UUID REFERENCES doctor_profiles(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_hospital_holidays_dates ON hospital_holidays(start_date, end_date);
      CREATE INDEX IF NOT EXISTS idx_doctor_leaves_doctor_dates ON doctor_leaves(doctor_profile_id, start_date, end_date);
    `);

    console.log('✅ Holiday and leave tables verified without dummy data!');

    console.log('✅ Holiday migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrateHolidays();
