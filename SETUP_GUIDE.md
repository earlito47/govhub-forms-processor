# GovHub Forms Processor - Setup Guide

## 📦 What You Have

A complete, production-ready Node.js/TypeScript service with:
- ✅ 54 files across full project structure
- ✅ AI-powered form field detection and mapping
- ✅ Redis caching and job queuing
- ✅ Complete API with 5 endpoints
- ✅ Docker & Render deployment configs
- ✅ Comprehensive error handling and logging
- ✅ Git repository initialized

## 🚀 Quick Start (5 Minutes)

### Step 1: Push to GitHub

```bash
cd govhub-forms-processor

# Create repo on GitHub (using GitHub CLI)
gh repo create govhub-forms-processor --private --source=. --remote=origin

# Or manually create on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/govhub-forms-processor.git

# Push code
git push -u origin master
```

### Step 2: Deploy to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml`
5. Add environment variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: From Supabase dashboard
   - `GEMINI_API_KEY`: From Google AI Studio
   - `ALLOWED_ORIGINS`: Your GovHub domain(s)
6. Click "Create Web Service"

**Your service will be live in ~5 minutes!**

### Step 3: Connect to Main GovHub App

In your main GovHub repository:

1. Add to `.env`:
```bash
VITE_FORMS_PROCESSOR_URL=https://govhub-forms-processor.onrender.com
```

2. Add to Supabase Edge Functions secrets (via dashboard):
```bash
FORMS_PROCESSOR_URL=https://govhub-forms-processor.onrender.com
FORMS_PROCESSOR_API_KEY=<from-render-dashboard>
```

3. Copy `forms-client.ts` to your Edge Functions shared folder
4. Use in your Edge Functions (see README for examples)

## 🧪 Local Development Setup

### Prerequisites
- Node.js 18+
- Redis (via Docker)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# 3. Copy and configure environment
cp .env.example .env
# Edit .env with your actual values

# 4. Run development server
npm run dev

# Server will start on http://localhost:3001
```

### Test Health Check
```bash
curl http://localhost:3001/health
```

### Test Field Detection (requires API key)
```bash
curl -X POST http://localhost:3001/api/detect-fields \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "formId": "test-123",
    "pdfUrl": "https://example.com/form.pdf"
  }'
```

## 📊 Project Structure Overview

```
govhub-forms-processor/
├── src/
│   ├── index.ts              # Express server entry point
│   ├── routes/               # API endpoints (5 routes)
│   ├── services/             # Business logic
│   │   ├── pdf-parser/       # PDF field detection
│   │   ├── template-matcher/ # Form template matching
│   │   ├── data-extractor/   # Extract from library
│   │   ├── field-mapper/     # AI mapping (Gemini)
│   │   ├── pdf-generator/    # Fill PDFs
│   │   └── validator/        # Validation logic
│   ├── models/               # TypeScript types
│   ├── utils/                # Logger, cache, queue, errors
│   └── config/               # Configuration & templates
├── Dockerfile                # Container config
├── docker-compose.yml        # Local Docker setup
├── render.yaml               # Render deployment
└── README.md                 # Full documentation
```

## 🔑 Key Components

### 1. PDF Parser Service
- **Location**: `src/services/pdf-parser/`
- **Purpose**: Detects fields in flat PDFs
- **Tech**: pdf-lib, pdf-parse
- **Output**: List of detected fields with bounding boxes

### 2. Field Mapper Service
- **Location**: `src/services/field-mapper/`
- **Purpose**: Maps fields to user data using AI
- **Tech**: Google Gemini 2.0 Flash
- **Output**: Field mappings with confidence scores

### 3. Template Matcher
- **Location**: `src/services/template-matcher/`
- **Purpose**: Recognizes known forms (SF-330, SF-254)
- **Templates**: `src/config/templates/`
- **Extensible**: Easy to add new templates

### 4. Validator
- **Location**: `src/services/validator/`
- **Purpose**: Validates filled forms
- **Rules**: Type checking, format validation, cross-field validation

## 🛠️ Customization

### Adding a New Form Template

1. Create template JSON in `src/config/templates/`:
```json
{
  "id": "custom-form-v1",
  "name": "Your Form Name",
  "fieldDefinitions": [...]
}
```

2. Import in `src/services/template-matcher/template-registry.ts`:
```typescript
import customForm from '../../config/templates/custom-form.json';

private loadTemplates() {
  const templates = [sf330, sf254, customForm, generic];
  // ...
}
```

### Adjusting AI Prompts

Edit `src/services/field-mapper/index.ts`:
```typescript
private buildMappingPrompt(...) {
  // Customize prompt for better results
}
```

### Adding Validation Rules

Edit `src/models/ValidationRule.ts`:
```typescript
export const CommonValidationRules = {
  // Add your custom rule here
  CUSTOM_RULE: { ... }
}
```

## 🐛 Troubleshooting

### "Failed to parse PDF"
- **Cause**: Corrupted or encrypted PDF
- **Solution**: Check PDF is valid, not password-protected

### "AI mapping failed"
- **Cause**: Invalid Gemini API key or rate limit
- **Solution**: Verify API key, check quotas

### "Redis connection failed"
- **Cause**: Redis not running
- **Solution**: Start Redis via Docker or connect to cloud Redis

### "Unauthorized"
- **Cause**: Missing or invalid API key
- **Solution**: Ensure `X-API-Key` header matches `API_KEY` env var

## 📈 Scaling Considerations

### Current Setup (Good for 0-100 forms/day)
- Single Render instance
- Starter Redis plan
- Default queue settings

### High Volume (100-1000 forms/day)
1. Upgrade Render to Standard plan
2. Increase `MAX_CONCURRENT_JOBS` to 10-20
3. Use dedicated Redis (e.g., Redis Cloud)
4. Add more Render instances with load balancer

### Enterprise (1000+ forms/day)
1. Kubernetes deployment
2. Separate workers for queue processing
3. Distributed Redis cluster
4. CDN for PDF caching
5. Database connection pooling

## 🔒 Security Checklist

- ✅ API key authentication on all endpoints
- ✅ CORS restricted to allowed origins
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet.js security headers
- ✅ Input validation on all endpoints
- ✅ Environment variables for secrets
- ✅ HTTPS in production (via Render)

## 📝 Next Steps

1. **Deploy**: Follow Quick Start above
2. **Test**: Use health check and test endpoints
3. **Integrate**: Connect to main GovHub app
4. **Monitor**: Watch Render logs for errors
5. **Iterate**: Add custom templates as needed
6. **Scale**: Upgrade resources as usage grows

## 🆘 Getting Help

- **Documentation**: See README.md
- **API Docs**: See README.md API Endpoints section
- **Architecture**: See original design docs
- **Issues**: GitHub Issues (once repo is created)

## 🎉 You're Ready!

Your forms processor is production-ready with:
- AI-powered field detection
- Smart data mapping
- Complete validation
- Scalable architecture
- Comprehensive error handling
- Full documentation

Just deploy and connect to your main app!
