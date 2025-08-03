import { SmartVisualTester } from './tests/visual/smart-visual-tester';

const tester = new SmartVisualTester();
const port = process.env.TEST_PORT || '3333';
const url = `http://localhost:${port}`;

console.log(`🚀 Running visual tests against ${url}...`);

tester.runSmartVisualTests(url)
  .then(() => console.log('✅ Smart visual testing completed'))
  .catch(error => {
    console.error('❌ Smart visual testing failed:', error);
    process.exit(1);
  });