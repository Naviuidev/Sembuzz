import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { MasterAdminGuard } from '../guards/master-admin.guard';
import { MasterAdminUserSchoolDto } from './dto/master-admin-user-school.dto';
import { MasterAdminUsersService } from './master-admin-users.service';

@Controller('master-admin/users')
@UseGuards(MasterAdminGuard)
export class MasterAdminUsersController {
  constructor(private readonly usersService: MasterAdminUsersService) {}

  @Get('pending')
  listPending(@Query('schoolId') schoolId: string) {
    return this.usersService.listPending(schoolId);
  }

  @Get('approved')
  listApproved(@Query('schoolId') schoolId: string) {
    return this.usersService.listApproved(schoolId);
  }

  @Get('automated')
  listAutomated(@Query('schoolId') schoolId: string) {
    return this.usersService.listAutomated(schoolId);
  }

  @Get('help')
  listHelp(@Query('schoolId') schoolId: string) {
    return this.usersService.listHelp(schoolId);
  }

  @Post(':userId/ban')
  ban(@Param('userId') userId: string, @Body() dto: MasterAdminUserSchoolDto) {
    return this.usersService.ban(dto.schoolId, userId);
  }

  @Post(':userId/unban')
  unban(@Param('userId') userId: string, @Body() dto: MasterAdminUserSchoolDto) {
    return this.usersService.unban(dto.schoolId, userId);
  }
}
