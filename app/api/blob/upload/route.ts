import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Issues a short-lived token so the browser uploads straight to Blob storage.
 * Video files are far past the 4.5MB request-body limit, so the bytes must
 * never pass through a serverless function.
 *
 * This route is excluded from the auth middleware because Blob storage calls
 * the completion hook itself, with no session cookie — so the session check
 * lives inside the token step instead, which is the half that matters.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const password = process.env.APP_PASSWORD;
        if (password) {
          const token = (await cookies()).get(SESSION_COOKIE)?.value;
          if (!(await verifySessionToken(password, token))) {
            throw new Error("Not signed in.");
          }
        }
        return {
          allowedContentTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"],
          maximumSizeInBytes: 512 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      // The row is created by the client once the upload resolves, so there is
      // nothing to do here — but the callback must exist.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed." },
      { status: 400 },
    );
  }
}
