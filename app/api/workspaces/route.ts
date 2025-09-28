import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import { createWorkspace, getUserWorkspaces, addWorkspaceMember } from '@/lib/db/queries';
import { workspaceCreateSchema } from '@/lib/validations/workspace';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const workspaces = await getUserWorkspaces(session.user.id);
    
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = workspaceCreateSchema.parse(body);
    
    // Create workspace
    const workspace = await createWorkspace({
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type,
      owner_id: parseInt(session.user.id, 10),
    });

    // Add owner as a member with admin role
    try {
      await addWorkspaceMember({
        workspace_id: workspace.id,
        user_id: parseInt(session.user.id, 10),
        role: 'admin',
      });
    } catch (error) {
      // If member already exists (unlikely but possible), continue
      console.warn('Failed to add owner as member:', error);
    }

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
