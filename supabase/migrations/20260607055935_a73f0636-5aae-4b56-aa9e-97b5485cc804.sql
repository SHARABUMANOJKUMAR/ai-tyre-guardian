ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS payload jsonb;

ALTER TABLE public.reports ALTER COLUMN is_tyre DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN is_tyre SET DEFAULT false;

CREATE INDEX IF NOT EXISTS reports_user_type_created_idx
  ON public.reports (user_id, report_type, created_at DESC);