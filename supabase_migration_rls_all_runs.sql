-- Update RLS policy on runs table to allow all authenticated users to view all runs
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own runs" ON runs;
DROP POLICY IF EXISTS "Users can view all runs" ON runs;

-- Create new policy: all authenticated users can view all runs
CREATE POLICY "Authenticated users can view all runs" ON runs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Note: Users can still only create/update/delete their own runs
-- If you want to allow all users to delete any run, update the DELETE policy as well






