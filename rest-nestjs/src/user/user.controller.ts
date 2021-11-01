import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { User as UserModel } from '@prisma/client';
import { UpdateUserDto } from './dto';
import { User } from './user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('/')
  getAllUsers(): Promise<Partial<UserModel>[]> {
    return this.usersService.getAllUsers();
  }

  @Get('/me')
  getMe(@User('id') id: string): Promise<Partial<UserModel>> {
    return this.usersService.getUserById(id);
  }

  @Patch('/:id')
  update(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<Partial<UserModel>> {
    return this.usersService.updateUser(id, body);
  }
}
