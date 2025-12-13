import type { APIRoute } from "astro";
import { v4 as uuidv4 } from "uuid";

// File type validation
const ALLOWED_TYPES = {
  pdf: ["application/pdf"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
};

const MAX_FILE_SIZES = {
  pdf: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  image: 5 * 1024 * 1024, // 5MB
};

function getFileType(mimeType: string): "pdf" | "video" | "image" | null {
  if (ALLOWED_TYPES.pdf.includes(mimeType)) return "pdf";
  if (ALLOWED_TYPES.video.includes(mimeType)) return "video";
  if (ALLOWED_TYPES.image.includes(mimeType)) return "image";
  return null;
}

function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export const POST: APIRoute = async ({ locals, request }) => {
  const { supabase, user } = locals;

  // Check authorization
  if (!user || user.role !== "admin") {
    return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ success: false, error: "No file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file type
    const fileType = getFileType(file.type);
    if (!fileType) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid file type. Allowed types: PDF, Video (MP4, WebM), Images (JPEG, PNG, WebP, GIF)`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[fileType];
    if (file.size > maxSize) {
      const maxSizeMB = Math.floor(maxSize / (1024 * 1024));
      return new Response(
        JSON.stringify({
          success: false,
          error: `File too large. Maximum size for ${fileType}: ${maxSizeMB}MB`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate unique filename
    const extension = getFileExtension(file.name);
    const uniqueFilename = `${uuidv4()}.${extension}`;
    const filePath = `${fileType}s/${uniqueFilename}`;

    // Convert File to ArrayBuffer for Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage.from("lesson-materials").upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("lesson-materials").getPublicUrl(filePath);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          url: urlData.publicUrl,
          filename: file.name,
          type: fileType,
          size: file.size,
          path: filePath,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload file",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
