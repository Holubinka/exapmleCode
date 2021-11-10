import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User as UserModel } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { ProfileRO, UserRO } from './user.interface';

const userSelect = {
  username: true,
  email: true,
  bio: true,
};

const profileSelect = {
  username: true,
  bio: true,
  firstName: true,
  lastName: true,
  id: true,
};

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllUsers(): Promise<Partial<UserModel>[]> {
    return await this.prismaService.user.findMany({ select: userSelect });
  }

  async getUserById(id: string): Promise<UserRO> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true, ...userSelect },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    return { user };
  }

  async getUserByEmail(email: string): Promise<UserModel> {
    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    return user;
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<UserRO> {
    const user = await this.prismaService.user.update({
      where: { id },
      data: userData,
      select: userSelect,
    });

    return { user };
  }

  async createUser(userData: CreateUserDto): Promise<UserRO> {
    const userInDb = await this.prismaService.user.findMany({
      where: {
        OR: [
          {
            email: userData.email,
          },
          {
            username: userData.username,
          },
        ],
      },
    });

    if (userInDb.length > 0) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prismaService.user.create({
      data: { ...userData, password: hashedPassword },
      select: userSelect,
    });

    return { user };
  }

  async toggleFollow(userId: string, username: string, toggleFollow: boolean): Promise<ProfileRO> {
    if (!username) {
      throw new HttpException('Follower username not provided.', HttpStatus.BAD_REQUEST);
    }

    const followed = await this.prismaService.user.findUnique({
      where: { username },
      select: profileSelect,
    });

    if (!followed) {
      throw new HttpException('User to follow not found.', HttpStatus.UNPROCESSABLE_ENTITY);
    }

    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        following: toggleFollow
          ? {
              ...{
                connect: {
                  id: followed.id,
                },
              },
            }
          : {
              ...{
                disconnect: {
                  id: followed.id,
                },
              },
            },
      },
    });

    const { id, ...rest } = followed;
    const profile = {
      ...rest,
      following: false,
    };

    return { profile };
  }
}
