import { query } from './index.js';

async function migrate() {
  console.log('Running doctor slot blocks migration...');
  await query(`
    CREATE TABLE IF NOT EXISTS doctor_slot_blocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
      block_date DATE NOT NULL,
      start_time TIME NOT NULL,
      end_time TIME,
      reason VARCHAR(255) DEFAULT 'Blocked by Doctor',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE (doctor_profile_id, block_date, start_time)
    );
  `);
  console.log('doctor_slot_blocks table created/verified successfully.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
