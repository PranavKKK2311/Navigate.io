# Navigate - AI-Powered Assessment & Adaptive Learning Platform

https://github.com/user-attachments/assets/0da1f349-d2b1-4282-90f7-f40f75e68950

Navigate is a comprehensive educational platform that leverages artificial intelligence to create personalized learning experiences and intelligent assessments. The platform combines advanced AI services with modern web technologies to provide adaptive learning paths, automated assessment generation, and intelligent content analysis.

## 🌟 Features

### For Instructors
- **AI-Powered Assessment Creation**: Generate assessments automatically from syllabus documents
- **Syllabus Analysis**: Extract learning outcomes, topics, and objectives from uploaded documents
- **Quick Quiz Generation**: Create instant quizzes based on course content
- **Student Performance Analytics**: Track and analyze student progress
- **Curriculum Mapping**: Align assessments with learning objectives
- **Plagiarism Detection**: AI-powered plagiarism checking for submissions
- **Expert Panel Integration**: Leverage AI expert panels for content validation

### For Students
- **Adaptive Learning Paths**: Personalized learning recommendations based on performance
- **Interactive Assessments**: Take assessments with real-time feedback
- **Progress Tracking**: Monitor learning progress and achievements
- **Submission Results**: Detailed feedback and scoring
- **Course Management**: Access and manage enrolled courses

### AI Services
- **Adaptive Learning Engine**: Personalizes learning experiences and predicts struggle areas
- **Assessment Generator**: Creates contextually relevant questions
- **Syllabus Analyzer**: Extracts structured data from educational documents
- **Plagiarism Detection**: Advanced content similarity analysis
- **Expert Panel System**: AI-driven expert consultation for content validation

## 🏗️ Architecture

The platform is built using a microservices architecture with three main components:

```
Navigate/
├── frontend/          # React.js web application
├── backend/           # Node.js/Express API server
└── ai_services/       # AI processing services
```

### Technology Stack

**Frontend:**
- React 18.2.0
- Material-UI (MUI) 5.12.1
- React Router DOM 6.10.0
- Chart.js 4.3.0 for analytics
- Axios for API communication

**Backend:**
- Node.js with Express 4.18.2
- MongoDB with Mongoose 7.8.7
- JWT authentication
- File upload with Multer
- Document processing (PDF, DOCX)

**AI Services:**
- Google Gemini AI
- Transformers.js for NLP
- OpenAI integration
- Custom adaptive learning algorithms

## 📋 Prerequisites

Before installing Navigate, ensure you have the following installed:

- **Node.js** (version 16.0 or higher)
- **npm** (version 8.0 or higher)
- **MongoDB** (version 5.0 or higher)
- **Git**

### Required API Keys

You'll need to obtain the following API keys:

1. **Google Gemini API Key**: For AI-powered content generation
2. **OpenAI API Key**: For additional AI services
3. **MongoDB Connection String**: For database access

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Navigate - Copy"
```

### 2. Environment Configuration

Create `.env` files in each service directory:

#### Backend Environment (`backend/.env`)
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/navigate_db
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/navigate_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# AI Service Configuration
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development


```

#### AI Services Environment (`ai_services/.env`)
```env
# AI API Keys
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=3600

# Model Configuration
MODEL_TEMPERATURE=0.7
MAX_TOKENS=2048
```

### 3. Install Dependencies

#### Install Backend Dependencies
```bash
cd backend
npm install
```

#### Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

#### Install AI Services Dependencies
```bash
cd ../ai_services
npm install
```

### 4. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service:
   ```bash
   mongod
   ```
3. The application will automatically create the required collections

#### Option B: MongoDB Atlas (Recommended)
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get the connection string
4. Update the `MONGODB_URI` in your `.env` file

### 5. Start the Application

#### Development Mode

Open three terminal windows/tabs:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```
The backend server will start on `http://localhost:5000`

**Terminal 2 - Frontend Application:**
```bash
cd frontend
npm start
```
The frontend will start on `http://localhost:3000`

**Terminal 3 - AI Services (Optional - for development):**
```bash
cd ai_services
# AI services are integrated into the backend, but you can run tests here
npm test
```

#### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the built files using a web server like nginx or serve
```

## 🔧 Configuration

### Database Configuration

The application uses MongoDB with the following collections:
- `users` - User accounts and profiles
- `courses` - Course information
- `assessments` - Assessment definitions
- `submissions` - Student submissions
- `learningpaths` - Adaptive learning paths

### AI Service Configuration

Configure AI services in the respective environment files:

- **Temperature**: Controls AI response creativity (0.0-1.0)
- **Max Tokens**: Maximum response length
- **Cache TTL**: Cache timeout for AI responses

### File Upload Configuration

Configure file upload limits and paths:
- Maximum file size: 50MB
- Supported formats: PDF, DOCX, TXT

## 📝 Usage

### Getting Started

1. **Access the Application**: Open `http://localhost:3000` in your browser
2. **Create an Account**: Register as either an instructor or student
3. **Login**: Use your credentials to access the platform

### For Instructors

1. **Upload Syllabus**: Go to Course Management → Upload syllabus document
2. **Generate Assessments**: Use the Assessment Creation tool to generate questions
3. **Create Courses**: Set up courses and learning objectives
4. **Monitor Students**: Track student progress and performance

### For Students

1. **Enroll in Courses**: Browse and enroll in available courses
2. **Take Assessments**: Complete assessments and receive instant feedback
3. **Follow Learning Paths**: Use AI-recommended learning paths
4. **Track Progress**: Monitor your learning journey



### API Testing

Use the provided test files to verify API functionality:
```bash
cd backend
node test-assessment-api.js
node test-assessment-flow.js
node test-submission-flow.js
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill processes using ports 3000 or 5000
netstat -ano | findstr :3000
netstat -ano | findstr :5000
# Use the PID to kill the process
taskkill /PID <PID_NUMBER> /F
```

#### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure network access for MongoDB Atlas

#### AI API Issues
- Verify API keys are correct
- Check API rate limits
- Ensure sufficient API credits

#### File Upload Issues
- Check file size limits
- Verify upload directory permissions
- Ensure supported file formats

### Log Files

Application logs are available in:
- Backend: Console output and error logs
- Frontend: Browser console
- AI Services: Service-specific logs

### Environment Issues

If you encounter environment-related issues:
1. Verify all `.env` files are properly configured
2. Restart all services after environment changes
3. Check for typos in environment variable names

## 🔐 Security

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes and middleware

### File Security
- File type validation
- Size limits
- Secure upload handling

### API Security
- CORS configuration
- Rate limiting (recommended for production)
- Input validation and sanitization

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**: Configure production environment variables
2. **Database**: Set up production MongoDB instance
3. **Build Frontend**: Create production build
4. **Web Server**: Configure nginx or Apache
5. **Process Manager**: Use PM2 for Node.js processes
6. **SSL Certificate**: Implement HTTPS

### Docker Deployment (Optional)

Create Dockerfiles for each service and use Docker Compose for orchestration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the documentation
- Create an issue in the repository
- Contact the development team

## 🗺️ Roadmap

### Planned Features
- Real-time collaboration tools
- Advanced analytics dashboard
- Mobile application
- Integration with LMS platforms
- Multi-language support
- Voice-to-text assessment features

---

**Navigate** - Empowering education through intelligent technology 🎓
