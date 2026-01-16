-- ====================================================================================
-- SISTEMA DE GESTÃO ESCOLAR - CORREÇÃO DE ESTRUTURA E PERSISTÊNCIA
-- ====================================================================================
-- INSTRUÇÕES:
-- 1. Copie todo este conteúdo.
-- 2. Vá no painel do Supabase -> SQL Editor -> New Query.
-- 3. Cole e clique em RUN.
-- ====================================================================================

-- 1. LIMPEZA (Garante que tabelas antigas/erradas sejam removidas)
DROP TABLE IF EXISTS public.remedial_enrollments CASCADE;
DROP TABLE IF EXISTS public.remedial_classes CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.skills CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. CRIAÇÃO DAS TABELAS (Com aspas para garantir compatibilidade com o React)

CREATE TABLE public.users (
    id TEXT PRIMARY KEY, 
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'coordenador', 'professor')),
    specialty TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    year INTEGER NOT NULL,
    shift TEXT,
    "teacherId" TEXT REFERENCES public.users(id), -- Aspas essenciais para o App funcionar
    status TEXT DEFAULT 'active',
    "isRemediation" BOOLEAN DEFAULT FALSE,      -- Aspas essenciais para o App funcionar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "classId" TEXT REFERENCES public.classes(id) ON DELETE SET NULL, -- Aspas essenciais
    "avatarUrl" TEXT,
    "registrationNumber" TEXT,
    "birthDate" TEXT,
    "parentName" TEXT,
    phone TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.skills (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.assessments (
    id TEXT PRIMARY KEY,
    "studentId" TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE, -- Aspas essenciais
    "skillId" TEXT NOT NULL REFERENCES public.skills(id), -- Aspas essenciais
    date TEXT NOT NULL,
    status TEXT CHECK (status IN ('nao_atingiu', 'em_desenvolvimento', 'superou')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. SEGURANÇA (Libera acesso total para o App funcionar sem login complexo)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso Total Users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Classes" ON public.classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Skills" ON public.skills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acesso Total Assessments" ON public.assessments FOR ALL USING (true) WITH CHECK (true);

-- 4. DADOS INICIAIS (Opcional)
INSERT INTO public.users (id, name, email, password, role)
VALUES ('admin-seed-01', 'Diretora Maria', 'admin@escola.com', '123456', 'admin');

INSERT INTO public.skills (id, code, description, subject) VALUES
('skill-001', 'EF01LP01', 'Reconhecer que textos são lidos e escritos da esquerda para a direita.', 'Língua Portuguesa'),
('skill-002', 'EF01MA01', 'Utilizar números naturais como indicador de quantidade.', 'Matemática');
