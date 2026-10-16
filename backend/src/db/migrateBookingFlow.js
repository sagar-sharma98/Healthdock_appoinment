import { query } from './index.js';

export async function migrateBookingFlow() {
  console.log('Running migrateBookingFlow...');
  try {
    // 1. Add columns to appointments table
    const addCol = async (colDef) => {
      try {
        await query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ${colDef}`);
      } catch (e) {
        console.warn(`Could not add column ${colDef}:`, e.message);
      }
    };

    await addCol("consultation_mode VARCHAR(30) DEFAULT 'IN_PERSON'");
    await addCol("branch_name VARCHAR(150) DEFAULT 'Main Clinic - Sector 18'");
    await addCol("booking_for VARCHAR(30) DEFAULT 'MYSELF'");
    await addCol("family_relation VARCHAR(50)");
    await addCol("patient_age INT");
    await addCol("booker_name VARCHAR(150)");
    await addCol("booker_phone VARCHAR(30)");
    await addCol("whatsapp_updates_enabled BOOLEAN DEFAULT TRUE");
    await addCol("consent_record JSONB DEFAULT '{\"dpdp_act_2026\": true, \"version\": \"1.0\"}'::jsonb");
    await addCol("payment_status VARCHAR(30) DEFAULT 'PENDING'");
    await addCol("razorpay_order_id VARCHAR(100)");
    await addCol("razorpay_payment_id VARCHAR(100)");

    // 2. Create OTP verification table
    await query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        phone VARCHAR(30) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await query(`CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verifications(phone)`);

    // 3. Create consent logs table
    await query(`
      CREATE TABLE IF NOT EXISTS consent_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
        consent_type VARCHAR(50) NOT NULL,
        is_granted BOOLEAN NOT NULL,
        actor_type VARCHAR(20) DEFAULT 'PATIENT',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create branches table
    await query(`
      CREATE TABLE IF NOT EXISTS clinic_branches (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(100) DEFAULT 'Delhi NCR',
        phone VARCHAR(30),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure at least default branch exists for organizations
    const orgs = await query(`SELECT id FROM organizations`);
    for (const org of orgs.rows) {
      const existingBranch = await query(`SELECT id FROM clinic_branches WHERE organization_id = $1`, [org.id]);
      if (existingBranch.rowCount === 0) {
        await query(`
          INSERT INTO clinic_branches (organization_id, name, address, phone)
          VALUES 
            ($1, 'Main Clinic - Medical Enclave', 'Plot 42, Health Street, Sector 18', '+91 98765 43210'),
            ($1, 'HealthDock Specialty Hub', 'Tower B, Ground Floor, Cyber City', '+91 98765 43211')
        `, [org.id]);
      }
    }

    console.log('migrateBookingFlow completed successfully!');
  } catch (err) {
    console.error('Error in migrateBookingFlow:', err);
    throw err;
  }
}

// Run if executed directly
if (process.argv[1]?.includes('migrateBookingFlow.js')) {
  migrateBookingFlow()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
