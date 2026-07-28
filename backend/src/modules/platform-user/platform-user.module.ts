import { Global, Module } from '@nestjs/common';
import { PlatformUserService } from './platform-user.service';

@Global()
@Module({
  providers: [PlatformUserService],
  exports: [PlatformUserService],
})
export class PlatformUserModule {}
