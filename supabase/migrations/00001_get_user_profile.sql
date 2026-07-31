-- Create a function to fetch a single user's profile (bypasses RLS via SECURITY DEFINER)
-- Only exposes specific fields: username, first_name, surname, avatar_url
CREATE OR REPLACE FUNCTION get_user_profile(target_user_id UUID)
RETURNS TABLE (username TEXT, first_name TEXT, surname TEXT, avatar_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.username, p.first_name, p.surname, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Create a batch function to fetch multiple users' profiles (for the conversation list)
CREATE OR REPLACE FUNCTION get_user_profiles(target_user_ids UUID[])
RETURNS TABLE (user_id UUID, username TEXT, first_name TEXT, surname TEXT, avatar_url TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.user_id, p.username, p.first_name, p.surname, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(target_user_ids);
END;
$$;

-- Create a function to fetch a single property by ID (bypasses RLS via SECURITY DEFINER)
-- Only exposes specific fields: property_type, property_details, price, address, image_urls
CREATE OR REPLACE FUNCTION get_property(target_property_id UUID)
RETURNS TABLE (property_type TEXT, property_details TEXT, price BIGINT, address TEXT, image_urls TEXT[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.property_type, p.property_details, p.price, p.address, p.image_urls
  FROM public.properties p
  WHERE p.id = target_property_id;
END;
$$;