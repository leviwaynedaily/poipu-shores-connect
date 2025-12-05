import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ...params } = await req.json();
    console.log(`start-conversation action: ${action}`, params);

    switch (action) {
      case 'start_direct': {
        // Start or find existing DM between two users
        const { target_user_id } = params;
        if (!target_user_id) {
          return new Response(
            JSON.stringify({ error: 'target_user_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if DM already exists between these two users
        const { data: existingChannels } = await supabaseClient
          .from('chat_channels')
          .select(`
            id,
            chat_channel_members!inner(user_id)
          `)
          .eq('channel_type', 'direct');

        // Find a channel where both users are members and only 2 members total
        let existingDmId: string | null = null;
        if (existingChannels) {
          for (const channel of existingChannels) {
            const members = channel.chat_channel_members as { user_id: string }[];
            const memberIds = members.map(m => m.user_id);
            if (memberIds.length === 2 && 
                memberIds.includes(user.id) && 
                memberIds.includes(target_user_id)) {
              existingDmId = channel.id;
              break;
            }
          }
        }

        if (existingDmId) {
          console.log('Found existing DM:', existingDmId);
          return new Response(
            JSON.stringify({ channel_id: existingDmId, created: false }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get target user's name for channel name
        const { data: targetProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', target_user_id)
          .single();

        const { data: currentProfile } = await supabaseClient
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        // Create new DM channel
        const { data: newChannel, error: channelError } = await supabaseClient
          .from('chat_channels')
          .insert({
            name: `DM: ${currentProfile?.full_name || 'User'} & ${targetProfile?.full_name || 'User'}`,
            channel_type: 'direct',
            is_private: true,
            created_by: user.id
          })
          .select()
          .single();

        if (channelError) {
          console.error('Error creating channel:', channelError);
          return new Response(
            JSON.stringify({ error: 'Failed to create conversation' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Add both users as members
        const { error: membersError } = await supabaseClient
          .from('chat_channel_members')
          .insert([
            { channel_id: newChannel.id, user_id: user.id, is_admin: true, added_by: user.id },
            { channel_id: newChannel.id, user_id: target_user_id, is_admin: true, added_by: user.id }
          ]);

        if (membersError) {
          console.error('Error adding members:', membersError);
          // Clean up channel
          await supabaseClient.from('chat_channels').delete().eq('id', newChannel.id);
          return new Response(
            JSON.stringify({ error: 'Failed to add members' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Created new DM:', newChannel.id);
        return new Response(
          JSON.stringify({ channel_id: newChannel.id, created: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'create_group': {
        // Create a new group chat
        const { name, member_ids } = params;
        if (!name || !member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
          return new Response(
            JSON.stringify({ error: 'name and member_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Create group channel
        const { data: newChannel, error: channelError } = await supabaseClient
          .from('chat_channels')
          .insert({
            name,
            channel_type: 'group',
            is_private: true,
            created_by: user.id
          })
          .select()
          .single();

        if (channelError) {
          console.error('Error creating group:', channelError);
          return new Response(
            JSON.stringify({ error: 'Failed to create group' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Add creator as admin
        const members = [
          { channel_id: newChannel.id, user_id: user.id, is_admin: true, added_by: user.id }
        ];

        // Add other members
        for (const memberId of member_ids) {
          if (memberId !== user.id) {
            members.push({ 
              channel_id: newChannel.id, 
              user_id: memberId, 
              is_admin: false, 
              added_by: user.id 
            });
          }
        }

        const { error: membersError } = await supabaseClient
          .from('chat_channel_members')
          .insert(members);

        if (membersError) {
          console.error('Error adding members:', membersError);
          await supabaseClient.from('chat_channels').delete().eq('id', newChannel.id);
          return new Response(
            JSON.stringify({ error: 'Failed to add members' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Created group:', newChannel.id);
        return new Response(
          JSON.stringify({ channel_id: newChannel.id, created: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add_members': {
        const { channel_id, member_ids } = params;
        if (!channel_id || !member_ids || !Array.isArray(member_ids)) {
          return new Response(
            JSON.stringify({ error: 'channel_id and member_ids required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if user is admin of the channel
        const { data: membership } = await supabaseClient
          .from('chat_channel_members')
          .select('is_admin')
          .eq('channel_id', channel_id)
          .eq('user_id', user.id)
          .single();

        if (!membership?.is_admin) {
          return new Response(
            JSON.stringify({ error: 'Only admins can add members' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const members = member_ids.map(id => ({
          channel_id,
          user_id: id,
          is_admin: false,
          added_by: user.id
        }));

        const { error } = await supabaseClient
          .from('chat_channel_members')
          .upsert(members, { onConflict: 'channel_id,user_id' });

        if (error) {
          console.error('Error adding members:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to add members' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'remove_member': {
        const { channel_id, member_id } = params;
        if (!channel_id || !member_id) {
          return new Response(
            JSON.stringify({ error: 'channel_id and member_id required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check if user is admin or removing themselves
        const { data: membership } = await supabaseClient
          .from('chat_channel_members')
          .select('is_admin')
          .eq('channel_id', channel_id)
          .eq('user_id', user.id)
          .single();

        if (!membership?.is_admin && user.id !== member_id) {
          return new Response(
            JSON.stringify({ error: 'Only admins can remove other members' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseClient
          .from('chat_channel_members')
          .delete()
          .eq('channel_id', channel_id)
          .eq('user_id', member_id);

        if (error) {
          console.error('Error removing member:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to remove member' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_conversations': {
        // Get all conversations for the user with unread counts
        const { data: channels, error } = await supabaseClient
          .from('chat_channel_members')
          .select(`
            channel_id,
            chat_channels!inner(
              id,
              name,
              channel_type,
              is_private,
              created_at
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching conversations:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch conversations' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get last message and unread count for each channel
        const conversations = await Promise.all((channels || []).map(async (ch: any) => {
          const channel = ch.chat_channels;
          
          // Get last message
          const { data: lastMessage } = await supabaseClient
            .from('chat_messages')
            .select('id, content, created_at, author_id')
            .eq('channel_id', channel.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get read receipts for this user
          const { data: lastRead } = await supabaseClient
            .from('chat_read_receipts')
            .select('message_id, read_at')
            .eq('user_id', user.id)
            .order('read_at', { ascending: false })
            .limit(1);

          // Count unread messages
          let unreadCount = 0;
          if (lastMessage) {
            const lastReadTime = lastRead?.[0]?.read_at || '1970-01-01';
            const { count } = await supabaseClient
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('channel_id', channel.id)
              .is('deleted_at', null)
              .neq('author_id', user.id)
              .gt('created_at', lastReadTime);
            unreadCount = count || 0;
          }

          // Get other member info for DMs
          let otherMember = null;
          if (channel.channel_type === 'direct') {
            const { data: members } = await supabaseClient
              .from('chat_channel_members')
              .select('user_id, profiles(id, full_name, avatar_url)')
              .eq('channel_id', channel.id)
              .neq('user_id', user.id)
              .limit(1);
            
            if (members?.[0]?.profiles) {
              otherMember = members[0].profiles;
            }
          }

          // Get member count for groups
          const { count: memberCount } = await supabaseClient
            .from('chat_channel_members')
            .select('*', { count: 'exact', head: true })
            .eq('channel_id', channel.id);

          return {
            ...channel,
            last_message: lastMessage,
            unread_count: unreadCount,
            other_member: otherMember,
            member_count: memberCount
          };
        }));

        // Sort by last message time
        conversations.sort((a, b) => {
          const aTime = a.last_message?.created_at || a.created_at;
          const bTime = b.last_message?.created_at || b.created_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        return new Response(
          JSON.stringify({ conversations }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
