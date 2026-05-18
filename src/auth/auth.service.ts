import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import { SESSION_COOKIE } from '../common/constants/auth.constants';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface AuthUserResponse {
  id: string;
  name: string;
  department: string;
  email: string;
  roles: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  private toAuthUser(user: UserDocument): AuthUserResponse {
    return {
      id: user.id,
      name: user.name,
      department: user.department,
      email: user.email,
      roles: user.roles ?? ['user'],
    };
  }

  private signToken(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles ?? ['user'],
    };
    return this.jwtService.sign(payload);
  }

  private cookieOptions(): CookieOptions {
    const isProd = this.config.get<string>('nodeEnv') === 'production';
    const domain = this.config.get<string>('cookie.domain');
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;

    const options: CookieOptions = {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      path: '/',
      maxAge: maxAgeMs,
    };

    if (domain) {
      options.domain = domain;
    }

    return options;
  }

  setSessionCookie(res: Response, token: string) {
    res.cookie(SESSION_COOKIE, token, this.cookieOptions());
  }

  clearSessionCookie(res: Response) {
    res.clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  async register(
    input: {
      name: string;
      department: string;
      email: string;
      password: string;
    },
    res: Response,
  ): Promise<AuthUserResponse> {
    const user = await this.usersService.create(input);
    const token = this.signToken(user);
    this.setSessionCookie(res, token);
    return this.toAuthUser(user);
  }

  async login(
    email: string,
    password: string,
    res: Response,
  ): Promise<AuthUserResponse> {
    const user = await this.usersService.assertValidCredentials(email, password);
    const token = this.signToken(user);
    this.setSessionCookie(res, token);
    return this.toAuthUser(user);
  }

  logout(res: Response) {
    this.clearSessionCookie(res);
  }
}
