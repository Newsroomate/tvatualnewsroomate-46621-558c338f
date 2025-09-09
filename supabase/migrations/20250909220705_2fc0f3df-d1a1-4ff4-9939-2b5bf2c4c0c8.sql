-- Remove foreign key constraint between espelhos_salvos and telejornais
-- This makes saved rundowns independent from telejornais table
ALTER TABLE public.espelhos_salvos 
DROP CONSTRAINT IF EXISTS espelhos_salvos_telejornal_id_fkey;

-- Keep telejornal_id as a simple reference field (no foreign key constraint)
-- This allows historical reference while preventing cascade deletes
COMMENT ON COLUMN public.espelhos_salvos.telejornal_id IS 'Historical reference to telejornal - not a foreign key constraint to maintain independence';