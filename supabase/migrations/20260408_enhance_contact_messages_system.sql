-- Add columns to contact_messages for enhanced functionality
ALTER TABLE public.contact_messages
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'resolved')),
ADD COLUMN is_edited BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN edited_at TIMESTAMPTZ,
ADD COLUMN edit_count INT NOT NULL DEFAULT 0,
ADD COLUMN shipping_phone TEXT,
ADD COLUMN shipping_country TEXT;

-- Create contact_message_replies table for admin responses
CREATE TABLE IF NOT EXISTS public.contact_message_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.contact_messages(id) ON DELETE CASCADE NOT NULL,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reply_text TEXT NOT NULL,
  read_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on reply table
ALTER TABLE public.contact_message_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_message_replies
CREATE POLICY "Users can view their message replies" ON public.contact_message_replies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.contact_messages
    WHERE contact_messages.id = contact_message_replies.message_id
    AND contact_messages.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all replies" ON public.contact_message_replies
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert replies" ON public.contact_message_replies
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update replies" ON public.contact_message_replies
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete replies" ON public.contact_message_replies
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Update contact_messages RLS policies for user access
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;

-- Allow authenticated users to insert their own messages
CREATE POLICY "Authenticated users can insert contact messages" ON public.contact_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to view their own messages
CREATE POLICY "Users can view their own messages" ON public.contact_messages
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own messages (for editing before reply)
CREATE POLICY "Users can update their messages before reply" ON public.contact_messages
FOR UPDATE
USING (auth.uid() = user_id AND status = 'new')
WITH CHECK (auth.uid() = user_id AND status = 'new');

-- Create trigger to update updated_at for contact_message_replies
CREATE TRIGGER update_contact_message_replies_updated_at 
BEFORE UPDATE ON public.contact_message_replies 
FOR EACH ROW 
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON public.contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_message_replies_message_id ON public.contact_message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_contact_message_replies_created_at ON public.contact_message_replies(created_at DESC);
