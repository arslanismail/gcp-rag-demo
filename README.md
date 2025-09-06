# GCP RAG Application Demo

## Architecture Overview

### Service Selection & Reasoning

**Vertex AI Gemini 2.5 Flash**
- Latest stable model with improved performance
- Free tier available with generous limits
- Fast response times, perfect for demos

**Vertex AI Text Embeddings (text-embedding-004)**
- Latest embedding model with improved accuracy
- Cost-effective pricing
- High-dimensional vectors for better semantic search

**Vertex AI Vector Search**
- Optimized for high-dimensional vector similarity search
- Advanced filtering and hybrid search capabilities
- Cost-effective at scale with sub-second query latency

**Cloud Run**
- Pay-per-use pricing model (free tier: 2M requests/month)
- Automatic scaling to zero when not in use
- Perfect for demo deployments

**LangChain.js**
- Simplified RAG workflow implementation
- Excellent GCP integrations and abstractions
- Active community and comprehensive documentation

## Requirements

### GCP Setup
- GCP Account (free tier sufficient)
- Project with billing enabled (required for Vertex AI)
- APIs to enable:
  - Vertex AI API
  - Cloud Run API

### Local Development
- Node.js 18+
- GCP CLI installed and authenticated
- Git

### Installation Commands
```bash
# Install GCP CLI
curl https://sdk.cloud.google.com | bash

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Set default region (recommended)
gcloud config set compute/region us-central1

# Set up Application Default Credentials with proper scopes
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform

# Enable APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable run.googleapis.com
```

## Cost Estimation (Demo Usage)
- Vertex AI Gemini 2.5 Flash: Free tier (15 requests/minute)
- Text Embeddings (text-embedding-004): ~$0.01 for 10K product embeddings
- Vector Search: ~$0.10/month for small index
- Cloud Run: Free tier sufficient
- **Total Monthly Cost: <$1**

## Module 1: Basic RAG Interface
Simple web interface demonstrating:
- Product search using vector similarity
- Context-aware responses using Gemini 2.5 Flash
- Mock product dataset (10 items)

## Model Configuration
- **Chat Model**: `gemini-2.5-flash` (latest stable)
- **Embedding Model**: `text-embedding-004` (latest)
- **Region**: `us-central1` (recommended for best availability)

## Step-by-Step Guide

### What is RAG (Retrieval-Augmented Generation)?
RAG combines information retrieval with text generation. Instead of relying solely on the AI model's training data, RAG:
1. **Retrieves** relevant information from your data
2. **Augments** the AI prompt with this context
3. **Generates** more accurate, contextual responses

### How This Demo Works

#### 1. Data Preparation (`data/products.json`)
- Contains 10 sample products with name, description, category, and price
- Each product becomes a "document" that can be searched

#### 2. Vector Embeddings Creation
```javascript
// Convert text to numerical vectors using Vertex AI
const embeddings = new VertexAIEmbeddings({
  model: 'text-embedding-004'  // Google's latest embedding model
});
```
**What happens**: Each product description is converted into a 768-dimensional vector that captures semantic meaning.

#### 3. Vector Storage
```javascript
// Store vectors in memory for similarity search
vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
```
**What happens**: All product vectors are stored in memory, creating a searchable index.

#### 4. User Query Processing
When user searches "wireless headphones":
1. **Query Embedding**: User query is converted to vector using same embedding model
2. **Similarity Search**: Find 3 most similar product vectors
3. **Context Retrieval**: Get original product data for similar items

#### 5. AI Response Generation (System Prompt Approach)
```javascript
// System prompt with product context
const messages = [
  { 
    role: 'system', 
    content: `You are a product recommendation assistant. Available Products:\n${context}` 
  },
  { role: 'user', content: query }
];
const response = await llm.invoke(messages);
```
**What happens**: Gemini receives system instructions with product catalog, then processes user query separately for better context management.

### Complete Setup Instructions

#### Step 1: GCP Account Setup
1. Create GCP account at https://cloud.google.com
2. Create new project or use existing one
3. Enable billing (required for Vertex AI)

#### Step 2: Install GCP CLI
```bash
# macOS
brew install google-cloud-sdk

# Linux/Windows
curl https://sdk.cloud.google.com | bash
```

