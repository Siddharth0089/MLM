import axios from 'axios';

async function testToken() {
    try {
        console.log("Testing stream token generation...");
        const res = await axios.post('http://localhost:3000/api/sessions/stream-token', {
            userId: 'test_user_123',
            userName: 'Test User'
        });
        console.log("Success:", res.data);
    } catch (error) {
        console.error("Error Message:", error.message);
        console.error("Error Code:", error.code);
        if (error.response) {
            console.error("Response Status:", error.response.status);
            console.error("Response Data:", error.response.data);
        }
    }
}

testToken();
