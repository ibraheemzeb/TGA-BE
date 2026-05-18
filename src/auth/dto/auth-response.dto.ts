import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id!: string;

  @ApiProperty({ example: 'Ahmed Al-Rashid' })
  name!: string;

  @ApiProperty({ example: 'Policy & Compliance' })
  department!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiProperty({ example: ['user'], type: [String] })
  roles!: string[];
}

export class AuthSuccessResponseDto {
  @ApiProperty({ example: true })
  ok!: true;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  ok!: true;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'BAD_REQUEST' })
  code!: string;

  @ApiProperty({ example: 'Validation failed' })
  message!: string;

  @ApiProperty({ example: ['Passwords do not match'], type: [String] })
  error!: string | string[];
}
