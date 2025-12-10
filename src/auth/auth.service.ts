import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { WalletService } from '../wallet/wallet.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private walletService: WalletService,
  ) {}

  async validateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<User> {
    let user = await this.usersService
      .findByGoogleId(googleUser.googleId);

    if (!user) {
      user = await this.usersService.create(googleUser);
      await this.walletService.createWallet(user.id);
    }

    return user;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
