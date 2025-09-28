const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testSync() {
  try {
    console.log('🔄 Starting category sync...');
    
    const response = await fetch('http://localhost:3000/api/admin/sync-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Sync successful!');
      console.log('📊 Results:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Sync failed!');
      console.log('Error:', JSON.stringify(data, null, 2));
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
  }
}

testSync();
