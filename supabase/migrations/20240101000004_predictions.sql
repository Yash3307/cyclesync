-- Create predictions table
CREATE TABLE public.predictions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    predicted_start DATE NOT NULL,
    predicted_end DATE NOT NULL,
    confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
    fertile_start DATE,
    fertile_end DATE,
    ovulation_day DATE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for efficient querying by user
CREATE INDEX predictions_user_idx ON public.predictions(user_id);

-- Enable RLS
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own predictions"
    ON public.predictions FOR SELECT
    USING (auth.uid() = user_id);

-- Normally predictions are inserted/updated by the Edge Function or backend with service role, 
-- but users might trigger recalculations, so we allow INSERT/UPDATE if needed, or stick to service_role.
-- Allowing users to run the algorithm client-side and push to DB is also an option.
CREATE POLICY "Users can insert their own predictions"
    ON public.predictions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions"
    ON public.predictions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own predictions"
    ON public.predictions FOR DELETE
    USING (auth.uid() = user_id);
