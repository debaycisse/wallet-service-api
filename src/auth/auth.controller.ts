import { 
  Controller,
  Get,
  Req,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  GoogleAuthSwagger,
  GoogleCallbackSwagger
} from '../common/decorators/swagger/auth.swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @GoogleAuthSwagger()
  async googleAuth() {
    /**
     * Guard initiates the Google OAuth flow
     * This method won't be reached as the
     *  guard handles the redirect
     */ 
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @GoogleCallbackSwagger()
  async googleAuthRedirect(@Req() req) {
    const user = await this.authService.validateGoogleUser(req.user);
    return this.authService.login(user);
  }
}
