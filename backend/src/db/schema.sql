-- ==========================================================
-- HEALTHDOCK MULTI-DOCTOR APPOINTMENT SYSTEM DATABASE SCHEMA
-- PostgreSQL DDL Script
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & AUTHENTICATION
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(30) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(150) NOT NULL,
    avatar_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    account_status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'PENDING_ONBOARDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OTP FOR SIGNUP AND LOGIN (EMAIL OTP FLOW)
CREATE TABLE email_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    purpose VARCHAR(30) NOT NULL CHECK (purpose IN ('SIGNUP', 'LOGIN', 'PASSWORD_RESET')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INT DEFAULT 0,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_otps_lookup ON email_otps(email, purpose, is_used, expires_at);

-- JWT REFRESH TOKENS
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. CLINICS / HOSPITALS (ORGANIZATIONS)
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
    plan_tier VARCHAR(50) DEFAULT 'SINGLE_PRACTICE' CHECK (plan_tier IN ('SINGLE_PRACTICE', 'MULTI_DOCTOR', 'ENTERPRISE')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PERMISSIONS & ROLE-BASED ACCESS CONTROL (RBAC)
CREATE TABLE permissions (
    id VARCHAR(50) PRIMARY KEY, -- 'appointments:read_own', 'appointments:manage_all', 'team:invite', etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- 'CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST', 'STAFF'
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
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'INACTIVE')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, user_id)
);

-- 4. DOCTOR PROFILES & BOOKING PAGES (Matches Screenshot 1 & 2)
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
    page_name VARCHAR(150) NOT NULL,         -- e.g. "sagar sharma"
    slug VARCHAR(100) UNIQUE NOT NULL,        -- e.g. "sagar-sharma"
    description TEXT,                        -- e.g. "Welcome to my scheduling page..."
    logo_url TEXT,
    logo_shape VARCHAR(30) DEFAULT 'Rounded',
    color_mode VARCHAR(20) DEFAULT 'System',
    remove_branding BOOLEAN DEFAULT FALSE,
    layout_style VARCHAR(30) DEFAULT 'SPLIT_2_COL',
    corner_radius VARCHAR(20) DEFAULT 'Rounded',
    bg_style VARCHAR(30) DEFAULT 'Mesh Gradient',
    card_finish VARCHAR(30) DEFAULT 'Glassmorphic',
    cover_banner_url TEXT DEFAULT '',
    button_style VARCHAR(20) DEFAULT 'Solid',
    theme VARCHAR(50) DEFAULT 'Modern Minimal', -- 'Retro Arcade', 'Claude', 'Claymorphism', etc.
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
    type VARCHAR(30) DEFAULT 'IN_PERSON' CHECK (type IN ('IN_PERSON', 'VIDEO_CONSULT', 'HOME_VISIT')),
    duration_minutes INT NOT NULL DEFAULT 30,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. AVAILABILITY SCHEDULES & SLOTS ENGINE
CREATE TABLE availability_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon, ..., 6=Sat
    shift_type VARCHAR(50) DEFAULT 'MORNING',
    slot_duration_minutes INT DEFAULT 30,
    max_patients_per_slot INT DEFAULT 1,
    max_accompanying_persons INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_profile_id, day_of_week, shift_type)
);

CREATE TABLE schedule_time_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES availability_schedules(id) ON DELETE CASCADE,
    start_time TIME NOT NULL, -- e.g. 09:00:00
    end_time TIME NOT NULL,   -- e.g. 13:00:00
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

-- 6. PATIENTS & APPOINTMENTS (Matches Screenshot 3)
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
    booking_reference VARCHAR(30) UNIQUE NOT NULL, -- e.g. "APT-1081"
    daily_token VARCHAR(10) NOT NULL,              -- e.g. "07"
    organization_id UUID NOT NULL REFERENCES organizations(id),
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id),
    service_id UUID REFERENCES services(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    status VARCHAR(30) DEFAULT 'CONFIRMED' CHECK (
        status IN ('PENDING', 'CONFIRMED', 'WAITING_IN_LOUNGE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW')
    ),
    
    patient_notes TEXT,
    doctor_prescription TEXT,
    cancellation_reason TEXT,
    
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_paid BOOLEAN DEFAULT FALSE,
    payment_method VARCHAR(50) DEFAULT 'PAY_AT_CLINIC',
    
    consultation_mode VARCHAR(30) DEFAULT 'IN_PERSON',
    branch_name VARCHAR(150) DEFAULT 'Main Clinic - Sector 18',
    booking_for VARCHAR(30) DEFAULT 'MYSELF',
    family_relation VARCHAR(50),
    patient_age INT,
    booker_name VARCHAR(150),
    booker_phone VARCHAR(30),
    whatsapp_updates_enabled BOOLEAN DEFAULT TRUE,
    consent_record JSONB DEFAULT '{"dpdp_act_2026": true, "version": "1.0"}'::jsonb,
    payment_status VARCHAR(30) DEFAULT 'PENDING',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    booked_channel VARCHAR(30) DEFAULT 'ONLINE_BOOKING_LINK' CHECK (booked_channel IN ('ONLINE_BOOKING_LINK', 'WALK_IN_RECEPTION', 'PHONE_CALL')),
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

-- 7. CLINIC BRANCHES & BOOKING FLOW ENHANCEMENTS
CREATE TABLE clinic_branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) DEFAULT 'Delhi NCR',
    phone VARCHAR(30),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(30) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_otp_phone ON otp_verifications(phone);

CREATE TABLE consent_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,
    is_granted BOOLEAN NOT NULL,
    actor_type VARCHAR(20) DEFAULT 'PATIENT',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. HOSPITAL HOLIDAYS & DOCTOR LEAVES
CREATE TABLE hospital_holidays (
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

CREATE TABLE doctor_leaves (
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
CREATE INDEX idx_hospital_holidays_dates ON hospital_holidays(start_date, end_date);
CREATE INDEX idx_doctor_leaves_doctor_dates ON doctor_leaves(doctor_profile_id, start_date, end_date);

-- 9. DOCTOR SLOT BLOCKS
CREATE TABLE doctor_slot_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_profile_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    block_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    reason VARCHAR(255) DEFAULT 'Blocked by Doctor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (doctor_profile_id, block_date, start_time)
);

-- 10. ANALYTICS
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
