const axios = require('axios');
const transformersModel = require('../models/transformersModel');
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');  // v1.1.1 - direct function export
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');  // OCR for image-based PDFs

// RAG module for improved question generation
const rag = require('../rag');

/**
 * Generate a quick quiz based on syllabus analysis using Gemini
 * @param {Object} syllabusAnalysis - The analyzed syllabus data
 * @param {Object} quizParameters - Parameters for quiz generation
 * @returns {Object} - The generated quiz
 */
async function generateQuickQuiz(syllabusAnalysis, quizParameters = {}) {
    try {
        console.log('=== GENERATING QUICK QUIZ WITH GEMINI ===');

        // Extract key syllabus information with defensive coding
        const basicInfo = syllabusAnalysis.basicInfo || {
            courseTitle: "Course",
            courseCode: "101",
            academicLevel: "Undergraduate"
        };

        const learningOutcomes = syllabusAnalysis.learningOutcomes || {};
        const courseTopics = (learningOutcomes.keyTopics && Array.isArray(learningOutcomes.keyTopics))
            ? learningOutcomes.keyTopics.slice(0, 5)
            : ["Topic 1", "Topic 2", "Topic 3"];

        // Apply default parameters with fallbacks
        const {
            questionCount = 5,
            difficulty = 'mixed',
            questionTypes = ['multiple-choice', 'true-false'],
            topicFocus = [],
            timeLimit = 15
        } = quizParameters;

        // Select topics to cover
        const topicsToUse = topicFocus.length > 0
            ? topicFocus.slice(0, 5)
            : courseTopics.slice(0, Math.min(5, courseTopics.length));

        // Build a structured prompt for Gemini
        const prompt = `
Generate a quiz with ${questionCount} questions about ${topicsToUse.join(', ')}.

Course: ${basicInfo.courseTitle}
Level: ${basicInfo.academicLevel}
Difficulty: ${difficulty}
Types: ${questionTypes.join(', ')}

Each question should have this format:
Q: [Question text]
Type: [question type]
${questionTypes.includes('multiple-choice') ? 'A: [Option A]\nB: [Option B]\nC: [Option C]\nD: [Option D]\nCorrect: [A/B/C/D]' : ''}
${questionTypes.includes('true-false') ? 'Options: True/False\nCorrect: [True/False]' : ''}
Points: [points]
Topic: [related topic]
END

Generate exactly ${questionCount} questions, one after another.`;

        // Use transformers model with Gemini
        const response = await transformersModel.createChatCompletion(
            'You are creating a quiz for students.',
            prompt,
            {
                temperature: 0.8,
                maxTokens: 2048,
                taskType: 'quiz',
                modelName: 'gemini-2.0-flash' // Use Gemini
            }
        );

        // Parse the Gemini response
        try {
            // Parse the response into structured quiz data
            const questions = [];
            const questionBlocks = response.split('END').filter(block => block.trim().length > 0);

            for (let i = 0; i < Math.min(questionCount, questionBlocks.length); i++) {
                const block = questionBlocks[i];

                // Extract question components
                const questionMatch = block.match(/Q:\s*(.+?)(?=\nType:|$)/s);
                const typeMatch = block.match(/Type:\s*(.+?)(?=\nA:|Options:|Points:|$)/);
                const topicMatch = block.match(/Topic:\s*(.+?)(?=\nEND|$)/s);
                const pointsMatch = block.match(/Points:\s*(\d+)/);

                // Extract multiple choice options if present
                const optionsA = block.match(/A:\s*(.+?)(?=\nB:|$)/);
                const optionsB = block.match(/B:\s*(.+?)(?=\nC:|$)/);
                const optionsC = block.match(/C:\s*(.+?)(?=\nD:|$)/);
                const optionsD = block.match(/D:\s*(.+?)(?=\nCorrect:|$)/);
                const correctMatch = block.match(/Correct:\s*([ABCD]|True|False)/);

                if (questionMatch) {
                    const questionType = typeMatch ? typeMatch[1].trim().toLowerCase() : 'multiple-choice';
                    let options = [];
                    let correctAnswer = '';

                    if (questionType.includes('multiple') || questionType.includes('choice')) {
                        options = [
                            optionsA ? optionsA[1].trim() : 'Option A',
                            optionsB ? optionsB[1].trim() : 'Option B',
                            optionsC ? optionsC[1].trim() : 'Option C',
                            optionsD ? optionsD[1].trim() : 'Option D'
                        ];

                        if (correctMatch) {
                            const correctLetter = correctMatch[1].trim();
                            if (correctLetter === 'A') correctAnswer = options[0];
                            else if (correctLetter === 'B') correctAnswer = options[1];
                            else if (correctLetter === 'C') correctAnswer = options[2];
                            else if (correctLetter === 'D') correctAnswer = options[3];
                            else correctAnswer = options[0]; // Default to first option
                        } else {
                            correctAnswer = options[0]; // Default to first option
                        }
                    } else if (questionType.includes('true') || questionType.includes('false')) {
                        options = ['True', 'False'];
                        correctAnswer = correctMatch ? correctMatch[1].trim() : 'True';
                    } else if (questionType.includes('short') || questionType.includes('answer')) {
                        // Short answer questions - provide a proper text answer
                        options = []; // Short answer questions don't have options

                        // Look for a sample answer in the block, or create a default one
                        const sampleAnswerMatch = block.match(/Sample\s+Answer:\s*(.*?)(?=\nPoints:|Topic:|$)/i);
                        const topicForAnswer = topicMatch ? topicMatch[1].trim() : topicsToUse[i % topicsToUse.length];

                        correctAnswer = sampleAnswerMatch
                            ? sampleAnswerMatch[1].trim()
                            : `A comprehensive answer about ${topicForAnswer} should explain the key concepts and demonstrate understanding of the main principles.`;
                    }

                    questions.push({
                        id: `q${i + 1}`,
                        question: questionMatch[1].trim(),
                        questionType: questionType,
                        options: options,
                        correctAnswer: correctAnswer,
                        topic: topicMatch ? topicMatch[1].trim() : topicsToUse[i % topicsToUse.length],
                        points: pointsMatch ? parseInt(pointsMatch[1]) : 1,
                        difficulty: difficulty,
                        explanation: "Explanation will be provided after submission."
                    });
                }
            }

            // Create a complete quiz structure even if parsing was incomplete
            const quiz = {
                title: `${basicInfo.courseTitle} Quick Quiz`,
                description: `A quick assessment covering ${topicsToUse.join(', ')}`,
                totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
                timeLimit: timeLimit,
                questions: questions.length > 0 ? questions : generateFallbackQuestions(topicsToUse, questionCount),
                generatedAt: new Date().toISOString(),
                generatedBy: 'gemini',
                courseInfo: {
                    title: basicInfo.courseTitle,
                    code: basicInfo.courseCode,
                    level: basicInfo.academicLevel
                }
            };

            console.log(`Successfully generated quiz with ${quiz.questions.length} questions using Gemini`);
            return quiz;
        } catch (error) {
            console.error('Error parsing quiz response from Gemini:', error);

            // Generate fallback questions directly
            return {
                title: `${basicInfo.courseTitle} Quick Quiz`,
                description: `A quick assessment covering ${topicsToUse.join(', ')}`,
                totalPoints: questionCount,
                timeLimit: timeLimit,
                questions: generateFallbackQuestions(topicsToUse, questionCount),
                generatedAt: new Date().toISOString(),
                generatedBy: 'gemini-fallback',
                courseInfo: {
                    title: basicInfo.courseTitle,
                    code: basicInfo.courseCode,
                    level: basicInfo.academicLevel
                }
            };
        }
    } catch (error) {
        console.error('Error generating quiz with Gemini:', error);
        throw new Error(`Failed to generate quiz with Gemini: ${error.message}`);
    }
}

