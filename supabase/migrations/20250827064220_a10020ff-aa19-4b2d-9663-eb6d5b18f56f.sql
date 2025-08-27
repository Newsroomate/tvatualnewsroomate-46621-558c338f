-- Add missing columns to pautas table to support all form fields
ALTER TABLE public.pautas 
ADD COLUMN IF NOT EXISTS programa text,
ADD COLUMN IF NOT EXISTS reporter text;