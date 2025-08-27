-- Add indexes for better performance on pautas table
CREATE INDEX IF NOT EXISTS idx_pautas_user_id ON pautas(user_id);
CREATE INDEX IF NOT EXISTS idx_pautas_data_cobertura ON pautas(data_cobertura);
CREATE INDEX IF NOT EXISTS idx_pautas_status ON pautas(status);