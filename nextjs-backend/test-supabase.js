// Test Supabase Storage Connection
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET;

console.log('Testing Supabase Configuration...\n');
console.log('STORAGE_TYPE:', process.env.STORAGE_TYPE);
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_KEY:', SUPABASE_KEY ? `${SUPABASE_KEY.substring(0, 20)}...` : 'NOT SET');
console.log('SUPABASE_BUCKET:', SUPABASE_BUCKET);
console.log('');

if (!SUPABASE_URL || !SUPABASE_KEY || !SUPABASE_BUCKET) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function testConnection() {
  try {
    console.log('Testing bucket access...');
    
    // List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    console.log('✅ Found buckets:', buckets.map(b => b.name).join(', '));
    
    // Check if our bucket exists
    const ourBucket = buckets.find(b => b.name === SUPABASE_BUCKET);
    if (!ourBucket) {
      console.error(`❌ Bucket "${SUPABASE_BUCKET}" not found!`);
      console.log('Available buckets:', buckets.map(b => b.name));
      return;
    }
    
    console.log(`✅ Bucket "${SUPABASE_BUCKET}" found!`);
    console.log('   - Public:', ourBucket.public);
    console.log('   - ID:', ourBucket.id);
    
    // Try to list files
    console.log('\nTesting file listing...');
    const { data: files, error: filesError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .list('uploads', {
        limit: 5,
      });
    
    if (filesError) {
      console.error('❌ Error listing files:', filesError.message);
      return;
    }
    
    console.log('✅ Can list files! Found', files.length, 'files');
    
    // Try to create a test file
    console.log('\nTesting file upload...');
    const testContent = Buffer.from('Hello from HR App!');
    const testPath = `test/${Date.now()}_test.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('   Details:', uploadError);
      return;
    }
    
    console.log('✅ Upload successful!');
    console.log('   Path:', uploadData.path);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(testPath);
    
    console.log('   Public URL:', urlData.publicUrl);
    
    // Clean up test file
    console.log('\nCleaning up test file...');
    const { error: deleteError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .remove([testPath]);
    
    if (deleteError) {
      console.error('⚠️  Could not delete test file:', deleteError.message);
    } else {
      console.log('✅ Test file deleted');
    }
    
    console.log('\n✅ All tests passed! Supabase Storage is working correctly.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

testConnection();
