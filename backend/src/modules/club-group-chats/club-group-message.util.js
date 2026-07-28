"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLUB_GROUP_MESSAGE_SELECT = exports.CLUB_GROUP_MESSAGE_REPLY_SELECT = void 0;
exports.isClubGroupMessageMode = isClubGroupMessageMode;
exports.clubGroupMessageSenderName = clubGroupMessageSenderName;
exports.CLUB_GROUP_MESSAGE_REPLY_SELECT = {
    id: true,
    body: true,
    attachmentType: true,
    attachmentUrl: true,
    attachmentName: true,
    user: { select: { id: true, name: true } },
    categoryAdmin: { select: { id: true, name: true } },
};
exports.CLUB_GROUP_MESSAGE_SELECT = {
    id: true,
    body: true,
    createdAt: true,
    attachmentUrl: true,
    attachmentType: true,
    attachmentName: true,
    replyToMessageId: true,
    user: {
        select: {
            id: true,
            name: true,
            profilePicUrl: true,
        },
    },
    categoryAdmin: {
        select: {
            id: true,
            name: true,
        },
    },
    subCategoryAdmin: {
        select: {
            id: true,
            name: true,
        },
    },
    replyTo: {
        select: exports.CLUB_GROUP_MESSAGE_REPLY_SELECT,
    },
};
function isClubGroupMessageMode(value) {
    return value === 'admin_only' || value === 'members';
}
function clubGroupMessageSenderName(message) {
    return message.user?.name ?? message.categoryAdmin?.name ?? message.subCategoryAdmin?.name ?? 'Unknown';
}
//# sourceMappingURL=club-group-message.util.js.map