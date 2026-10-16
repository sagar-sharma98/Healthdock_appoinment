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

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to DB. Checking and adding columns...');

    await client.query(`
      ALTER TABLE availability_schedules 
      ADD COLUMN IF NOT EXISTS shift_type VARCHAR(50) DEFAULT 'MORNING',
      ADD COLUMN IF NOT EXISTS slot_duration_minutes INT DEFAULT 30,
      ADD COLUMN IF NOT EXISTS max_patients_per_slot INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS max_accompanying_persons INT DEFAULT 0;
    `);

    // In case uniqueness was doctor_profile_id + day_of_week, if we have morning and evening shifts for the same day,
    // let's drop the old constraint if needed and make it (doctor_profile_id, day_of_week, shift_type)
    await client.query(`
      ALTER TABLE availability_schedules DROP CONSTRAINT IF EXISTS availability_schedules_doctor_profile_id_day_of_week_key;
      ALTER TABLE availability_schedules DROP CONSTRAINT IF EXISTS availability_schedules_doctor_profile_id_day_of_week_shift_type_key;
      ALTER TABLE availability_schedules ADD CONSTRAINT availability_schedules_doctor_profile_id_day_of_week_shift_type_key UNIQUE (doctor_profile_id, day_of_week, shift_type);
    `);

    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

migrate();
