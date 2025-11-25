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

    // Fetch ALL documents with their content
    const { data: documents } = await supabase
      .from("documents")
      .select("title, category, folder, content, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

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

    // Build context with FULL document content
    let contextText = "You are the Poipu Shores Hawaiian condo community AI assistant. You have access to real-time community data and FULL document content.\n\n";
    
    if (documents && documents.length > 0) {
      contextText += "**Available Documents with Full Content:**\n\n" + 
        documents.map(doc => {
          let docInfo = `## ${doc.title}\nCategory: ${doc.category}${doc.folder ? `, Folder: ${doc.folder}` : ''}\n`;
          if (doc.content) {
            // Include first 800 chars of content for context
            docInfo += `\nContent Preview:\n${doc.content.substring(0, 800)}${doc.content.length > 800 ? '...' : ''}\n`;
          } else {
            docInfo += `\n(Content not yet extracted for this document)\n`;
          }
          return docInfo;
        }).join("\n---\n\n") + "\n\n";
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
1. Answer questions about documents, announcements, emergency contacts, and community information using the ACTUAL CONTENT provided above
2. Reference specific documents by name when providing information
3. Be conversational and warm - use Hawaiian spirit (Aloha!) when appropriate
4. If a document's content hasn't been extracted yet, let users know and suggest downloading it
5. Provide accurate information based on the actual document content
6. If you don't have specific information, guide users where to find it (Documents page, Announcements page, etc.)
7. Provide helpful summaries and insights about community activities
8. Be concise but informative

FORMATTING GUIDELINES:
- Use clear paragraph breaks between different topics or points
- Use bullet points (- or •) for lists and multiple items
- Use **bold** for important terms, rules, or key information
- Keep paragraphs short (2-4 sentences max)
- Add blank lines between sections for better readability
- When listing requirements or steps, number them clearly

Remember: You have access to the FULL content of documents, so answer questions directly from that content!`;

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
