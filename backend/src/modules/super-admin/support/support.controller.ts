import { Controller, Post, Get, Delete, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportRequestDto } from '../dto/support-request.dto';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@Controller('super-admin/support')
@UseGuards(SuperAdminGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('request')
  async sendSupportRequest(
    @Body() supportRequestDto: SupportRequestDto,
    @Request() req,
  ) {
    const superAdminId = req.user?.sub;
    const superAdminEmail = req.user?.email;
    return this.supportService.sendSupportRequest(supportRequestDto, superAdminId, superAdminEmail);
  }

  @Get('queries')
  async getQueries(@Request() req) {
    const superAdminId = req.user?.sub;
    return this.supportService.findAll(superAdminId);
  }

  @Get('queries/from-school-admins')
  async getQueriesFromSchoolAdmins() {
    return this.supportService.findFromSchoolAdmins();
  }

  @Get('queries/from-category-admins')
  async getQueriesFromCategoryAdmins() {
    return this.supportService.findFromCategoryAdmins();
  }

  @Get('queries/from-subcategory-admins')
  async getQueriesFromSubcategoryAdmins() {
    return this.supportService.findFromSubcategoryAdmins();
  }

  @Put('queries/:id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.supportService.updateStatus(id, body.status);
  }

  @Post('queries/:id/reply')
  async sendReply(@Param('id') id: string, @Body() body: { message: string }) {
    return this.supportService.sendReply(id, body.message);
  }

  @Post('queries/from-school-admins/:id/reply')
  async replyToSchoolAdmin(@Param('id') id: string, @Body() body: { message: string }) {
    return this.supportService.replyToSchoolAdminQuery(id, body.message);
  }

  @Post('queries/from-category-admins/:id/reply')
  async replyToCategoryAdmin(@Param('id') id: string, @Body() body: { message: string }) {
    return this.supportService.replyToCategoryAdminQuery(id, body.message);
  }

  @Post('queries/from-subcategory-admins/:id/reply')
  async replyToSubcategoryAdmin(@Param('id') id: string, @Body() body: { message: string }) {
    return this.supportService.replyToSubcategoryAdminQuery(id, body.message);
  }

  @Delete('queries/from-school-admins/:id')
  async deleteFromSchoolAdmins(@Param('id') id: string) {
    return this.supportService.deleteFromSchoolAdmins(id);
  }

  @Delete('queries/from-category-admins/:id')
  async deleteFromCategoryAdmins(@Param('id') id: string) {
    return this.supportService.deleteFromCategoryAdmins(id);
  }

  @Delete('queries/from-subcategory-admins/:id')
  async deleteFromSubcategoryAdmins(@Param('id') id: string) {
    return this.supportService.deleteFromSubcategoryAdmins(id);
  }

  @Delete('queries/super-admin/:id')
  async deleteSuperAdminQuery(@Param('id') id: string) {
    return this.supportService.deleteSuperAdminQuery(id);
  }
}
