import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    validateUser(userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string;
    }>;
}
