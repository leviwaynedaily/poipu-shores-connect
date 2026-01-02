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

    // Get the user's latest message for semantic search
    const userMessages = messages.filter((m: { role: string }) => m.role === "user");
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || "";

    let contextText = "";
    let usedVectorSearch = false;

    // Try vector search first if we have embeddings
    if (latestUserMessage) {
      try {
        // Generate embedding for the user's question
        const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "text-embedding-3-small",
            input: latestUserMessage,
            dimensions: 768,
          }),
        });

        if (embeddingResponse.ok) {
          const embeddingData = await embeddingResponse.json();
          const queryEmbedding = embeddingData.data?.[0]?.embedding;

          if (queryEmbedding) {
            // Search for similar chunks using the database function
            const { data: similarChunks, error: searchError } = await supabase.rpc(
              "match_document_chunks",
              {
                query_embedding: `[${queryEmbedding.join(",")}]`,
                match_count: 10,
                match_threshold: 0.3,
              }
            );

            if (!searchError && similarChunks && similarChunks.length > 0) {
              console.log(`Found ${similarChunks.length} relevant chunks via vector search`);
              usedVectorSearch = true;

              // Group chunks by document
              const docChunks: Record<string, { title: string; chunks: string[] }> = {};
              for (const chunk of similarChunks) {
                if (!docChunks[chunk.document_id]) {
                  docChunks[chunk.document_id] = {
                    title: chunk.document_title,
                    chunks: [],
                  };
                }
                docChunks[chunk.document_id].chunks.push(chunk.content);
              }

              contextText = "Relevant document excerpts (found via semantic search):\n\n" +
                Object.values(docChunks).map(doc => 
                  `## ${doc.title}\n\n${doc.chunks.join("\n\n")}`
                ).join("\n\n---\n\n");
            }
          }
        }
      } catch (vectorError) {
        console.error("Vector search failed, falling back to full document fetch:", vectorError);
      }
    }

    // Fallback: fetch documents directly if vector search didn't work
    if (!usedVectorSearch) {
      console.log("Using fallback: fetching documents directly");
      
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
        // If no specific documents and no vector search, list available with content preview
        const { data: allDocs } = await supabase
          .from("documents")
          .select("title, category, folder, content")
          .not("content", "is", null)
          .limit(20);

        if (allDocs && allDocs.length > 0) {
          contextText = "Available documents (content preview):\n\n" + 
            allDocs.map(doc => {
              let docInfo = `## ${doc.title}\nCategory: ${doc.category}${doc.folder ? `, Folder: ${doc.folder}` : ''}\n`;
              if (doc.content) {
                docInfo += `\nPreview:\n${doc.content.substring(0, 300)}${doc.content.length > 300 ? '...' : ''}\n`;
              }
              return docInfo;
            }).join("\n---\n\n");
        }
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

    console.log("Using vector search:", usedVectorSearch);
    console.log("Context length:", contextText.length);

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
