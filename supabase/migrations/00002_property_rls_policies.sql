-- Enable Row Level Security on the properties table
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- SELECT: allow all users to read all properties (needed for the public rent page)
CREATE POLICY "properties_select_all"
  ON public.properties
  FOR SELECT
  USING (true);

-- INSERT: allow authenticated users to insert properties
CREATE POLICY "properties_insert_authenticated"
  ON public.properties
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: only allow the owner to update their own properties
CREATE POLICY "properties_update_owner"
  ON public.properties
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: only allow the owner to delete their own properties
CREATE POLICY "properties_delete_owner"
  ON public.properties
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());