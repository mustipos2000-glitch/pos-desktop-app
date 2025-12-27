-- ============================================
-- SQL Script to Check and Create Members Table
-- ============================================

-- 1. Check if members table exists
SELECT 'Checking if members table exists...' as info;
SELECT name FROM sqlite_master WHERE type='table' AND name='members';

-- 2. Check members table structure (if it exists)
SELECT 'Members table structure:' as info;
PRAGMA table_info(members);

-- 3. Count total members in database
SELECT 'Total Members in Database:' as info, COUNT(*) as count FROM members;

-- 4. Show all members
SELECT 'All Members:' as info;
SELECT id, member_id, full_name, phone, email, address, created_at, updated_at 
FROM members 
ORDER BY created_at DESC;

-- 5. Show recent members (last 10)
SELECT 'Recent 10 Members:' as info;
SELECT id, member_id, full_name, phone, email, created_at 
FROM members 
ORDER BY created_at DESC 
LIMIT 10;

-- ============================================
-- CREATE MEMBERS TABLE: If table doesn't exist
-- ============================================

-- Uncomment and run this to create the members table:
/*
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
*/

-- ============================================
-- FIX MEMBERS TABLE: If table exists but missing columns
-- ============================================

-- Uncomment and run these if you need to add missing columns:

-- Add member_id column if it doesn't exist
/*
-- First, check if column exists
PRAGMA table_info(members);

-- If member_id doesn't exist, add it:
ALTER TABLE members ADD COLUMN member_id TEXT;

-- Generate member_id for existing members
UPDATE members 
SET member_id = printf('%04d', id) 
WHERE member_id IS NULL;

-- Then add UNIQUE constraint (requires recreating table)
-- This is more complex, so it's handled by migrations
*/

-- Add updated_at column if it doesn't exist
/*
ALTER TABLE members ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP;
UPDATE members SET updated_at = created_at WHERE updated_at IS NULL;
*/

-- ============================================
-- CREATE TEST DATA: If you have NO members
-- ============================================

-- Uncomment and run this to create test members:
/*
-- Test Member 1
INSERT INTO members (member_id, full_name, phone, email, address)
VALUES ('0001', 'John Doe', '1234567890', 'john@example.com', '123 Main St');

-- Test Member 2
INSERT INTO members (member_id, full_name, phone, email, address)
VALUES ('0002', 'Jane Smith', '0987654321', 'jane@example.com', '456 Oak Ave');

-- Test Member 3
INSERT INTO members (member_id, full_name, phone, email, address)
VALUES ('0003', 'Bob Johnson', '5551234567', 'bob@example.com', '789 Pine Rd');

-- Verify test members were created
SELECT 'Test Members Created:' as info;
SELECT id, member_id, full_name, phone, email 
FROM members 
WHERE member_id IN ('0001', '0002', '0003');
*/

-- ============================================
-- EXPECTED TABLE STRUCTURE
-- ============================================

-- The members table should have the following columns:
-- id (INTEGER PRIMARY KEY AUTOINCREMENT)
-- member_id (TEXT UNIQUE) - Unique member identifier (e.g., '0001', '0002')
-- full_name (TEXT NOT NULL) - Full name of the member
-- phone (TEXT DEFAULT '') - Phone number
-- email (TEXT DEFAULT '') - Email address
-- address (TEXT DEFAULT '') - Address
-- created_at (DATETIME DEFAULT CURRENT_TIMESTAMP)
-- updated_at (DATETIME DEFAULT CURRENT_TIMESTAMP)

