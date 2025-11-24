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
        .select("title, category, folder, content")
        .in("id", documentIds);

      if (documents && documents.length > 0) {
        contextText = "Documents with their content:\n\n" + 
          documents.map(doc => {
            let docInfo = `## ${doc.title}\nCategory: ${doc.category}${doc.folder ? `, Folder: ${doc.folder}` : ''}\n`;
            if (doc.content) {
              docInfo += `\nContent:\n${doc.content}\n`;
            } else {
              docInfo += `\n(Content not yet extracted for this document)\n`;
            }
            return docInfo;
          }).join("\n---\n\n");
      }
    } else {
      // If no specific documents, list all available with content
      const { data: allDocs } = await supabase
        .from("documents")
        .select("title, category, folder, content")
        .limit(50);

      if (allDocs && allDocs.length > 0) {
        contextText = "Available documents in the system:\n\n" + 
          allDocs.map(doc => {
            let docInfo = `## ${doc.title}\nCategory: ${doc.category}${doc.folder ? `, Folder: ${doc.folder}` : ''}\n`;
            if (doc.content) {
              docInfo += `\nContent Preview:\n${doc.content.substring(0, 500)}${doc.content.length > 500 ? '...' : ''}\n`;
            }
            return docInfo;
          }).join("\n---\n\n");
      }
    }

    const systemPrompt = `You are a helpful AI assistant for the Poipu Shores Hawaiian condo community portal. 
You have access to community documents and their actual content.

${contextText}

When users ask about documents:
1. Answer questions directly using the document content provided above
2. Reference specific documents by name when providing information
3. If a document's content hasn't been extracted yet, let them know and suggest downloading it
4. Provide accurate information based on the actual document content
5. If the answer isn't in the available documents, be honest about that
6. Provide general information about HOA/condo management best practices when relevant

FORMATTING GUIDELINES:
- Use clear paragraph breaks between different topics or points
- Use bullet points (- or •) for lists and multiple items
- Use **bold** for important terms, rules, or key information
- Keep paragraphs short (2-4 sentences max)
- Add blank lines between sections for better readability
- When listing requirements or steps, number them clearly

Example format:
"Based on Rule 1, here are the key points:

**No coverings allowed:** You cannot place any covering on your lanai without prior written approval from the Board.

**This includes:**
- Paint or tile
- Carpet (indoor and outdoor)
- All other types of coverings

**Important:** If you get approval, you are solely responsible for any damage caused."

For questions about the community, be helpful and friendly. Use the actual document content to provide accurate answers.`;

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
    console.error("Error in document-chat:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
