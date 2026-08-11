import { Body, Controller, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { SchoolAdminGuard } from '../guards/school-admin.guard';
import { UpdateEmailDto } from '../../platform-user/dto/update-email.dto';
import { SchoolAdminAdsAdminsService } from './ads-admins.service';

@Controller('school-admin/ads-admins')
@UseGuards(SchoolAdminGuard)
export class SchoolAdminAdsAdminsController {
  constructor(private readonly service: SchoolAdminAdsAdminsService) {}

  @Get()
  async findAll(@Request() req: { user: { schoolId: string } }) {
    return this.service.findAll(req.user.schoolId);
  }

  @Patch(':id/email')
  async updateEmail(
    @Param('id') id: string,
    @Request() req: { user: { schoolId: string } },
    @Body() dto: UpdateEmailDto,
  ) {
    return this.service.updateEmail(id, req.user.schoolId, dto.email);
  }
}
