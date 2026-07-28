"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STUDENT_CHAT_MESSAGE_SELECT = exports.STUDENT_CHAT_MESSAGE_REPLY_SELECT = void 0;
exports.isStudentChatGroupVisibility = isStudentChatGroupVisibility;
exports.STUDENT_CHAT_MESSAGE_REPLY_SELECT = {
    id: true,
    body: true,
    attachmentType: true,
    attachmentUrl: true,
    attachmentName: true,
    sender: { select: { id: true, name: true } },
};
exports.STUDENT_CHAT_MESSAGE_SELECT = {
    id: true,
    body: true,
    createdAt: true,
    senderUserId: true,
    attachmentUrl: true,
    attachmentType: true,
    attachmentName: true,
    replyToMessageId: true,
    sender: {
        select: {
            id: true,
            name: true,
            profilePicUrl: true,
        },
    },
    replyTo: {
        select: exports.STUDENT_CHAT_MESSAGE_REPLY_SELECT,
    },
};
function isStudentChatGroupVisibility(value) {
    return value === 'public' || value === 'private';
}
//# sourceMappingURL=student-chat-message.util.js.map