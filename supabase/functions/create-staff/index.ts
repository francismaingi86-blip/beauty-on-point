// Beauty on Point — create-staff edge function
//
// Creates a new staff login (Supabase Auth user) plus their role record.
// Only an existing administrator may call this — it checks the caller's
// own staff row before doing anything, then uses the service role key
// (only available inside this server-side function, never in the browser)
// to actually create the account.
//
// Deploy this from the Supabase dashboard: Edge Functions -> Deploy a new
// function -> name it "create-staff" -> paste this file's contents in.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

const VALID_ROLES = ['administrator', 'manager', 'cashier', 'storekeeper']

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client scoped as the caller — used only to confirm who they are and
    // that they're an administrator.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: userData, error: userError } = await callerClient.auth.getUser()
    if (userError || !userData.user) return json({ error: 'Not authenticated' }, 401)

    const { data: callerStaff } = await callerClient
      .from('staff')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (!callerStaff || callerStaff.role !== 'administrator') {
      return json({ error: 'Only administrators can add staff' }, 403)
    }

    const { name, email, password, role } = await req.json()
    if (!name || !email || !password || !role) {
      return json({ error: 'Missing name, email, password, or role' }, 400)
    }
    if (!VALID_ROLES.includes(role)) return json({ error: 'Invalid role' }, 400)
    if (password.length < 6) return json({ error: 'Password must be at least 6 characters' }, 400)

    // Elevated client — only this server-side function ever sees the
    // service role key.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'Could not create user' }, 400)
    }

    const { error: staffError } = await adminClient
      .from('staff')
      .insert({ id: created.user.id, name, email, role })

    if (staffError) {
      // Roll back the auth user so we don't leave an orphaned login.
      await adminClient.auth.admin.deleteUser(created.user.id)
      return json({ error: staffError.message }, 400)
    }

    return json({ success: true, id: created.user.id })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500)
  }
})
