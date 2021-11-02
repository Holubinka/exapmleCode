import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { User as UserModel } from '@prisma/client';
import { UpdateUserDto } from './dto';
import { User } from './user.decorator';
import { ProfileRO, UserRO } from './user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('/')
  getAllUsers(): Promise<Partial<UserModel>[]> {
    return this.usersService.getAllUsers();
  }

  @Get('/me')
  getMe(@User('id') id: string): Promise<UserRO> {
    return this.usersService.getUserById(id);
  }

  @Patch('/:id')
  update(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<UserRO> {
    return this.usersService.updateUser(id, body);
  }

  @Post(':username/follow')
  async follow(@User('id') userId: string, @Param('username') username: string): Promise<ProfileRO> {
    return await this.usersService.toggleFollow(userId, username, true);
  }

  @Delete(':username/follow')
  async unFollow(@User('id') userId: string, @Param('username') username: string): Promise<ProfileRO> {
    return await this.usersService.toggleFollow(userId, username, false);
  }
}
