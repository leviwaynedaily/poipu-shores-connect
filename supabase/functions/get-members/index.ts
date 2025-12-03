import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify the requesting user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all active profiles with unit ownership info
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        full_name,
        phone,
        show_contact_info,
        avatar_url,
        unit_owners (
          unit_number,
          relationship_type,
          is_primary_contact
        )
      `)
      .eq('is_active', true)
      .order('full_name');

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch members' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all user emails from auth.users
    const { data: { users: authUsers }, error: usersError } = await supabaseClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching auth users:', usersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch user emails' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create email map
    const emailMap = new Map<string, string>();
    authUsers?.forEach(user => {
      if (user.email) {
        emailMap.set(user.id, user.email);
      }
    });

    // Transform and combine data
    const members = profiles?.map((profile: any) => {
      const unitOwner = profile.unit_owners?.[0];
      return {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        email: emailMap.get(profile.id) || null,
        show_contact_info: profile.show_contact_info,
        avatar_url: profile.avatar_url,
        unit_number: unitOwner?.unit_number || null,
        relationship_type: unitOwner?.relationship_type || null,
        is_primary_contact: unitOwner?.is_primary_contact || null,
      };
    }) || [];

    // Sort: members with units first (by unit number), then others (alphabetically)
    members.sort((a: any, b: any) => {
      if (a.unit_number && !b.unit_number) return -1;
      if (!a.unit_number && b.unit_number) return 1;
      if (a.unit_number && b.unit_number) {
        return a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true });
      }
      return a.full_name.localeCompare(b.full_name);
    });

    console.log(`Returning ${members.length} members`);

    return new Response(JSON.stringify({ members }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in get-members:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
