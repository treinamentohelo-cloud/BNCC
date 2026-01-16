-- ====================================================================================
-- SISTEMA DE GESTÃO ESCOLAR - ATUALIZAÇÃO FINAL
-- Execute este script no Editor SQL do Supabase para habilitar o registro de aulas.
-- ====================================================================================

-- 1. GARANTIR CAMPOS DE REFORÇO NOS ALUNOS
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remediation_entry_date TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS remediation_exit_date TEXT;

-- 2. CRIAR TABELA DE DIÁRIO DE CLASSE (CHAMADAS)
CREATE TABLE IF NOT EXISTS public.class_daily_logs (
    id TEXT PRIMARY KEY,
    class_id TEXT NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date TEXT NOT NULL,          -- Data da aula (YYYY-MM-DD)
    content TEXT NOT NULL,       -- Conteúdo ministrado
    attendance JSONB DEFAULT '{}'::jsonb, -- Lista de presença
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. HABILITAR SEGURANÇA E PERMISSÕES
ALTER TABLE public.class_daily_logs ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura e escrita para todos os usuários logados
DROP POLICY IF EXISTS "Enable access for all users" ON public.class_daily_logs;

CREATE POLICY "Enable access for all users" ON public.class_daily_logs
    FOR ALL USING (true) WITH CHECK (true);

-- 4. RECARREGAR CONFIGURAÇÕES
NOTIFY pgrst, 'reload config';
