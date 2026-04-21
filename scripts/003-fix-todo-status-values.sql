-- Update the todos table to use 'in-process' instead of 'in-progress'
-- First, drop the existing check constraint
ALTER TABLE public.todos DROP CONSTRAINT IF EXISTS todos_status_check;

-- Add the new check constraint with the correct status values
ALTER TABLE public.todos ADD CONSTRAINT todos_status_check 
  CHECK (status IN ('pending', 'in-process', 'complete'));

-- Update any existing 'in-progress' values to 'in-process'
UPDATE public.todos SET status = 'in-process' WHERE status = 'in-progress';
