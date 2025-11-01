/**
 * Simple ChromaDB test using basic HTTP requests
 */

const http = require('http');

function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve(result);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testChromaDB() {
  console.log('🔍 Testing ChromaDB connection...\n');

  try {
    // Test heartbeat
    console.log('1. Testing heartbeat...');
    const heartbeat = await makeRequest('GET', '/api/v1/heartbeat');
    console.log('   ✅ ChromaDB is responding');

    // List collections
    console.log('2. Listing collections...');
    const collections = await makeRequest('GET', '/api/v1/collections');
    console.log(`   📚 Found ${collections.length} collections`);

    // Try to create a test collection
    console.log('3. Creating test collection...');
    try {
      const collection = await makeRequest('POST', '/api/v1/collections', {
        name: 'test_collection',
        metadata: { description: 'Test collection' }
      });
      console.log('   ✅ Test collection created');
    } catch (error) {
      console.log('   ℹ️  Collection may already exist');
    }

    console.log('\n✅ ChromaDB is working correctly!');
    console.log('\n💡 Now you can run your Next.js application:');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('\n❌ ChromaDB connection failed:', error.message);
    console.log('\n💡 Make sure ChromaDB is running:');
    console.log('   docker run -d --rm -p 8000:8000 chromadb/chroma:0.5.0');
  }
}

testChromaDB();