/**
 * Generate fallback questions when parsing fails
 * @param {Array} topics - Available topics
 * @param {Number} count - Number of questions to generate
 * @returns {Array} - Array of question objects
 */
function generateFallbackQuestions(topics, count) {
    const questions = [];

    const questionTemplates = [
        topic => `What is the main concept in ${topic}?`,
        topic => `Which of the following is NOT related to ${topic}?`,
        topic => `True or False: ${topic} is fundamental to understanding this course.`,
        topic => `What is the relationship between ${topic} and ${topics[Math.floor(Math.random() * topics.length)]}?`,
        topic => `Which best describes the purpose of studying ${topic}?`
    ];

    for (let i = 0; i < count; i++) {
        const topic = topics[i % topics.length];
        const templateIndex = i % questionTemplates.length;
        const questionFn = questionTemplates[templateIndex];

        if (templateIndex <= 1) {
            // Multiple choice
            questions.push({
                id: `q${i + 1}`,
                question: questionFn(topic),
                questionType: 'multiple-choice',
                options: [
                    `${topic} concept 1`,
                    `${topic} concept 2`,
                    `${topic} concept 3`,
                    'None of the above'
                ],
                correctAnswer: `${topic} concept 1`,
                topic: topic,
                points: 1,
                difficulty: ['easy', 'medium', 'hard'][i % 3],
                explanation: `This relates to fundamental concepts in ${topic}.`
            });
        } else if (templateIndex === 2) {
            // True/False
            questions.push({
                id: `q${i + 1}`,
                question: questionFn(topic),
                questionType: 'true-false',
                options: ['True', 'False'],
                correctAnswer: 'True',
                topic: topic,
                points: 1,
                difficulty: 'easy',
                explanation: `${topic} is indeed a core concept in this course.`
            });
        } else {
            // Short answer - Fix: Using a proper text answer instead of true/false
            questions.push({
                id: `q${i + 1}`,
                question: questionFn(topic),
                questionType: 'short-answer',
                options: [], // Short answer questions don't have options
                topic: topic,
                points: 2,
                difficulty: 'medium',
                explanation: `This tests understanding of ${topic} in context.`,
                correctAnswer: `A comprehensive answer should explain the key aspects of ${topic} and demonstrate understanding of its applications.`
            });
        }
    }

    return questions;
}

/**
 * Analyzes a syllabus document to extract key information
 * @param {string} syllabusContent - Raw text content of the syllabus
 * @param {Object} options - Analysis options
 * @returns {Object} - Structured syllabus analysis
 */
async function analyzeSyllabus(syllabusContent, options = {}) {
    try {
        console.log('Analyzing syllabus content...');

        if (!syllabusContent || syllabusContent.trim().length < 50) {
            throw new Error('Syllabus content is too short for meaningful analysis');
        }

        // Default options
        const {
            extractTopics = true,
            extractSchedule = true,
            extractPolicies = true
        } = options;

        // Always use transformer models
        let modelPreference = options.modelPreference || 'transformer';

        // Build prompt for the model to extract structured information
        const prompt = `
Extract and analyze the following syllabus content:

${syllabusContent.substring(0, 8000)}

Please extract and return a JSON object with the following structure:
{
  "basicInfo": {
    "courseTitle": "",
    "courseCode": "",
    "instructorName": "",
    "term": "",
    "academicLevel": ""
  },
  "learningOutcomes": {
    "objectives": [],
    "keyTopics": [],
    "skillsGained": []
  },
  "schedule": {
    "topics": [],
    "majorAssignments": []
  },
  "assessmentStructure": {
    "gradingScale": "",
    "assessmentBreakdown": []
  },
  "policies": []
}

Focus on accurately extracting course content, learning outcomes, and assessment information.
If certain sections aren't present in the syllabus, leave them as empty arrays or empty strings.
`;

        // Use Gemini or Hugging Face fallback model
        // Update model name to use the latest available model
        console.log('Using Gemini model for syllabus analysis');
        const response = await transformersModel.createChatCompletion(
            'You are a helpful system for analyzing educational syllabi.',
            prompt,
            {
                temperature: 0.3,
                maxTokens: 4000,
                taskType: 'extraction',
                modelName: 'gemini-2.0-flash' // Updated to use the latest available model
            }
        );

        // Extract JSON from response
        let analysisResult;
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                analysisResult = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.error('Error parsing JSON from model response:', parseError);
                // If we can't parse JSON, create a basic structure
                analysisResult = generateBasicSyllabusStructure(syllabusContent);
            }
        } else {
            console.log('No JSON structure found in response, generating basic structure');
            analysisResult = generateBasicSyllabusStructure(syllabusContent);
        }

        // Validate and clean the analysis result
        if (!analysisResult || !analysisResult.basicInfo) {
            throw new Error('Failed to extract basic information from syllabus');
        }

        // Add metadata including raw content for question generation
        analysisResult.metadata = {
            analyzedAt: new Date().toISOString(),
            modelUsed: 'gemini-2.0-flash',
            contentLength: syllabusContent.length
        };

        // Store the raw content for question generation (up to 10000 chars)
        analysisResult.rawContent = syllabusContent.substring(0, 10000);

        console.log('Syllabus analysis complete');
        return analysisResult;
    } catch (error) {
        console.error('Error analyzing syllabus:', error);
        console.log('Generating default syllabus analysis structure');
        return generateBasicSyllabusStructure(syllabusContent);
    }
}

/**
 * Generate a basic syllabus structure when JSON parsing fails
 * @param {string} syllabusContent - Raw text content of the syllabus
 * @returns {Object} - Basic syllabus analysis structure
 */
