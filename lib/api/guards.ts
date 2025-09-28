import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { idParamSchema, parseIdStrict } from '@/lib/utils/ids'
import { isWorkspaceMemberOrOwner, isWorkspaceOwnerOrAdmin } from '@/lib/db/queries'

export async function requireSession(_req: NextRequest): Promise<{ userId: number }> {
  const session = await getServerSession(getAuthOptions())
  if (!session?.user?.id) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }
  const userId = parseIdStrict(session.user.id, 'userId')
  return { userId }
}

export async function requireWorkspaceMember(
  req: NextRequest,
  params: { id: string }
): Promise<{ userId: number; workspaceId: number }> {
  const { userId } = await requireSession(req)
  const workspaceId = idParamSchema.parse(params.id)
  const hasAccess = await isWorkspaceMemberOrOwner(workspaceId, userId)
  if (!hasAccess) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  return { userId, workspaceId }
}

export async function requireWorkspaceAdmin(
  req: NextRequest,
  params: { id: string }
): Promise<{ userId: number; workspaceId: number }> {
  const { userId } = await requireSession(req)
  const workspaceId = idParamSchema.parse(params.id)
  const hasPermission = await isWorkspaceOwnerOrAdmin(workspaceId, userId)
  if (!hasPermission) {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  return { userId, workspaceId }
}
