import { Injectable, ConflictException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { UpdateFeatureDto } from '../dto/update-feature.dto';

@Injectable()
export class FeaturesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    try {
      return await this.prisma.feature.findMany({
        orderBy: { createdAt: 'asc' },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[SuperAdmin Features] findAll error:', message, err);
      throw new HttpException(
        { statusCode: 500, message: 'Failed to load features' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByCode(code: string) {
    return this.prisma.feature.findUnique({
      where: { code },
    });
  }

  async findById(id: string) {
    return this.prisma.feature.findUnique({
      where: { id },
    });
  }

  async create(createFeatureDto: CreateFeatureDto) {
    // Check if feature with same code already exists
    const existing = await this.findByCode(createFeatureDto.code);
    if (existing) {
      throw new ConflictException(`Feature with code ${createFeatureDto.code} already exists`);
    }

    return this.prisma.feature.create({
      data: {
        code: createFeatureDto.code,
        name: createFeatureDto.name,
      },
    });
  }

  async update(id: string, updateFeatureDto: UpdateFeatureDto) {
    const feature = await this.findById(id);
    if (!feature) {
      throw new NotFoundException(`Feature with id ${id} not found`);
    }

    return this.prisma.feature.update({
      where: { id },
      data: updateFeatureDto,
    });
  }

  async remove(id: string) {
    const feature = await this.findById(id);
    if (!feature) {
      throw new NotFoundException(`Feature with id ${id} not found`);
    }

    // Check if feature is being used by any schools
    const schoolFeatures = await this.prisma.schoolFeature.findMany({
      where: { featureId: id },
    });

    if (schoolFeatures.length > 0) {
      throw new ConflictException(
        `Cannot delete feature. It is currently assigned to ${schoolFeatures.length} school(s)`,
      );
    }

    return this.prisma.feature.delete({
      where: { id },
    });
  }

  async seedFeatures() {
    const features = [
      { code: 'NEWS', name: 'News' },
      { code: 'EVENTS', name: 'Events' },
      { code: 'ADS', name: 'Advertisements' },
      { code: 'INSTAGRAM', name: 'Instagram Feed' },
      { code: 'ANALYTICS', name: 'Analytics' },
      { code: 'EMERGENCY', name: 'Emergency Notifications' },
    ];

    for (const feature of features) {
      await this.prisma.feature.upsert({
        where: { code: feature.code },
        update: {},
        create: feature,
      });
    }

    return this.findAll();
  }
}
