/**
 * Test script for maintenance mode functionality
 * 
 * This script helps test if the site correctly redirects to the waitlist page
 * when in maintenance mode. It makes requests to various endpoints and logs
 * the responses.
 * 
 * Run with: node scripts/test-maintenance-mode.js
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_URL = 'https://eleveadmin.netlify.app';

async function testMaintenance() {
  console.log('🧪 Testing maintenance mode functionality...');
  console.log('--------------------------------------------');
  
  // Step 1: Check current site status
  console.log('1️⃣ Checking current site status...');
  try {
    const statusRes = await fetch(`${ADMIN_URL}/api/site-status`);
    const statusData = await statusRes.json();
    console.log('   Site status:', statusData);
    console.log('   Site is', statusData.inactive ? 'INACTIVE ❌' : 'ACTIVE ✅');
    console.log('--------------------------------------------');
  } catch (error) {
    console.error('   Error checking site status:', error.message);
  }

  // Step 2: Test homepage access
  console.log('2️⃣ Testing homepage access...');
  try {
    const homeRes = await fetch(BASE_URL, {
      redirect: 'manual', // Don't follow redirects
    });
    
    console.log('   Status code:', homeRes.status);
    console.log('   Location header:', homeRes.headers.get('location'));
    
    if (homeRes.status === 200) {
      console.log('   ✅ Homepage accessible - site is active');
    } else if (homeRes.status === 307 && 
              homeRes.headers.get('location')?.includes('/waitlist')) {
      console.log('   ✅ Redirected to waitlist - site is inactive');
    } else {
      console.log('   ❌ Unexpected response');
    }
    console.log('--------------------------------------------');
  } catch (error) {
    console.error('   Error accessing homepage:', error.message);
  }

  // Step 3: Test admin access
  console.log('3️⃣ Testing admin access with admin cookie...');
  try {
    const adminRes = await fetch(`${BASE_URL}/admin`, {
      redirect: 'manual',
      headers: {
        Cookie: 'admin_access=true',
      }
    });
    
    console.log('   Status code:', adminRes.status);
    console.log('   Location header:', adminRes.headers.get('location'));
    
    if (adminRes.status === 200 || 
        (adminRes.status === 307 && !adminRes.headers.get('location')?.includes('/waitlist'))) {
      console.log('   ✅ Admin access working');
    } else {
      console.log('   ❌ Admin access not working properly');
    }
    console.log('--------------------------------------------');
  } catch (error) {
    console.error('   Error testing admin access:', error.message);
  }

  // Step 4: Test waitlist page direct access
  console.log('4️⃣ Testing direct access to waitlist page...');
  try {
    const waitlistRes = await fetch(`${BASE_URL}/waitlist`);
    
    console.log('   Status code:', waitlistRes.status);
    
    if (waitlistRes.status === 200) {
      console.log('   ✅ Waitlist page accessible');
    } else {
      console.log('   ❌ Waitlist page not accessible');
    }
    console.log('--------------------------------------------');
  } catch (error) {
    console.error('   Error accessing waitlist page:', error.message);
  }
  
  console.log('🧪 Testing complete!');
}

// Run the tests
testMaintenance().catch(console.error); 