import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    minLength: 1,
    example: 'password123',
    description: 'Account password',
  })
  @IsString()
  @MinLength(1)
  password!: string;
}
