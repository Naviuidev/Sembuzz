import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { UpdateFeatureDto } from '../dto/update-feature.dto';
export declare class FeaturesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        code: string;
    }[]>;
    findByCode(code: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        code: string;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        code: string;
    } | null>;
    create(createFeatureDto: CreateFeatureDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        code: string;
    }>;
    update(id: string, updateFeatureDto: UpdateFeatureDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        code: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        code: string;
    }>;
    seedFeatures(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        code: string;
    }[]>;
}
