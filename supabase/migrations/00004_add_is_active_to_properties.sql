-- Add soft-delete column to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Update get_property RPC to also return is_active so the conversation
-- page can detect deactivated listings (it's SECURITY DEFINER, used to
-- bypass RLS and expose a limited set of columns)
CREATE OR REPLACE FUNCTION public.get_property(target_property_id UUID)
RETURNS TABLE (property_type TEXT, property_details TEXT, price INTEGER, address TEXT, image_urls TEXT[], is_active BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.property_type, p.property_details, p.price, p.address, p.image_urls, p.is_active
  FROM public.properties p
  WHERE p.id = target_property_id;
END;
$$;