import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Split text into chunks with overlap
function splitIntoChunks(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    
    start = end - overlap;
    if (start >= text.length - overlap) break;
  }
  
  return chunks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { documentId } = await req.json();

    if (!documentId) {
      return new Response(
        JSON.stringify({ error: "documentId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating embeddings for document ${documentId}`);

    // Fetch the document content
    const { data: document, error: docError } = await supabase
      .from("documents")
      .select("id, title, content")
      .eq("id", documentId)
      .single();

    if (docError || !document) {
      console.error("Error fetching document:", docError);
      return new Response(
        JSON.stringify({ error: "Document not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!document.content || document.content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Document has no content to embed", documentId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete existing chunks for this document
    const { error: deleteError } = await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", documentId);

    if (deleteError) {
      console.error("Error deleting existing chunks:", deleteError);
    }

    // Split content into chunks
    const chunks = splitIntoChunks(document.content);
    console.log(`Split document into ${chunks.length} chunks`);

    // Generate embeddings for each chunk using OpenAI
    const embeddedChunks: { chunk_index: number; content: string; embedding: number[] }[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // Use OpenAI embeddings API
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: chunk,
          dimensions: 768,
        }),
      });

      if (!embeddingResponse.ok) {
        const errorText = await embeddingResponse.text();
        console.error(`Error generating embedding for chunk ${i}:`, errorText);
        
        if (embeddingResponse.status === 429) {
          // Rate limited - wait and retry
          console.log("Rate limited, waiting 2s before retry...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          i--; // Retry this chunk
          continue;
        }
        throw new Error(`Failed to generate embedding: ${errorText}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data?.[0]?.embedding;

      if (!embedding) {
        console.error("No embedding returned for chunk", i);
        continue;
      }

      embeddedChunks.push({
        chunk_index: i,
        content: chunk,
        embedding,
      });

      // Small delay to avoid rate limits
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Generated ${embeddedChunks.length} embeddings`);

    // Insert chunks into database
    const chunksToInsert = embeddedChunks.map(chunk => ({
      document_id: documentId,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      embedding: `[${chunk.embedding.join(",")}]`,
    }));

    const { error: insertError } = await supabase
      .from("document_chunks")
      .insert(chunksToInsert);

    if (insertError) {
      console.error("Error inserting chunks:", insertError);
      throw insertError;
    }

    console.log(`Successfully stored ${embeddedChunks.length} chunks for document ${documentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        chunksCreated: embeddedChunks.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-embeddings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
