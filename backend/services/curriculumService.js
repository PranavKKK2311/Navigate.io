const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Gemini API if API key is available
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
let genAI = null;
let model = null;

// Check if we have a valid API key (not the placeholder)
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your-api-key-here') {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    console.log('Gemini AI initialized successfully with model:', GEMINI_MODEL);
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }
} else {
  console.log('No valid Gemini API key found. Using simulation mode.');
}

/**
 * Match a topic name to an appropriate icon
 * @param {string} topicName - The name of the topic
 * @returns {string} The name of the Material-UI icon to use
 */
const matchTopicToIcon = (topicName) => {
  if (!topicName) return 'School'; // Default icon

  const lowerTopic = topicName.toLowerCase();

  // Topic category to icon mapping
  // These icons are from Material-UI and match common academic subjects
  const topicIconMap = {
    // Programming and Computer Science
    'programming': 'Code',
    'coding': 'Code',
    'software': 'Code',
    'development': 'DeveloperMode',
    'web': 'Web',
    'html': 'Code',
    'css': 'Brush',
    'javascript': 'Code',
    'frontend': 'Web',
    'backend': 'Storage',
    'database': 'Storage',
    'sql': 'Storage',
    'data': 'DataObject',
    'structure': 'AccountTree',
    'algorithm': 'Functions',
    'artificial intelligence': 'Psychology',
    'ai': 'Psychology',
    'machine learning': 'Psychology',

    // Math and Analytics
    'mathematics': 'Calculate',
    'math': 'Calculate',
    'statistics': 'BarChart',
    'analytics': 'Analytics',
    'calculus': 'Functions',
    'algebra': 'Calculate',

    // Science
    'science': 'Science',
    'physics': 'Science',
    'chemistry': 'Science',
    'biology': 'Biotech',

    // Business and Management
    'business': 'Business',
    'management': 'ManageAccounts',
    'economics': 'Paid',
    'marketing': 'Campaign',
    'finance': 'Paid',

    // Arts and Humanities
    'art': 'Palette',
    'design': 'Design',
    'history': 'History',
    'philosophy': 'Psychology',
    'literature': 'MenuBook',
    'writing': 'Edit',
    'language': 'Translate',

    // Education
    'education': 'School',
    'teaching': 'School',
    'learning': 'ImportContacts',

    // Default icons for general categories
    'theory': 'Lightbulb',
    'concept': 'Lightbulb',
    'framework': 'AccountTree',
    'method': 'Build',
    'practice': 'Construction',
    'application': 'Apps',
    'research': 'Search',
    'analysis': 'FindInPage',
    'evaluation': 'Grading',
  };

  // Try to find a direct match first
  for (const [key, icon] of Object.entries(topicIconMap)) {
    if (lowerTopic === key) {
      return icon;
    }
  }

  // Try to find a partial match
  for (const [key, icon] of Object.entries(topicIconMap)) {
    if (lowerTopic.includes(key)) {
      return icon;
    }
  }

  // Default icon if no match found
  return 'School';
};

/**
 * Format topics with appropriate icons
 * @param {Array} topics - Array of topic names
 * @returns {Array} Array of topic objects with names and icons
 */
const formatTopicsWithIcons = (topics) => {
  if (!topics || !Array.isArray(topics)) return [];

  return topics.map(topic => ({
    name: topic,
    icon: matchTopicToIcon(topic)
  }));
};

/**
 * Simulate curriculum generation for testing when Gemini API is not available
 * @param {string} courseTitle - The title of the course
 * @param {string} courseDescription - The description of the course
 * @returns {Object} A simulated curriculum map
 */
