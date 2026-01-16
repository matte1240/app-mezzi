import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  
  // Join path segments and prevent directory traversal
  const safePath = path.normalize(pathSegments.join("/")).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(process.cwd(), "public/uploads", safePath);

  if (!existsSync(filePath)) {
    return new NextResponse("File not found", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on extension
    const ext = path.extname(safePath).toLowerCase();
    let contentType = "application/octet-stream";
    
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".svg") contentType = "image/svg+xml";
    else if (ext === ".pdf") contentType = "application/pdf";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
