/**
 * RAG (Retrieval-Augmented Generation) Module
 * Main entry point for document indexing and retrieval
 */

const { chunkText, extractKeySentences } = require('./chunker');
const { generateEmbedding, generateEmbeddings, cosineSimilarity } = require('./embeddings');
const vectorStore = require('./vectorStore');

/**
 * Index a document for RAG
 * @param {string} documentId - Unique document ID
 * @param {string} text - Document text content
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<{success: boolean, chunkCount: number}>}
 */
async function indexDocument(documentId, text, metadata = {}) {
    try {
        console.log(`RAG: Indexing document ${documentId}...`);

        // 1. Chunk the text
        const chunks = chunkText(text, {
            minChunkSize: 200,
            maxChunkSize: 800,
            overlap: 100
        });

        if (chunks.length === 0) {
            console.warn('RAG: No chunks created from document');
            return { success: false, chunkCount: 0 };
        }

        // 2. Generate embeddings for each chunk
        console.log(`RAG: Generating embeddings for ${chunks.length} chunks...`);
        const chunkTexts = chunks.map(c => c.text);
        const embeddings = await generateEmbeddings(chunkTexts);

        // 3. Combine chunks with embeddings
        const indexedChunks = chunks.map((chunk, i) => ({
            ...chunk,
            embedding: embeddings[i]
        }));

        // 4. Store in vector store
        vectorStore.addDocument(documentId, indexedChunks, metadata);

        console.log(`RAG: Successfully indexed ${chunks.length} chunks`);
        return { success: true, chunkCount: chunks.length };

    } catch (error) {
        console.error('RAG indexing error:', error);
        return { success: false, chunkCount: 0, error: error.message };
    }
}

/**
 * Retrieve relevant chunks for a query
 * @param {string} query - Search query
 * @param {number} topK - Number of results
 * @param {string} documentId - Optional: limit to specific document
 * @returns {Promise<Array<{text: string, similarity: number}>>}
 */
async function retrieve(query, topK = 5, documentId = null) {
    try {
        // Generate query embedding
        const queryEmbedding = await generateEmbedding(query);

        // Search vector store
        const results = vectorStore.search(queryEmbedding, topK, documentId);

        console.log(`RAG: Retrieved ${results.length} chunks for query "${query.substring(0, 50)}..."`);
        return results;

    } catch (error) {
        console.error('RAG retrieval error:', error);
        return [];
    }
}

/**
 * Generate an augmented prompt with retrieved context
 * @param {string} basePrompt - Original prompt
 * @param {string} query - Query to retrieve context for
 * @param {string} documentId - Document to search
 * @param {number} contextChunks - Number of context chunks to include
 * @returns {Promise<string>} Augmented prompt with context
 */
async function augmentPrompt(basePrompt, query, documentId, contextChunks = 3) {
    const retrieved = await retrieve(query, contextChunks, documentId);

    if (retrieved.length === 0) {
        return basePrompt;
    }

    // Build context section
    const context = retrieved
        .map((r, i) => `[Context ${i + 1}]: ${r.text}`)
        .join('\n\n');

    // Augment the prompt
    return `${basePrompt}

RELEVANT CONTEXT FROM DOCUMENT:
${context}

Use the above context to provide accurate, document-based responses.`;
}

/**
 * Extract topics from a document using RAG
 * @param {string} documentId - Document ID in vector store
 * @param {string} text - Original document text (for fallback)
 * @returns {Promise<string[]>} Extracted topics
 */
async function extractTopicsRAG(documentId, text) {
    // Try to retrieve chunks about course content, topics, modules
    const topicQueries = [
        'course topics and modules',
        'learning objectives and outcomes',
        'main subjects covered',
        'unit chapters and sections'
    ];

    const allRetrieved = [];
    for (const query of topicQueries) {
        const results = await retrieve(query, 3, documentId);
        allRetrieved.push(...results);
    }

    // Extract key sentences from retrieved chunks
    const combinedText = allRetrieved.map(r => r.text).join(' ');
    const keySentences = extractKeySentences(combinedText, 10);

    return keySentences;
}

/**
 * Generate questions using RAG
 * @param {string} documentId - Document ID in vector store
 * @param {string[]} topics - Topics to generate questions about
 * @param {number} questionsPerTopic - Questions per topic
 * @returns {Promise<Array<{topic: string, context: string}>>} Topics with relevant context
 */
async function getContextForTopics(documentId, topics, questionsPerTopic = 2) {
    const topicsWithContext = [];

    for (const topic of topics) {
        const context = await retrieve(topic, questionsPerTopic, documentId);
        topicsWithContext.push({
            topic,
            contexts: context.map(c => c.text)
        });
    }

    return topicsWithContext;
}

module.exports = {
    indexDocument,
    retrieve,
    augmentPrompt,
    extractTopicsRAG,
    getContextForTopics,
    // Re-export utilities
    vectorStore,
    chunkText,
    generateEmbedding
};
