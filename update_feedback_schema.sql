-- Add priority column with default value 'MEDIUM'
ALTER TABLE "feedback" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'MEDIUM';

-- Add ai_analysis column (nullable)
ALTER TABLE "feedback" ADD COLUMN "ai_analysis" TEXT;

-- Create index on priority for faster filtering
CREATE INDEX "feedback_priority_idx" ON "feedback"("priority");
