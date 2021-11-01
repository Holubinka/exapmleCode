import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { CreateUserDto } from '../user/dto';
import { LoginStatus, RegistrationStatus } from './auth.interface';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  public async register(@Body() createUserDto: CreateUserDto): Promise<RegistrationStatus> {
    const result: RegistrationStatus = await this.authService.register(createUserDto);

    console.log(result);
    if (!result.success) {
      throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
    }

    return result;
  }

  @Post('login')
  public async login(@Body() loginUserDto: LoginUserDto): Promise<LoginStatus> {
    return await this.authService.login(loginUserDto);
  }
}
