/**
 * Helper script to guide PDF to text conversion
 * Run: node scripts/pdf-to-text-helper.js
 */

const fs = require('fs');
const path = require('path');

console.log('📄 PDF to Text Conversion Helper\n');

// Check for PDF files in samples directory
const samplesDir = path.join(process.cwd(), 'app', 'samples');

if (!fs.existsSync(samplesDir)) {
  console.log('❌ app/samples directory not found. Creating it...');
  fs.mkdirSync(samplesDir, { recursive: true });
  console.log('✅ Created app/samples directory\n');
}

const files = fs.readdirSync(samplesDir);
const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
const txtFiles = files.filter(file => file.toLowerCase().endsWith('.txt'));

console.log(`📊 Current Status:`);
console.log(`   📁 Directory: ${samplesDir}`);
console.log(`   📄 PDF files found: ${pdfFiles.length}`);
console.log(`   📝 Text files found: ${txtFiles.length}\n`);

if (pdfFiles.length > 0) {
  console.log('🔍 PDF Files Detected:');
  pdfFiles.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file}`);
  });
  console.log('');

  console.log('🛠️  Conversion Methods:\n');
  
  console.log('📋 Method 1: Online Conversion');
  console.log('   1. Go to https://www.ilovepdf.com/pdf_to_text');
  console.log('   2. Upload your PDF files');
  console.log('   3. Download converted .txt files');
  console.log('   4. Place them in app/samples/\n');
  
  console.log('💻 Method 2: Command Line (Linux/Mac)');
  console.log('   # Install pdftotext:');
  console.log('   sudo apt-get install poppler-utils  # Linux');
  console.log('   brew install poppler               # Mac');
  console.log('');
  console.log('   # Convert files:');
  pdfFiles.forEach(file => {
    const txtName = file.replace(/\.pdf$/i, '.txt');
    console.log(`   pdftotext "${file}" "${txtName}"`);
  });
  console.log('');
  
  console.log('🪟 Method 3: Windows PowerShell');
  console.log('   # Using built-in tools (basic extraction):');
  pdfFiles.forEach(file => {
    const txtName = file.replace(/\.pdf$/i, '.txt');
    console.log(`   # For ${file} -> ${txtName}`);
    console.log(`   # Use Adobe Reader: File > Save As > Text`);
  });
  console.log('');

} else if (txtFiles.length > 0) {
  console.log('✅ Great! Text files are ready:');
  txtFiles.forEach((file, i) => {
    console.log(`   ${i + 1}. ${file}`);
  });
  console.log('');
  console.log('🚀 Run the ingestion script:');
  console.log('   npm run ingest\n');
} else {
  console.log('📝 No PDF or text files found.');
  console.log('');
  console.log('📁 Add files to: ' + samplesDir);
  console.log('   Supported formats: .pdf, .txt');
  console.log('');
  console.log('🧪 Or run the script to generate samples:');
  console.log('   npm run ingest');
}

console.log('📖 Sample Text File Format:');
console.log('   For chapters: Any educational content');
console.log('   For questions: Use this format:');
console.log('');
console.log('   1. What is the capital of France?');
console.log('   A) London');
console.log('   B) Berlin');
console.log('   C) Paris');
console.log('   D) Madrid');
console.log('   Answer: C');
console.log('   Explanation: Paris is the capital city of France.');
console.log('');
console.log('   2. Next question...');
console.log('');

console.log('🔗 Helpful Resources:');
console.log('   - PDF to Text Online: https://www.ilovepdf.com/pdf_to_text');
console.log('   - PDF to Text (Small Files): https://pdftotext.com/');
console.log('   - Adobe Reader: File > Save As > Text');
console.log('');

console.log('❓ Need help? Check: FIXED_SETUP_GUIDE.md');
console.log('✅ Ready to process? Run: npm run ingest');
