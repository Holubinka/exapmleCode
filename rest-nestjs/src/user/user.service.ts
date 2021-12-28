import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User as UserModel } from '@prisma/client';
import { CreateUserDto, UpdateUserDto } from './dto';
import * as bcrypt from 'bcrypt';
import { ProfileData, UserData } from './user.interface';

const userSelect = {
  username: true,
  email: true,
  bio: true,
};

const profileSelect = {
  username: true,
  followedByIDs: true,
  bio: true,
  firstName: true,
  lastName: true,
  id: true,
};

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllUsers(): Promise<UserData[]> {
    return await this.prismaService.user.findMany({ select: userSelect });
  }

  async getUserById(id: string, options: any = {}): Promise<Partial<UserModel>> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: { ...profileSelect, ...options },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<UserModel> {
    const user = await this.prismaService.user.findUnique({ where: { email } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<UserModel> {
    const user = await this.prismaService.user.findUnique({ where: { username } });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async updateUser(id: string, userData: UpdateUserDto): Promise<UserData> {
    return await this.prismaService.user.update({
      where: { id },
      data: userData,
      select: userSelect,
    });
  }

  async deleteUser(username: string): Promise<any> {
    const user = await this.getUserByUsername(username);

    if (user) {
      await this.prismaService.user.delete({
        where: { username },
      });
      return {
        success: true,
        message: 'User successfully deleted',
      };
    }
  }

  async createUser(userData: CreateUserDto): Promise<UserData> {
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

    return await this.prismaService.user.create({
      data: { ...userData, password: hashedPassword },
      select: userSelect,
    });
  }

  async toggleFollow(userId: string, username: string, toggleFollow: boolean): Promise<ProfileData> {
    if (!username) {
      throw new HttpException('Follower username not provided.', HttpStatus.BAD_REQUEST);
    }

    const followed = await this.prismaService.user.findUnique({
      where: { username },
      select: profileSelect,
    });

    if (!followed) {
      throw new HttpException('User to follow not found.', HttpStatus.NOT_FOUND);
    }

    if (followed.id === userId) {
      throw new HttpException('Follower and FollowingId cannot be equal.', HttpStatus.BAD_REQUEST);
    }

    if (followed.followedByIDs.includes(userId) && toggleFollow) {
      throw new HttpException('You are already following for this user', HttpStatus.BAD_REQUEST);
    }

    if (!followed.followedByIDs.includes(userId) && !toggleFollow) {
      throw new HttpException('You are already unFollowing for this user', HttpStatus.BAD_REQUEST);
    }

    await this.prismaService.user.update({
      where: { id: userId },
      select: profileSelect,
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

    const { id, followedByIDs, ...rest } = followed;
    return {
      ...rest,
      following: toggleFollow,
    };
  }
}
