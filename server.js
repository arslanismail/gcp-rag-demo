require('dotenv').config();
const express = require('express');
const { ChatVertexAI, VertexAIEmbeddings } = require('@langchain/google-vertexai');
const { MemoryVectorStore } = require('langchain/vectorstores/memory');
const { Document } = require('langchain/document');
const products = require('./data/products.json');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

// Initialize LangChain components
const embeddings = new VertexAIEmbeddings({
  model: 'text-embedding-004',
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1'
});

const llm = new ChatVertexAI({
  model: 'gemini-2.5-flash',
  temperature: 1.0,
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1'
});

let vectorStore;
let qaChain;

// Initialize RAG chain
async function initializeRAG() {
  console.log('Starting RAG initialization...');
  
  try {
    // Convert products to LangChain documents
    console.log(`Converting ${products.length} products to documents...`);
    const docs = products.map(product => 
      new Document({
        pageContent: `${product.name}: ${product.description}. Category: ${product.category}. Price: $${product.price}`,
        metadata: { id: product.id, ...product }
      })
    );

    console.log('Creating vector store with embeddings...');
    // Create vector store
    vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
    
    console.log('Setting up retriever...');
    // Simple flag to indicate initialization is complete
    qaChain = true;

    console.log('RAG chain initialized successfully!');
  } catch (error) {
    console.error('RAG initialization failed:', error);
    throw error;
  }
}

// API Routes
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    let products = [];
    let messages;
    
    if (!qaChain || !vectorStore) {
      // RAG not initialized - use model without product context
      messages = [
        { role: 'system', content: 'You are a helpful AI assistant. Answer questions clearly and concisely.' },
        { role: 'user', content: query }
      ];
    } else {
      // RAG initialized - use product context with system prompt
      const similarDocs = await vectorStore.similaritySearch(query, 3);
      products = similarDocs.map(doc => ({
        ...doc.metadata,
        similarity: 0.85
      }));
      
      const context = products.map(p => `${p.name}: ${p.description} ($${p.price})`).join('\n');
      
      messages = [
        { 
          role: 'system', 
          content: `You are a helpful product recommendation assistant. Use the following product catalog to answer user questions about products. Always be helpful and provide specific product recommendations when relevant.\n\nAvailable Products:\n${context}` 
        },
        { role: 'user', content: query }
      ];
    }
    
    const llmResponse = await llm.invoke(messages);
    
    // Handle different response formats
    let responseText = 'No response generated';
    if (typeof llmResponse === 'string') {
      responseText = llmResponse;
    } else if (llmResponse && llmResponse.content) {
      responseText = llmResponse.content;
    } else if (llmResponse && llmResponse.text) {
      responseText = llmResponse.text;
    }
    
    res.json({ 
      products: products,
      response: responseText,
      ragInitialized: !!(qaChain && vectorStore)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      products: [],
      response: 'Search encountered an error',
      ragInitialized: false
    });
  }
});

app.post('/api/init', async (req, res) => {
  try {
    await initializeRAG();
    res.json({ message: 'RAG chain initialized successfully with LangChain' });
  } catch (error) {
    console.error('Initialization error:', error);
    res.status(500).json({ error: 'Initialization failed' });
  }
});

app.listen(port, () => {
  console.log(`LangChain RAG Demo running on port ${port}`);
  console.log('Visit /api/init to initialize RAG chain');
});