-- Create cycles table
CREATE TABLE public.cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    duration_days INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN end_date IS NOT NULL THEN (end_date - start_date) + 1
            ELSE NULL
        END
    ) STORED,
    cycle_length INTEGER,
    is_predicted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT end_date_after_start_date CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Note: We can add more complex overlap checks using a trigger later if needed.

-- Index for efficient querying by user and date
CREATE INDEX cycles_user_date_idx ON public.cycles(user_id, start_date DESC);

-- Enable RLS
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cycles"
    ON public.cycles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cycles"
    ON public.cycles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cycles"
    ON public.cycles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cycles"
    ON public.cycles FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_cycles_updated_at
    BEFORE UPDATE ON public.cycles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
