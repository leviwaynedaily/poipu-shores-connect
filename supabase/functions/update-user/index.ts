import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, email, full_name, unit_number, phone, relationship_type, is_primary_contact } = await req.json();

    console.log('Updating user:', { userId, email, full_name, unit_number, phone, relationship_type, is_primary_contact });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) throw rolesError;

    const isAdmin = roles?.some(r => r.role === 'admin');
    if (!isAdmin) {
      throw new Error('Only admins can update users');
    }

    // Update email in auth.users if provided and changed
    if (email) {
      const { data: targetUser, error: getUserError } = await supabaseClient.auth.admin.getUserById(userId);
      
      if (getUserError) throw getUserError;

      if (targetUser?.user?.email !== email) {
        const { error: updateEmailError } = await supabaseClient.auth.admin.updateUserById(
          userId,
          { email }
        );

        if (updateEmailError) throw updateEmailError;
      }
    }

    // Update profile information
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;

    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (profileError) throw profileError;

    // Update unit ownership information
    if (unit_number) {
      // Check if unit_owners record exists
      const { data: existingUnit } = await supabaseClient
        .from('unit_owners')
        .select('id')
        .eq('user_id', userId)
        .eq('unit_number', unit_number)
        .maybeSingle();

      const unitUpdateData: any = {};
      if (relationship_type !== undefined) unitUpdateData.relationship_type = relationship_type;
      if (is_primary_contact !== undefined) unitUpdateData.is_primary_contact = is_primary_contact;

      if (existingUnit) {
        // Update existing unit_owners record
        const { error: unitUpdateError } = await supabaseClient
          .from('unit_owners')
          .update(unitUpdateData)
          .eq('id', existingUnit.id);

        if (unitUpdateError) throw unitUpdateError;
      } else if (Object.keys(unitUpdateData).length > 0) {
        // Create new unit_owners record if relationship data is provided
        const { error: unitInsertError } = await supabaseClient
          .from('unit_owners')
          .insert({
            user_id: userId,
            unit_number,
            ...unitUpdateData,
          });

        if (unitInsertError) throw unitInsertError;
      }
    }

    console.log('User updated successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error('Error updating user:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