const simulateCurriculumGeneration = (courseTitle, courseDescription) => {
  console.log('Using simulation mode for curriculum generation');

  // Extract subject area from course title (simplified)
  const title = courseTitle.toLowerCase();
  let subjectArea = 'default';

  // Check for common subject areas in the title
  if (title.includes('data structure') || title.includes('algorithm')) {
    subjectArea = 'data structures';
  } else if (title.includes('programming') || title.includes('coding')) {
    subjectArea = 'programming';
  } else if (title.includes('web') || title.includes('frontend') || title.includes('backend')) {
    subjectArea = 'web development';
  } else if (title.includes('database') || title.includes('sql')) {
    subjectArea = 'database';
  } else if (title.includes('machine learning') || title.includes('ai') || title.includes('artificial intelligence')) {
    subjectArea = 'machine learning';
  }

  // Template-based outcomes
  const templates = {
    'data structures': {
      topics: [
        'Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Hashing',
        'Algorithm Analysis', 'Recursion', 'Sorting Algorithms', 'Search Algorithms'
      ],
      learningOutcomes: [
        {
          text: 'Understand fundamental data structures and their implementations',
          bloom: 'Understand',
          competency: 'Core'
        },
        {
          text: 'Analyze algorithm complexity using Big O notation',
          bloom: 'Analyze',
          competency: 'Core'
        },
        {
          text: 'Implement and use common data structures such as lists, stacks, queues, trees, and graphs',
          bloom: 'Apply',
          competency: 'Advanced'
        },
        {
          text: 'Apply appropriate data structures to solve programming problems',
          bloom: 'Apply',
          competency: 'Advanced'
        },
        {
          text: 'Compare and evaluate algorithms for efficiency',
          bloom: 'Evaluate',
          competency: 'Advanced'
        }
      ]
    },
    'programming': {
      topics: [
        'Variables', 'Data Types', 'Control Structures', 'Functions', 'Arrays',
        'Input/Output', 'File Handling', 'Error Handling', 'Object-Oriented Concepts'
      ],
      learningOutcomes: [
        {
          text: 'Write syntactically correct programs using core language features',
          bloom: 'Apply',
          competency: 'Introductory'
        },
        {
          text: 'Debug and troubleshoot programming errors',
          bloom: 'Analyze',
          competency: 'Core'
        },
        {
          text: 'Apply problem-solving techniques to design programming solutions',
          bloom: 'Apply',
          competency: 'Core'
        },
        {
          text: 'Implement solutions using object-oriented programming principles',
          bloom: 'Apply',
          competency: 'Advanced'
        },
        {
          text: 'Evaluate code quality and efficiency',
          bloom: 'Evaluate',
          competency: 'Advanced'
        }
      ]
    },
    'web development': {
      topics: [
        'HTML', 'CSS', 'JavaScript', 'DOM Manipulation', 'Responsive Design',
        'HTTP Protocol', 'Client-Server Model', 'Web APIs', 'Frontend Frameworks', 'Backend Development'
      ],
      learningOutcomes: [
        {
          text: 'Create static web pages using HTML and CSS',
          bloom: 'Create',
          competency: 'Introductory'
        },
        {
          text: 'Implement interactive features using JavaScript',
          bloom: 'Apply',
          competency: 'Core'
        },
        {
          text: 'Apply responsive design principles for multiple device compatibility',
          bloom: 'Apply',
          competency: 'Core'
        },
        {
          text: 'Develop web applications using frontend frameworks',
          bloom: 'Create',
          competency: 'Advanced'
        },
        {
          text: 'Integrate frontend with backend services and APIs',
          bloom: 'Create',
          competency: 'Advanced'
        }
      ]
    },
    'database': {
      topics: [
        'Relational Database Concepts', 'SQL', 'Database Design', 'Normalization',
        'Entity-Relationship Diagrams', 'Transactions', 'Indexing', 'NoSQL Databases', 'Data Warehousing'
      ],
      learningOutcomes: [
        {
          text: 'Design and implement database schemas',
          bloom: 'Create',
          competency: 'Core'
        },
        {
          text: 'Write SQL queries to manipulate and retrieve data',
          bloom: 'Apply',
          competency: 'Core'
        },
        {
          text: 'Apply normalization techniques to database design',
          bloom: 'Apply',
          competency: 'Core'
        },
        {
          text: 'Analyze database performance and implement optimization strategies',
          bloom: 'Analyze',
          competency: 'Advanced'
        },
        {
          text: 'Compare and contrast different database technologies',
          bloom: 'Evaluate',
          competency: 'Advanced'
        }
      ]
    },
    'machine learning': {
      topics: [
        'Supervised Learning', 'Unsupervised Learning', 'Neural Networks', 'Feature Engineering',
        'Model Evaluation', 'Data Preprocessing', 'Regression', 'Classification', 'Clustering', 'Deep Learning'
      ],
      learningOutcomes: [
        {
          text: 'Understand fundamental machine learning concepts and algorithms',
          bloom: 'Understand',
          competency: 'Core'
        },
        {
          text: 'Preprocess and prepare data for machine learning models',
          bloom: 'Apply',
          competency: 'Core'
        },
        {
          text: 'Implement and train machine learning models',
          bloom: 'Apply',
          competency: 'Advanced'
        },
        {
          text: 'Evaluate model performance using appropriate metrics',
          bloom: 'Evaluate',
          competency: 'Advanced'
        },
        {
          text: 'Design and implement machine learning solutions for real-world problems',
          bloom: 'Create',
          competency: 'Advanced'
        }
      ]
    },
    'default': {
      topics: [
        'Core Concepts', 'Fundamental Principles', 'Theoretical Frameworks',
        'Applied Techniques', 'Current Trends', 'Research Methods'
      ],
      learningOutcomes: [
        {
          text: 'Understand fundamental concepts in the subject area',
          bloom: 'Understand',
          competency: 'Introductory'
        },
        {
          text: 'Apply theoretical knowledge to practical scenarios',
          bloom: 'Apply',
          competency: 'Core'
        },
        {
          text: 'Analyze problems using appropriate techniques and methods',
          bloom: 'Analyze',
          competency: 'Core'
        },
        {
          text: 'Evaluate solutions using established criteria',
          bloom: 'Evaluate',
          competency: 'Advanced'
        },
        {
          text: 'Create innovative solutions to complex problems',
          bloom: 'Create',
          competency: 'Advanced'
        }
      ]
    }
  };

  const template = templates[subjectArea] || templates['default'];

  // Format topics with appropriate icons
  const topicsWithIcons = formatTopicsWithIcons(template.topics);

  return {
    topics: topicsWithIcons,
    learningOutcomes: template.learningOutcomes
  };
};

