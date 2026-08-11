import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { SchoolAdminGuard } from '../school-admin/guards/school-admin.guard';
import { AdminEmailChangeRequestsService } from './admin-email-change-requests.service';
import { InitiateAdminEmailChangeDto } from './dto/initiate-admin-email-change.dto';
import { ConfirmAdminEmailChangeOtpDto } from './dto/confirm-admin-email-change-otp.dto';
import { ConfigureAdminNewEmailDto } from './dto/configure-admin-new-email.dto';

@Controller('school-admin/email-change-requests')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminEmailChangeRequestsController {
  constructor(private readonly service: AdminEmailChangeRequestsService) {}

  @Post('initiate')
  initiate(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: InitiateAdminEmailChangeDto,
  ) {
    return this.service.initiate(req.user.schoolId, 'school_admin', req.user.sub, dto);
  }

  @Post(':id/confirm-otp')
  confirmOtp(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: ConfirmAdminEmailChangeOtpDto,
  ) {
    return this.service.confirmOtp(req.user.schoolId, 'school_admin', req.user.sub, id, dto.otp);
  }

  @Get()
  listPending(@Request() req: { user: { schoolId: string } }) {
    return this.service.listPendingForSchoolAdmin(req.user.schoolId);
  }

  @Post(':id/configure-email')
  configureEmail(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: ConfigureAdminNewEmailDto,
  ) {
    return this.service.configureNewEmail(req.user.schoolId, req.user.sub, id, dto.newEmail);
  }

  @Post(':id/confirm-new-email')
  confirmNewEmail(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: ConfirmAdminEmailChangeOtpDto,
  ) {
    return this.service.confirmNewEmailAndApply(req.user.schoolId, req.user.sub, id, dto.otp);
  }
}
