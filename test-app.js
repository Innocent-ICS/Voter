import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3001';
const BACKEND_URL = 'http://localhost:8000';

class VotingAppTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Starting Voting App Tests...');

    this.browser = await puppeteer.launch({
      headless: false, // Set to true for CI/CD
      defaultViewport: { width: 1280, height: 720 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    this.page = await this.browser.newPage();
    await this.page.setUserAgent('VotingApp-TestBot/1.0');

    console.log('✅ Browser initialized');
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }

  async testHealthChecks() {
    console.log('\n🏥 Testing Health Checks...');

    try {
      // Test backend health
      const backendResponse = await fetch(`${BACKEND_URL}/make-server-02adf113/health`);
      const backendData = await backendResponse.json();
      console.log('✅ Backend health:', backendData);

      // Test frontend loading
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      const title = await this.page.title();
      console.log('✅ Frontend loaded, title:', title);

      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  }

  async testRegistrationFlow() {
    console.log('\n📝 Testing Registration Flow...');

    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });

      // Click on Register tab
      await this.page.waitForSelector('[role="tab"]', { timeout: 5000 });
      const registerTab = await this.page.$$eval('[role="tab"]', tabs =>
        tabs.find(tab => tab.textContent?.includes('Register'))
      );

      if (registerTab) {
        await this.page.click('[role="tab"]:has-text("Register")');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Use setTimeout instead of waitForTimeout
        console.log('✅ Register tab clicked');
      }

      // Test direct registration form
      await this.page.waitForSelector('input', { timeout: 5000 });

      // Fill registration form
      const inputs = await this.page.$$('input');
      if (inputs.length >= 3) {
        await this.page.type('input:nth-of-type(1)', 'john.doe@school.edu');
        await this.page.type('input:nth-of-type(2)', 'John Doe');
        await this.page.select('select', 'Grade 12'); // Assuming there's a class selector
        console.log('✅ Registration form filled');
      }

      return true;
    } catch (error) {
      console.error('❌ Registration flow test failed:', error.message);
      return false;
    }
  }

  async testVotingFlow() {
    console.log('\n🗳️ Testing Voting Flow...');

    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });

      // Click on Vote tab (should be default)
      await this.page.waitForSelector('input[placeholder*="email"]', { timeout: 5000 });

      // Fill email for voting
      await this.page.type('input[placeholder*="email"]', 'test@school.edu');
      console.log('✅ Voting email entered');

      // Click generate link button
      const buttons = await this.page.$$('button');
      const generateButton = buttons.find(btn => btn.textContent?.includes('Generate'));
      if (generateButton) {
        await generateButton.click();
        console.log('✅ Generate voting link clicked');
      }

      return true;
    } catch (error) {
      console.error('❌ Voting flow test failed:', error.message);
      return false;
    }
  }

  async testUIElements() {
    console.log('\n🎨 Testing UI Elements...');

    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });

      // Check for main elements
      const elements = [
        { selector: '[role="tab"]', name: 'Navigation tabs' },
        { selector: 'button', name: 'Buttons' },
        { selector: 'input', name: 'Input fields' },
        { selector: 'h1', name: 'Headings' }
      ];

      for (const element of elements) {
        const count = await this.page.$$eval(element.selector, el => el.length);
        console.log(`✅ Found ${count} ${element.name}`);
      }

      // Test dark mode toggle
      const darkModeButton = await this.page.$('button:has(svg)');
      if (darkModeButton) {
        await darkModeButton.click();
        console.log('✅ Dark mode toggle clicked');
        await new Promise(resolve => setTimeout(resolve, 500)); // Use setTimeout instead of waitForTimeout
      }

      return true;
    } catch (error) {
      console.error('❌ UI elements test failed:', error.message);
      return false;
    }
  }

  async testResponsiveDesign() {
    console.log('\n📱 Testing Responsive Design...');

    try {
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];

      for (const viewport of viewports) {
        await this.page.setViewport(viewport);
        await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Use setTimeout instead of waitForTimeout

        // Take screenshot
        await this.page.screenshot({
          path: `test-${viewport.name.toLowerCase()}.png`,
          fullPage: true
        });

        console.log(`✅ ${viewport.name} viewport tested (${viewport.width}x${viewport.height})`);
      }

      return true;
    } catch (error) {
      console.error('❌ Responsive design test failed:', error.message);
      return false;
    }
  }

  async runAllTests() {
    await this.init();

    const results = {
      healthChecks: await this.testHealthChecks(),
      registrationFlow: await this.testRegistrationFlow(),
      votingFlow: await this.testVotingFlow(),
      uiElements: await this.testUIElements(),
      responsiveDesign: await this.testResponsiveDesign()
    };

    await this.close();

    // Print results
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`${status} ${test}`);
    });

    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;

    console.log(`\n🎯 Overall: ${passedCount}/${totalCount} tests passed`);

    if (passedCount === totalCount) {
      console.log('🎉 All tests passed! Ready for deployment.');
      return true;
    } else {
      console.log('⚠️ Some tests failed. Please check the issues above.');
      return false;
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new VotingAppTester();
  tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

export default VotingAppTester;
