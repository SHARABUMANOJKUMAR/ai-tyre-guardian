
-- Vehicles
CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nickname text,
  make text NOT NULL,
  model text NOT NULL,
  year integer,
  registration text,
  vehicle_type text NOT NULL DEFAULT 'car',
  current_odometer_km integer NOT NULL DEFAULT 0,
  fuel_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT ALL ON public.vehicles TO service_role;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own vehicles" ON public.vehicles
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_vehicles_updated_at BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Maintenance reminders
CREATE TABLE public.maintenance_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  title text NOT NULL,
  notes text,
  due_date date,
  due_odometer_km integer,
  interval_km integer,
  interval_months integer,
  status text NOT NULL DEFAULT 'pending',
  last_notified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_reminders TO authenticated;
GRANT ALL ON public.maintenance_reminders TO service_role;
ALTER TABLE public.maintenance_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reminders" ON public.maintenance_reminders
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_reminders_updated_at BEFORE UPDATE ON public.maintenance_reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_reminders_due ON public.maintenance_reminders(status, due_date);

-- Vehicle health logs
CREATE TABLE public.vehicle_health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  entry_type text NOT NULL,
  title text NOT NULL,
  description text,
  odometer_km integer,
  cost numeric(10,2),
  service_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicle_health_logs TO authenticated;
GRANT ALL ON public.vehicle_health_logs TO service_role;
ALTER TABLE public.vehicle_health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own health logs" ON public.vehicle_health_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_health_logs_updated_at BEFORE UPDATE ON public.vehicle_health_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
