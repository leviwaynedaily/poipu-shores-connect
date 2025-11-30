import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    // Verify the user is authenticated by passing token directly
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking admin access for user:', user.id);

    // Check if the requesting user is an admin
    const { data: adminCheck, error: adminError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminCheck) {
      console.error('Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin verified, fetching all users');

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Profiles fetch error:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profiles', details: profilesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all roles
    const { data: allRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      console.error('Roles fetch error:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch roles', details: rolesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all unit owners
    const { data: unitOwners, error: unitsError } = await supabaseClient
      .from('unit_owners')
      .select('user_id, unit_number, relationship_type, is_primary_contact');

    if (unitsError) {
      console.error('Units fetch error:', unitsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch unit ownership', details: unitsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create maps for efficient lookup
    const rolesMap = new Map<string, string[]>();
    allRoles?.forEach((roleData) => {
      const userId = roleData.user_id;
      if (!rolesMap.has(userId)) {
        rolesMap.set(userId, []);
      }
      rolesMap.get(userId)!.push(roleData.role);
    });

    const unitsMap = new Map<string, any[]>();
    unitOwners?.forEach((unitData) => {
      const userId = unitData.user_id;
      if (!unitsMap.has(userId)) {
        unitsMap.set(userId, []);
      }
      unitsMap.get(userId)!.push({
        unit_number: unitData.unit_number,
        relationship_type: unitData.relationship_type,
        is_primary_contact: unitData.is_primary_contact,
      });
    });

    // Combine all data
    const users = profiles?.map((profile) => {
      const roles = rolesMap.get(profile.id) || [];
      const units = unitsMap.get(profile.id) || [];

      return {
        id: profile.id,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active,
        created_at: profile.created_at,
        last_sign_in_at: profile.last_sign_in_at,
        roles,
        units,
        is_admin: roles.includes('admin'),
        is_owner: roles.includes('owner'),
        is_board: roles.includes('board'),
      };
    }) || [];

    console.log(`Successfully fetched ${users.length} users`);

    // Return response
    return new Response(
      JSON.stringify({ users }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
