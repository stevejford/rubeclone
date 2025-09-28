export function isValidToolkit(toolkit: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(toolkit) && toolkit.length > 0 && toolkit.length <= 50
}

export function generateComposioUserId(
  userId: string | number,
  workspaceId: string | number,
  isPersonal: boolean
): string {
  return isPersonal ? `user_${userId}` : `org_${workspaceId}`
}
