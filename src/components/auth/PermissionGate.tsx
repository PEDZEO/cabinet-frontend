import { usePermissionStore } from '../../store/permissions';

interface PermissionGateProps {
  children: React.ReactNode;
  /** Single permission to check */
  permission?: string;
  /** Multiple permissions (OR by default, AND if requireAll is true) */
  permissions?: string[];
  /** When true, ALL listed permissions are required instead of ANY */
  requireAll?: boolean;
  /** Content to render when the user lacks the required permissions */
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const hasPermission = usePermissionStore((state) => state.hasPermission);
  const hasAnyPermission = usePermissionStore((state) => state.hasAnyPermission);
  const hasAllPermissions = usePermissionStore((state) => state.hasAllPermissions);

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll ? hasAllPermissions(...permissions) : hasAnyPermission(...permissions);
  } else {
    // No permissions specified — allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
