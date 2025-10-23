/**
 * Example: How to Insert Data into ChromaDB
 * 
 * Run: npx tsx scripts/exampleDataInsertion.ts
 * 
 * This script demonstrates:
 * 1. Proper data types
 * 2. How to structure documents, metadata, and IDs
 * 3. Best practices
 */

import { addDocuments, initChromaDB, getCollectionStats, searchKeywordDefinition } from '../lib/chromaService';

// ============================================================================
// EXAMPLE 1: Simple Text Documents
// ============================================================================

const simpleExample = {
  // These are your actual text contents
  documents: [
    'Net Present Value (NPV) is a method used to evaluate the profitability of an investment. It calculates the present value of future cash flows.',
    'Return on Assets (ROA) measures how efficiently a company uses its assets to generate profit. Formula: Net Income / Total Assets.',
    'The Current Ratio is a liquidity ratio that measures a company\'s ability to pay short-term obligations. Formula: Current Assets / Current Liabilities.',
  ],
  
  // Metadata: Additional information about each document
  metadatas: [
    {
      topic: 'Net Present Value',
      category: 'Capital Budgeting',
      difficulty: 'intermediate',
      page: 215,
      source: 'CMA Study Guide',
      has_formula: true,
    },
    {
      topic: 'Return on Assets',
      category: 'Financial Ratios',
      difficulty: 'beginner',
      page: 185,
      source: 'CMA Study Guide',
      has_formula: true,
    },
    {
      topic: 'Current Ratio',
      category: 'Liquidity Ratios',
      difficulty: 'beginner',
      page: 168,
      source: 'CPA Financial Accounting',
      has_formula: true,
    },
  ],
  
  // IDs: Unique identifiers (must be unique!)
  ids: [
    'example-npv-1',
    'example-roa-1',
    'example-current-ratio-1',
  ],
};

// ============================================================================
// EXAMPLE 2: Structured Educational Content
// ============================================================================

interface EducationalDocument {
  id: string;
  content: string;
  metadata: {
    topic: string;
    category: string;
    keywords: string[];
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    page?: number;
    chapter?: string;
    source: string;
  };
}

const structuredExample: EducationalDocument[] = [
  {
    id: 'fa-001-cost-of-goods-sold',
    content: 'Cost of Goods Sold (COGS) represents the direct costs attributable to the production of goods sold by a company. The formula is: Beginning Inventory + Purchases - Ending Inventory = COGS. This is a crucial metric for determining gross profit.',
    metadata: {
      topic: 'Cost of Goods Sold',
      category: 'Cost Accounting',
      keywords: ['COGS', 'inventory', 'gross profit', 'cost accounting'],
      difficulty: 'beginner',
      page: 125,
      chapter: 'Chapter 5: Cost Management',
      source: 'CMA Cost Management Guide',
    },
  },
  {
    id: 'fa-002-break-even-analysis',
    content: 'Break-Even Analysis determines the point at which total revenue equals total costs. The break-even point in units is calculated as: Fixed Costs / Contribution Margin per Unit. This analysis helps businesses understand their profitability thresholds.',
    metadata: {
      topic: 'Break-Even Analysis',
      category: 'Cost Management',
      keywords: ['break-even', 'fixed costs', 'contribution margin', 'profitability'],
      difficulty: 'intermediate',
      page: 245,
      chapter: 'Chapter 8: Cost-Volume-Profit Analysis',
      source: 'CMA Cost Management Guide',
    },
  },
  {
    id: 'fa-003-dcf-valuation',
    content: 'Discounted Cash Flow (DCF) valuation is a method of valuing a project, company, or asset using the concepts of the time value of money. All future cash flows are estimated and discounted to give their present values. The discount rate typically represents the weighted average cost of capital (WACC).',
    metadata: {
      topic: 'DCF Valuation',
      category: 'Financial Analysis',
      keywords: ['DCF', 'valuation', 'discount rate', 'WACC', 'present value'],
      difficulty: 'advanced',
      page: 312,
      chapter: 'Chapter 12: Advanced Valuation Methods',
      source: 'CMA Financial Decision Making',
    },
  },
];

// ============================================================================
// EXAMPLE 3: Chunked Content (From Long Text)
// ============================================================================

const longText = `
Financial Statement Analysis is a comprehensive process of examining and analyzing a company's financial statements 
to make informed economic decisions. This involves reviewing the balance sheet, income statement, and cash flow statement.

The balance sheet provides a snapshot of a company's financial position at a specific point in time, showing assets, 
liabilities, and shareholders' equity. Assets represent what the company owns, liabilities represent what it owes, 
and equity represents the residual interest.

The income statement shows the company's financial performance over a period of time. It includes revenues, expenses, 
and the resulting net income or loss. Key metrics include gross profit margin, operating profit margin, and net profit margin.

The cash flow statement tracks the movement of cash through three main categories: operating activities, investing 
activities, and financing activities. This statement is crucial for assessing liquidity and financial flexibility.
`;

// Function to chunk long text
function chunkText(text: string, chunkSize: number = 200): string[] {
  const words = text.trim().split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    chunks.push(chunk);
  }
  
  return chunks;
}

