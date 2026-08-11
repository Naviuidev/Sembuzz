import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { CategoryAdminGuard } from '../category-admin/guards/category-admin.guard';
import { AdminEmailChangeRequestsService } from './admin-email-change-requests.service';
import { InitiateAdminEmailChangeDto } from './dto/initiate-admin-email-change.dto';
import { ConfirmAdminEmailChangeOtpDto } from './dto/confirm-admin-email-change-otp.dto';

@Controller('category-admin/email-change-requests')
@UseGuards(CategoryAdminGuard)
export class CategoryAdminEmailChangeRequestsController {
  constructor(private readonly service: AdminEmailChangeRequestsService) {}

  @Post('initiate')
  initiate(
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: InitiateAdminEmailChangeDto,
  ) {
    return this.service.initiate(req.user.schoolId, 'category_admin', req.user.sub, dto);
  }

  @Post(':id/confirm-otp')
  confirmOtp(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string; sub: string } },
    @Body() dto: ConfirmAdminEmailChangeOtpDto,
  ) {
    return this.service.confirmOtp(req.user.schoolId, 'category_admin', req.user.sub, id, dto.otp);
  }
}
