ALTER TABLE public.logs
    ADD COLUMN IF NOT EXISTS log_type TEXT NOT NULL DEFAULT 'system';

CREATE INDEX IF NOT EXISTS idx_logs_log_type ON public.logs (log_type);