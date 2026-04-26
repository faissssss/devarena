-- Migration: Update category constraint to support 10 categories
-- Description: Expand competition categories from 4 to 10 to support Web3/Blockchain, Game Development, Mobile Development, Design/UI/UX, Cloud/DevOps, and Other
-- Requirements: 2.2, 5.2, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9

-- Drop the existing category constraint
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS valid_category;

-- Add the updated category constraint with all 10 categories
ALTER TABLE competitions ADD CONSTRAINT valid_category CHECK (category IN (
  'Competitive Programming',
  'Hackathons',
  'AI/Data Science',
  'CTF/Security',
  'Web3/Blockchain',
  'Game Development',
  'Mobile Development',
  'Design/UI/UX',
  'Cloud/DevOps',
  'Other'
));

COMMENT ON CONSTRAINT valid_category ON competitions IS 'Ensures category is one of 10 predefined categories: Competitive Programming, Hackathons, AI/Data Science, CTF/Security, Web3/Blockchain, Game Development, Mobile Development, Design/UI/UX, Cloud/DevOps, Other';
