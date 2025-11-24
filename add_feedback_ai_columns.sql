-- ============================================
-- Migration: Add AI-powered feedback columns
-- ============================================
-- This migration adds priority and ai_analysis columns to the feedback table

-- Add priority column with default value
ALTER TABLE feedback 
ADD COLUMN priority TEXT DEFAULT 'MEDIUM' NOT NULL;

-- Add ai_analysis column (nullable for AI-generated analysis)
ALTER TABLE feedback 
ADD COLUMN ai_analysis TEXT;

-- Create index on priority for better query performance
CREATE INDEX feedback_priority_idx ON feedback(priority);

-- Update existing records to have default priority
UPDATE feedback SET priority = 'MEDIUM' WHERE priority IS NULL;

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify the columns were added:
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'feedback' 
-- AND column_name IN ('priority', 'ai_analysis');
