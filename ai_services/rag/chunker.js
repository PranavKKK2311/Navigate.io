/**
 * Text Chunker for RAG
 * Splits documents into semantic chunks for embedding and retrieval
 */

/**
 * Split text into semantic chunks by paragraphs
 * @param {string} text - The text to chunk
 * @param {Object} options - Chunking options
 * @returns {Array<{id: string, text: string, index: number}>}
 */
function chunkText(text, options = {}) {
    const {
        minChunkSize = 200,    // Minimum characters per chunk
        maxChunkSize = 1000,   // Maximum characters per chunk
        overlap = 100          // Overlap between chunks for context
    } = options;

    if (!text || typeof text !== 'string') {
        return [];
    }

    // Clean the text
    const cleanedText = text
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
        .trim();

    // Split by paragraphs (double newline)
    const paragraphs = cleanedText.split(/\n\n+/).filter(p => p.trim().length > 0);

    const chunks = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
        const trimmedPara = paragraph.trim();

        // If adding this paragraph would exceed max, save current and start new
        if (currentChunk.length + trimmedPara.length > maxChunkSize && currentChunk.length >= minChunkSize) {
            chunks.push({
                id: `chunk_${chunkIndex}`,
                text: currentChunk.trim(),
                index: chunkIndex
            });
            chunkIndex++;

            // Start new chunk with overlap from previous
            const overlapText = currentChunk.slice(-overlap);
            currentChunk = overlapText + ' ' + trimmedPara;
        } else {
            // Add paragraph to current chunk
            currentChunk = currentChunk ? currentChunk + '\n\n' + trimmedPara : trimmedPara;
        }

        // If current chunk is already at max, force split
        if (currentChunk.length > maxChunkSize) {
            // Split long paragraph into sentences
            const sentences = currentChunk.match(/[^.!?]+[.!?]+/g) || [currentChunk];
            currentChunk = '';

            for (const sentence of sentences) {
                if (currentChunk.length + sentence.length > maxChunkSize && currentChunk.length >= minChunkSize) {
                    chunks.push({
                        id: `chunk_${chunkIndex}`,
                        text: currentChunk.trim(),
                        index: chunkIndex
                    });
                    chunkIndex++;
                    currentChunk = sentence;
                } else {
                    currentChunk += sentence;
                }
            }
        }
    }

    // Don't forget the last chunk
    if (currentChunk.trim().length >= minChunkSize) {
        chunks.push({
            id: `chunk_${chunkIndex}`,
            text: currentChunk.trim(),
            index: chunkIndex
        });
    }

    console.log(`Chunked text into ${chunks.length} chunks (avg ${Math.round(chunks.reduce((s, c) => s + c.text.length, 0) / chunks.length)} chars each)`);

    return chunks;
}

/**
 * Extract key sentences from text for question generation
 * @param {string} text - Source text
 * @param {number} count - Number of sentences to extract
 * @returns {string[]} Key sentences
 */
function extractKeySentences(text, count = 10) {
    if (!text || typeof text !== 'string') return [];

    // Split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

    // Filter and score sentences
    const scored = sentences
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 300)  // Not too short or long
        .filter(s => !/^(note|example|see|refer|http|www)/i.test(s))  // Skip references
        .map(s => ({
            text: s,
            score: scoreSentence(s)
        }))
        .sort((a, b) => b.score - a.score);

    return scored.slice(0, count).map(s => s.text);
}

/**
 * Score a sentence for importance
 */
function scoreSentence(sentence) {
    let score = 0;

    // Longer sentences (but not too long) score higher
    if (sentence.length > 50 && sentence.length < 200) score += 2;

    // Contains definition patterns
    if (/\b(is|are|refers to|defined as|means)\b/i.test(sentence)) score += 3;

    // Contains key concept indicators
    if (/\b(important|key|main|primary|essential|fundamental)\b/i.test(sentence)) score += 2;

    // Contains technical terms (capitalized words)
    const capitalWords = sentence.match(/\b[A-Z][a-z]+\b/g) || [];
    score += Math.min(capitalWords.length, 3);

    // Penalize questions (we want statements)
    if (sentence.includes('?')) score -= 2;

    // Penalize bullets/lists markers
    if (/^[\-\*\•\d\.]+/.test(sentence)) score -= 1;

    return score;
}

module.exports = {
    chunkText,
    extractKeySentences
};
