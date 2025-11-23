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
    
    const { messages, documentIds } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch document contents
    let contextText = "";
    if (documentIds && documentIds.length > 0) {
      const { data: documents } = await supabase
        .from("documents")
        .select("title, category, folder")
        .in("id", documentIds);

      if (documents && documents.length > 0) {
        contextText = "Available documents:\n" + 
          documents.map(doc => 
            `- ${doc.title} (${doc.category}${doc.folder ? `, folder: ${doc.folder}` : ''})`
          ).join("\n") + "\n\n";
      }
    } else {
      // If no specific documents, list all available
      const { data: allDocs } = await supabase
        .from("documents")
        .select("title, category, folder")
        .limit(50);

      if (allDocs && allDocs.length > 0) {
        contextText = "Available documents in the system:\n" + 
          allDocs.map(doc => 
            `- ${doc.title} (${doc.category}${doc.folder ? `, folder: ${doc.folder}` : ''})`
          ).join("\n") + "\n\n";
      }
    }

    const systemPrompt = `You are a helpful AI assistant for a Hawaiian condo community portal. 
You have access to community documents and can answer questions about them.

${contextText}

Provide clear, concise answers based on the documents available. If you don't have specific information from the documents, let the user know and provide general helpful guidance.`;

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
    console.error("Error in document-chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
