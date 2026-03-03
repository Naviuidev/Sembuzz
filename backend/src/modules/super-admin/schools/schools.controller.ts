import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from '../dto/create-school.dto';
import { UpdateSchoolDto } from '../dto/update-school.dto';
import { SuperAdminGuard } from '../guards/super-admin.guard';

@Controller('super-admin/schools')
@UseGuards(SuperAdminGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  async create(@Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(createSchoolDto);
  }

  @Get()
  async findAll() {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    return this.schoolsService.update(id, updateSchoolDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }

  @Post(':id/send-email')
  async sendEmail(
    @Param('id') id: string,
    @Body() body: { emailType: string },
  ) {
    return this.schoolsService.sendEmailToSchool(id, body.emailType);
  }
}
