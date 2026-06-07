SELECT cron.unschedule('send-maintenance-reminders-daily');
SELECT cron.schedule(
  'send-maintenance-reminders-daily',
  '0 3 * * *',
  $$ SELECT extensions.http_post(
       url := 'https://project--5b0179b5-0a8b-47a9-b995-a8ac40331d6b.lovable.app/api/public/hooks/send-maintenance-reminders',
       headers := '{"Content-Type":"application/json"}'::jsonb,
       body := '{}'::jsonb
     ) $$
);