import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto';
import { User } from './user.decorator';
import { ProfileData, UserData } from './user.interface';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('/')
  getAllUsers(): Promise<UserData[]> {
    return this.usersService.getAllUsers();
  }

  @Get('/me')
  getMe(@User('id') id: string): Promise<UserData> {
    return this.usersService.getUserById(id);
  }

  @Patch('/')
  update(@User('id') id: string, @Body() body: UpdateUserDto): Promise<UserData> {
    return this.usersService.updateUser(id, body);
  }

  @Post(':username/follow')
  async follow(@User('id') userId: string, @Param('username') username: string): Promise<ProfileData> {
    return await this.usersService.toggleFollow(userId, username, true);
  }

  @Delete(':username/follow')
  async unFollow(@User('id') userId: string, @Param('username') username: string): Promise<ProfileData> {
    return await this.usersService.toggleFollow(userId, username, false);
  }
}
