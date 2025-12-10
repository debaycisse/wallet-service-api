import {
  Injectable,
  ExecutionContext,
  UnauthorizedException
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrApiKeyGuard extends AuthGuard(
  ['jwt', 'api-key']
) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(
    err: any,
    user: any, 
    info: any,
    context: ExecutionContext
  ) {
    if (err || !user) {
      throw err || new UnauthorizedException(
        'Authentication required'
      );
    }
    return user;
  }
}
