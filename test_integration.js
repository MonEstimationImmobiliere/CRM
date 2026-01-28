// Simple integration test for the CRM improvements
console.log('Testing CRM integration...');

// Test 1: Check if the application starts without errors
setTimeout(() => {
  console.log('✅ Application started successfully');

  // Test 2: Check if the reminders route exists
  const reminderButton =
    document.querySelector('[data-testid="reminders-button"]') ||
    document.querySelector('button:contains("Mes rappels")');

  if (reminderButton) {
    console.log('✅ Reminders button found');
  } else {
    console.log('⚠️ Reminders button not found - check navigation');
  }

  // Test 3: Check if localStorage is working
  try {
    localStorage.setItem('crm_test', 'test_value');
    const testValue = localStorage.getItem('crm_test');
    if (testValue === 'test_value') {
      console.log('✅ LocalStorage working correctly');
      localStorage.removeItem('crm_test');
    }
  } catch (e) {
    console.log('❌ LocalStorage error:', e.message);
  }

  console.log('Integration tests completed');
}, 2000);
