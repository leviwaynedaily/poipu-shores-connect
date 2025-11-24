import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch recent documents
    const { data: documents } = await supabase
      .from("documents")
      .select("title, category, folder, created_at")
      .order("created_at", { ascending: false })
      .limit(20);

    // Fetch recent announcements
    const { data: announcements } = await supabase
      .from("announcements")
      .select("title, content, created_at, is_pinned")
      .order("created_at", { ascending: false })
      .limit(10);

    // Fetch emergency contacts
    const { data: emergencyContacts } = await supabase
      .from("emergency_contacts")
      .select("name, phone, email, category, description")
      .eq("is_active", true)
      .order("display_order");

    // Fetch community photos count
    const { count: photosCount } = await supabase
      .from("community_photos")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", true);

    // Build context
    let contextText = "You are the Poipu Shores Hawaiian condo community AI assistant. You have access to real-time community data.\n\n";
    
    if (documents && documents.length > 0) {
      contextText += "**Recent Documents:**\n" + 
        documents.map(doc => 
          `- ${doc.title} (${doc.category}${doc.folder ? `, folder: ${doc.folder}` : ''}) - ${new Date(doc.created_at).toLocaleDateString()}`
        ).join("\n") + "\n\n";
    }

    if (announcements && announcements.length > 0) {
      contextText += "**Recent Announcements:**\n" + 
        announcements.map(ann => 
          `- ${ann.is_pinned ? '📌 ' : ''}${ann.title} (${new Date(ann.created_at).toLocaleDateString()})\n  ${ann.content.substring(0, 150)}${ann.content.length > 150 ? '...' : ''}`
        ).join("\n") + "\n\n";
    }

    if (emergencyContacts && emergencyContacts.length > 0) {
      contextText += "**Emergency Contacts:**\n" + 
        emergencyContacts.map(contact => 
          `- ${contact.name} (${contact.category}): ${contact.phone}${contact.email ? ` | ${contact.email}` : ''}${contact.description ? ` - ${contact.description}` : ''}`
        ).join("\n") + "\n\n";
    }

    if (photosCount) {
      contextText += `**Community Photos:** ${photosCount} approved photos available in the gallery\n\n`;
    }

    const systemPrompt = `${contextText}

You are a helpful, friendly AI assistant for the Poipu Shores Hawaiian condo community. 

Your role:
1. Answer questions about documents, announcements, emergency contacts, and community information
2. Be conversational and warm - use Hawaiian spirit (Aloha!) when appropriate
3. Reference specific documents, announcements, or contacts when relevant
4. If you don't have specific information, guide users where to find it (Documents page, Announcements page, etc.)
5. Provide helpful summaries and insights about community activities
6. Be concise but informative

Remember: You're here to help the community stay informed and connected!`;

    console.log("System prompt:", systemPrompt);
    console.log("User messages:", messages);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in community-assistant:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
