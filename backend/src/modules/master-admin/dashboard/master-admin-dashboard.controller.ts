import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { MasterAdminGuard } from '../guards/master-admin.guard';
import type { MasterAdminJwtPayload } from '../types/master-admin-jwt.types';
import { MasterAdminDashboardService } from './master-admin-dashboard.service';

@Controller('master-admin/dashboard')
@UseGuards(MasterAdminGuard)
export class MasterAdminDashboardController {
  constructor(private readonly dashboardService: MasterAdminDashboardService) {}

  @Get('summary')
  getSummary(@Request() req: { user: MasterAdminJwtPayload }) {
    return this.dashboardService.getSummary(req.user);
  }
}
