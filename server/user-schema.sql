-- User Profile Schema for FeedbACTS System

-- Students profile table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    studentID VARCHAR(50),
    course_yr_section VARCHAR(50),
    contact_number VARCHAR(20),
    subjects TEXT,
    image VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Alumni profile table
CREATE TABLE IF NOT EXISTS alumni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    grad_year YEAR,
    degree VARCHAR(100),
    jobtitle VARCHAR(255),
    contact VARCHAR(20),
    image VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Employers profile table
CREATE TABLE IF NOT EXISTS employers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    companyname VARCHAR(255),
    industry VARCHAR(255),
    location VARCHAR(255),
    contact VARCHAR(20),
    image VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Instructors profile table
CREATE TABLE IF NOT EXISTS instructors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNIQUE NOT NULL,
    instructor_id VARCHAR(50),
    department VARCHAR(255),
    subject_taught TEXT,
    image VARCHAR(500),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);