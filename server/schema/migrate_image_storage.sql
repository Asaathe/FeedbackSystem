-- Migration Script: Convert Image Storage from Base64 to File Paths
-- This script updates the database schema and migrates existing base64 images to files

-- ============================================
-- Step 1: Update image_url column type
-- ============================================

-- For forms table
ALTER TABLE `forms` 
MODIFY COLUMN `image_url` varchar(500) DEFAULT NULL COMMENT 'Image file path (e.g., /uploads/forms/uuid.jpg)';

-- For alumni table
ALTER TABLE `alumni` 
MODIFY COLUMN `image` varchar(500) DEFAULT NULL COMMENT 'Image file path (e.g., /uploads/alumni/uuid.jpg)';

-- For employers table
ALTER TABLE `employers` 
MODIFY COLUMN `image` varchar(500) DEFAULT NULL COMMENT 'Image file path (e.g., /uploads/employers/uuid.jpg)';

-- For instructors table
ALTER TABLE `instructors` 
MODIFY COLUMN `image` varchar(500) DEFAULT NULL COMMENT 'Image file path (e.g., /uploads/instructors/uuid.jpg)';

-- For students table
ALTER TABLE `students` 
MODIFY COLUMN `image` varchar(500) DEFAULT NULL COMMENT 'Image file path (e.g., /uploads/students/uuid.jpg)';

-- ============================================
-- Step 2: Create migration tracking table
-- ============================================

CREATE TABLE IF NOT EXISTS `image_migration_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `table_name` varchar(50) NOT NULL,
  `record_id` int(11) NOT NULL,
  `old_base64_data` text DEFAULT NULL COMMENT 'Truncated base64 data for reference',
  `new_file_path` varchar(500) DEFAULT NULL,
  `migration_status` enum('pending','success','failed') DEFAULT 'pending',
  `error_message` text DEFAULT NULL,
  `migrated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_table_record` (`table_name`, `record_id`),
  KEY `idx_status` (`migration_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ============================================
-- Step 3: Create stored procedure for migration
-- ============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `migrate_base64_images`$$

CREATE PROCEDURE `migrate_base64_images`()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_base64 LONGTEXT;
  DECLARE v_file_path VARCHAR(500);
  DECLARE v_ext VARCHAR(10);
  DECLARE v_uuid VARCHAR(36);
  
  -- Cursor for forms table
  DECLARE cur_forms CURSOR FOR 
    SELECT id, image_url FROM forms 
    WHERE image_url IS NOT NULL 
    AND image_url LIKE 'data:image/%';
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Migrate forms images
  OPEN cur_forms;
  read_forms: LOOP
    FETCH cur_forms INTO v_id, v_base64;
    IF done THEN
      LEAVE read_forms;
    END IF;
    
    -- Extract file extension from base64
    IF v_base64 LIKE 'data:image/jpeg%' THEN
      SET v_ext = '.jpg';
    ELSEIF v_base64 LIKE 'data:image/png%' THEN
      SET v_ext = '.png';
    ELSEIF v_base64 LIKE 'data:image/gif%' THEN
      SET v_ext = '.gif';
    ELSEIF v_base64 LIKE 'data:image/webp%' THEN
      SET v_ext = '.webp';
    ELSE
      SET v_ext = '.jpg'; -- Default
    END IF;
    
    -- Generate UUID for filename
    SET v_uuid = UUID();
    SET v_file_path = CONCAT('/uploads/forms/', v_uuid, v_ext);
    
    -- Log migration
    INSERT INTO image_migration_log (table_name, record_id, old_base64_data, new_file_path, migration_status)
    VALUES ('forms', v_id, LEFT(v_base64, 100), v_file_path, 'pending');
    
    -- Update the record (file will be created by Node.js script)
    UPDATE forms SET image_url = v_file_path WHERE id = v_id;
    
  END LOOP;
  CLOSE cur_forms;
  
  -- Similar cursors can be added for other tables (alumni, employers, instructors, students)
  
END$$

DELIMITER ;

-- ============================================
-- Step 4: Create rollback procedure
-- ============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `rollback_image_migration`$$

CREATE PROCEDURE `rollback_image_migration`()
BEGIN
  -- This procedure can be used to rollback if needed
  -- Note: This requires keeping the original base64 data
  
  UPDATE forms f
  JOIN image_migration_log l ON f.id = l.record_id AND l.table_name = 'forms'
  SET f.image_url = l.old_base64_data
  WHERE l.migration_status = 'success';
  
END$$

DELIMITER ;

-- ============================================
-- Instructions for running the migration
-- ============================================

/*
  To run this migration:
  
  1. Execute this SQL file to update the schema
  2. Run the Node.js migration script (migrateImages.js) to:
     - Extract base64 data from database
     - Convert to image files
     - Save to appropriate upload directories
     - Update migration log with status
  
  The Node.js script will:
  - Read records with pending migration status
  - Decode base64 data to binary
  - Save as image files with UUID names
  - Update migration log with success/failed status
  
  To rollback:
  - Call CALL rollback_image_migration();
  - Delete the generated image files
*/
