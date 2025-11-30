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

    console.log('Fetching profile for user:', user.id);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch profile', details: profileError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch user roles
    const { data: userRoles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      console.error('Roles fetch error:', rolesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch roles', details: rolesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract roles array
    const roles = userRoles?.map((r) => r.role) || [];

    // Compute role flags
    const is_admin = roles.includes('admin');
    const is_owner = roles.includes('owner');
    const is_board = roles.includes('board');

    console.log('Successfully fetched profile and roles for user:', user.id);

    // Return combined response
    return new Response(
      JSON.stringify({
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          is_active: profile.is_active,
          show_contact_info: profile.show_contact_info,
          onboarding_completed: profile.onboarding_completed,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        },
        roles,
        is_admin,
        is_owner,
        is_board,
      }),
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