const chunks = chunkText(longText, 150); // 150 words per chunk

const chunkedExample = chunks.map((chunk, index) => ({
  id: `fsa-intro-chunk-${index}`,
  content: chunk,
  metadata: {
    topic: 'Financial Statement Analysis',
    category: 'Financial Accounting',
    chunk_index: index,
    total_chunks: chunks.length,
    page: 45 + Math.floor(index / 2), // Estimate 2 chunks per page
    source: 'Financial Analysis Textbook',
  },
}));

// ============================================================================
// Main Function: Insert All Examples
// ============================================================================

async function insertExamples() {
  try {
    console.log('🚀 Starting example data insertion...\n');
    
    // Initialize ChromaDB
    await initChromaDB();
    console.log('✅ Connected to ChromaDB\n');
    
    // ========================================================================
    // Insert Example 1: Simple Documents
    // ========================================================================
    console.log('📝 Example 1: Inserting simple documents...');
    await addDocuments(
      simpleExample.documents,
      simpleExample.metadatas,
      simpleExample.ids
    );
    console.log(`   ✓ Inserted ${simpleExample.documents.length} documents\n`);
    
    // ========================================================================
    // Insert Example 2: Structured Content
    // ========================================================================
    console.log('📚 Example 2: Inserting structured educational content...');
    await addDocuments(
      structuredExample.map(doc => doc.content),
      structuredExample.map(doc => doc.metadata),
      structuredExample.map(doc => doc.id)
    );
    console.log(`   ✓ Inserted ${structuredExample.length} structured documents\n`);
    
    // ========================================================================
    // Insert Example 3: Chunked Content
    // ========================================================================
    console.log('✂️  Example 3: Inserting chunked content...');
    await addDocuments(
      chunkedExample.map(chunk => chunk.content),
      chunkedExample.map(chunk => chunk.metadata),
      chunkedExample.map(chunk => chunk.id)
    );
    console.log(`   ✓ Inserted ${chunkedExample.length} chunks\n`);
    
    // ========================================================================
    // Get Collection Statistics
    // ========================================================================
    const stats = await getCollectionStats();
    console.log('📊 Collection Statistics:');
    console.log(`   - Collection: ${stats.collection_name}`);
    console.log(`   - Total documents: ${stats.document_count}`);
    console.log(`   - Status: ${stats.status}\n`);
    
    // ========================================================================
    // Test Searches
    // ========================================================================
    console.log('🔍 Testing semantic search...\n');
    
    const testQueries = [
      'Net Present Value',
      'profitability ratios',
      'cash flow analysis',
    ];
    
    for (const query of testQueries) {
      console.log(`Query: "${query}"`);
      const result = await searchKeywordDefinition(query);
      
      if (result.relevant_chunks.length > 0) {
        console.log(`   ✓ Found ${result.relevant_chunks.length} results`);
        console.log(`   → ${result.relevant_chunks[0].substring(0, 100)}...\n`);
      }
    }
    
    // ========================================================================
    // Summary
    // ========================================================================
    console.log('✅ All examples inserted successfully!\n');
    console.log('💡 Key Takeaways:');
    console.log('   1. documents = array of text strings');
    console.log('   2. metadatas = array of objects with any properties');
    console.log('   3. ids = array of unique string identifiers');
    console.log('   4. All three arrays must have the same length');
    console.log('   5. Chunk long texts for better search results\n');
    
    console.log('🎯 Next Steps:');
    console.log('   - Check CHROMADB_SETUP.md for production setup');
    console.log('   - See PDF_TO_CHROMADB_GUIDE.md for PDF processing');
    console.log('   - Run: npm run test-chroma to test searches\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Make sure ChromaDB is running:');
    console.log('   docker-compose up -d\n');
  }
}

// ============================================================================
// Helper Function: Display Data Structure
// ============================================================================

function displayDataStructure() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 CHROMADB DATA STRUCTURE EXPLAINED');
  console.log('='.repeat(70) + '\n');
  
  console.log('Required Format:');
  console.log(`
  {
    documents: string[],    // The actual text content
    metadatas: object[],    // Additional information (optional but recommended)
    ids: string[]          // Unique identifiers (required)
  }
  `);
  
  console.log('Example:');
  console.log(`
  {
    documents: [
      "Financial analysis is...",
      "Cost accounting involves..."
    ],
    metadatas: [
      { topic: "Financial Analysis", page: 45 },
      { topic: "Cost Accounting", page: 125 }
    ],
    ids: [
      "fa-chapter-1",
      "ca-chapter-5"
    ]
  }
  `);
  
  console.log('Rules:');
  console.log('  ✓ All arrays must have same length');
  console.log('  ✓ IDs must be unique');
  console.log('  ✓ Documents must be strings');
  console.log('  ✓ Metadata can be any JSON-serializable object');
  console.log('  ✓ Recommended: 200-1000 words per document\n');
  
  console.log('='.repeat(70) + '\n');
}

// Run the example
if (require.main === module) {
  displayDataStructure();
  insertExamples();
}

export { simpleExample, structuredExample, chunkedExample, chunkText };

