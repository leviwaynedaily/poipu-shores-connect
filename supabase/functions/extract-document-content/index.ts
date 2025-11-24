import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { extractText } from "https://esm.sh/unpdf@0.11.0";

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

    const { documentId, filePath } = await req.json();

    if (!documentId || !filePath) {
      return new Response(
        JSON.stringify({ error: "documentId and filePath are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracting content for document ${documentId} at path ${filePath}`);

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(filePath);

    if (downloadError) {
      console.error("Error downloading file:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get file extension
    const extension = filePath.split(".").pop()?.toLowerCase();
    let extractedText = "";

    // Extract text based on file type
    if (extension === "txt" || extension === "md") {
      // Plain text files
      extractedText = await fileData.text();
    } else if (extension === "pdf") {
      // Extract text from PDF using unpdf
      try {
        const arrayBuffer = await fileData.arrayBuffer();
        const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
        extractedText = text || "";
        console.log(`Extracted ${extractedText.length} characters from PDF`);
      } catch (pdfError) {
        console.error("Error extracting PDF content:", pdfError);
        extractedText = `[PDF Document - ${filePath}]\nError extracting content: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`;
      }
    } else if (extension === "doc" || extension === "docx") {
      // For Word docs, mark as requiring processing
      extractedText = `[Word Document - ${filePath}]\nContent extraction for Word documents requires additional processing. This document has been uploaded and can be downloaded for viewing.`;
    } else {
      extractedText = `[${extension?.toUpperCase() || 'Unknown'} Document - ${filePath}]\nThis document type requires specialized processing for content extraction.`;
    }

    // Update the document record with extracted content
    const { error: updateError } = await supabase
      .from("documents")
      .update({ content: extractedText })
      .eq("id", documentId);

    if (updateError) {
      console.error("Error updating document content:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update document content" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully extracted content for document ${documentId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        contentLength: extractedText.length,
        message: "Content extracted and stored successfully"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-document-content:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
