import { query } from './index.js';

async function migrate() {
  try {
    await query(`
      ALTER TABLE booking_pages 
      ADD COLUMN IF NOT EXISTS logo_shape VARCHAR(30) DEFAULT 'Rounded',
      ADD COLUMN IF NOT EXISTS color_mode VARCHAR(20) DEFAULT 'System',
      ADD COLUMN IF NOT EXISTS remove_branding BOOLEAN DEFAULT FALSE;
    `);
    console.log('Successfully added appearance columns to booking_pages.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
