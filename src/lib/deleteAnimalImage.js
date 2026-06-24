import { supabase } from "@/api/supabaseClient";

export async function deleteAnimalImage({
  animalId,
  photoUrl,
  currentUrls = [],
}) {
  if (!photoUrl) return;

  try {
    // -------------------------
    // 1. SAFELY EXTRACT FILE PATH
    // -------------------------
    const url = new URL(photoUrl);
    const pathParts = url.pathname.split("/animal-photos/");

    if (!pathParts[1]) {
      throw new Error("Invalid storage path format");
    }

    const filePath = decodeURIComponent(pathParts[1]);

    // -------------------------
    // 2. DELETE FROM STORAGE
    // -------------------------
    const { error: storageError } = await supabase.storage
      .from("animal-photos")
      .remove([filePath]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
    }

    // -------------------------
    // 3. UPDATE DB ARRAY SAFELY
    // -------------------------
    const updatedUrls = currentUrls.filter((url) => url !== photoUrl);

    const { error: dbError } = await supabase
      .from("animals")
      .update({ photo_urls: updatedUrls })
      .eq("id", animalId);

    if (dbError) {
      console.error("DB update error:", dbError);
      throw dbError;
    }

    return updatedUrls;
  } catch (err) {
    console.error("deleteAnimalImage failed:", err);
    throw err;
  }
}