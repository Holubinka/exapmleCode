import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User } from './user.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  getAllUsers(): Promise<User[]> {
    return this.prismaService.user.findMany();
  }

  getUserById(id: string): Promise<User> {
    return this.prismaService.user.findUnique({ where: { id } });
  }

  getUserByEmail(email: string): Promise<User> {
    return this.prismaService.user.findUnique({ where: { email } });
  }

  updateUser(id: string, userData: UpdateUserDto): Promise<User> {
    return this.prismaService.user.update({
      where: { id },
      data: {
        email: userData.email,
        profile: {
          update: userData?.profile,
        },
      },
    });
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    const userInDb = await this.getUserByEmail(userData.email);

    if (userInDb) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    return this.prismaService.user.create({
      data: { ...userData, profile: { create: userData?.profile } },
    });
  }
}
