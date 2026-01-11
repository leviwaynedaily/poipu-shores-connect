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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting batch embedding generation...");

    // Fetch all documents with content that need processing
    const { data: documents, error: fetchError } = await supabase
      .from("documents")
      .select("id, title, content, embedding_status")
      .not("content", "is", null);

    if (fetchError) {
      console.error("Error fetching documents:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${documents?.length || 0} documents with content`);

    // Get documents that already have embeddings
    const { data: existingChunks } = await supabase
      .from("document_chunks")
      .select("document_id")
      .limit(1000);

    const embeddedDocIds = new Set(existingChunks?.map(c => c.document_id) || []);

    // Filter to documents that need embedding (not already completed or not in chunks)
    const docsToProcess = documents?.filter(doc => 
      doc.content && 
      doc.content.trim().length > 10 &&
      !embeddedDocIds.has(doc.id)
    ) || [];

    console.log(`${docsToProcess.length} documents need embedding generation`);

    const results = {
      total: docsToProcess.length,
      successful: 0,
      failed: 0,
      errors: [] as { documentId: string; title: string; error: string }[],
    };

    // Process each document
    for (const doc of docsToProcess) {
      try {
        console.log(`Processing document: ${doc.title} (${doc.id})`);

        // Update status to processing
        await supabase
          .from("documents")
          .update({ embedding_status: 'processing' })
          .eq("id", doc.id);

        // Call the generate-embeddings function
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-embeddings`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ documentId: doc.id }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        const result = await response.json();
        console.log(`Successfully processed ${doc.title}: ${result.chunksCreated} chunks`);
        
        // Update status to completed
        await supabase
          .from("documents")
          .update({ embedding_status: 'completed' })
          .eq("id", doc.id);
        
        results.successful++;

        // Delay between documents to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing document ${doc.title}:`, error);
        
        // Update status to failed
        await supabase
          .from("documents")
          .update({ embedding_status: 'failed' })
          .eq("id", doc.id);
        
        results.failed++;
        results.errors.push({
          documentId: doc.id,
          title: doc.title,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(`Batch processing complete: ${results.successful} successful, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.successful} documents successfully`,
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in batch-generate-embeddings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