function generateBasicSyllabusStructure(syllabusContent) {
    console.log('Generating basic syllabus structure');

    // Try to extract some basic information from the syllabus content
    const courseMatch = syllabusContent.match(/course:?\s*([^\n]+)/i);
    const codeMatch = syllabusContent.match(/code:?\s*([^\n]+)/i);
    const instructorMatch = syllabusContent.match(/instructor:?\s*([^\n]+)/i);
    const termMatch = syllabusContent.match(/term:?\s*([^\n]+)/i);

    // Extract topic keywords by looking for bullet points or numbered lists
    const topics = [];
    const topicMatches = syllabusContent.match(/[-•*]\s*([^\n]+)/g) ||
        syllabusContent.match(/\d+\.\s*([^\n]+)/g) || [];

    // Process up to 5 topics
    for (let i = 0; i < Math.min(topicMatches.length, 5); i++) {
        // Clean up the topic text
        const topic = topicMatches[i].replace(/[-•*\d.]\s*/, '').trim();
        if (topic && topic.length > 3) {
            topics.push(topic);
        }
    }

    // If we couldn't extract topics, provide some defaults
    if (topics.length === 0) {
        topics.push('Course Fundamentals');
        topics.push('Key Concepts');
        topics.push('Practical Applications');
    }

    // Create basic syllabus analysis structure
    return {
        basicInfo: {
            courseTitle: courseMatch ? courseMatch[1].trim() : "Untitled Course",
            courseCode: codeMatch ? codeMatch[1].trim() : "N/A",
            instructorName: instructorMatch ? instructorMatch[1].trim() : "Instructor",
            term: termMatch ? termMatch[1].trim() : "Current Term",
            academicLevel: syllabusContent.includes('graduate') ? "Graduate" : "Undergraduate"
        },
        learningOutcomes: {
            objectives: [
                "Understand core concepts of the subject",
                "Apply theoretical knowledge to practical scenarios",
                "Develop critical thinking skills related to the field"
            ],
            keyTopics: topics,
            skillsGained: [
                "Critical thinking",
                "Problem-solving",
                "Subject-specific knowledge"
            ]
        },
        schedule: {
            topics: topics.map((topic, index) => ({
                week: index + 1,
                topic: topic,
                description: `Week ${index + 1} covers ${topic}`
            })),
            majorAssignments: [
                {
                    name: "Midterm Examination",
                    dueDate: "Middle of the course",
                    weight: "30%"
                },
                {
                    name: "Final Project",
                    dueDate: "End of the course",
                    weight: "40%"
                }
            ]
        },
        assessmentStructure: {
            gradingScale: "A: 90-100%, B: 80-89%, C: 70-79%, D: 60-69%, F: Below 60%",
            assessmentBreakdown: [
                { name: "Participation", weight: "10%" },
                { name: "Assignments", weight: "20%" },
                { name: "Midterm Exam", weight: "30%" },
                { name: "Final Project", weight: "40%" }
            ]
        },
        policies: [
            "Regular attendance is expected.",
            "Late assignments may be subject to penalties.",
            "Academic integrity is taken seriously."
        ]
    };
}

/**
 * Generate a fallback syllabus analysis when all model calls fail
 * @param {string} syllabusContent - Raw text content of the syllabus
 * @returns {Object} - Basic syllabus analysis object
 */
function generateFallbackSyllabusAnalysis(syllabusContent) {
    // This is essentially the same as our generateBasicSyllabusStructure function
    // We can reuse that implementation to provide a consistent fallback
    return generateBasicSyllabusStructure(syllabusContent);
}

/**
 * Extract text from an uploaded file (PDF, DOCX, TXT)
 * @param {Object} file - Uploaded file object from multer
 * @returns {string} - Extracted text content
 */
async function extractTextFromFile(file) {
    try {
        console.log(`Extracting text from file: ${file.originalname} (${file.mimetype})`);
        console.log(`File object keys: ${Object.keys(file).join(', ')}`);
        console.log(`File path: ${file.path}`);
        console.log(`File buffer exists: ${!!file.buffer}`);

        // Get file extension
        const ext = path.extname(file.originalname).toLowerCase();
        let extractedText = '';

        // Determine how to read the file
        let fileBuffer;
        if (file.buffer) {
            console.log('Using file.buffer (memory storage)');
            fileBuffer = file.buffer;
        } else if (file.path && fs.existsSync(file.path)) {
            console.log(`Using file.path (disk storage): ${file.path}`);
            fileBuffer = fs.readFileSync(file.path);
        } else {
            throw new Error(`Cannot read file: no buffer and path "${file.path}" does not exist`);
        }

        if (ext === '.pdf' || file.mimetype === 'application/pdf') {
            // Extract text from PDF using pdf-parse first
            console.log('Parsing PDF file with pdf-parse...');
            const data = await pdfParse(fileBuffer);
            extractedText = data.text;
            console.log(`Initial extraction: ${extractedText.length} characters`);

            // Check if extracted text is good quality
            const wordCount = (extractedText.match(/[a-zA-Z]{4,}/g) || []).length;
            const charCount = extractedText.replace(/\s/g, '').length;
            const wordRatio = charCount > 0 ? wordCount / (charCount / 5) : 0;

            console.log(`Text quality check - words: ${wordCount}, chars: ${charCount}, ratio: ${wordRatio.toFixed(2)}`);

            // If text quality is poor (likely scanned/image PDF), try OCR
            if (wordRatio < 0.3 || wordCount < 20) {
                console.log('Low quality text detected, attempting OCR with Tesseract...');
                try {
                    // Write buffer to temp file for Tesseract
                    const tempPath = path.join(__dirname, `temp_${Date.now()}.pdf`);
                    fs.writeFileSync(tempPath, fileBuffer);

                    // Use Tesseract.js to OCR the PDF (it can read PDFs directly)
                    const { data: { text: ocrText } } = await Tesseract.recognize(tempPath, 'eng', {
                        logger: m => console.log(`OCR: ${m.status} ${Math.round((m.progress || 0) * 100)}%`)
                    });

                    // Clean up temp file
                    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

                    // Use OCR text if it's better
                    const ocrWordCount = (ocrText.match(/[a-zA-Z]{4,}/g) || []).length;
                    if (ocrWordCount > wordCount) {
                        console.log(`OCR extracted better text: ${ocrText.length} chars, ${ocrWordCount} words`);
                        extractedText = ocrText;
                    } else {
                        console.log('OCR did not improve text quality, using original');
                    }
                } catch (ocrError) {
                    console.warn('OCR fallback failed:', ocrError.message);
                    // Continue with original pdf-parse text
                }
            }

            console.log(`Final extraction: ${extractedText.length} characters from PDF`);
        } else if (ext === '.docx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Extract text from DOCX using mammoth
            console.log('Parsing DOCX file...');
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
            console.log(`Extracted ${extractedText.length} characters from DOCX`);
        } else if (ext === '.doc' || file.mimetype === 'application/msword') {
            // For old .doc files, try mammoth (may work for some)
            console.log('Attempting to parse DOC file...');
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            extractedText = result.value;
            console.log(`Extracted ${extractedText.length} characters from DOC`);
        } else if (ext === '.txt' || file.mimetype === 'text/plain') {
            // Plain text file
            console.log('Reading TXT file...');
            extractedText = fileBuffer.toString('utf8');
            console.log(`Read ${extractedText.length} characters from TXT`);
        } else {
            // Unsupported file type
            console.warn(`Unsupported file type: ${ext} (${file.mimetype})`);
            throw new Error(`Unsupported file type: ${ext}. Please upload a PDF, DOCX, DOC, or TXT file.`);
        }

        if (!extractedText || extractedText.trim().length < 10) {
            console.warn('Very little text extracted from file');
            throw new Error('Could not extract meaningful text from the file. Please ensure the file contains text content.');
        }

        console.log(`Successfully extracted ${extractedText.length} characters from ${file.originalname}`);
        console.log(`First 500 chars: ${extractedText.substring(0, 500)}`);

        // Index document for RAG (async, non-blocking)
        const documentId = file.originalname.replace(/[^a-zA-Z0-9]/g, '_');
        rag.indexDocument(documentId, extractedText, {
            originalName: file.originalname,
            mimeType: file.mimetype
        }).then(result => {
            console.log(`RAG: Document indexed with ${result.chunkCount} chunks`);
        }).catch(err => {
            console.warn('RAG indexing failed (non-critical):', err.message);
        });

        // Store documentId in file object for later use
        file.ragDocumentId = documentId;

        return extractedText;
    } catch (error) {
        console.error('Error extracting text from file:', error);
        throw new Error(`Failed to extract text from ${file.originalname}: ${error.message}`);
    }
}

