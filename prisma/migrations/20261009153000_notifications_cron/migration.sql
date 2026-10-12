CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  existing bigint;
BEGIN
  SELECT jobid INTO existing FROM cron.job WHERE jobname = 'notifications';
  IF existing IS NOT NULL THEN
    PERFORM cron.unschedule(existing);
  END IF;

  PERFORM cron.schedule(
    'notifications',
    '*/5 * * * *',
    $job$
    select net.http_post(
      url := 'https://fcvfrerknmarxrusjpuk.supabase.co/functions/v1/notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', coalesce((
          select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1
        ), '')
      ),
      body := '{}'::jsonb
    );
    $job$
  );
END $$;
