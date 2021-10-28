import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { RegistrationStatus } from './auth.interface';
import { UserService } from '../user/user.service';
import { LoginStatus } from './auth.interface';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from '../user/user.interface';
import { JwtPayload } from './auth.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(userDto: CreateUserDto): Promise<RegistrationStatus> {
    let status: RegistrationStatus = {
      success: true,
      message: 'User registered',
    };

    try {
      await this.usersService.createUser(userDto);
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

    const token = this._createToken(user);

    return {
      username: user.username,
      ...token,
    };
  }

  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findByPayload(payload);
    if (!user) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }

  private _createToken({ id, email }: User): any {
    const accessToken = this.jwtService.sign({ id, email });
    return {
      accessToken,
    };
  }
}
