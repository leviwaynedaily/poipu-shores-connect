import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, ...params } = await req.json();
    console.log(`Action: ${action}, User: ${user.id}`);

    // Action router
    switch (action) {
      case "list": {
        // List all conversations for the user
        const { data, error } = await supabase
          .from("community_assistant_conversations")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("List error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ conversations: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create": {
        // Create a new conversation
        const { title } = params;
        if (!title) {
          return new Response(
            JSON.stringify({ error: "Title is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("community_assistant_conversations")
          .insert({ user_id: user.id, title })
          .select()
          .single();

        if (error) {
          console.error("Create error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ conversation: data }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_messages": {
        // Get messages for a conversation
        const { conversation_id } = params;
        if (!conversation_id) {
          return new Response(
            JSON.stringify({ error: "conversation_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify the conversation belongs to the user
        const { data: conversation, error: convError } = await supabase
          .from("community_assistant_conversations")
          .select("user_id")
          .eq("id", conversation_id)
          .single();

        if (convError || !conversation) {
          return new Response(
            JSON.stringify({ error: "Conversation not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (conversation.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("community_assistant_messages")
          .select("*")
          .eq("conversation_id", conversation_id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Get messages error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ messages: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "save_message": {
        // Save a message to a conversation
        const { conversation_id, role, content } = params;
        if (!conversation_id || !role || !content) {
          return new Response(
            JSON.stringify({ error: "conversation_id, role, and content are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (role !== "user" && role !== "assistant") {
          return new Response(
            JSON.stringify({ error: "role must be 'user' or 'assistant'" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Verify the conversation belongs to the user
        const { data: conversation, error: convError } = await supabase
          .from("community_assistant_conversations")
          .select("user_id")
          .eq("id", conversation_id)
          .single();

        if (convError || !conversation) {
          return new Response(
            JSON.stringify({ error: "Conversation not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (conversation.user_id !== user.id) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("community_assistant_messages")
          .insert({ conversation_id, user_id: user.id, role, content })
          .select()
          .single();

        if (error) {
          console.error("Save message error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ message: data }),
          { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        // Delete a conversation (messages cascade automatically)
        const { conversation_id } = params;
        if (!conversation_id) {
          return new Response(
            JSON.stringify({ error: "conversation_id is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { error } = await supabase
          .from("community_assistant_conversations")
          .delete()
          .eq("id", conversation_id)
          .eq("user_id", user.id);

        if (error) {
          console.error("Delete error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update_title": {
        // Update conversation title
        const { conversation_id, title } = params;
        if (!conversation_id || !title) {
          return new Response(
            JSON.stringify({ error: "conversation_id and title are required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data, error } = await supabase
          .from("community_assistant_conversations")
          .update({ title })
          .eq("id", conversation_id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) {
          console.error("Update title error:", error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ conversation: data }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
