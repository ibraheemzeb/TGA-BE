import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { SESSION_COOKIE } from '../common/constants/auth.constants';
import { Public } from '../common/decorators/public.decorator';
import { AuthService, AuthUserResponse } from './auth.service';
import {
  AuthSuccessResponseDto,
  ErrorResponseDto,
  LogoutResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({
    summary: 'Create account and start session',
    description:
      'Creates a user with name, department, email, and password. Sets an httpOnly session cookie (`tga_session`) on success.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({
    type: AuthSuccessResponseDto,
    description: 'User registered; session cookie set',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Validation error',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Email already registered',
  })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true; user: AuthUserResponse }> {
    const user = await this.authService.register(
      {
        name: dto.name,
        department: dto.department,
        email: dto.email,
        password: dto.password,
      },
      res,
    );
    return { ok: true, user };
  }

  @Public()
  @Throttle({ auth: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({
    summary: 'Sign in and start session',
    description: 'Authenticates with email and password. Sets httpOnly `tga_session` cookie.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    type: AuthSuccessResponseDto,
    description: 'Authenticated; session cookie set',
  })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'Invalid email or password',
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ ok: true; user: AuthUserResponse }> {
    const user = await this.authService.login(dto.email, dto.password, res);
    return { ok: true, user };
  }

  @Public()
  @Post('logout')
  @ApiOperation({
    summary: 'Sign out',
    description: 'Clears the `tga_session` cookie.',
  })
  @ApiOkResponse({ type: LogoutResponseDto })
  logout(@Res({ passthrough: true }) res: Response): LogoutResponseDto {
    this.authService.logout(res);
    return { ok: true };
  }

  @Get('me')
  @ApiCookieAuth(SESSION_COOKIE)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Current user',
    description: 'Returns the authenticated user from JWT (cookie or Bearer token).',
  })
  @ApiOkResponse({ type: AuthSuccessResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  me(@Req() req: { user: AuthUserResponse }): AuthSuccessResponseDto {
    return { ok: true, user: req.user };
  }
}