/**
 * Generate a curriculum map using Google's Gemini API
 * @param {string} courseTitle - The title of the course
 * @param {string} courseDescription - The description of the course
 * @returns {Object} The generated curriculum map
 */
const generateCurriculumMap = async (courseTitle, courseDescription) => {
  try {
    console.log(`Generating curriculum map for "${courseTitle}" using ${model ? 'Gemini API' : 'simulation mode'}`);

    // If we don't have a valid Gemini model, use simulation mode
    if (!model) {
      return simulateCurriculumGeneration(courseTitle, courseDescription);
    }

    // Create the prompt for Gemini
    const prompt = `
    You are an expert curriculum designer for higher education. Create a comprehensive curriculum map for a course titled "${courseTitle}". ${courseDescription ? `The course description is: ${courseDescription}` : ''}
    
    Please generate:
    1. A list of 8-12 relevant topics that should be covered in this course
    2. 5-7 learning outcomes for the course
    
    For each learning outcome:
    - Write a clear, measurable outcome statement starting with an action verb
    - Assign a Bloom's Taxonomy level (Remember, Understand, Apply, Analyze, Evaluate, Create)
    - Assign a competency level (Introductory, Core, Advanced)
    
    Format your response as a valid JSON object with this exact structure:
    {
      "topics": ["Topic 1", "Topic 2", ...],
      "learningOutcomes": [
        {
          "text": "Complete learning outcome statement",
          "bloom": "One of: Remember, Understand, Apply, Analyze, Evaluate, Create",
          "competency": "One of: Introductory, Core, Advanced"
        },
        ...more outcomes
      ]
    }
    
    Ensure your response is only the JSON object, nothing else.
    `;

    // Set generation parameters
    const generationConfig = {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    };

    // Get response from Gemini
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = await result.response;
    const text = response.text();

    // Extract the JSON part from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/({[\s\S]*})/) || [null, text];

    let parsedResponse;
    try {
      // Try to parse the entire text first
      try {
        parsedResponse = JSON.parse(text);
      } catch {
        // If that fails, try to parse the extracted part
        parsedResponse = JSON.parse(jsonMatch[1] || text);
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      console.log('Raw response:', text);

      // Fallback to simulation mode if parsing fails
      return simulateCurriculumGeneration(courseTitle, courseDescription);
    }

    // Format topics with appropriate icons
    const topicsWithIcons = formatTopicsWithIcons(parsedResponse.topics || []);

    // Process and return the curriculum map
    return {
      topics: topicsWithIcons,
      learningOutcomes: parsedResponse.learningOutcomes || []
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Fallback to simulation mode on error
    return simulateCurriculumGeneration(courseTitle, courseDescription);
  }
};

/**
 * Generate learning outcomes for a set of topics
 * @param {string} courseTitle - Course title
 * @param {string} courseDescription - Course description
 * @param {Array} topics - Array of topics to generate outcomes for
 * @returns {Object} Object with generated learning outcomes
 */
const generateLearningOutcomes = async (courseTitle, courseDescription, topics) => {
  // Implementation of learning outcomes generation
  // This can use Gemini similar to curriculum map generation
  // ...
};

/**
 * Generate learning outcomes directly from course description
 * @param {string} courseTitle - Course title
 * @param {string} courseDescription - Course description 
 * @returns {Array} Array of learning outcome objects
 */
const generateLearningOutcomesFromDescription = async (courseTitle, courseDescription) => {
  try {
    console.log(`Generating learning outcomes from description for "${courseTitle}" using ${model ? 'Gemini API' : 'simulation mode'}`);

    // If no description provided, use a generic message
    if (!courseDescription || courseDescription.trim() === '') {
      courseDescription = 'A higher education course covering fundamental concepts and practical applications.';
    }

    // If we don't have a valid Gemini model, use simulation mode
    if (!model) {
      console.log('Using simulation mode for learning outcomes generation');
      // Extract subject area from course title (simplified)
      const title = courseTitle.toLowerCase();
      let subjectArea = 'default';

      // Check for common subject areas in the title
      if (title.includes('data structure') || title.includes('algorithm')) {
        subjectArea = 'data structures';
      } else if (title.includes('programming') || title.includes('coding')) {
        subjectArea = 'programming';
      } else if (title.includes('web') || title.includes('frontend') || title.includes('backend')) {
        subjectArea = 'web development';
      } else if (title.includes('database') || title.includes('sql')) {
        subjectArea = 'database';
      } else if (title.includes('machine learning') || title.includes('ai') || title.includes('artificial intelligence')) {
        subjectArea = 'machine learning';
      }

      // Re-use the templates from simulateCurriculumGeneration
      const templates = {
        'data structures': [
          {
            text: 'Understand fundamental data structures and their implementations',
            bloom: 'Understand',
            competency: 'Core'
          },
          {
            text: 'Analyze algorithm complexity using Big O notation',
            bloom: 'Analyze',
            competency: 'Core'
          },
          {
            text: 'Implement and use common data structures such as lists, stacks, queues, trees, and graphs',
            bloom: 'Apply',
            competency: 'Advanced'
          },
          {
            text: 'Apply appropriate data structures to solve programming problems',
            bloom: 'Apply',
            competency: 'Advanced'
          },
          {
            text: 'Compare and evaluate algorithms for efficiency',
            bloom: 'Evaluate',
            competency: 'Advanced'
          }
        ],
        'programming': [
          {
            text: 'Write syntactically correct programs using core language features',
            bloom: 'Apply',
            competency: 'Introductory'
          },
          {
            text: 'Debug and troubleshoot programming errors',
            bloom: 'Analyze',
            competency: 'Core'
          },
          {
            text: 'Apply problem-solving techniques to design programming solutions',
            bloom: 'Apply',
            competency: 'Core'
          },
          {
            text: 'Implement solutions using object-oriented programming principles',
            bloom: 'Apply',
            competency: 'Advanced'
          },
          {
            text: 'Evaluate code quality and efficiency',
            bloom: 'Evaluate',
            competency: 'Advanced'
          }
        ],
        'web development': [
          {
            text: 'Create static web pages using HTML and CSS',
            bloom: 'Create',
            competency: 'Introductory'
          },
          {
            text: 'Implement interactive features using JavaScript',
            bloom: 'Apply',
            competency: 'Core'
          },
          {
            text: 'Apply responsive design principles for multiple device compatibility',
            bloom: 'Apply',
            competency: 'Core'
          },
          {
            text: 'Develop web applications using frontend frameworks',
            bloom: 'Create',
            competency: 'Advanced'
          },
          {
            text: 'Integrate frontend with backend services and APIs',
            bloom: 'Create',
            competency: 'Advanced'
          }
        ],
        'database': [
          {
            text: 'Design and implement database schemas',
            bloom: 'Create',
            competency: 'Core'
          },
          {
            text: 'Write SQL queries to manipulate and retrieve data',
            bloom: 'Apply',
            competency: 'Core'
          },
          {
            text: 'Apply normalization techniques to database design',
            bloom: 'Apply',
            competency: 'Core'
          },
          {
            text: 'Analyze database performance and implement optimization strategies',
            bloom: 'Analyze',
            competency: 'Advanced'
          },
          {
            text: 'Compare and contrast different database technologies',
            bloom: 'Evaluate',
            competency: 'Advanced'
          }
        ],
        'machine learning': [
          {
            text: 'Understand fundamental machine learning concepts and algorithms',
            bloom: 'Understand',
            competency: 'Core'
          },
          {
            text: 'Preprocess and prepare data for machine learning models',
            bloom: 'Apply',
            competency: 'Core'
          },
          {
            text: 'Implement and train machine learning models',
            bloom: 'Apply',
            competency: 'Advanced'
          },
          {
            text: 'Evaluate model performance using appropriate metrics',
            bloom: 'Evaluate',
            competency: 'Advanced'
          },
          {
            text: 'Design and implement machine learning solutions for real-world problems',
            bloom: 'Create',
            competency: 'Advanced'
          }
        ],
        'default': [
          {
            text: 'Understand fundamental concepts in the subject area',
            bloom: 'Understand',
            competency: 'Introductory'
          },
          {
            text: 'Apply theoretical knowledge to practical scenarios',
            bloom: 'Apply',
            competency: 'Core'
          },
          {
            text: 'Analyze problems using appropriate techniques and methods',
            bloom: 'Analyze',
            competency: 'Core'
          },
          {
            text: 'Evaluate solutions using established criteria',
            bloom: 'Evaluate',
            competency: 'Advanced'
          },
          {
            text: 'Create innovative solutions to complex problems',
            bloom: 'Create',
            competency: 'Advanced'
          }
        ]
      };

      return templates[subjectArea] || templates['default'];
    }

    // Create the prompt for Gemini
    const prompt = `
    You are an expert curriculum designer for higher education. Create learning outcomes for a course titled "${courseTitle}". 
    
    The course description is: "${courseDescription}"
    
    Based on this description, generate 5-7 learning outcomes that would be appropriate for this course.
    
    For each learning outcome:
    - Write a clear, measurable outcome statement starting with an action verb
    - Assign a Bloom's Taxonomy level (Remember, Understand, Apply, Analyze, Evaluate, Create)
    - Assign a competency level (Introductory, Core, Advanced)
    
    Format your response as a valid JSON array with this exact structure:
    [
      {
        "text": "Complete learning outcome statement",
        "bloom": "One of: Remember, Understand, Apply, Analyze, Evaluate, Create",
        "competency": "One of: Introductory, Core, Advanced"
      },
      ...more outcomes
    ]
    
    Ensure your response is only the JSON array, nothing else.
    `;

    // Set generation parameters
    const generationConfig = {
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
      maxOutputTokens: 2048,
    };

    // Get response from Gemini
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig,
    });

    const response = await result.response;
    const text = response.text();

    // Extract the JSON part from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/) || text.match(/(\[[\s\S]*\])/) || [null, text];

    let parsedResponse;
    try {
      // Try to parse the entire text first
      try {
        parsedResponse = JSON.parse(text);
      } catch {
        // If that fails, try to parse the extracted part
        parsedResponse = JSON.parse(jsonMatch[1] || text);
      }
    } catch (error) {
      console.error('Error parsing Gemini response for learning outcomes:', error);
      console.log('Raw response:', text);

      // Fallback to default learning outcomes if parsing fails
      const title = courseTitle.toLowerCase();
      let subjectArea = 'default';

      // Check for common subject areas in the title
      if (title.includes('data structure') || title.includes('algorithm')) {
        subjectArea = 'data structures';
      } else if (title.includes('programming') || title.includes('coding')) {
        subjectArea = 'programming';
      } else if (title.includes('web') || title.includes('frontend') || title.includes('backend')) {
        subjectArea = 'web development';
      } else if (title.includes('database') || title.includes('sql')) {
        subjectArea = 'database';
      } else if (title.includes('machine learning') || title.includes('ai') || title.includes('artificial intelligence')) {
        subjectArea = 'machine learning';
      }

      const templates = {
        'data structures': [
          // ...outcomes as defined above...
        ],
        // ...other templates as defined above...
        'default': [
          {
            text: 'Understand fundamental concepts in the subject area',
            bloom: 'Understand',
            competency: 'Introductory'
          },
          {
            text: 'Apply theoretical knowledge to practical scenarios',
            bloom: 'Apply',
            competency: 'Core'
          },
          {
            text: 'Analyze problems using appropriate techniques and methods',
            bloom: 'Analyze',
            competency: 'Core'
          },
          {
            text: 'Evaluate solutions using established criteria',
            bloom: 'Evaluate',
            competency: 'Advanced'
          },
          {
            text: 'Create innovative solutions to complex problems',
            bloom: 'Create',
            competency: 'Advanced'
          }
        ]
      };

      return templates[subjectArea] || templates['default'];
    }

    // Return the array of learning outcomes
    return parsedResponse;
  } catch (error) {
    console.error('Error generating learning outcomes from description:', error);
    // Return default learning outcomes on error
    return [
      {
        text: 'Understand fundamental concepts in the subject area',
        bloom: 'Understand',
        competency: 'Introductory'
      },
      {
        text: 'Apply theoretical knowledge to practical scenarios',
        bloom: 'Apply',
        competency: 'Core'
      },
      {
        text: 'Analyze problems using appropriate techniques and methods',
        bloom: 'Analyze',
        competency: 'Core'
      },
      {
        text: 'Evaluate solutions using established criteria',
        bloom: 'Evaluate',
        competency: 'Advanced'
      },
      {
        text: 'Create innovative solutions to complex problems',
        bloom: 'Create',
        competency: 'Advanced'
      }
    ];
  }
};

// Export the functions
module.exports = {
  generateCurriculumMap,
  generateLearningOutcomes,
  generateLearningOutcomesFromDescription
};