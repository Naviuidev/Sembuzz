import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { UserGuard } from '../guards/user.guard';
import { UserHelpService } from './user-help.service';
import { CreateUserHelpDto } from './dto/create-user-help.dto';

@Controller('user/help')
@UseGuards(UserGuard)
export class UserHelpController {
  constructor(private readonly userHelpService: UserHelpService) {}

  @Post()
  async create(
    @Request() req: { user: { sub: string } },
    @Body() dto: CreateUserHelpDto,
  ) {
    return this.userHelpService.create(req.user.sub, dto.message);
  }

  @Get()
  async findMyQueries(@Request() req: { user: { sub: string } }) {
    return this.userHelpService.findMyQueries(req.user.sub);
  }
}
