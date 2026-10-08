-- ===================================================================
-- MySQL Database Schema: Doctor Appointment & Clinical Scheduling System
-- Mini Project 2: Patient & Doctor Workload Scheduling (16 Slots Max)
-- ===================================================================

CREATE DATABASE IF NOT EXISTS doctor_appointment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE doctor_appointment_db;

-- 1. HOSPITALS (Hierarchy: Nearest Hospitals)
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    distance_km DECIMAL(4, 1) DEFAULT 0.0,
    rating DECIMAL(3, 2) DEFAULT 4.8,
    phone VARCHAR(25) NOT NULL,
    emergency_phone VARCHAR(25) DEFAULT '108',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS (Hierarchy: Departments within Hospital)
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Stethoscope',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hospital to Department mapping
CREATE TABLE IF NOT EXISTS hospital_departments (
    hospital_id VARCHAR(36),
    department_id VARCHAR(36),
    PRIMARY KEY (hospital_id, department_id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 3. DOCTORS (With 16 patients per 8-hour workday constraint)
CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(36) PRIMARY KEY,
    hospital_id VARCHAR(36) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    specialization VARCHAR(150) NOT NULL,
    qualification VARCHAR(150) NOT NULL,
    experience_years INT DEFAULT 5,
    consultation_fee DECIMAL(10, 2) DEFAULT 600.00,
    cabin VARCHAR(100) DEFAULT 'Room 101',
    phone VARCHAR(25),
    email VARCHAR(150),
    rating DECIMAL(3, 2) DEFAULT 4.9,
    bio TEXT,
    max_patients_per_day INT DEFAULT 16,
    shift_start TIME DEFAULT '09:00:00',
    shift_end TIME DEFAULT '17:00:00',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 4. PATIENTS (Personal Health Records, Contact, Vitals & Nurse Entries)
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(10) DEFAULT 'Other',
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    blood_group VARCHAR(10) DEFAULT 'O+',
    hospital_id VARCHAR(36),
    bp VARCHAR(25) DEFAULT '120/80 mmHg',
    heart_rate VARCHAR(25) DEFAULT '74 bpm',
    spo2 VARCHAR(25) DEFAULT '98%',
    sugar VARCHAR(25) DEFAULT '96 mg/dL',
    temp VARCHAR(25) DEFAULT '98.4 °F',
    weight VARCHAR(25) DEFAULT '68 kg',
    respiration_rate VARCHAR(25) DEFAULT '16 breaths/min',
    last_vitals_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vitals_recorded_by VARCHAR(150) DEFAULT 'Staff Nurse',
    chronic_conditions JSON,
    allergies JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL
);

-- 4b. PATIENT HEALTH NOTES (Clinical Observations Documented by Nurses & Doctors)
CREATE TABLE IF NOT EXISTS patient_health_notes (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    note TEXT NOT NULL,
    recorded_by VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'Staff Nurse',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 5. APPOINTMENTS (Matches Screenshot 1, 3, 4 with #SN, ID, Patient, Disease, Doctor, Date, Time, Day)
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sn INT,
    patient_id VARCHAR(36),
    patient_name VARCHAR(150) NOT NULL,
    patient_age INT,
    patient_phone VARCHAR(25),
    patient_disease VARCHAR(255) NOT NULL,
    patient_address TEXT,
    doctor_id VARCHAR(36) NOT NULL,
    doctor_name VARCHAR(150) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_day VARCHAR(20) NOT NULL,
    slot_time VARCHAR(10) NOT NULL,
    status ENUM('Scheduled', 'In Consultation', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_doctor_date_slot (doctor_id, appointment_date, slot_time),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- 6. PRESCRIPTIONS (Patient Medical History & Treatment Plans)
CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(36) PRIMARY KEY,
    appointment_id INT,
    patient_name VARCHAR(150) NOT NULL,
    doctor_name VARCHAR(150) NOT NULL,
    specialization VARCHAR(150),
    hospital_name VARCHAR(255),
    prescription_date DATE NOT NULL,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    medicines JSON NOT NULL,
    advice TEXT,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

-- 7. BILLS & INVOICES (Billing Inquiries & Cashless Insurance Claims)
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(36) PRIMARY KEY,
    appointment_id INT,
    patient_name VARCHAR(150) NOT NULL,
    doctor_name VARCHAR(150) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    bill_date DATE NOT NULL,
    items JSON NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    insurance_discount DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('Paid', 'Pending', 'Insurance Claimed') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. SMS LOGS (Automated SMS Delivery & Reminders)
CREATE TABLE IF NOT EXISTS sms_logs (
    id VARCHAR(36) PRIMARY KEY,
    to_phone VARCHAR(25) NOT NULL,
    patient_name VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    sms_type ENUM('CONFIRMATION', 'REMINDER_24H', 'REMINDER_2H', 'CANCELLATION') DEFAULT 'CONFIRMATION',
    status VARCHAR(20) DEFAULT 'Delivered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- SEED DATA (Directly matching Screenshots 1, 3, and 4)
-- ===================================================================

INSERT INTO hospitals (id, name, address, city, distance_km, rating, phone, emergency_phone) VALUES
('hosp-1', 'City Care General Hospital', '42 Medical Boulevard, Central District', 'Pune', 0.8, 4.90, '+91 20 2567 8900', '108'),
('hosp-2', 'Apollo Health City & Research Center', '15 High Tech Avenue, Baner', 'Pune', 2.3, 4.80, '+91 20 6688 1234', '102'),
('hosp-3', 'Metro Superspecialty Healthcare', '88 Station Link Road, Shivaji Nagar', 'Pune', 3.5, 4.70, '+91 20 2445 7788', '112'),
('hosp-4', 'Sunrise Family & Children Hospital', '102 Green Park Avenue, Kothrud', 'Pune', 5.1, 4.90, '+91 20 2544 3322', '108')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO departments (id, name, description, icon) VALUES
('dept-1', 'Pulmonology & Respiratory Care', 'Expert care for respiratory disorders, viral pneumonia, COVID-19 & asthma.', 'Stethoscope'),
('dept-2', 'Cardiology', 'Comprehensive heart care, coronary diagnostics, hypertension and ECG monitoring.', 'HeartPulse'),
('dept-3', 'General Medicine & Infectious Diseases', 'Primary care, viral fever management, diabetes, infections and general wellness.', 'Activity'),
('dept-4', 'Pediatrics', 'Specialized healthcare for infants, children, immunization and child development.', 'Baby'),
('dept-5', 'Orthopedics & Joint Care', 'Bone fractures, arthritis, joint replacements and musculoskeletal therapy.', 'Bone'),
('dept-6', 'Neurology & Brain Sciences', 'Diagnosis and care for chronic migraines, epilepsy, nerve disorders and stroke.', 'Brain'),
('dept-7', 'Dermatology & Skin Health', 'Skin allergies, eczema, acne solutions, cosmetic dermatology and biopsy.', 'Sparkles')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO doctors (id, hospital_id, department_id, name, specialization, qualification, experience_years, consultation_fee, cabin, phone, email, rating, bio, max_patients_per_day, shift_start, shift_end) VALUES
('doc-1', 'hosp-1', 'dept-1', 'Dr. Ramesh', 'Senior Pulmonologist & Critical Care', 'MBBS, MD (Pulmonary Medicine), FCCP', 16, 600.00, 'Room 204, 2nd Floor', '+91 98230 11223', 'dr.ramesh@citycare.org', 4.90, 'Renowned respiratory specialist with 16+ years experience treating COVID-19 and chronic bronchitis.', 16, '09:00:00', '17:00:00'),
('doc-2', 'hosp-1', 'dept-3', 'Dr. Priyanka', 'Infectious Disease Specialist & Physician', 'MBBS, MD (General Medicine), DNB', 12, 550.00, 'Room 108, 1st Floor', '+91 98230 44556', 'dr.priyanka@citycare.org', 4.80, 'Lead physician for infectious disease treatment, fevers and preventive diagnostics.', 16, '09:00:00', '17:00:00'),
('doc-3', 'hosp-2', 'dept-2', 'Dr. Rajesh Mehta', 'Senior Interventional Cardiologist', 'MBBS, MD, DM (Cardiology)', 20, 850.00, 'CathLab Suite B, Apollo Tower', '+91 98231 77889', 'dr.mehta@apollo.org', 4.95, 'Over 5,000 successful cardiac interventions.', 16, '09:00:00', '17:00:00')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Seed Appointments (Matches Screenshot 3 records)
INSERT INTO appointments (id, sn, patient_name, patient_age, patient_phone, patient_disease, patient_address, doctor_id, doctor_name, appointment_date, appointment_day, slot_time, status) VALUES
(1, 1, 'Kamlesh', 38, '9876543210', 'COVID-19', 'Camp, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '09:00', 'Scheduled'),
(2, 2, 'Sa', 24, '7865432123', 'COVID-19', 'Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '09:30', 'Scheduled'),
(3, 3, 'Deepak Kumar', 45, '9822114455', 'COVID-19', 'Kothrud, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '10:00', 'Scheduled'),
(4, 4, 'Raj Kamal', 32, '9844223311', 'COVID-19', 'Hadapsar, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '10:30', 'Scheduled'),
(5, 5, 'Seema Devi', 51, '9922334411', 'COVID-19', 'Aundh, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '11:00', 'Scheduled'),
(6, 6, 'Suneeta Kumari', 29, '9855112233', 'FEVER', 'Viman Nagar, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '11:30', 'Scheduled'),
(7, 7, 'Ram Krishan', 62, '9766554433', 'COVID-19', 'Deccan, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '12:00', 'Scheduled'),
(8, 8, 'Ravi Kumar', 35, '9833441122', 'COVID-19', 'Baner, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '12:30', 'Scheduled'),
(9, 9, 'Sateesh Kumar', 41, '9811224455', 'COVID-19', 'Wakad, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '13:00', 'Scheduled'),
(10, 10, 'Suneel Sharma', 39, '9822336677', 'COVID-19', 'Koregaon Park, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '13:30', 'Scheduled'),
(11, 11, 'Shivam Panday', 27, '9844551122', 'COVID-19', 'Bhosari, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '14:00', 'Scheduled'),
(12, 12, 'Vineeta Sharma', 34, '9899887766', 'COVID-19', 'Model Colony, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '14:30', 'Scheduled'),
(13, 13, 'Vishwareshar Kumar', 58, '9822998811', 'COVID-19', 'Pimpri, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '15:00', 'Scheduled'),
(14, 14, 'Radha Panday', 48, '9811447788', 'COVID-19', 'Swargate, Pune', 'doc-1', 'Dr. Ramesh', '2022-07-11', 'Monday', '15:30', 'Scheduled'),
(15, 15, 'Sohan Raj', 31, '9877443322', 'COVID-19', 'Katraj, Pune', 'doc-2', 'Dr. Priyanka', '2022-07-11', 'Monday', '09:00', 'Scheduled')
ON DUPLICATE KEY UPDATE patient_name=VALUES(patient_name);
