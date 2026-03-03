import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { FeaturesService } from './features.service';
import { SuperAdminGuard } from '../guards/super-admin.guard';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { UpdateFeatureDto } from '../dto/update-feature.dto';

@Controller('super-admin/features')
@UseGuards(SuperAdminGuard)
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get()
  async findAll() {
    return this.featuresService.findAll();
  }

  @Post()
  async create(@Body() createFeatureDto: CreateFeatureDto) {
    return this.featuresService.create(createFeatureDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateFeatureDto: UpdateFeatureDto) {
    return this.featuresService.update(id, updateFeatureDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.featuresService.remove(id);
  }
}
