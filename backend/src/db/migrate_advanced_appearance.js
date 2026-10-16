import { query } from './index.js';

async function migrateAdvancedAppearance() {
  try {
    await query(`
      ALTER TABLE booking_pages 
      ADD COLUMN IF NOT EXISTS layout_style VARCHAR(30) DEFAULT 'SPLIT_2_COL',
      ADD COLUMN IF NOT EXISTS corner_radius VARCHAR(20) DEFAULT 'Rounded',
      ADD COLUMN IF NOT EXISTS bg_style VARCHAR(30) DEFAULT 'Mesh Gradient',
      ADD COLUMN IF NOT EXISTS card_finish VARCHAR(30) DEFAULT 'Glassmorphic',
      ADD COLUMN IF NOT EXISTS cover_banner_url TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS button_style VARCHAR(20) DEFAULT 'Solid';
    `);
    console.log('Successfully added advanced appearance columns to booking_pages.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateAdvancedAppearance();
