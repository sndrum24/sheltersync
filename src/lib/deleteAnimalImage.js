import { supabase } from "@/api/supabaseClient";

export async function deleteAnimalImage({ animalId, photoUrl, currentUrls }) {
  if (!photoUrl) return;

  // 1. Extract file path from Supabase URL
  const urlParts = photoUrl.split("/animal-photos/");
  const filePath = urlParts[1];

  // 2. Delete from storage
  const { error: storageError } = await supabase.storage
    .from("animal-photos")
    .remove([filePath]);

  if (storageError) {
    console.error("Storage delete error:", storageError);
  }

  // 3. Remove from DB array
  const updatedUrls = (currentUrls || []).filter((url) => url !== photoUrl);

  const { error: dbError } = await supabase
    .from("animals")
    .update({ photo_urls: updatedUrls })
    .eq("id", animalId);

  if (dbError) {
    console.error("DB update error:", dbError);
    throw dbError;
  }

  return updatedUrls;
}