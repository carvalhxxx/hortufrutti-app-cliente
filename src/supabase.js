import { createClient } from '@supabase/supabase-js'

// Substitua aqui pelas suas credenciais do Supabase
const supabaseUrl = 'https://zxlbuwhoyemzfrsxmpjf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4bGJ1d2hveWVtemZyc3htcGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NDM3ODIsImV4cCI6MjA3MjQxOTc4Mn0.F-R4-vfWMUKdEnBtdzB7ar40QKTLUaNaQRSjEVMczVQ'

export const supabase = createClient(supabaseUrl, supabaseKey)
