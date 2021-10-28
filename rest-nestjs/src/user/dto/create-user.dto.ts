import { Prisma } from '@prisma/client';
import { IsNotEmpty, IsEmail, IsOptional, IsObject } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsObject()
  profile: CreateProfileDto;
}

class CreateProfileDto {
  firstName: string;
  lastName: string;
  bio: string;
}
