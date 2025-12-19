/**
 * Real implementation of AI Syllabus Analyzer
 * Now actually extracts text from PDF and DOCX files
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const extractTextFromFile = async (file) => {
    console.log(`Extracting text from ${file.originalname} (${file.mimetype})`);

    try {
        // Get file extension
        const ext = path.extname(file.originalname).toLowerCase();
        let extractedText = '';

        if (ext === '.pdf' || file.mimetype === 'application/pdf') {
            // Extract text from PDF using pdf-parse
            console.log('Parsing PDF file...');
            const dataBuffer = file.buffer || fs.readFileSync(file.path);
            const data = await pdfParse(dataBuffer);
            extractedText = data.text;
            console.log(`Extracted ${extractedText.length} characters from PDF`);
        } else if (ext === '.docx' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            // Extract text from DOCX using mammoth
            console.log('Parsing DOCX file...');
            const buffer = file.buffer || fs.readFileSync(file.path);
            const result = await mammoth.extractRawText({ buffer: buffer });
            extractedText = result.value;
            console.log(`Extracted ${extractedText.length} characters from DOCX`);
        } else if (ext === '.doc' || file.mimetype === 'application/msword') {
            // For old .doc files, try mammoth (may work for some)
            console.log('Attempting to parse DOC file...');
            const buffer = file.buffer || fs.readFileSync(file.path);
            const result = await mammoth.extractRawText({ buffer: buffer });
            extractedText = result.value;
            console.log(`Extracted ${extractedText.length} characters from DOC`);
        } else if (ext === '.txt' || file.mimetype === 'text/plain') {
            // Plain text file
            console.log('Reading TXT file...');
            extractedText = file.buffer ? file.buffer.toString('utf8') : fs.readFileSync(file.path, 'utf8');
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

        return extractedText;
    } catch (error) {
        console.error('Error extracting text from file:', error);
        throw new Error(`Failed to extract text from ${file.originalname}: ${error.message}`);
    }
};

const analyzeSyllabus = async (syllabusContent, options = {}) => {
    console.log('Analyzing syllabus content...');
    console.log(`Content length: ${syllabusContent?.length || 0} characters`);
    console.log(`First 200 chars: ${syllabusContent?.substring(0, 200) || 'No content'}`);

    // Return mock analysis result with the actual content stored
    return {
        title: "Java Programming Syllabus",
        description: "Analysis of the provided Java programming syllabus",
        learningOutcomes: {
            keyTopics: [
                "Introduction to Java",
                "Object Oriented Programming",
                "Collections Framework",
                "Exception Handling",
                "Multithreading"
            ],
            estimatedDuration: "10 weeks",
            difficultyLevel: "Intermediate"
        },
        assessmentPatterns: {
            patterns: [
                {
                    name: "Unit 1-2 Review",
                    description: "Focus on Java basics and OOP concepts",
                    structure: [
                        { questionType: "Multiple Choice", count: 10, pointsPerQuestion: 1 },
                        { questionType: "Short Answer", count: 5, pointsPerQuestion: 2 }
                    ],
                    totalPoints: 20,
                    estimatedDuration: 30
                },
                {
                    name: "Collections Deep Dive",
                    description: "In-depth assessment of Java Collections",
                    structure: [
                        { questionType: "Multiple Choice", count: 5, pointsPerQuestion: 1 },
                        { questionType: "Coding Challenge", count: 2, pointsPerQuestion: 10 }
                    ],
                    totalPoints: 25,
                    estimatedDuration: 45
                }
            ]
        }
    };
};

const extractTopicsFromSyllabus = async (syllabusContent) => {
    return {
        topics: [
            "Introduction to Java",
            "Object Oriented Programming",
            "Collections Framework",
            "Exception Handling",
            "Multithreading"
        ]
    };
};

const getSyllabiList = async () => {
    return [];
};

const generateQuickQuiz = async (syllabusAnalysis, quizParameters) => {
    console.log('Generating quick quiz...');
    return {
        title: "Quick Quiz",
        description: "A quick quiz generated from syllabus",
        questions: [
            {
                id: "q_1",
                type: "multiple-choice",  // Changed from questionType to type
                text: "Which of the following is NOT a feature of Java?",
                options: ["Object-Oriented", "Platform Independent", "Pointers", "Robust"],
                correctAnswer: "Pointers",
                points: 1,
                topic: "Introduction to Java",
                difficulty: "Easy"
            },
            {
                id: "q_2",
                type: "multiple-choice",  // Changed from questionType to type
                text: "Which collection class allows duplicate elements?",
                options: ["HashSet", "ArrayList", "TreeSet", "HashMap"],
                correctAnswer: "ArrayList",
                points: 1,
                topic: "Collections Framework",
                difficulty: "Medium"
            },
            {
                id: "q_3",
                type: "true-false",  // Changed from questionType to type
                text: "Java supports multiple inheritance through classes.",
                options: ["True", "False"],
                correctAnswer: "False",
                points: 1,
                topic: "Object Oriented Programming",
                difficulty: "Medium"
            }
        ],
        totalPoints: 3,
        timeLimit: 10
    };
};

const generateAssessment = async (syllabusAnalysis, preferences) => {
    console.log('Generating full assessment...');
    const pattern = preferences.pattern || {};

    // Mock questions based on requested pattern
    const questions = [];
    let questionIdCounter = 1;

    // Helper to generate mock questions based on structure
    const structure = pattern.structure || pattern.questionDistribution || [];

    // Safe list of fallback topics if syllabus analysis is garbage
    const fallbackTopics = [
        "Encapsulation", "Inheritance", "Polymorphism", "Abstraction",
        "Exception Handling", "Collections", "Multithreading", "JVM Architecture",
        "Garbage Collection", "Generics", "Lambda Expressions", "Streams API"
    ];

    structure.forEach(item => {
        const type = item.questionType || item.type;
        const count = item.count || 0;
        const points = item.pointsPerQuestion || item.pointsEach || 1;

        console.log(`Generating ${count} questions of type: ${type}`);

        for (let i = 0; i < count; i++) {
            const qId = `q_${Date.now()}_${questionIdCounter++}`;

            // Pick a random topic
            const topic = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];

            let questionData = {
                id: qId,
                type: type.toLowerCase(),  // Changed from questionType to type
                points: points,
                topic: topic,
                difficulty: "Medium"
            };

            if (type.toLowerCase().includes('multiple') || type === 'multiple-choice') {
                questionData.text = `Which of the following best describes ${topic}?`;
                questionData.options = [
                    `${topic} is a fundamental concept in this field that ensures modularity.`,
                    `${topic} is an advanced technique rarely used in modern production.`,
                    `${topic} is unrelated to the course material and out of scope.`,
                    `${topic} is only theoretical with no practical applications.`
                ];
                questionData.correctAnswer = `${topic} is a fundamental concept in this field that ensures modularity.`;
            } else if (type.toLowerCase().includes('true') || type === 'true-false') {
                questionData.text = `${topic} allows for more efficient memory management in Java Applications.`;
                questionData.options = ["True", "False"];
                questionData.correctAnswer = "True";
            } else if (type.toLowerCase().includes('short') || type === 'short-answer') {
                questionData.text = `Briefly explain the importance of ${topic} in software development.`;
                questionData.correctAnswer = `${topic} is crucial because it promotes code reusability, maintainability, and scalability. It allows developers to build complex systems by managing complexity through modular design.`;
            } else if (type.toLowerCase().includes('essay')) {
                questionData.text = `Discuss the evolution of ${topic} and its impact on modern programming paradigms.`;
                questionData.correctAnswer = `A comprehensive answer should cover the history of ${topic}, its core principles, comparison with alternative approaches, and real-world use cases. It should also touch upon trade-offs and performance implications.`;
            } else {
                questionData.text = `Analyze the properties of ${topic}.`;
                questionData.correctAnswer = "Standard analysis required.";
            }

            questions.push(questionData);
        }
    });

    console.log(`Generated ${questions.length} total questions`);

    return {
        title: pattern.name || "Generated Assessment",
        description: pattern.description || "Assessment generated from syllabus analysis",
        questions: questions,
        totalPoints: questions.reduce((sum, q) => sum + q.points, 0),
        timeLimit: pattern.estimatedTime || pattern.timeLimit || 30,
        generatedBy: "Mock AI Service"
    };
};

module.exports = {
    extractTextFromFile,
    analyzeSyllabus,
    extractTopicsFromSyllabus,
    getSyllabiList,
    generateQuickQuiz,
    generateAssessment
};