/**
 * Extract topics from syllabus content
 * @param {string} syllabusContent - Raw text content of the syllabus
 * @returns {Object} - Object containing the extracted topics
 */
async function extractTopicsFromSyllabus(syllabusContent) {
    try {
        console.log('Extracting topics from syllabus content...');

        if (!syllabusContent || syllabusContent.trim().length < 50) {
            throw new Error('Syllabus content is too short for meaningful topic extraction');
        }

        // Build a prompt focused specifically on topic extraction
        const prompt = `
Extract the main topics covered in this syllabus. Focus only on the academic subjects, 
course modules, or knowledge areas that will be taught, not administrative details.
Return the result as a JSON array of strings, with each string being a course topic.

Example:
If extracting from a Computer Science syllabus, the result might be:
["Introduction to Programming", "Data Structures", "Algorithms", "Database Systems", "Web Development"]

Syllabus content:
${syllabusContent.substring(0, 8000)}

Topics (JSON array of strings):
`;

        // Use transformer model to extract topics
        const response = await transformersModel.createChatCompletion(
            'You are a system for extracting course topics from educational syllabi.',
            prompt,
            {
                temperature: 0.3,
                maxTokens: 1000,
                taskType: 'extraction',
                modelName: 'gemini-2.0-flash'
            }
        );

        // Extract JSON array from response
        let topics = [];
        const jsonMatch = response.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
            try {
                topics = JSON.parse(jsonMatch[0]);

                // Ensure topics is an array of strings
                if (!Array.isArray(topics)) {
                    topics = [];
                }

                // Blacklist of generic/metadata terms to filter out
                const blacklist = [
                    'learning outcomes', 'learning objectives', 'course objectives',
                    'and assessment', 'assessment information', 'assessment criteria', 'grading',
                    'course description', 'course overview', 'introduction',
                    'syllabus', 'schedule', 'attendance', 'policies',
                    'prerequisites', 'textbook', 'references', 'resources',
                    'instructor', 'contact', 'office hours', 'evaluation',
                    'assignments', 'homework', 'exam', 'midterm', 'final'
                ];

                // Helper function to truncate at word boundary
                const truncateAtWord = (text, maxLen = 60) => {
                    if (text.length <= maxLen) return text;
                    const truncated = text.substring(0, maxLen);
                    const lastSpace = truncated.lastIndexOf(' ');
                    return lastSpace > 20 ? truncated.substring(0, lastSpace) : truncated;
                };

                // Extract just the title part (before colon/description)
                const extractTitle = (topic) => {
                    const colonIdx = topic.indexOf(':');
                    if (colonIdx > 0 && colonIdx < 50) {
                        return topic.substring(0, colonIdx).trim();
                    }
                    return truncateAtWord(topic, 60);
                };

                // Clean up topics - remove generic/metadata topics
                topics = topics
                    .filter(topic => typeof topic === 'string' && topic.trim().length > 5)
                    .map(topic => topic.trim())
                    .filter(topic => !topic.toLowerCase().startsWith('and '))  // Filter "and ..."
                    .filter(topic => {
                        const lower = topic.toLowerCase();
                        return !blacklist.some(blocked => lower.includes(blocked));
                    })
                    .map(extractTitle);  // Extract just the title part

            } catch (parseError) {
                console.error('Error parsing topics JSON from model response:', parseError);
                // If we can't parse JSON, extract topics using regex patterns
                topics = extractTopicsUsingPatterns(syllabusContent);
            }
        } else {
            console.log('No JSON topics array found in response, using pattern extraction');
            topics = extractTopicsUsingPatterns(syllabusContent);
        }

        // If we couldn't extract any topics, return an empty array, not defaults
        if (!topics || topics.length === 0) {
            console.log('No topics found, returning empty array');
            topics = [];
        }

        // Limit to a reasonable number of topics
        topics = topics.slice(0, 15);

        return {
            topics,
            metadata: {
                extractedAt: new Date().toISOString(),
                modelUsed: 'gemini-2.0-flash',
                topicCount: topics.length
            }
        };
    } catch (error) {
        console.error('Error extracting topics from syllabus:', error);
        // Return empty array on error, not defaults
        return {
            topics: [],
            metadata: {
                extractedAt: new Date().toISOString(),
                modelUsed: 'fallback',
                error: error.message
            }
        };
    }
}

/**
 * Extract topics using regex patterns when AI extraction fails
 * @private
 * @param {string} syllabusContent - Raw text content of the syllabus
 * @returns {Array} - Array of topic strings
 */
