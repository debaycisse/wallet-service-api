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

    // If authenticated via JWT, allow all actions
    if (user.email) {
      return true;
    }

    // If authenticated via API key, check permissions
    if (user.permissions) {
      const hasPermission = requiredPermissions.every((permission) =>
        user.permissions.includes(permission),
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
