import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../user/dto';
import { JwtPayload, LoginStatus, RegistrationStatus } from './auth.interface';
import { UserService } from '../user/user.service';
import { LoginUserDto } from './dto';
import jwt from 'jsonwebtoken';

import { User as UserModel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import constants from '../constants';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UserService) {}

  async register(userDto: CreateUserDto): Promise<RegistrationStatus> {
    let status: RegistrationStatus = {
      success: true,
      message: 'User registered',
    };

    try {
      await this.usersService.createUser(userDto);
      console.log('rty');
    } catch (err) {
      status = {
        success: false,
        message: err,
      };
    }

    return status;
  }

  async login({ email, password }: LoginUserDto): Promise<LoginStatus> {
    const user = await this.usersService.getUserByEmail(email);

    const areEqual = await bcrypt.compare(user.password, password);

    if (!areEqual) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    const accessToken = this._createToken(user);

    return {
      accessToken,
    };
  }

  async validateUser({ email }: JwtPayload): Promise<Partial<UserModel>> {
    const user = await this.usersService.getUserByEmail(email);

    if (!user) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  private _createToken({ id, email }: UserModel): any {
    const accessToken = jwt.sign({ id, email }, constants.authSecret);

    return {
      accessToken,
    };
  }
}
