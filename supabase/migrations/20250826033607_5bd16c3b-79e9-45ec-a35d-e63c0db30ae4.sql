-- Add new fields to pautas table
ALTER TABLE public.pautas 
ADD COLUMN proposta text,
ADD COLUMN encaminhamento text,
ADD COLUMN informacoes text;