import { query } from './src/db/index.js';

async function clearDummy() {
  try {
    await query('DELETE FROM hospital_holidays');
    await query('DELETE FROM doctor_leaves');
    await query("DELETE FROM date_overrides WHERE reason LIKE 'Doctor Leave%'");
    console.log('✅ All dummy holidays and doctor leaves cleared successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing dummy data:', err);
    process.exit(1);
  }
}

clearDummy();
