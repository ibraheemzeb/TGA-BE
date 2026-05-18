import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ahmed Al-Rashid' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: 'Policy & Compliance' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  department!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({
    minLength: 8,
    example: 'password123',
    description: 'Must be at least 8 characters',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
