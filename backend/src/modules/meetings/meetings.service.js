"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingsService = void 0;
const common_1 = require("@nestjs/common");
const meetings_util_1 = require("./meetings.util");
let MeetingsService = (() => {
    let _classDecorators = [(0, common_1.Injectable)()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var MeetingsService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MeetingsService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        googleCalendar;
        zoom;
        constructor(googleCalendar, zoom) {
            this.googleCalendar = googleCalendar;
            this.zoom = zoom;
        }
        /**
         * Schedule a meeting (Google Meet or Zoom) and return the join link.
         * For Meet: creates a calendar event with 5-min reminder and adds attendees (they get invite + reminder).
         * For Zoom: creates a meeting with reminder enabled; Zoom sends reminder emails to participants.
         */
        async scheduleMeeting(input) {
            const parsed = (0, meetings_util_1.getMeetingStartEndISO)(input.meetingDate, input.timeSlot, input.timeZone);
            if (!parsed) {
                return { error: 'Invalid meeting date, time slot, or time zone.' };
            }
            const startDate = new Date(parsed.startISO);
            const endDate = new Date(parsed.endISO);
            const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60_000) || 60;
            if (input.meetingType === 'google_meet') {
                if (!this.googleCalendar.isConfigured()) {
                    return { error: 'Google Meet is not configured. Contact support.' };
                }
                const result = await this.googleCalendar.createMeetEvent({
                    title: input.title,
                    startISO: parsed.startISO,
                    endISO: parsed.endISO,
                    ianaTimeZone: parsed.ianaZone,
                    attendeeEmails: input.attendeeEmails,
                });
                if ('error' in result)
                    return result;
                return { meetingLink: result.link };
            }
            if (input.meetingType === 'zoom') {
                if (!this.zoom.isConfigured()) {
                    return { error: 'Zoom is not configured. Contact support.' };
                }
                const result = await this.zoom.createMeeting({
                    topic: input.title,
                    startISO: parsed.startISO,
                    durationMinutes,
                    timeZone: parsed.ianaZone,
                    attendeeEmails: input.attendeeEmails,
                });
                if ('error' in result)
                    return result;
                return { meetingLink: result.link };
            }
            return { error: 'Unsupported meeting type.' };
        }
    };
    return MeetingsService = _classThis;
})();
exports.MeetingsService = MeetingsService;
//# sourceMappingURL=meetings.service.js.map