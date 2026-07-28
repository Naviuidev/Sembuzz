"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIRECT_CONVERSATION_USER_SELECT = exports.DIRECT_MESSAGE_SELECT = exports.DIRECT_MESSAGE_REPLY_SELECT = exports.INDIVIDUAL_MESSAGING_CODE = void 0;
exports.isDirectConversationStatus = isDirectConversationStatus;
exports.peerStatusForConversation = peerStatusForConversation;
exports.canonicalDirectChatUserPair = canonicalDirectChatUserPair;
exports.lastReadAtForUser = lastReadAtForUser;
exports.lastReadAtFieldForUser = lastReadAtFieldForUser;
exports.conversationBlockState = conversationBlockState;
exports.INDIVIDUAL_MESSAGING_CODE = 'INDIVIDUAL_MESSAGING';
function isDirectConversationStatus(value) {
    return value === 'pending' || value === 'accepted' || value === 'declined';
}
function peerStatusForConversation(conversation, currentUserId, otherUserId) {
    if (conversation.userOneId !== currentUserId && conversation.userTwoId !== currentUserId) {
        return 'none';
    }
    if (conversation.userOneId !== otherUserId && conversation.userTwoId !== otherUserId) {
        return 'none';
    }
    const status = isDirectConversationStatus(conversation.status) ? conversation.status : 'pending';
    if (status === 'accepted')
        return 'accepted';
    if (status === 'declined')
        return 'declined';
    if (conversation.requestedByUserId === currentUserId)
        return 'pending_outgoing';
    return 'pending_incoming';
}
function canonicalDirectChatUserPair(userIdA, userIdB) {
    return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}
function lastReadAtForUser(conversation, userId) {
    if (conversation.userOneId === userId)
        return conversation.userOneLastReadAt;
    if (conversation.userTwoId === userId)
        return conversation.userTwoLastReadAt;
    return null;
}
function lastReadAtFieldForUser(userId, conversation) {
    return conversation.userOneId === userId ? 'userOneLastReadAt' : 'userTwoLastReadAt';
}
function conversationBlockState(blockedByUserId, currentUserId) {
    if (!blockedByUserId) {
        return { isBlockedByMe: false, isBlockedByPeer: false };
    }
    return {
        isBlockedByMe: blockedByUserId === currentUserId,
        isBlockedByPeer: blockedByUserId !== currentUserId,
    };
}
exports.DIRECT_MESSAGE_REPLY_SELECT = {
    id: true,
    body: true,
    attachmentType: true,
    attachmentUrl: true,
    attachmentName: true,
    senderUserId: true,
    sender: {
        select: {
            id: true,
            name: true,
        },
    },
};
exports.DIRECT_MESSAGE_SELECT = {
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
        select: exports.DIRECT_MESSAGE_REPLY_SELECT,
    },
};
exports.DIRECT_CONVERSATION_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    profilePicUrl: true,
};
//# sourceMappingURL=direct-chat.util.js.map