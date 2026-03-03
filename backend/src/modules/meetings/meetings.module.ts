import { Module, Global } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { ZoomService } from './zoom.service';
import { MeetingsService } from './meetings.service';

@Global()
@Module({
  providers: [GoogleCalendarService, ZoomService, MeetingsService],
  exports: [MeetingsService],
})
export class MeetingsModule {}
