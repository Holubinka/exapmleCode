import { IsEmail, IsNotEmpty, IsObject } from 'class-validator';

export class UpdateUserDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsObject()
  profile: UpdateProfileDto;
}

class UpdateProfileDto {
  firstName: string;
  lastName: string;
  bio: string;
}
