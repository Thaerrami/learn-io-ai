import { Question, UserProfile } from './types';

// Mock Question Bank Data
export const questionBankData: Question[] = [
  {
    id: 'q1',
    topic_id: 'financial-analysis',
    original_question: 'A company has a beginning inventory of $50,000, purchases of $200,000, and an ending inventory of $45,000. What is the cost of goods sold?',
    correct_answer: '$205,000',
    explanation: 'Cost of Goods Sold = Beginning Inventory + Purchases - Ending Inventory. Therefore: $50,000 + $200,000 - $45,000 = $205,000',
    pattern_type: 'numerical_calculation',
    difficulty_level: 'beginner',
    options: ['$195,000', '$205,000', '$215,000', '$255,000']
  },
  {
    id: 'q2',
    topic_id: 'financial-analysis',
    original_question: 'XYZ Corporation is considering investing in a new production line. The project requires an initial investment of $500,000 and is expected to generate cash flows of $150,000 annually for 5 years. If the discount rate is 10%, should the company proceed with the investment based on NPV analysis?',
    correct_answer: 'Yes, the NPV is positive',
    explanation: 'Using NPV formula: NPV = Σ(Cash Flow / (1+r)^t) - Initial Investment. The present value of cash flows ($568,618) exceeds the initial investment ($500,000), resulting in a positive NPV of $68,618. Therefore, the company should proceed with the investment.',
    pattern_type: 'scenario_analysis',
    difficulty_level: 'intermediate',
    options: ['Yes, the NPV is positive', 'No, the NPV is negative', 'Cannot determine without IRR', 'Need more information']
  },
  {
    id: 'q3',
    topic_id: 'cost-accounting',
    original_question: 'A manufacturing company produced 10,000 units with total manufacturing costs of $250,000. Fixed costs were $100,000. What is the variable cost per unit?',
    correct_answer: '$15',
    explanation: 'Variable Cost Per Unit = (Total Manufacturing Costs - Fixed Costs) / Number of Units. Therefore: ($250,000 - $100,000) / 10,000 = $15 per unit',
    pattern_type: 'numerical_calculation',
    difficulty_level: 'beginner',
    options: ['$10', '$15', '$25', '$35']
  },
  {
    id: 'q4',
    topic_id: 'cost-accounting',
    original_question: 'ABC Manufacturing uses job-order costing. Job #305 was completed in March 2024. The job required $12,000 in direct materials, $8,000 in direct labor, and overhead is applied at 150% of direct labor cost. The customer requested rush delivery, adding $2,000 to the cost. What is the total cost of Job #305?',
    correct_answer: '$34,000',
    explanation: 'Total Job Cost = Direct Materials + Direct Labor + Applied Overhead + Additional Costs. Overhead = $8,000 × 150% = $12,000. Total = $12,000 + $8,000 + $12,000 + $2,000 = $34,000',
    pattern_type: 'scenario_analysis',
    difficulty_level: 'intermediate',
    options: ['$32,000', '$34,000', '$36,000', '$38,000']
  },
  {
    id: 'q5',
    topic_id: 'financial-analysis',
    original_question: 'What is the primary purpose of the Statement of Cash Flows?',
    correct_answer: 'To show how cash was generated and used during the period',
    explanation: 'The Statement of Cash Flows provides information about cash receipts and payments during a specific period, categorized into operating, investing, and financing activities. This helps users understand the company\'s liquidity and cash management.',
    pattern_type: 'pure_recall',
    difficulty_level: 'beginner',
    options: [
      'To show profitability of the company',
      'To show how cash was generated and used during the period',
      'To display the company\'s assets and liabilities',
      'To calculate earnings per share'
    ]
  }
];

// Mock User Profiles
export const mockUserProfiles: UserProfile[] = [
  {
    user_id: 'user1',
    performance_level: 'beginner',
    completed_topics: [],
    strengths: [],
    weaknesses: ['financial-analysis', 'cost-accounting']
  },
  {
    user_id: 'user2',
    performance_level: 'intermediate',
    completed_topics: ['financial-analysis'],
    strengths: ['financial-analysis'],
    weaknesses: ['cost-accounting']
  },
  {
    user_id: 'user3',
    performance_level: 'advanced',
    completed_topics: ['financial-analysis', 'cost-accounting'],
    strengths: ['financial-analysis', 'cost-accounting'],
    weaknesses: []
  }
];

// Mock Chapter Data
export const mockChapters = [
  {
    chapter_id: 'ch1',
    chapter_name: 'Financial Statement Analysis',
    topic_ids: ['financial-analysis']
  },
  {
    chapter_id: 'ch2',
    chapter_name: 'Cost Accounting Fundamentals',
    topic_ids: ['cost-accounting']
  },
  {
    chapter_id: 'ch3',
    chapter_name: 'Budgeting and Forecasting',
    topic_ids: ['budgeting']
  }
];

// Mock PDF Chunks for RAG (simulating vector database)
export const mockPDFChunks: Record<string, string[]> = {
  'net present value': [
    'Net Present Value (NPV) is a financial metric used to evaluate the profitability of an investment. It represents the difference between the present value of cash inflows and outflows over a period of time. A positive NPV indicates that the projected earnings exceed the anticipated costs, making the investment favorable.',
    'The NPV formula is: NPV = Σ[CF_t / (1+r)^t] - Initial Investment, where CF_t is the cash flow at time t, r is the discount rate, and t is the time period.',
    'NPV is considered one of the most reliable methods for capital budgeting decisions because it accounts for the time value of money and provides a dollar amount that can be directly interpreted as value creation.'
  ],
  'cost of goods sold': [
    'Cost of Goods Sold (COGS) represents the direct costs attributable to the production of goods sold by a company. This includes the cost of materials and direct labor used to create the product.',
    'The basic formula for COGS is: Beginning Inventory + Purchases - Ending Inventory = Cost of Goods Sold. This calculation is fundamental in determining gross profit.',
    'COGS is reported on the income statement and is subtracted from revenue to calculate gross profit. It is a critical metric for analyzing a company\'s operational efficiency.'
  ],
  'variable cost': [
    'Variable costs are expenses that change in proportion to the production volume or activity level. Unlike fixed costs, which remain constant, variable costs increase as production increases and decrease as production decreases.',
    'Common examples of variable costs include raw materials, direct labor, and sales commissions. Understanding variable costs is essential for break-even analysis and contribution margin calculations.',
    'The variable cost per unit is calculated by dividing total variable costs by the number of units produced. This metric helps in pricing decisions and profitability analysis.'
  ],
  'overhead': [
    'Manufacturing overhead consists of all indirect costs associated with production that cannot be directly traced to specific products. This includes indirect materials, indirect labor, utilities, depreciation, and factory rent.',
    'Overhead is typically applied to products using a predetermined overhead rate, which is calculated by dividing estimated total overhead costs by an allocation base (such as direct labor hours or machine hours).',
    'Proper overhead allocation is crucial for accurate product costing and pricing decisions in manufacturing environments.'
  ],
  'statement of cash flows': [
    'The Statement of Cash Flows is one of the three primary financial statements and provides detailed information about a company\'s cash inflows and outflows during a specific period.',
    'It is divided into three sections: Operating Activities (cash from normal business operations), Investing Activities (cash from buying/selling long-term assets), and Financing Activities (cash from debt, equity, and dividends).',
    'This statement is essential for assessing a company\'s liquidity, financial flexibility, and overall financial health, as it shows the actual movement of cash rather than accrual-based profits.'
  ]
};

