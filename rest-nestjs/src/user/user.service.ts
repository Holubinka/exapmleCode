import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User as UserModel } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as argon2 from 'argon2';

const select = {
  email: true,
  firstName: true,
  lastName: true,
  bio: true,
};

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllUsers(): Promise<Partial<UserModel>[]> {
    return await this.prismaService.user.findMany({ select });
  }

  getUserById(id: string): Promise<Partial<UserModel>> {
    const user = this.prismaService.user.findUnique({ where: { id }, select: { id: true, ...select } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<UserModel> {
    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  updateUser(id: string, userData: UpdateUserDto): Promise<Partial<UserModel>> {
    return this.prismaService.user.update({
      where: { id },
      data: userData,
      select,
    });
  }

  async createUser(userData: CreateUserDto): Promise<any> {
    const userInDb = await this.prismaService.user.findUnique({ where: { email: userData.email } });

    if (userInDb) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await argon2.hash(userData.password);

    console.log({
      data: { ...userData, password: hashedPassword },
    });
    const user = await this.prismaService.user.create({
      data: { ...userData, password: hashedPassword },
      select,
    });

    return { user };
  }
}