function extractTopicsUsingPatterns(syllabusContent) {
    // Look for common topic patterns in the syllabus
    const topics = [];

    // Match sections that might contain topics
    const contentSections = syllabusContent.match(/(?:topics|content|subject|curriculum|modules|units|lessons)[ :].+?(?:\n\n|\n\r\n|$)/gi) || [];

    // Process each potential section to extract topics
    for (const section of contentSections) {
        // Look for bulleted or numbered list items
        const listItems = section.match(/[-•*][ \t](.+?)(?:\n|$)/g) ||
            section.match(/\d+\.[ \t](.+?)(?:\n|$)/g) ||
            section.match(/[A-Z]\.[ \t](.+?)(?:\n|$)/g);

        if (listItems && listItems.length > 0) {
            for (const item of listItems) {
                // Clean up the item
                const cleaned = item.replace(/^[-•*\d.A-Z][ \t]+/, '').trim();
                if (cleaned.length > 3 && !topics.includes(cleaned)) {
                    topics.push(cleaned);
                }
            }
        }
    }

    // Look for potential topics in headings or bold text
    const headings = syllabusContent.match(/#{1,6}[ \t](.+?)(?:\n|$)/g) ||
        syllabusContent.match(/\*\*(.+?)\*\*/g) ||
        syllabusContent.match(/Chapter \d+:[ \t](.+?)(?:\n|$)/gi);

    if (headings && headings.length > 0) {
        for (const heading of headings) {
            // Clean up the heading
            const cleaned = heading.replace(/^#{1,6}[ \t]+/, '')
                .replace(/^\*\*|\*\*$/g, '')
                .replace(/^Chapter \d+:[ \t]+/i, '')
                .trim();

            if (cleaned.length > 3 && !topics.includes(cleaned) &&
                !cleaned.match(/course|syllabus|overview|assessment|grading|schedule|policy|objective/i)) {
                topics.push(cleaned);
            }
        }
    }

    return topics;
}

/**
 * Get list of analyzed syllabi (mock implementation)
 * @returns {Array} - List of syllabi
 */
async function getSyllabiList() {
    // Mock implementation for demo purposes
    return [
        {
            id: 'syllabus-1',
            courseTitle: 'Introduction to Computer Science',
            courseCode: 'CS101',
            analyzedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
        },
        {
            id: 'syllabus-2',
            courseTitle: 'Advanced Programming Techniques',
            courseCode: 'CS301',
            analyzedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        }
    ];
}

/**
 * Generate assessment based on syllabus analysis
 * @param {Object} syllabusAnalysis - The analyzed syllabus data
 * @param {Object} preferences - Assessment generation preferences
 * @returns {Object} - The generated assessment
 */
async function generateAssessment(syllabusAnalysis, preferences = {}) {
    try {
        console.log(`Generating assessment with pattern:`, JSON.stringify(preferences.pattern || {}));

        // Helper to sanitize course title - remove JSON garbage
        const sanitizeCourseTitle = (title) => {
            if (!title || typeof title !== 'string') return 'Course';
            let cleaned = title
                .replace(/["':\[\]\{\}]/g, '')  // Remove JSON chars
                .replace(/skillsGained|schedule|topics|keyTopics|learningOutcomes/gi, '')
                .replace(/basicInfo|courseCode|academicLevel/gi, '')
                .replace(/\s+/g, ' ')
                .trim();
            // Only use if it's a meaningful title
            return (cleaned.length >= 3 && /[a-zA-Z]{2,}/.test(cleaned)) ? cleaned : 'Course';
        };

        // Get sanitized course title
        const courseTitle = sanitizeCourseTitle(syllabusAnalysis.basicInfo?.courseTitle);

        // Extract key topics from multiple possible locations in syllabusAnalysis
        // The frontend might store them in different places
        let topics = [];

        // Try multiple sources for topics
        if (syllabusAnalysis.selectedTopics && Array.isArray(syllabusAnalysis.selectedTopics)) {
            topics = syllabusAnalysis.selectedTopics;
            console.log('Using selectedTopics:', topics);
        } else if (syllabusAnalysis.topics && Array.isArray(syllabusAnalysis.topics)) {
            topics = syllabusAnalysis.topics;
            console.log('Using topics array:', topics);
        } else if (syllabusAnalysis.learningOutcomes?.keyTopics && Array.isArray(syllabusAnalysis.learningOutcomes.keyTopics)) {
            topics = syllabusAnalysis.learningOutcomes.keyTopics;
            console.log('Using learningOutcomes.keyTopics:', topics);
        } else if (syllabusAnalysis.learningOutcomes?.skills && Array.isArray(syllabusAnalysis.learningOutcomes.skills)) {
            topics = syllabusAnalysis.learningOutcomes.skills;
            console.log('Using learningOutcomes.skills:', topics);
        }

        // Log the entire syllabusAnalysis structure to debug
        console.log('SyllabusAnalysis keys:', Object.keys(syllabusAnalysis));
        console.log('Topics extracted:', topics);

        const pattern = preferences.pattern || {};

        // Use the latest available model name
        const modelName = preferences.modelName || pattern.modelName || 'gemini-2.0-flash';
        console.log(`Using model ${modelName} for assessment generation`);

        // Get the raw syllabus content for the AI to use
        const syllabusContent = syllabusAnalysis.rawContent || '';
        console.log(`Raw content length: ${syllabusContent.length} chars`);

        // Build a detailed prompt with the ACTUAL syllabus content
        const prompt = `
You are an expert educator creating a high-quality assessment. Read the following syllabus/document content carefully and generate questions ONLY based on what is actually written in this document.

===== DOCUMENT CONTENT START =====
${syllabusContent || 'No content provided'}
===== DOCUMENT CONTENT END =====

Course: ${syllabusAnalysis.basicInfo?.courseTitle || 'Course'}
Level: ${syllabusAnalysis.basicInfo?.academicLevel || 'Undergraduate'}

Assessment Pattern:
- Name: ${pattern.name || 'Assessment'}
- Difficulty: ${pattern.difficulty || 'Medium'}
- Question Distribution: ${JSON.stringify(pattern.questionDistribution || [])}
- Time Limit: ${pattern.timeLimit || 60} minutes

CRITICAL FORMATTING RULES - FOLLOW EXACTLY:
1. NEVER use ellipses (...) or truncated text in any question or answer option
2. Every question MUST be a COMPLETE, grammatically correct sentence ending with a question mark
3. Every answer option MUST be a COMPLETE phrase or sentence - NO trailing "..."
4. Questions must be clear and understandable without needing the source document
5. Do NOT copy raw text snippets with "..." from the document

CONTENT RULES:
1. Generate questions ONLY about concepts, facts, and topics that are EXPLICITLY mentioned in the document
2. Do NOT make up topics or concepts that are not in the document
3. Each question should test understanding of specific content from the document
4. For multiple-choice questions, create 4 distinct, plausible options - NO placeholders or truncated text
5. All options should be similar in length and structure

Generate questions in this exact format (generate as many as specified in the pattern):

Question 1: [Write a complete question sentence ending with ?]
Type: [multiple-choice/true-false/short-answer]
Option A: [Complete answer option - full sentence or phrase]
Option B: [Complete answer option - full sentence or phrase]
Option C: [Complete answer option - full sentence or phrase]
Option D: [Complete answer option - full sentence or phrase]
Correct Answer: [A/B/C/D]
Topic: [The specific topic from the document this question covers]
Difficulty: [Easy/Medium/Hard]
Points: [point value]

Question 2: ...
`;

        // Use transformers model with the latest model name
        console.log('Calling model to generate assessment...');
        const response = await transformersModel.createChatCompletion(
            'You are an expert assessment creator for educational courses.',
            prompt,
            {
                temperature: 0.7,
                maxTokens: 4000,
                modelName: modelName,
                topP: 0.9
            }
        );

        // Parse the response to extract questions
        console.log('Parsing model response for assessment questions...');

        // Process the response to extract questions - use simple parsing rather than expecting JSON
        const questions = [];
        const questionRegex = /Question\s+(\d+):\s*(.*?)(?=\s*Question\s+\d+:|$)/gs;
        const questionMatches = [...response.matchAll(questionRegex)];

        if (questionMatches && questionMatches.length > 0) {
            for (let i = 0; i < questionMatches.length; i++) {
                const questionBlock = questionMatches[i][2];

                // First extract all metadata we'll need to avoid reference errors
                const typeMatch = questionBlock.match(/Type:\s*(multiple-choice|true-false|short-answer)/i);
                const questionType = typeMatch ? typeMatch[1].toLowerCase() : 'multiple-choice';

                const topicMatch = questionBlock.match(/Topic:\s*(.*?)(?=\s*Difficulty:|$)/i);
                const topic = topicMatch ? topicMatch[1].trim() : (topics[i % topics.length] || 'General');

                const difficultyMatch = questionBlock.match(/Difficulty:\s*(Easy|Medium|Hard)/i);
                const difficulty = difficultyMatch ? difficultyMatch[1] : (pattern.difficulty || 'Medium');

                const pointsMatch = questionBlock.match(/Points:\s*(\d+)/i);
                const points = pointsMatch ? parseInt(pointsMatch[1]) : (
                    questionType === 'multiple-choice' ? 2 :
                        questionType === 'true-false' ? 1 : 5
                );

                const questionTextMatch = questionBlock.match(/^(.*?)(?=\s*Type:|$)/i);
                const questionText = questionTextMatch ? questionTextMatch[1].trim() : `Question about ${topic}`;

                // Extract options for multiple-choice
                const options = [];
                if (questionType === 'multiple-choice') {
                    const optionA = questionBlock.match(/Option\s+A:\s*(.*?)(?=\s*Option\s+B:|$)/i);
                    const optionB = questionBlock.match(/Option\s+B:\s*(.*?)(?=\s*Option\s+C:|$)/i);
                    const optionC = questionBlock.match(/Option\s+C:\s*(.*?)(?=\s*Option\s+D:|$)/i);
                    const optionD = questionBlock.match(/Option\s+D:\s*(.*?)(?=\s*Correct\s+Answer:|$)/i);

                    if (optionA) options.push(optionA[1].trim());
                    if (optionB) options.push(optionB[1].trim());
                    if (optionC) options.push(optionC[1].trim());
                    if (optionD) options.push(optionD[1].trim());
                } else if (questionType === 'true-false') {
                    options.push('True');
                    options.push('False');
                }

                // Extract correct answer
                let correctAnswer = '';
                const correctAnswerMatch = questionBlock.match(/Correct\s+Answer:\s*([A-D]|True|False)/i);
                if (correctAnswerMatch) {
                    const correctAnswerLetter = correctAnswerMatch[1];
                    if (questionType === 'multiple-choice') {
                        const index = correctAnswerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
                        if (index >= 0 && index < options.length) {
                            correctAnswer = options[index];
                        } else {
                            correctAnswer = options[0] || '';
                        }
                    } else if (questionType === 'true-false') {
                        correctAnswer = correctAnswerLetter;
                    } else if (questionType === 'short-answer') {
                        // For short answer, instead of using True/False, use a proper text answer
                        // Look for a sample answer in the question block
                        const sampleAnswerMatch = questionBlock.match(/Sample\s+Answer:\s*(.*?)(?=\s*Topic:|$)/i);
                        correctAnswer = sampleAnswerMatch
                            ? sampleAnswerMatch[1].trim()
                            : `A comprehensive answer should address key concepts related to ${topic} and demonstrate understanding of the core principles.`;
                    }
                } else {
                    // Default answers based on question type
                    if (questionType === 'multiple-choice') {
                        correctAnswer = options[0] || '';
                    } else if (questionType === 'true-false') {
                        correctAnswer = 'True';
                    } else if (questionType === 'short-answer') {
                        // For short answer, provide a sample answer instead of True/False
                        correctAnswer = `A comprehensive answer should address key concepts related to ${topic} and demonstrate understanding of the core principles.`;
                    }
                }

                // Add the question to our array
                questions.push({
                    id: `q${i + 1}`,
                    question: questionText,
                    questionType: questionType,
                    options: options,
                    correctAnswer: correctAnswer,
                    topic: topic,
                    difficulty: difficulty,
                    points: points,
                    explanation: `This question tests understanding of ${topic}.`
                });
            }
        }


        // If we couldn't extract questions, generate fallback ones
        if (questions.length === 0) {
            console.log('Could not extract questions from model response, generating fallbacks...');
            return {
                title: `${courseTitle} Assessment`,
                description: `Assessment based on the course syllabus`,
                totalPoints: 100,
                timeLimit: preferences.timeLimit || pattern.timeLimit || 60,
                questions: await generateBasicQuestions(topics, preferences, syllabusAnalysis.rawContent || ''),
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
                generatedAt: new Date().toISOString(),
                generatedBy: 'fallback-system'
            };
        }

        // Enforce pattern: match question type/count/points to pattern.questionDistribution
        if (pattern.questionDistribution && Array.isArray(pattern.questionDistribution)) {
            let enforcedQuestions = [];
            let used = new Set();
            let qIndex = 0;
            for (const dist of pattern.questionDistribution) {
                let count = dist.count || 0;
                let type = (dist.type || '').toLowerCase();
                let pointsEach = dist.pointsEach || 1;
                // Filter questions of this type
                let typeQuestions = questions.filter((q, idx) => (q.questionType === type || q.type === type) && !used.has(idx));
                // If not enough, fill with any remaining of this type
                for (let i = 0; i < count; i++) {
                    let q = typeQuestions[i];
                    if (!q) {
                        // If not enough, try to find any unused question
                        q = questions.find((qq, idx) => !used.has(idx) && (qq.questionType === type || qq.type === type));
                    }
                    if (!q) {
                        // If still not enough, create a dummy question
                        q = {
                            id: `q${qIndex + 1}`,
                            question: `Placeholder question for ${type}`,
                            questionType: type,
                            options: type === 'multiple-choice' ? ['Option A', 'Option B', 'Option C', 'Option D'] : [],
                            correctAnswer: type === 'multiple-choice' ? 'Option A' : (type === 'true-false' ? 'True' : ''),
                            topic: topics[qIndex % topics.length] || 'General',
                            difficulty: pattern.difficulty || 'Medium',
                            points: pointsEach,
                            explanation: `This is a placeholder question for ${type}.`
                        };
                    } else {
                        // Clone and enforce points/type
                        q = { ...q, questionType: type, points: pointsEach };
                    }
                    enforcedQuestions.push(q);
                    // Mark as used if from original
                    let origIdx = questions.indexOf(q);
                    if (origIdx !== -1) used.add(origIdx);
                    qIndex++;
                }
            }
            // Replace questions with enforced
            return {
                title: `${courseTitle} Assessment`,
                description: `${pattern.name || 'Standard'} assessment covering key course topics`,
                totalPoints: enforcedQuestions.reduce((sum, q) => sum + (q.points || 0), 0),
                timeLimit: preferences.timeLimit || pattern.timeLimit || 60,
                questions: enforcedQuestions,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                generatedAt: new Date().toISOString(),
                generatedBy: modelName
            };
        } else {
            // Return as before if no pattern
            return {
                title: `${courseTitle} Assessment`,
                description: `${pattern.name || 'Standard'} assessment covering key course topics`,
                totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
                timeLimit: preferences.timeLimit || pattern.timeLimit || 60,
                questions: questions,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                generatedAt: new Date().toISOString(),
                generatedBy: modelName
            };
        }
    } catch (error) {
        console.error('Error generating assessment:', error);

        // Generate fallback questions on error
        const topics = syllabusAnalysis.learningOutcomes?.keyTopics || [];
        return {
            title: 'Course Assessment',
            description: `Assessment based on the course syllabus (fallback mode)`,
            totalPoints: 100,
            timeLimit: preferences.timeLimit || 60,
            questions: await generateBasicQuestions(topics, preferences, syllabusAnalysis.rawContent || ''),
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            generatedAt: new Date().toISOString(),
            generatedBy: 'error-fallback'
        };
    }
}

/**
 * Generate basic questions based on topics
 * @private
 */
async function generateBasicQuestions(topics, preferences, rawContent = '') {
    console.log('=== GENERATING QUESTIONS WITH GEMINI AI ===');
    console.log('Topics:', topics);
    console.log('Raw content length:', rawContent?.length || 0);

    // Robust topic sanitization - remove ALL JSON garbage
    const sanitizeTopic = (topic) => {
        if (typeof topic !== 'string') return null;

        // Remove JSON artifacts
        let cleaned = topic
            .replace(/["':\[\]\{\}]/g, '')  // Remove JSON chars
            .replace(/skillsGained|schedule|topics|keyTopics|learningOutcomes/gi, '')  // Remove field names
            .replace(/basicInfo|courseTitle|courseCode|academicLevel/gi, '')
            .replace(/prerequisites|assessments|grades|grading/gi, '')
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .trim();

        // Only keep if it's a meaningful string (5+ chars, contains letters)
        if (cleaned.length >= 5 && /[a-zA-Z]{3,}/.test(cleaned)) {
            return cleaned;
        }
        return null;
    };

    let cleanTopics = Array.isArray(topics)
        ? topics.map(sanitizeTopic).filter(t => t !== null).slice(0, 5)
        : [];

    // If no valid topics after sanitization, use the raw content to extract topics
    if (cleanTopics.length === 0 && rawContent) {
        // Extract meaningful words from content (capitalized words, technical terms)
        const contentWords = rawContent.substring(0, 2000)
            .match(/[A-Z][a-z]{4,}(?:\s+[A-Z][a-z]+)*/g) || [];
        cleanTopics = [...new Set(contentWords)].slice(0, 5);
    }

    // Final fallback
    if (cleanTopics.length === 0) {
        cleanTopics = ['Course Content', 'Key Concepts', 'Main Topics'];
    }

    // Calculate total question count from distribution if available
    let questionCount = preferences.questionCount || 10;
    if (preferences.questionDistribution && Array.isArray(preferences.questionDistribution)) {
        questionCount = preferences.questionDistribution.reduce((sum, d) => sum + (d.count || 0), 0);
        console.log(`Using questionDistribution total: ${questionCount} questions`);
    } else if (preferences.pattern?.questionDistribution && Array.isArray(preferences.pattern.questionDistribution)) {
        questionCount = preferences.pattern.questionDistribution.reduce((sum, d) => sum + (d.count || 0), 0);
        console.log(`Using pattern.questionDistribution total: ${questionCount} questions`);
    }

    // Build prompt for Gemini
    const prompt = `
Generate ${questionCount} assessment questions based on these topics: ${cleanTopics.join(', ')}

${rawContent ? `Document Content (use this to create specific questions):\n${rawContent.substring(0, 5000)}` : ''}

For EACH question, use this EXACT format:
---
QUESTION: [A specific, detailed question about the content]
TYPE: [multiple-choice OR short-answer OR essay]
OPTIONS: [For multiple-choice only: A) first option | B) second option | C) third option | D) fourth option]
ANSWER: [The correct answer - for multiple choice, just the letter]
TOPIC: [The topic this question covers]
POINTS: [10 for multiple-choice, 15 for short-answer, 25 for essay]
---

Generate exactly ${questionCount} questions. Make them specific to the actual content, not generic templates.`;

    try {
        const response = await transformersModel.createChatCompletion(
            'You are an educational assessment expert. Generate specific questions based on the provided content.',
            prompt,
            {
                temperature: 0.7,
                maxTokens: 4096,
                taskType: 'assessment',
                modelName: 'gemini-2.0-flash'
            }
        );

        console.log('Gemini response received, parsing questions...');

        // Parse the response
        const questions = [];
        const questionBlocks = response.split('---').filter(b => b.trim().includes('QUESTION:'));

        for (let i = 0; i < questionBlocks.length && questions.length < questionCount; i++) {
            const block = questionBlocks[i];

            const questionMatch = block.match(/QUESTION:\s*(.+?)(?=\nTYPE:|$)/s);
            const typeMatch = block.match(/TYPE:\s*(\w+[-\w]*)/);
            const optionsMatch = block.match(/OPTIONS:\s*(.+?)(?=\nANSWER:|$)/s);
            const answerMatch = block.match(/ANSWER:\s*(.+?)(?=\nTOPIC:|$)/s);
            const topicMatch = block.match(/TOPIC:\s*(.+?)(?=\nPOINTS:|$)/s);
            const pointsMatch = block.match(/POINTS:\s*(\d+)/);

            if (questionMatch) {
                const type = typeMatch ? typeMatch[1].trim().toLowerCase() : 'multiple-choice';
                const questionText = questionMatch[1].trim();
                const answer = answerMatch ? answerMatch[1].trim() : '';
                const topic = topicMatch ? topicMatch[1].trim() : cleanTopics[0];
                const points = pointsMatch ? parseInt(pointsMatch[1]) : 10;

                const question = {
                    type: type,
                    question: questionText,
                    topic: topic,
                    points: points
                };

                if (type === 'multiple-choice' && optionsMatch) {
                    const optionsText = optionsMatch[1].trim();
                    const options = optionsText.split(/\s*\|\s*/).map(o => o.replace(/^[A-D]\)\s*/, '').trim());
                    question.options = options.length >= 4 ? options : [
                        options[0] || 'Option A',
                        options[1] || 'Option B',
                        options[2] || 'Option C',
                        options[3] || 'Option D'
                    ];
                    question.correctAnswer = question.options[0]; // First option is usually correct
                }

                if (type === 'short-answer' || type === 'essay') {
                    question.sampleAnswer = answer;
                }

                questions.push(question);
                console.log(`Parsed question ${questions.length}: ${questionText.substring(0, 50)}...`);
            }
        }

        if (questions.length > 0) {
            console.log(`Successfully generated ${questions.length} questions with Gemini AI`);
            return questions;
        }
    } catch (error) {
        console.error('Error generating questions with Gemini:', error.message);
    }

    // Only fall back to simple questions if AI completely fails
    console.log('Gemini failed, generating content-based fallback questions...');
    console.log('Using raw content to extract meaningful topics...');

    // Extract meaningful sentences from raw content
    const fallbackQuestions = [];

    if (rawContent && rawContent.length > 100) {
        // Split into sentences and find interesting ones
        const sentences = rawContent
            .replace(/\n+/g, ' ')
            .split(/[.!?]/)
            .map(s => s.trim())
            .filter(s => s.length > 30 && s.length < 200)  // Good sentence length
            .filter(s => /[a-zA-Z]{5,}/.test(s))  // Has meaningful words
            .filter(s => !/^(page|figure|table|chapter|section|\d+)/i.test(s));  // Not headers

        // Remove duplicates and get unique sentences
        const uniqueSentences = [...new Set(sentences)].slice(0, questionCount * 2);

        console.log(`Found ${uniqueSentences.length} unique sentences from content`);

        // Helper to clean sentence text
        const cleanText = (text) => {
            return text
                .replace(/[^\x20-\x7E]/g, '')  // Remove non-ASCII characters
                .replace(/\s+/g, ' ')          // Normalize whitespace
                .trim();
        };

        // Different question templates for variety - NO 'according to course material'
        const questionTemplates = [
            (concept) => `Which of the following best describes "${concept}"?`,
            (concept) => `Which statement is TRUE about "${concept}"?`,
            (concept) => `"${concept}" can be defined as:`,
            (concept) => `Identify the correct statement about "${concept}":`,
            (concept) => `What does "${concept}" refer to?`
        ];

        // Helper to modify a sentence to create wrong answer
        const modifySentence = (text, modType) => {
            const words = text.split(' ');
            if (words.length < 3) return text + ' (incorrect interpretation)';

            switch (modType % 4) {
                case 0: // Swap words
                    if (words.length > 4) {
                        [words[1], words[3]] = [words[3], words[1]];
                    }
                    return words.join(' ');
                case 1: // Add negation
                    return 'It is not true that ' + text.toLowerCase();
                case 2: // Change ending
                    return words.slice(0, -2).join(' ') + ' in a different context';
                case 3: // Opposite meaning hint
                    return text.replace(/is/g, 'is not');
                default:
                    return text + ' (alternative view)';
            }
        };

        // Track used sentences to avoid duplicates
        const usedIndices = new Set();

        // Generate a MIX of multiple-choice, true-false, and short-answer questions
        for (let i = 0; i < questionCount && usedIndices.size < uniqueSentences.length; i++) {
            // Pick a random unused sentence
            let sentenceIdx = i;
            while (usedIndices.has(sentenceIdx) && usedIndices.size < uniqueSentences.length) {
                sentenceIdx = Math.floor(Math.random() * uniqueSentences.length);
            }
            usedIndices.add(sentenceIdx);

            const sentence = cleanText(uniqueSentences[sentenceIdx]);
            if (!sentence || sentence.length < 20) continue;

            const questionType = i % 5; // Cycle through 5 patterns

            if (questionType < 3) {
                // MULTIPLE CHOICE - 60% of questions
                const mainConcept = sentence.split(' ').slice(0, 6).join(' ');
                const correctOption = sentence;

                // Generate distractors using multiple strategies
                const distractors = [];

                // Strategy 1: Use other sentences from content
                for (let offset = 1; offset <= 5 && distractors.length < 2; offset++) {
                    const otherIdx = (sentenceIdx + offset * 3) % uniqueSentences.length;
                    if (otherIdx !== sentenceIdx && uniqueSentences[otherIdx]) {
                        const other = cleanText(uniqueSentences[otherIdx]);
                        if (other && other.length > 20 && other !== correctOption) {
                            distractors.push(other);
                        }
                    }
                }

                // Strategy 2: Modify the correct answer to create plausible wrong answers
                if (distractors.length < 3) {
                    distractors.push(modifySentence(correctOption, i));
                }
                if (distractors.length < 3) {
                    distractors.push(modifySentence(correctOption, i + 1));
                }

                // Fill remaining with varied fallbacks
                const fallbackPool = [
                    'This applies to a different principle entirely',
                    'This is a common misconception about the topic',
                    'This describes an unrelated phenomenon',
                    'This is partially correct but incomplete',
                    'This represents a historical view no longer accepted'
                ];
                while (distractors.length < 3) {
                    distractors.push(fallbackPool[distractors.length] || 'Alternative interpretation');
                }

                // Remove any duplicate options before shuffling
                const uniqueDistractors = distractors.filter((d, idx) =>
                    d !== correctOption &&
                    d.substring(0, 40) !== correctOption.substring(0, 40) &&
                    distractors.indexOf(d) === idx // Remove duplicate distractors
                );

                // Refill if we lost distractors due to duplicates
                const extraFallbacks = [
                    'This represents an alternative interpretation',
                    'This concept applies in different contexts',
                    'This is often confused with the correct answer',
                    'This statement is incomplete or inaccurate'
                ];
                while (uniqueDistractors.length < 3) {
                    const fallback = extraFallbacks[uniqueDistractors.length];
                    if (!uniqueDistractors.includes(fallback)) {
                        uniqueDistractors.push(fallback);
                    }
                }

                // Shuffle options
                const allOptions = [correctOption, uniqueDistractors[0], uniqueDistractors[1], uniqueDistractors[2]];
                for (let j = allOptions.length - 1; j > 0; j--) {
                    const k = Math.floor(Math.random() * (j + 1));
                    [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
                }

                // Use varied question template
                const templateFn = questionTemplates[i % questionTemplates.length];

                fallbackQuestions.push({
                    type: 'multiple-choice',
                    question: templateFn(mainConcept + '...'),
                    options: allOptions,
                    correctAnswer: correctOption,
                    topic: ['Concepts', 'Definitions', 'Theory', 'Application', 'Understanding'][i % 5],
                    points: 10,
                    difficulty: ['Easy', 'Medium', 'Medium', 'Hard'][i % 4]
                });

            } else if (questionType === 3) {
                // TRUE/FALSE - 20% of questions
                const statement = sentence.length > 100 ? sentence.substring(0, 100) : sentence;
                const isTrue = Math.random() > 0.4; // 60% chance of true statement

                let questionText;
                if (isTrue) {
                    questionText = statement;
                } else {
                    questionText = modifySentence(statement, i);
                }

                fallbackQuestions.push({
                    type: 'true-false',
                    question: `True or False: ${questionText}`,
                    options: ['True', 'False'],
                    correctAnswer: isTrue ? 'True' : 'False',
                    topic: 'Fact Check',
                    points: 5,
                    difficulty: 'Easy'
                });

            } else {
                // SHORT ANSWER - 20% of questions
                const shortAnswerTemplates = [
                    `Explain the following concept in your own words: "${sentence}"`,
                    `What is meant by: "${sentence.split(' ').slice(0, 8).join(' ')}..."?`,
                    `Describe the significance of: "${sentence.split(' ').slice(0, 6).join(' ')}..."`,
                    `In 2-3 sentences, explain: "${sentence.split(' ').slice(0, 7).join(' ')}..."`
                ];

                fallbackQuestions.push({
                    type: 'short-answer',
                    question: shortAnswerTemplates[i % shortAnswerTemplates.length],
                    correctAnswer: sentence,
                    sampleAnswer: sentence,
                    topic: 'Comprehension',
                    points: 15,
                    difficulty: 'Medium'
                });
            }
        }
    }

    // If still no questions, create generic course questions with proper answers
    if (fallbackQuestions.length < questionCount) {
        const genericQA = [
            { q: 'What are the main objectives of this course?', a: 'The main objectives include understanding core concepts, developing practical skills, and applying knowledge to real-world scenarios.' },
            { q: 'What skills will you develop by completing this course?', a: 'Students will develop analytical, problem-solving, and practical application skills related to the course subject.' },
            { q: 'How would you apply the knowledge from this course?', a: 'The knowledge can be applied in professional settings, research, and practical problem-solving situations.' },
            { q: 'What are the key concepts covered in this course?', a: 'Key concepts include foundational theories, methodologies, and their applications.' },
            { q: 'Why is this subject matter important?', a: 'This subject is important for understanding fundamental principles and their real-world applications.' }
        ];

        for (let i = fallbackQuestions.length; i < questionCount; i++) {
            const qa = genericQA[i % genericQA.length];
            fallbackQuestions.push({
                type: 'short-answer',
                question: qa.q,
                correctAnswer: qa.a,
                sampleAnswer: qa.a,
                topic: 'Course Overview',
                points: 10,
                difficulty: 'Easy'
            });
        }
    }

    console.log(`Generated ${fallbackQuestions.length} fallback questions`);
    return fallbackQuestions;
}

// Export existing functions from the original code
module.exports = {
    generateQuickQuiz,
    analyzeSyllabus,
    extractTextFromFile,
    extractTopicsFromSyllabus,
    getSyllabiList,
    generateAssessment,
    generateFallbackSyllabusAnalysis
};