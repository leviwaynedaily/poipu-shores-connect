-- Add delivery tracking columns to email_logs table
ALTER TABLE public.email_logs
ADD COLUMN resend_email_id TEXT,
ADD COLUMN delivered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN bounced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN bounce_reason TEXT,
ADD COLUMN complained_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN delivery_status TEXT DEFAULT 'sent';

-- Create index for resend_email_id lookups
CREATE INDEX idx_email_logs_resend_id ON public.email_logs(resend_email_id);

-- Add comment explaining delivery_status values
COMMENT ON COLUMN public.email_logs.delivery_status IS 'Possible values: sent, delivered, bounced, complained, opened, clicked';