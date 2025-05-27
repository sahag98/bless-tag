import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';
console.log('Hello from Functions!');

Deno.serve(async (req) => {
  const { userId } = await req.json();

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data, error } = await supabaseClient.auth.admin.deleteUser(userId);

  return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
});
