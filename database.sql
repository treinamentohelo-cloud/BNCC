-- ====================================================================================
-- SCRIPT DE CORREÇÃO ESTRUTURAL (SUPABASE)
-- Execute este script no "SQL Editor" do Supabase e clique em "RUN".
-- ====================================================================================

-- 1. CORREÇÃO NA TABELA DE TURMAS (classes)
-- Adiciona a coluna para identificar se é turma de reforço e o ID do professor
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_remediation BOOLEAN DEFAULT false;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_id TEXT;
-- Adiciona coluna para array de IDs de habilidades foco (armazenado como JSON array de strings)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS focus_skills JSONB DEFAULT '[]'::jsonb;

-- 2. CORREÇÃO NA TABELA DE ALUNOS (students)
-- Adiciona campos de perfil e dados pessoais
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_name TEXT;

-- Adiciona campos para controle de entrada/saída do reforço escolar
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remediation_entry_date TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remediation_exit_date TEXT;

-- 3. CRIAÇÃO DA TABELA DE DIÁRIO DE AULAS (class_daily_logs)
-- Esta tabela armazena o conteúdo dado e a chamada
CREATE TABLE IF NOT EXISTS public.class_daily_logs (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    attendance JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CRIAÇÃO DA TABELA DE USUÁRIOS (users)
-- Garante que a tabela de usuários exista para o login funcionar
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'professor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CONFIGURAÇÃO DE SEGURANÇA (RLS)
-- Habilita segurança nas tabelas
ALTER TABLE public.class_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Remove políticas antigas se existirem para evitar conflito
DROP POLICY IF EXISTS "Enable access for all users" ON public.class_daily_logs;
DROP POLICY IF EXISTS "Enable access for all users" ON public.users;

-- Cria novas políticas permitindo leitura e escrita para o aplicativo
CREATE POLICY "Enable access for all users" ON public.class_daily_logs
    FOR ALL USING (true) 
    WITH CHECK (true);

CREATE POLICY "Enable access for all users" ON public.users
    FOR ALL USING (true) 
    WITH CHECK (true);

-- 6. ATUALIZAÇÃO DO CACHE
-- Força o Supabase a reconhecer as mudanças imediatamente
NOTIFY pgrst, 'reload config';