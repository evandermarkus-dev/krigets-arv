-- RLS-policies för publikt läsande av konfliktdata
-- Service role (backend) kringgår alltid RLS och påverkas inte av dessa.
-- Policies aktiverar läsning för anon-nyckel (framtida frontend-användning).

-- conflict_meta: visa bara aktiva konflikter publikt
ALTER TABLE public.conflict_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_conflicts"
  ON public.conflict_meta
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- conflict_stats: alla rader är publik information
ALTER TABLE public.conflict_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_conflict_stats"
  ON public.conflict_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- documents: visa bara dokument som har klassificerats (doc_type satt)
-- Filtrerar bort hemsidor och skräpdata från pilot-scrapen
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_typed_documents"
  ON public.documents
  FOR SELECT
  TO anon, authenticated
  USING (doc_type IS NOT NULL);

-- Inga INSERT/UPDATE/DELETE via anon eller authenticated — service role sköter allt
