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
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 4. ATUALIZAÇÃO DA TABELA DE HABILIDADES (skills)
-- Adiciona coluna de Ano/Série
ALTER TABLE public.skills ADD COLUMN IF NOT EXISTS year TEXT;

-- 5. CRIAÇÃO DA TABELA DE DISCIPLINAS (subjects)
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CRIAÇÃO DAS OUTRAS TABELAS SE NÃO EXISTIREM
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

-- 7. INSERIR DISCIPLINAS PADRÃO (Se a tabela estiver vazia)
INSERT INTO public.subjects (id, name)
VALUES 
  ('sub-lp', 'Língua Portuguesa'),
  ('sub-mat', 'Matemática'),
  ('sub-cie', 'Ciências'),
  ('sub-his', 'História'),
  ('sub-geo', 'Geografia'),
  ('sub-art', 'Arte'),
  ('sub-ing', 'Inglês'),
  ('sub-edfis', 'Educação Física')
ON CONFLICT (id) DO NOTHING; 
-- Nota: O conflito por ID é apenas para evitar erro no script, a constraint unique é no nome.

-- 8. CONFIGURAÇÃO DE SEGURANÇA (RLS)
ALTER TABLE public.class_daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable access for all users" ON public.class_daily_logs;
DROP POLICY IF EXISTS "Enable access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable access for all users" ON public.subjects;

CREATE POLICY "Enable access for all users" ON public.class_daily_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for all users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable access for all users" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

-- 9. REGRAS DE INTEGRIDADE (TRAVA DE EXCLUSÃO)
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_class_id_fkey;
ALTER TABLE public.students ADD CONSTRAINT students_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE RESTRICT;

ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS assessments_student_id_fkey;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE RESTRICT;

-- 10. ATUALIZAÇÃO DO CACHE
NOTIFY pgrst, 'reload config';