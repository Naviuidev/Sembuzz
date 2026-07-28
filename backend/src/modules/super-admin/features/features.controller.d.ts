import { FeaturesService } from './features.service';
import { CreateFeatureDto } from '../dto/create-feature.dto';
import { UpdateFeatureDto } from '../dto/update-feature.dto';
export declare class FeaturesController {
    private readonly featuresService;
    constructor(featuresService: FeaturesService);
    findAll(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        code: string;
    }[]>;
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
}
