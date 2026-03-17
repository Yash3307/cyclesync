-- Create symptoms table
CREATE TABLE public.symptoms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    cycle_id UUID REFERENCES public.cycles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL,
    severity INTEGER CHECK (severity >= 1 AND severity <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: cycle_id can be nullable if logging an out-of-cycle symptom, though typically it belongs to a cycle.

-- Index for efficient querying by user, cycle, and date
CREATE INDEX symptoms_user_date_idx ON public.symptoms(user_id, date DESC);
CREATE INDEX symptoms_cycle_idx ON public.symptoms(cycle_id);

-- Enable RLS
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own symptoms"
    ON public.symptoms FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own symptoms"
    ON public.symptoms FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own symptoms"
    ON public.symptoms FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own symptoms"
    ON public.symptoms FOR DELETE
    USING (auth.uid() = user_id);
