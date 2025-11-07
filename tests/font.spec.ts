import { test, expect } from '@playwright/test';

test.describe('Font Tests', () => {
  test('should use Poppins font throughout the application', async ({ page }) => {
    // Navigate to your app
    await page.goto('http://localhost:5173');
    
    // Wait for the app to be fully loaded
    await page.waitForLoadState('networkidle');

    // Test body font
    const bodyFont = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontFamily;
    });
    expect(bodyFont.toLowerCase()).toContain('poppins');

    // Test heading font by finding an existing heading or creating one
    const headingFont = await page.evaluate(() => {
      // Try to find an existing h1 first
      let h1 = document.querySelector('h1');
      if (!h1) {
        // If no h1 exists, create one
        h1 = document.createElement('h1');
        h1.textContent = 'Test Heading';
        document.body.prepend(h1);
      }
      return window.getComputedStyle(h1).fontFamily;
    });
    expect(headingFont.toLowerCase()).toContain('poppins');

    // Test button font by finding an existing button or creating one
    const buttonFont = await page.evaluate<string>(() => {
  let button = document.querySelector('button');
  if (!button) {
    button = document.createElement('button');
    button.textContent = 'Test Button';
    document.body.appendChild(button);
    return new Promise<string>(resolve => {
      requestAnimationFrame(() => {
        resolve(window.getComputedStyle(button as HTMLElement).fontFamily);
      });
    });
  }
  return window.getComputedStyle(button).fontFamily;
});

const inputFont = await page.evaluate<string>(() => {
  let input = document.querySelector('input');
  if (!input) {
    input = document.createElement('input');
    document.body.appendChild(input);
    return new Promise<string>(resolve => {
      requestAnimationFrame(() => {
        resolve(window.getComputedStyle(input as HTMLElement).fontFamily);
      });
    });
  }
  return window.getComputedStyle(input).fontFamily;
});

expect(buttonFont.toLowerCase()).toContain('poppins');
expect(inputFont.toLowerCase()).toContain('poppins');
});
});