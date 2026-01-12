async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/p/yvgk5xubkw');
    const data = await response.json();

    console.log('API Response:');
    console.log('- Title:', data.title);
    console.log('- Has completionMessage:', !!data.completionMessage);
    console.log('- Message:', data.completionMessage || 'NOT FOUND');
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();