#### Step 3: Authentication & Configuration
```bash
# Login to GCP
gcloud auth login

# Set your project ID (replace with your actual project ID)
gcloud config set project YOUR_PROJECT_ID

# Set default region
gcloud config set compute/region us-central1

# Set up application credentials
gcloud auth application-default login --scopes=https://www.googleapis.com/auth/cloud-platform
```

#### Step 4: Enable Required APIs
```bash
# Enable Vertex AI API (for embeddings and Gemini)
gcloud services enable aiplatform.googleapis.com

# Enable Cloud Run API (for deployment)
gcloud services enable run.googleapis.com
```

#### Step 5: Clone and Setup Project
```bash
# Clone the repository
git clone <your-repo-url>
cd gcp-ai

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### Step 6: Configure Environment
Edit `.env` file:
```bash
GOOGLE_CLOUD_PROJECT=your-project-id
PORT=3000
```

#### Step 7: Run the Application
```bash
# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

#### Step 8: Initialize RAG System
1. Open browser to `http://localhost:3000`
2. Click "Initialize RAG" button
3. Wait for "RAG chain initialized successfully" message

#### Step 9: Test the System
1. Type queries like:
   - "wireless headphones"
   - "yoga equipment"
   - "smart home devices"
   - "budget under $50"
2. Observe how the system:
   - Finds similar products
   - Provides contextual AI responses

### API Endpoints Explained

#### `POST /api/init`
**Purpose**: Initialize the RAG system
**What it does**:
1. Loads product data from `data/products.json`
2. Converts each product to LangChain Document format
3. Creates embeddings for all products using `text-embedding-004`
4. Stores vectors in memory for fast similarity search

#### `POST /api/search`
**Purpose**: Process user queries and return results
**Input**: `{ "query": "user search text" }`
**Process**:
1. Convert user query to vector using same embedding model
2. Find 3 most similar products using cosine similarity
3. Extract product details for context
4. Create system prompt with product catalog
5. Send system + user messages to Gemini 2.5 Flash
6. Return both similar products and AI-generated response

**Output**:
```json
{
  "products": [/* array of similar products */],
  "response": "AI-generated contextual response"
}
```

### Key Concepts Explained

#### Vector Embeddings
- **What**: Numerical representations of text that capture semantic meaning
- **Why**: Allows mathematical similarity comparison between texts
- **Example**: "wireless headphones" and "bluetooth earbuds" have similar vectors

#### Similarity Search
- **Method**: Cosine similarity between query vector and stored vectors
- **Result**: Products with highest similarity scores (0-1 range)
- **Benefit**: Finds semantically related items, not just keyword matches

#### System Prompt Architecture
- **System Message**: Contains product catalog and assistant role definition
- **User Message**: Contains only the user's actual query
- **Benefits**: 
  - Cleaner separation of context and user input
  - More efficient processing
  - Better conversation flow
  - Industry standard approach

#### Context Augmentation
- **Process**: Relevant products are added to the system prompt as context
- **Benefit**: AI responses are grounded in actual available data
- **Result**: More accurate, helpful, and specific answers

### Troubleshooting

#### Common Issues
1. **404 Model Not Found**: Check model names in `server.js`
2. **Authentication Error**: Run `gcloud auth application-default login`
3. **API Not Enabled**: Run the `gcloud services enable` commands
4. **Project ID Wrong**: Check `.env` file and GCP console

#### Verify Setup
```bash
# Check current project
gcloud config get-value project

# Check enabled APIs
gcloud services list --enabled

# Test authentication
gcloud auth list
```

### Architecture Improvements Implemented

#### System Prompt Approach
- **Better Context Management**: Product catalog in system message, not user prompt
- **Cleaner Architecture**: Clear separation between system instructions and user queries
- **Industry Standard**: Follows best practices for RAG applications
- **Scalable**: Easy to extend system instructions without affecting user experience

#### Graceful Degradation
- **Uninitialized RAG**: Works as regular AI assistant
- **Initialized RAG**: Enhanced with product knowledge
- **User Feedback**: Clear indicators of system state

### Next Steps
- Add conversation memory for multi-turn chats
- Implement dynamic context (only relevant products in system prompt)
- Add more products to `data/products.json`
- Experiment with different embedding models
- Try different Gemini model parameters (temperature, etc.)
- Deploy to Cloud Run for production use