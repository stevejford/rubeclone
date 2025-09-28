import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceById, updateWorkspace, deleteWorkspace } from '@/lib/db/queries';
import { workspaceUpdateSchema } from '@/lib/validations/workspace';
import { z } from 'zod';
import { requireWorkspaceMember, requireWorkspaceAdmin, requireSession } from '@/lib/api/guards';
import { idParamSchema } from '@/lib/utils/ids';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId } = await requireWorkspaceMember(request, params);
    const workspace = await getWorkspaceById(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireWorkspaceAdmin(request, params);

    const body = await request.json();
    const validatedData = workspaceUpdateSchema.parse(body);
    
    const updateData: Partial<{ name: string; description: string | null }> = {};
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }

    const workspaceId = idParamSchema.parse(params.id);
    const workspace = await updateWorkspace(workspaceId, updateData);
    
    return NextResponse.json({ workspace });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await requireSession(request);

    // Check if user is workspace owner
    const workspaceId = idParamSchema.parse(params.id);
    const workspace = await getWorkspaceById(workspaceId);

    if (!workspace || workspace.owner_id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await deleteWorkspace(workspaceId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
