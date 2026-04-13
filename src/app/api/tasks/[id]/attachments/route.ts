import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

async function checkIsAdmin(user: any) {
  if (!user) return false;
  if (process.env.SUPER_ADMIN_EMAIL && user.email === process.env.SUPER_ADMIN_EMAIL) {
    return true;
  }
  const employee = await prisma.employee.findUnique({
    where: { id: user.id },
    include: { role: true }
  });
  return employee?.role?.name === "Admin";
}

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

    const attachment = await prisma.task_attachments.findUnique({
      where: { id: attachment_id },
      include: { task: true }
    });

    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    // Authorization: Only Admin, Uploader, or Task Creator can delete
    const isAdmin = await checkIsAdmin(user);
    const isUploader = attachment.uploaded_by === user.id;
    const isCreator = attachment.task.created_by === user.id;

    if (!isAdmin && !isUploader && !isCreator) {
      return NextResponse.json({ error: "Forbidden: You don't have permission to delete this attachment" }, { status: 403 });
    }

    // Delete from Supabase Storage first
    try {
      const supabaseAdmin = getSupabaseAdmin();
      // file_url looks like: https://.../storage/v1/object/public/task-attachments/attachments/...
      const pathParts = attachment.file_url.split('/task-attachments/');
      if (pathParts.length > 1) {
        const storagePath = pathParts[1];
        await supabaseAdmin.storage.from('task-attachments').remove([storagePath]);
      }
    } catch (storageError) {
      console.error("Failed to delete physical file from storage:", storageError);
      // We continue to delete the DB record even if storage deletion fails
    }

    // Delete from Database
    await prisma.task_attachments.delete({
      where: { id: attachment_id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete attachment" }, { status: 500 });
  }
}
