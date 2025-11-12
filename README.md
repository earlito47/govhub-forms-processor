# GovHub Forms Processor

AI-powered form filling service for GovHub platform. Automatically detects fields in flat PDF forms and fills them using data from your document library.

## 🚀 Features

- **Automated Field Detection**: Detects form fields in flat (non-fillable) PDFs using computer vision and layout analysis
- **Template Matching**: Recognizes common government forms (SF-330, SF-254) for optimized processing
- **AI-Powered Mapping**: Uses Google Gemini to intelligently map library data to form fields
- **Smart Validation**: Validates filled forms with type-specific and cross-field rules
- **Background Processing**: Queued job processing for concurrent form handling
- **Caching**: Redis-based caching for improved performance

## 📋 Prerequisites

- Node.js >= 18.0.0
- Redis (for caching and queuing)
- Supabase account
- Google Gemini API key

## 🛠️ Installation

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/your-org/govhub-forms-processor.git
cd govhub-forms-processor
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your values
```

4. Start Redis (if running locally):
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

5. Run in development mode:
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment | No | development |
| `SUPABASE_URL` | Supabase project URL | Yes | - |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Yes | - |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `API_KEY` | API authentication key | Yes | - |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | Yes | - |
| `REDIS_URL` | Redis connection URL | No | - |
| `LOG_LEVEL` | Logging level | No | info |
| `MAX_FILE_SIZE_MB` | Max PDF size in MB | No | 50 |
| `PROCESSING_TIMEOUT_MS` | Processing timeout | No | 300000 |
| `MAX_CONCURRENT_JOBS` | Max concurrent jobs | No | 5 |

## 📡 API Endpoints

All API endpoints require `X-API-Key` header for authentication.

### Health Check

```
GET /health
```

No authentication required.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-12T10:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "redis": true,
    "database": true,
    "ai": true
  }
}
```

### Detect Fields

```
POST /api/detect-fields
```

Detects form fields in a PDF.

**Request Body:**
```json
{
  "formId": "uuid",
  "pdfUrl": "https://storage.url/form.pdf"
}
```

**Response:**
```json
{
  "formId": "uuid",
  "fields": [
    {
      "id": "field_1",
      "name": "applicant_name",
      "type": "text",
      "label": "Applicant Name",
      "boundingBox": { "page": 1, "x": 100, "y": 200, "width": 300, "height": 20 },
      "required": true,
      "confidence": 0.85
    }
  ],
  "metadata": {
    "pageCount": 2,
    "title": "Form Title"
  },
  "templateMatch": {
    "templateId": "sf-330-v1",
    "confidence": 0.92
  }
}
```

### Extract Data

```
POST /api/extract-data
```

Extracts data from user's library documents.

**Request Body:**
```json
{
  "formId": "uuid",
  "userId": "uuid",
  "libraryDocIds": ["doc_id_1", "doc_id_2"]
}
```

**Response:**
```json
{
  "formId": "uuid",
  "candidateData": {
    "company_name": "ACME Corp",
    "emails": ["contact@acme.com"],
    "phones": ["555-0100"]
  }
}
```

### Map Fields

```
POST /api/map-fields
```

Maps detected fields to candidate data using AI.

**Request Body:**
```json
{
  "formId": "uuid",
  "fields": [...],
  "candidateData": {...}
}
```

**Response:**
```json
{
  "formId": "uuid",
  "mappings": [
    {
      "fieldId": "field_1",
      "fieldName": "applicant_name",
      "suggestedValue": "ACME Corp",
      "confidence": 0.95,
      "requiresManualReview": false
    }
  ],
  "autoFilled": {
    "applicant_name": "ACME Corp"
  },
  "manualRequired": []
}
```

### Populate Form

```
POST /api/populate-form
```

Fills the PDF with mapped values.

**Request Body:**
```json
{
  "formId": "uuid",
  "fieldMappings": [...]
}
```

**Response:**
```json
{
  "formId": "uuid",
  "success": true,
  "filledPath": "forms/user_id/form_filled.pdf"
}
```

### Validate Form

```
POST /api/validate-form
```

Validates filled form fields.

**Request Body:**
```json
{
  "formId": "uuid",
  "fields": [...]
}
```

**Response:**
```json
{
  "formId": "uuid",
  "errors": [
    {
      "fieldId": "email_field",
      "fieldName": "email",
      "errorType": "format",
      "message": "Invalid email format",
      "severity": "error"
    }
  ],
  "isValid": false
}
```

## 🚢 Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Render

1. Connect your GitHub repository to Render
2. Render will automatically detect `render.yaml`
3. Add environment variables in Render dashboard
4. Deploy!

The service will be available at: `https://govhub-forms-processor.onrender.com`

### Railway / Fly.io

Similar deployment process - add environment variables and deploy.

## 🔗 Connecting to Main GovHub App

### 1. Update Environment Variables

In your main GovHub app:
```bash
VITE_FORMS_PROCESSOR_URL=https://govhub-forms-processor.onrender.com
```

In Supabase Edge Functions:
```bash
FORMS_PROCESSOR_URL=https://govhub-forms-processor.onrender.com
FORMS_PROCESSOR_API_KEY=your-secret-key
```

### 2. Use the Client

```typescript
// In your Edge Function
import { formsClient } from '../_shared/forms-client.ts';

const result = await formsClient.detectFields({
  formId: 'uuid',
  pdfUrl: 'https://...',
});
```

## 📊 Monitoring

### Logs

```bash
# Development
npm run dev

# Production (Docker)
docker-compose logs -f app

# Production (Render)
# View in Render dashboard
```

### Health Check

```bash
curl https://your-service.onrender.com/health
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## 🛡️ Security

- All API endpoints require `X-API-Key` authentication
- CORS configured for specific origins only
- Rate limiting: 100 requests per 15 minutes per IP
- Helmet.js for security headers
- Input validation on all endpoints

## 📝 Development

### Project Structure

```
src/
├── routes/           # API endpoints
├── services/         # Business logic
│   ├── pdf-parser/   # PDF processing
│   ├── template-matcher/  # Template matching
│   ├── data-extractor/    # Data extraction
│   ├── field-mapper/      # AI mapping
│   ├── pdf-generator/     # PDF generation
│   └── validator/         # Validation
├── models/           # TypeScript types
├── utils/            # Utilities
├── config/           # Configuration
└── index.ts          # Server entry point
```

### Adding a New Template

1. Create template JSON in `src/config/templates/`:
```json
{
  "id": "your-form-v1",
  "name": "Your Form Name",
  "formIdentifiers": [...],
  "fieldDefinitions": [...]
}
```

2. Register in `template-registry.ts`

3. Test with sample PDF

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT

## 🆘 Support

For issues and questions:
- GitHub Issues: https://github.com/your-org/govhub-forms-processor/issues
- Email: support@govhub.com

## 🗺️ Roadmap

- [ ] OCR support for scanned documents
- [ ] Advanced table field detection
- [ ] Multi-page form support
- [ ] Signature field handling
- [ ] Batch processing API
- [ ] WebSocket for real-time updates
- [ ] Form template editor UI
- [ ] Enhanced validation rules engine
- [ ] Integration with more AI models
- [ ] Performance optimization with caching strategies
