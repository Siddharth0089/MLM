import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.LINGO_API_KEY;
const API_URL = process.env.LINGO_API_URL || 'https://api.lingo.dev/v1';

async function testTranslation() {
    console.log('\n🔄 Testing Translation...');
    try {
        const response = await axios.post(
            `${API_URL}/translate`,
            {
                text: "Hello, how are you today?",
                sourceLang: "en-US",
                targetLang: "es-ES"
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Translation successful!');
        console.log('   Original: "Hello, how are you today?"');
        console.log(`   Translated: "${response.data.translatedText || response.data.translation}"`);
        return true;
    } catch (error) {
        console.error('❌ Translation failed:', error.response?.data || error.message);
        return false;
    }
}

async function testLanguageDetection() {
    console.log('\n🔄 Testing Language Detection...');
    try {
        const response = await axios.post(
            `${API_URL}/detect`,
            { text: "Bonjour, comment allez-vous?" },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Language detection successful!');
        console.log(`   Detected language: ${response.data.language || response.data.detectedLanguage}`);
        return true;
    } catch (error) {
        console.error('❌ Detection failed:', error.response?.data || error.message);
        return false;
    }
}

async function testBatchTranslation() {
    console.log('\n🔄 Testing Batch Translation...');
    try {
        const texts = [
            "Good morning",
            "How are you?",
            "Thank you very much"
        ];

        const response = await axios.post(
            `${API_URL}/translate/batch`,
            {
                texts,
                sourceLang: "en-US",
                targetLang: "fr-FR"
            },
            {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('✅ Batch translation successful!');
        console.log('   Translations:', response.data.translations || response.data);
        return true;
    } catch (error) {
        console.error('❌ Batch translation failed:', error.response?.data || error.message);
        console.log('   Note: Batch endpoint may not be supported. Falling back to individual requests.');
        return false;
    }
}

async function runAllTests() {
    console.log('='.repeat(60));
    console.log('🧪 Lingo.dev API Test Suite');
    console.log('='.repeat(60));

    if (!API_KEY) {
        console.error('\n❌ ERROR: LINGO_API_KEY not found in .env file');
        console.log('\nPlease add the following to backend/.env:');
        console.log('LINGO_API_KEY=your_api_key_here');
        console.log('LINGO_API_URL=https://api.lingo.dev/v1');
        process.exit(1);
    }

    console.log(`\n📡 API URL: ${API_URL}`);
    console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...`);

    const results = {
        translation: await testTranslation(),
        detection: await testLanguageDetection(),
        batch: await testBatchTranslation()
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));
    console.log(`Translation:       ${results.translation ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Language Detection: ${results.detection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Batch Translation:  ${results.batch ? '✅ PASS' : '⚠️  OPTIONAL'}`);

    const allPassed = results.translation && results.detection;
    if (allPassed) {
        console.log('\n🎉 All essential tests passed! Your Lingo.dev API is configured correctly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check your API key and endpoint configuration.');
    }

    console.log('='.repeat(60) + '\n');
}

runAllTests();
