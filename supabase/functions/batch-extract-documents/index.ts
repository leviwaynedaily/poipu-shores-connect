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

    console.log("Starting batch document content extraction");

    // Fetch all documents
    const { data: documents, error: fetchError } = await supabase
      .from("documents")
      .select("id, file_path, title, file_type");

    if (fetchError) {
      console.error("Error fetching documents:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch documents" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter to only PDF files
    const pdfsToProcess = documents?.filter(doc => {
      const filePath = doc.file_path?.toLowerCase() || '';
      const fileType = doc.file_type?.toLowerCase() || '';
      return filePath.endsWith('.pdf') || fileType.includes('pdf');
    }) || [];

    if (pdfsToProcess.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No PDF documents found to extract",
          processed: 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${pdfsToProcess.length} PDF documents to process`);

    // Process each document
    const results = {
      total: pdfsToProcess.length,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const doc of pdfsToProcess) {
      try {
        console.log(`Processing document ${doc.id}: ${doc.title}`);
        
        // Call the extract-document-content function for each document
        const response = await fetch(`${supabaseUrl}/functions/v1/extract-document-content`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId: doc.id,
            filePath: doc.file_path,
          }),
        });

        if (response.ok) {
          results.successful++;
          console.log(`Successfully processed ${doc.title}`);
        } else {
          results.failed++;
          const errorText = await response.text();
          results.errors.push(`${doc.title}: ${errorText}`);
          console.error(`Failed to process ${doc.title}:`, errorText);
        }
      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`${doc.title}: ${errorMsg}`);
        console.error(`Error processing ${doc.title}:`, error);
      }
    }

    console.log(`Batch processing complete. Success: ${results.successful}, Failed: ${results.failed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.total} documents. Success: ${results.successful}, Failed: ${results.failed}`,
        ...results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in batch-extract-documents:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
