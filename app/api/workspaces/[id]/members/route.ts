import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getAuthOptions } from '@/lib/auth';
import {
  getWorkspaceMembers,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  isWorkspaceOwnerOrAdmin,
  isWorkspaceMemberOrOwner,
  getUserByEmail,
  getWorkspaceOwnerId,
  countWorkspaceAdmins,
  getWorkspaceMemberRole
} from '@/lib/db/queries';
import { memberInviteSchema, memberRoleUpdateSchema } from '@/lib/validations/workspace';
import { z } from 'zod';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is member or owner before listing members
    const hasAccess = await isWorkspaceMemberOrOwner(params.id, session.user.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const members = await getWorkspaceMembers(params.id);

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error fetching workspace members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(getAuthOptions());
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is owner or admin
    const hasPermission = await isWorkspaceOwnerOrAdmin(params.id, session.user.id);
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = memberInviteSchema.parse(body);
    
    // Find user by email
    const user = await getUserByEmail(validatedData.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Add member to workspace
    const member = await addWorkspaceMember({
      workspace_id: parseInt(params.id, 10),
      user_id: user.id,
      role: validatedData.role,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error adding workspace member:', error);
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
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is owner or admin
    const hasPermission = await isWorkspaceOwnerOrAdmin(params.id, session.user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = memberRoleUpdateSchema.parse(body);

    // Check if target user is the workspace owner
    const ownerId = await getWorkspaceOwnerId(params.id);
    const targetUserId = parseInt(validatedData.userId, 10);

    if (ownerId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot change role of workspace owner' },
        { status: 400 }
      );
    }

    // If demoting from admin, ensure at least one admin remains
    if (validatedData.role === 'member') {
      const adminCount = await countWorkspaceAdmins(params.id);
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the last admin. At least one admin must remain.' },
          { status: 400 }
        );
      }
    }

    const member = await updateWorkspaceMemberRole(
      parseInt(params.id, 10),
      targetUserId,
      validatedData.role
    );

    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating member role:', error);
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
    const session = await getServerSession(getAuthOptions());

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user is owner or admin
    const hasPermission = await isWorkspaceOwnerOrAdmin(params.id, session.user.id);

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if target user is the workspace owner
    const ownerId = await getWorkspaceOwnerId(params.id);
    const targetUserId = parseInt(userId, 10);

    if (ownerId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot remove workspace owner' },
        { status: 400 }
      );
    }

    // Check if removing the last admin
    const role = await getWorkspaceMemberRole(params.id, userId);
    if (role === 'admin') {
      const adminCount = await countWorkspaceAdmins(params.id);
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin. At least one admin must remain.' },
          { status: 400 }
        );
      }
    }

    await removeWorkspaceMember(parseInt(params.id, 10), targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing workspace member:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
