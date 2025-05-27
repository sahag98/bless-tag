// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
console.log('Hello from Functions!');

Deno.serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { data: squadsData, error } = await supabaseClient.from('squads').select('*');

  const now = new Date();
  now.setSeconds(0);
  squadsData?.forEach(async (squad: any) => {
    if (squad.timer_start) {
      const timerStart = new Date(squad.timer_start);
      const startHour = timerStart.getHours();
      const startMinutes = timerStart.getMinutes();

      // Calculate the target end time based on the start time
      let targetEndTime = new Date(timerStart);

      if (startMinutes < 30) {
        // If start time is between XX:00 and XX:30, round down to XX:00
        targetEndTime.setMinutes(0, 0, 0);
      } else {
        // If start time is between XX:30 and XX:59, round up to XX+1:00
        targetEndTime.setHours(startHour + 1, 0, 0, 0);
      }

      // Add 12 hours to the target end time
      targetEndTime.setHours(targetEndTime.getHours() + 12);
      targetEndTime.setSeconds(0);

      console.log('now: ', now);
      console.log('timer start: ', timerStart);
      console.log('target end time: ', targetEndTime);

      const nowHours = now.getHours();
      const nowMinutes = now.getMinutes();

      const targetHours = targetEndTime.getHours();
      const targetMinutes = targetEndTime.getMinutes();

      if (nowHours === targetHours && nowMinutes === targetMinutes) {
        console.log('WORKS!!!');
        const { data: squadMembers, error } = await supabaseClient
          .from('members')
          .select('*, profiles(*)')
          .eq('squad_id', Number(squad.id));

        const loser = squadMembers.find((member: any) => member.user_id === squad.blessed_id);

        if (loser.profiles.noti_token) {
          const loserMessage = {
            to: loser.profiles.noti_token,
            sound: 'default',
            title: `${squad?.name}`,
            body: `Uh-oh! You didn't pass the blessing 👀. Step it up next time!`,
            data: {
              route: `/squad/${squad.id}`,
            },
          };

          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loserMessage),
          });
        }

        console.log(`Timer should end for squad ${squad.name}`);
        await supabaseClient
          .from('squads')
          .update({
            has_started: false,
            blessed_id: null,
            streak: 0,
            timer_start: null,
            has_ended: true,
            loser_id: squad.blessed_id,
          })
          .eq('id', Number(squad.id));
        await supabaseClient.from('blessed').delete().eq('squad_id', Number(squad.id));
        // await supabaseClient.from('consequences').delete().eq('squad_id', Number(squad.id));

        if (squadMembers) {
          console.log('send noti');
          squadMembers.map(async (m: any) => {
            if (m.profiles.noti_token) {
              const message = {
                to: m.profiles.noti_token,
                sound: 'default',
                title: `${squad?.name}`,
                body: `Game over! Try again.`,
                data: {
                  route: `/squad/${squad.id}`,
                },
              };

              await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Accept-Encoding': 'gzip, deflate',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
              });
            }
          });
        }
      }
    }
  });

  return new Response(JSON.stringify(squadsData), {
    headers: { 'Content-Type': 'application/json' },
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/check-timer' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
