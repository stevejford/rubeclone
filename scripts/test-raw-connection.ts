import { neon } from '@neondatabase/serverless'

async function testRawConnection() {
  try {
    console.log('Testing raw Neon connection...')
    
    const DATABASE_URL = "postgresql://neondb_owner:npg_YJdOKBCjqE60@ep-empty-band-ad6vr965-pooler.c-2.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
    
    const sql = neon(DATABASE_URL)
    
    // Test basic connection
    const result = await sql`SELECT 1 as test`
    console.log('✅ Raw connection successful!')
    console.log('Test result:', result)
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
    console.log('Existing tables:', tables.map(t => t.table_name))
    
  } catch (error) {
    console.error('❌ Raw connection failed:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
  }
}

testRawConnection()
