-- ====================================================================================
-- SCRIPT DE CORREÇÃO ESTRUTURAL (SUPABASE)
-- Execute este script no "SQL Editor" do Supabase e clique em "RUN".
-- ====================================================================================

-- 1. CORREÇÃO NA TABELA DE TURMAS (classes)
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS is_remediation BOOLEAN DEFAULT false;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_id TEXT;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS focus_skills JSONB DEFAULT '[]'::jsonb;

-- 2. CORREÇÃO NA TABELA DE ALUNOS (students)
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS registration_number TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS parent_name TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remediation_entry_date TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remediation_exit_date TEXT;

-- 3. CORREÇÃO NA TABELA DE USUÁRIOS (users)
-- Adiciona coluna de status para inativação lógica
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. CRIAÇÃO DAS TABELAS SE NÃO EXISTIREM
CREATE TABLE IF NOT EXISTS public.class_daily_logs (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    content TEXT NOT NULL,
    attendance JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'professor',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CONFIGURAÇÃO DE SEGURANÇA (RLS)
ALTER TABLE public.class_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable access for all users" ON public.class_daily_logs;
DROP POLICY IF EXISTS "Enable access for all users" ON public.users;

CREATE POLICY "Enable access for all users" ON public.class_daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for all users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 6. REGRAS DE INTEGRIDADE (TRAVA DE EXCLUSÃO)
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_fkey;
ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE RESTRICT;

ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS assessments_student_id_fkey;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;

-- 7. ATUALIZAÇÃO DO CACHE
NOTIFY pgrst, 'reload config';
