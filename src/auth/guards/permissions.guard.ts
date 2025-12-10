import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const authType = request.authType;

    // If authenticated via JWT, allow all actions
    if (authType === 'jwt')
      return true;

    const apiKeyPermissions = request.permissions;
    // If authenticated via API key, check permissions
    if (authType === 'api-key') {
      const hasPermission = requiredPermissions.every((permission) =>
        apiKeyPermissions.includes(permission)
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Missing required permissions: ${requiredPermissions.join(', ')}`,
        );
      }

      return true;
    }

    return false;
  }
}
