const http = require('http');

const testLogin = (email, password) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email, password });

    const options = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = http.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: responseBody,
          headers: res.headers,
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
};

async function main() {
  console.log('🧪 Testing Demo Account Logins\n');

  const accounts = [
    { email: 'sa@demo.local', password: 'P@ssw0rd!', role: 'SUPERADMIN' },
    { email: 'admin@demo.local', password: 'P@ssw0rd!', role: 'ADMIN' },
    { email: 'user@demo.local', password: 'P@ssw0rd!', role: 'EMPLOYEE' },
    { email: 'admin@company.com', password: 'password123', role: 'ADMIN (alt)' },
  ];

  for (const account of accounts) {
    try {
      console.log(`Testing ${account.role}: ${account.email}`);
      const response = await testLogin(account.email, account.password);
      
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        console.log(`  ✅ SUCCESS`);
        console.log(`  User: ${data.user.fullName}`);
        console.log(`  Role: ${data.user.role}`);
        console.log(`  Token length: ${data.accessToken.length} chars\n`);
      } else {
        console.log(`  ❌ FAILED - Status: ${response.statusCode}`);
        console.log(`  Response: ${response.body}\n`);
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}\n`);
    }
  }
}

main();
