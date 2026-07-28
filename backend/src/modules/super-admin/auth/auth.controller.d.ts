import { AuthService } from './auth.service';
import { LoginDto } from '../dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    logout(): Promise<{
        message: string;
    }>;
    getMe(req: any): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string;
    }>;
}
