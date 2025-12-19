/**
 * Embeddings Generator for RAG
 * Uses Gemini embedding API with TF-IDF fallback
 */

const axios = require('axios');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Generate embedding for a single text using Gemini
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector
 */
async function generateEmbedding(text) {
    try {
        if (!GEMINI_API_KEY) {
            console.warn('GEMINI_API_KEY not found, using TF-IDF fallback');
            return generateTFIDFEmbedding(text);
        }

        const response = await axios.post(
            `${EMBEDDING_API_URL}/models/${EMBEDDING_MODEL}:embedContent`,
            {
                model: `models/${EMBEDDING_MODEL}`,
                content: {
                    parts: [{ text: text.substring(0, 2048) }]  // API limit
                }
            },
            {
                headers: { 'Content-Type': 'application/json' },
                params: { key: GEMINI_API_KEY },
                timeout: 30000
            }
        );

        if (response.data?.embedding?.values) {
            return response.data.embedding.values;
        }

        console.warn('Unexpected embedding response, using fallback');
        return generateTFIDFEmbedding(text);

    } catch (error) {
        console.error('Embedding API error:', error.message);
        return generateTFIDFEmbedding(text);
    }
}

/**
 * Generate embeddings for multiple texts (batched)
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
async function generateEmbeddings(texts) {
    const embeddings = [];

    // Process in batches of 5 to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
            batch.map(text => generateEmbedding(text))
        );
        embeddings.push(...batchEmbeddings);

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < texts.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    return embeddings;
}

/**
 * TF-IDF based fallback embedding (works offline)
 * Creates a simple bag-of-words vector
 * @param {string} text - Text to embed
 * @returns {number[]} Simplified embedding vector
 */
function generateTFIDFEmbedding(text) {
    // Common vocabulary for education domain (256 dimensions)
    const vocabulary = [
        'learn', 'student', 'course', 'understand', 'concept', 'theory', 'practice',
        'knowledge', 'skill', 'objective', 'outcome', 'assessment', 'exam', 'quiz',
        'study', 'research', 'analysis', 'method', 'approach', 'solution', 'problem',
        'data', 'information', 'system', 'process', 'model', 'design', 'develop',
        'implement', 'evaluate', 'test', 'result', 'conclusion', 'application',
        'technology', 'science', 'math', 'engineering', 'computer', 'program',
        'algorithm', 'structure', 'function', 'class', 'object', 'variable',
        'database', 'network', 'security', 'web', 'software', 'hardware',
        'artificial', 'intelligence', 'machine', 'learning', 'neural', 'deep',
        'natural', 'language', 'processing', 'vision', 'recognition', 'pattern',
        'physics', 'chemistry', 'biology', 'environment', 'energy', 'material',
        'economics', 'business', 'management', 'marketing', 'finance', 'accounting',
        'history', 'culture', 'society', 'politics', 'law', 'ethics', 'philosophy',
        'psychology', 'communication', 'media', 'art', 'music', 'literature',
        'health', 'medicine', 'nutrition', 'exercise', 'wellness', 'therapy',
        'education', 'teaching', 'curriculum', 'pedagogy', 'instruction', 'training',
        'critical', 'creative', 'analytical', 'logical', 'strategic', 'systematic',
        'quantitative', 'qualitative', 'experimental', 'theoretical', 'practical',
        'professional', 'academic', 'technical', 'fundamental', 'advanced', 'basic',
        'primary', 'secondary', 'main', 'key', 'important', 'essential', 'core',
        'chapter', 'unit', 'module', 'section', 'topic', 'subject', 'area',
        'example', 'case', 'scenario', 'situation', 'context', 'framework',
        'principle', 'rule', 'law', 'formula', 'equation', 'theorem', 'proof',
        'definition', 'term', 'vocabulary', 'concept', 'idea', 'notion', 'meaning',
        'relationship', 'connection', 'comparison', 'contrast', 'similarity', 'difference',
        'cause', 'effect', 'impact', 'influence', 'factor', 'element', 'component',
        'type', 'kind', 'category', 'classification', 'group', 'set', 'list',
        'step', 'stage', 'phase', 'level', 'degree', 'extent', 'scope',
        'feature', 'characteristic', 'property', 'attribute', 'quality', 'aspect',
        'advantage', 'benefit', 'strength', 'weakness', 'limitation', 'challenge',
        'goal', 'purpose', 'aim', 'objective', 'target', 'requirement', 'criteria',
        'standard', 'measure', 'metric', 'indicator', 'benchmark', 'baseline',
        'performance', 'efficiency', 'effectiveness', 'productivity', 'accuracy',
        'reliability', 'validity', 'consistency', 'precision', 'quality', 'improvement',
        'change', 'transformation', 'evolution', 'development', 'growth', 'progress',
        'innovation', 'creativity', 'discovery', 'invention', 'breakthrough', 'advance',
        'support', 'assist', 'help', 'guide', 'facilitate', 'enable', 'promote',
        'contribute', 'participate', 'engage', 'involve', 'collaborate', 'cooperate',
        'communicate', 'present', 'express', 'explain', 'describe', 'discuss', 'argue',
        'demonstrate', 'illustrate', 'show', 'prove', 'verify', 'confirm', 'validate',
        'identify', 'recognize', 'detect', 'find', 'locate', 'determine', 'establish',
        'select', 'choose', 'decide', 'judge', 'assess', 'evaluate', 'review'
    ];

    // Normalize text
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    const wordCount = {};
    words.forEach(w => {
        wordCount[w] = (wordCount[w] || 0) + 1;
    });

    // Create embedding vector
    const embedding = vocabulary.map(vocabWord => {
        const count = wordCount[vocabWord] || 0;
        // TF-IDF-like weighting
        return count > 0 ? Math.log(1 + count) / Math.log(words.length + 1) : 0;
    });

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
        return embedding.map(val => val / magnitude);
    }

    return embedding;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vec1 - First vector
 * @param {number[]} vec2 - Second vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
    }

    const magnitude = Math.sqrt(mag1) * Math.sqrt(mag2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
}

module.exports = {
    generateEmbedding,
    generateEmbeddings,
    generateTFIDFEmbedding,
    cosineSimilarity
};
