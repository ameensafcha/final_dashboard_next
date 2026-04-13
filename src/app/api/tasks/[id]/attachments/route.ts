import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: task_id } = await params;
    const { file_name, file_url, file_size, file_type } = await request.json();

    if (!file_name || !file_url) {
      return NextResponse.json({ error: "Missing file information" }, { status: 400 });
    }

    const attachment = await prisma.task_attachments.create({
      data: {
        task_id,
        file_name,
        file_url,
        file_size,
        file_type,
        uploaded_by: user.id,
      },
    });

    return NextResponse.json({ data: attachment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save attachment" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: task_id } = await params;
    const { searchParams } = new URL(request.url);
    const attachment_id = searchParams.get("attachment_id");

    if (!attachment_id) {
      return NextResponse.json({ error: "Attachment ID is required" }, { status: 400 });
    }

    // Optional: Add check to ensure user has permission or is uploader
    await prisma.task_attachments.delete({
      where: { id: attachment_id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }
}
