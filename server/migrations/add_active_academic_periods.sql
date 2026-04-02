-- Migration: Add active academic periods for current date (2026-04-01)
-- This ensures Student/Instructor dashboards show subjects for the current period

-- First check if periods already exist
SELECT 'Checking existing academic periods...' AS status;

-- Insert active academic periods that cover current date (April 1, 2026)
INSERT INTO academic_periods (department, period_type, academic_year, period_number, start_date, end_date, status) VALUES 
('College', 'semester', '2025-2026', 1, '2025-08-01', '2026-12-31', 'active'),
('Senior High', 'quarter', '2025-2026', 1, '2025-08-01', '2026-12-31', 'active')
ON DUPLICATE KEY UPDATE status = status;

-- Verify the insertion
SELECT id, department, period_type, academic_year, period_number, start_date, end_date, status 
FROM academic_periods 
WHERE status = 'active';