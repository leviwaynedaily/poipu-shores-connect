import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at?: string;
    bounce?: {
      reason: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const webhookEvent: ResendWebhookEvent = await req.json();
    console.log("Received webhook event:", webhookEvent.type, "for email:", webhookEvent.data.email_id);

    const emailId = webhookEvent.data.email_id;
    
    // Find the email log by resend_email_id
    const { data: emailLog, error: findError } = await supabaseClient
      .from("email_logs")
      .select("id")
      .eq("resend_email_id", emailId)
      .single();

    if (findError || !emailLog) {
      console.log("Email log not found for resend_email_id:", emailId);
      // Return 200 anyway to prevent Resend from retrying
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prepare update based on event type
    const updateData: any = {};
    
    switch (webhookEvent.type) {
      case "email.delivered":
        updateData.delivered_at = new Date().toISOString();
        updateData.delivery_status = "delivered";
        console.log("Email delivered:", emailId);
        break;
        
      case "email.delivery_delayed":
        updateData.delivery_status = "delayed";
        console.log("Email delivery delayed:", emailId);
        break;
        
      case "email.bounced":
        updateData.bounced_at = new Date().toISOString();
        updateData.bounce_reason = webhookEvent.data.bounce?.reason || "Unknown";
        updateData.delivery_status = "bounced";
        console.log("Email bounced:", emailId, "Reason:", updateData.bounce_reason);
        break;
        
      case "email.complained":
        updateData.complained_at = new Date().toISOString();
        updateData.delivery_status = "complained";
        console.log("Email complaint (spam):", emailId);
        break;
        
      case "email.opened":
        updateData.opened_at = new Date().toISOString();
        if (updateData.delivery_status !== "clicked") {
          updateData.delivery_status = "opened";
        }
        console.log("Email opened:", emailId);
        break;
        
      case "email.clicked":
        updateData.clicked_at = new Date().toISOString();
        updateData.delivery_status = "clicked";
        console.log("Email clicked:", emailId);
        break;
        
      default:
        console.log("Unknown event type:", webhookEvent.type);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }

    // Update the email log
    const { error: updateError } = await supabaseClient
      .from("email_logs")
      .update(updateData)
      .eq("id", emailLog.id);

    if (updateError) {
      console.error("Error updating email log:", updateError);
      throw updateError;
    }

    console.log("Email log updated successfully for:", emailId);

    return new Response(
      JSON.stringify({ received: true, updated: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in email-webhook function:", error);
    
    // Return 200 even on error to prevent Resend from retrying endlessly
    return new Response(
      JSON.stringify({ 
        received: true, 
        error: error.message 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
