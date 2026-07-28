"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha256hex = sha256hex;
exports.condenseListingTextForGpt = condenseListingTextForGpt;
const crypto_1 = require("crypto");
function sha256hex(s) {
    return (0, crypto_1.createHash)('sha256').update(s).digest('hex');
}
/**
 * Shrink listing text before GPT: drop boilerplate-ish lines, collapse short repeats, hard cap length.
 */
function condenseListingTextForGpt(text, maxChars) {
    if (!text)
        return '';
    const lines = text.split('\n');
    const kept = [];
    let prev = '';
    for (const raw of lines) {
        const line = raw.trim();
        if (!line)
            continue;
        if (line.length < 140 && line === prev)
            continue;
        prev = line;
        if (line.length < 200 &&
            /^(accept|agree)\s+/i.test(line) &&
            /cookie|privacy|terms/i.test(line)) {
            continue;
        }
        if (line.length < 160 && /^(subscribe|sign up for our newsletter|follow us on)/i.test(line))
            continue;
        kept.push(line);
    }
    let out = kept.join('\n');
    if (out.length > maxChars) {
        out = `${out.slice(0, maxChars)}\n[…truncated…]`;
    }
    return out;
}
//# sourceMappingURL=crawl-text.util.js.map