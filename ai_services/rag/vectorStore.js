/**
 * Local Vector Store for RAG
 * File-based vector database with cosine similarity search
 */

const fs = require('fs');
const path = require('path');
const { cosineSimilarity } = require('./embeddings');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * In-memory document store (persisted to JSON)
 */
let documentStore = {};

/**
 * Load store from disk
 */
function loadStore() {
    const storePath = path.join(DATA_DIR, 'vector_store.json');
    try {
        if (fs.existsSync(storePath)) {
            const data = fs.readFileSync(storePath, 'utf8');
            documentStore = JSON.parse(data);
            console.log(`Loaded vector store with ${Object.keys(documentStore).length} documents`);
        }
    } catch (error) {
        console.error('Error loading vector store:', error);
        documentStore = {};
    }
}

/**
 * Save store to disk
 */
function saveStore() {
    const storePath = path.join(DATA_DIR, 'vector_store.json');
    try {
        fs.writeFileSync(storePath, JSON.stringify(documentStore, null, 2));
    } catch (error) {
        console.error('Error saving vector store:', error);
    }
}

/**
 * Add a document to the vector store
 * @param {string} documentId - Unique document identifier
 * @param {Array<{id: string, text: string, embedding: number[]}>} chunks - Document chunks with embeddings
 * @param {Object} metadata - Optional document metadata
 */
function addDocument(documentId, chunks, metadata = {}) {
    if (!documentId || !chunks || !Array.isArray(chunks)) {
        throw new Error('Invalid document data');
    }

    documentStore[documentId] = {
        id: documentId,
        chunks: chunks,
        metadata: {
            ...metadata,
            indexedAt: new Date().toISOString(),
            chunkCount: chunks.length
        }
    };

    saveStore();
    console.log(`Indexed document ${documentId} with ${chunks.length} chunks`);
}

/**
 * Search for similar chunks across all documents
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {number} topK - Number of results to return
 * @param {string} documentId - Optional: limit search to specific document
 * @returns {Array<{documentId: string, chunkId: string, text: string, similarity: number}>}
 */
function search(queryEmbedding, topK = 5, documentId = null) {
    const results = [];

    const docsToSearch = documentId
        ? { [documentId]: documentStore[documentId] }
        : documentStore;

    for (const [docId, doc] of Object.entries(docsToSearch)) {
        if (!doc || !doc.chunks) continue;

        for (const chunk of doc.chunks) {
            if (!chunk.embedding) continue;

            const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
            results.push({
                documentId: docId,
                chunkId: chunk.id,
                text: chunk.text,
                similarity: similarity
            });
        }
    }

    // Sort by similarity and return top K
    return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK);
}

/**
 * Get a specific document
 * @param {string} documentId - Document ID
 * @returns {Object|null} Document data or null
 */
function getDocument(documentId) {
    return documentStore[documentId] || null;
}

/**
 * Delete a document from the store
 * @param {string} documentId - Document ID to delete
 */
function deleteDocument(documentId) {
    if (documentStore[documentId]) {
        delete documentStore[documentId];
        saveStore();
        console.log(`Deleted document ${documentId} from vector store`);
    }
}

/**
 * Clear all documents
 */
function clearStore() {
    documentStore = {};
    saveStore();
    console.log('Cleared vector store');
}

/**
 * Get store statistics
 * @returns {Object} Store statistics
 */
function getStats() {
    const docCount = Object.keys(documentStore).length;
    let totalChunks = 0;

    for (const doc of Object.values(documentStore)) {
        totalChunks += doc.chunks?.length || 0;
    }

    return {
        documentCount: docCount,
        totalChunks: totalChunks
    };
}

// Load store on module initialization
loadStore();

module.exports = {
    addDocument,
    search,
    getDocument,
    deleteDocument,
    clearStore,
    getStats
};
