-- Clean up duplicate entries in mentor_types array
UPDATE mentors 
SET mentor_types = (
  SELECT ARRAY(
    SELECT DISTINCT unnest(mentor_types)
  )
)
WHERE mentor_types IS NOT NULL
AND cardinality(mentor_types) > 0;

-- Also clean up duplicates in exams array for safety
UPDATE mentors 
SET exams = (
  SELECT ARRAY(
    SELECT DISTINCT unnest(exams)
  )
)
WHERE exams IS NOT NULL
AND cardinality(exams) > 0;