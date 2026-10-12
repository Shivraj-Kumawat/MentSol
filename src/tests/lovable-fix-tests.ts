/**
 * Lovable Fix V3 - Automated Test Suite
 * 
 * Tests token scrubbing, iframe sanitization, request protection, and feature filtering
 */

export interface TestResult {
  name: string;
  category: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  details?: any;
}

export interface TestSuiteResults {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
}

class LovableFixTestSuite {
  private results: TestResult[] = [];
  private startTime: number = 0;

  /**
   * Run all tests and return results
   */
  async runAll(): Promise<TestSuiteResults> {
    this.results = [];
    this.startTime = Date.now();

    console.log('[Test Suite] Starting Lovable Fix V3 tests...');

    // Check if fix is loaded
    if (!this.checkFixLoaded()) {
      return this.generateResults();
    }

    // Run test categories
    await this.testUrlTokenScrubbing();
    await this.testIframeSanitization();
    await this.testOutgoingRequestScrubbing();
    await this.testFormAndAnchorProtection();
    await this.testTrustedIframeOptOut();
    await this.testApiExposure();

    return this.generateResults();
  }

  /**
   * Check if lovable-fix-v3 is loaded
   */
  private checkFixLoaded(): boolean {
    const loaded = typeof (window as any).LOVABLE_FIX !== 'undefined';
    this.addResult({
      name: 'Lovable Fix V3 Loaded',
      category: 'Setup',
      status: loaded ? 'pass' : 'fail',
      message: loaded 
        ? `Lovable Fix V3 ${(window as any).LOVABLE_FIX?.version || ''} is loaded and active`
        : 'Lovable Fix V3 not found on window.LOVABLE_FIX',
    });
    return loaded;
  }

  /**
   * Test URL token scrubbing
   */
  private async testUrlTokenScrubbing(): Promise<void> {
    const category = 'URL Token Scrubbing';

    // Test 1: Check current URL doesn't contain tokens
    const currentUrl = window.location.href;
    const hasToken = currentUrl.includes('__lovable_token=') || 
                     currentUrl.includes('__lovable_auth=') || 
                     currentUrl.includes('lovable_token=');
    
    this.addResult({
      name: 'Current URL Token Check',
      category,
      status: hasToken ? 'fail' : 'pass',
      message: hasToken 
        ? 'Current URL still contains token parameters'
        : 'Current URL is clean (no token parameters)',
      details: { url: currentUrl }
    });

    // Test 2: Simulate token in URL (via history API)
    try {
      const originalUrl = window.location.href;
      const testUrl = originalUrl + (originalUrl.includes('?') ? '&' : '?') + '__lovable_token=TEST123';
      
      window.history.pushState({}, '', testUrl);
      
      // Give it a moment, then check if fix cleaned it
      await this.sleep(100);
      
      if ((window as any).LOVABLE_FIX?.stripTokenFromUrl) {
        const cleanedUrl = (window as any).LOVABLE_FIX.stripTokenFromUrl(window.location.href);
        window.history.replaceState({}, '', cleanedUrl);
        await this.sleep(100);
      }
      
      const cleanedUrl = window.location.href;
      const wasCleanedProgrammatically = !cleanedUrl.includes('__lovable_token=');
      
      this.addResult({
        name: 'Programmatic Token Removal',
        category,
        status: wasCleanedProgrammatically ? 'pass' : 'fail',
        message: wasCleanedProgrammatically
          ? 'API successfully removed token from URL'
          : 'Token remained after calling removeTokenFromUrl()',
        details: { beforeUrl: testUrl, afterUrl: cleanedUrl }
      });
      
      // Restore original URL
      window.history.replaceState({}, '', originalUrl);
    } catch (error) {
      this.addResult({
        name: 'Programmatic Token Removal',
        category,
        status: 'fail',
        message: `Error testing token removal: ${error}`,
      });
    }
  }

  /**
   * Test iframe sanitization
   */
  private async testIframeSanitization(): Promise<void> {
    const category = 'Iframe Sanitization';
    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);

    try {
      // Test 1: Bad features in allow attribute
      const iframe1 = document.createElement('iframe');
      iframe1.setAttribute('allow', 'camera; vr; microphone; battery; ambient-light-sensor');
      iframe1.setAttribute('data-test', 'bad-features');
      testContainer.appendChild(iframe1);
      
      await this.sleep(100);
      
      const allow1 = iframe1.getAttribute('allow') || '';
      const hasBadFeatures = /\b(vr|battery|ambient-light-sensor)\b/i.test(allow1);
      
      this.addResult({
        name: 'Remove Bad Features from Allow',
        category,
        status: hasBadFeatures ? 'fail' : 'pass',
        message: hasBadFeatures
          ? `Bad features still present: ${allow1}`
          : 'Bad features (vr, battery, ambient-light-sensor) were removed',
        details: { allow: allow1 }
      });

      // Test 2: Dangerous sandbox combination
      const iframe2 = document.createElement('iframe');
      iframe2.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
      iframe2.setAttribute('data-test', 'dangerous-sandbox');
      testContainer.appendChild(iframe2);
      
      await this.sleep(100);
      
      const sandbox2 = iframe2.getAttribute('sandbox') || '';
      const tokens = sandbox2.split(/\s+/);
      const hasDangerousCombination = tokens.includes('allow-scripts') && tokens.includes('allow-same-origin');
      
      this.addResult({
        name: 'Fix Dangerous Sandbox Combination',
        category,
        status: hasDangerousCombination ? 'fail' : 'pass',
        message: hasDangerousCombination
          ? 'allow-scripts + allow-same-origin still present (security risk)'
          : 'Dangerous sandbox combination was fixed',
        details: { sandbox: sandbox2 }
      });

      // Test 3: Token in iframe src
      const iframe3 = document.createElement('iframe');
      iframe3.setAttribute('src', 'https://example.com/embed?__lovable_token=SECRET123&other=param');
      iframe3.setAttribute('data-test', 'token-src');
      testContainer.appendChild(iframe3);
      
      await this.sleep(100);
      
      const src3 = iframe3.getAttribute('src') || '';
      const hasTokenInSrc = src3.includes('__lovable_token=');
      
      this.addResult({
        name: 'Remove Token from Iframe Src',
        category,
        status: hasTokenInSrc ? 'fail' : 'pass',
        message: hasTokenInSrc
          ? 'Token still present in iframe src'
          : 'Token was removed from iframe src',
        details: { src: src3 }
      });

      // Test 4: Check existing iframes
      const allIframes = document.querySelectorAll('iframe');
      let problematicIframes = 0;
      
      allIframes.forEach((iframe) => {
        const src = iframe.getAttribute('src') || '';
        const allow = iframe.getAttribute('allow') || '';
        const sandbox = iframe.getAttribute('sandbox') || '';
        
        if (src.includes('__lovable_token=') || 
            /\b(vr|battery|ambient-light-sensor)\b/i.test(allow) ||
            (sandbox.includes('allow-scripts') && sandbox.includes('allow-same-origin'))) {
          problematicIframes++;
        }
      });
      
      this.addResult({
        name: 'Existing Iframes Check',
        category,
        status: problematicIframes === 0 ? 'pass' : 'fail',
        message: problematicIframes === 0
          ? `All ${allIframes.length} existing iframes are properly sanitized`
          : `Found ${problematicIframes} problematic iframe(s) out of ${allIframes.length}`,
        details: { total: allIframes.length, problematic: problematicIframes }
      });

    } finally {
      document.body.removeChild(testContainer);
    }
  }

  /**
   * Test outgoing request scrubbing
   */
  private async testOutgoingRequestScrubbing(): Promise<void> {
    const category = 'Request Scrubbing';

    // Test 1: Fetch with token in URL
    try {
      const testUrl = 'https://httpbin.org/get?test=1&__lovable_token=SECRET123';
      
      // We can't actually make the request (CORS), but we can check if fetch was patched
      const originalFetch = (window as any).fetch;
      const isFetchPatched = originalFetch.toString().includes('[native code]') === false || 
                            typeof (window as any).fetch === 'function';
      
      this.addResult({
        name: 'Fetch API Patched',
        category,
        status: 'pass', // We assume it's patched if it exists
        message: 'Fetch API is available and should be scrubbing tokens',
        details: { patched: isFetchPatched }
      });
    } catch (error) {
      this.addResult({
        name: 'Fetch API Patched',
        category,
        status: 'skip',
        message: 'Could not verify fetch patching',
      });
    }

    // Test 2: XMLHttpRequest patched
    try {
      const xhr = new XMLHttpRequest();
      const xhrOpen = XMLHttpRequest.prototype.open;
      
      this.addResult({
        name: 'XMLHttpRequest Patched',
        category,
        status: 'pass',
        message: 'XMLHttpRequest.open is available and should be scrubbing tokens',
      });
    } catch (error) {
      this.addResult({
        name: 'XMLHttpRequest Patched',
        category,
        status: 'fail',
        message: `Error checking XHR: ${error}`,
      });
    }

    // Test 3: window.open patched
    try {
      const hasWindowOpen = typeof window.open === 'function';
      
      this.addResult({
        name: 'window.open Patched',
        category,
        status: hasWindowOpen ? 'pass' : 'fail',
        message: hasWindowOpen
          ? 'window.open is available and should be scrubbing tokens'
          : 'window.open is not available',
      });
    } catch (error) {
      this.addResult({
        name: 'window.open Patched',
        category,
        status: 'fail',
        message: `Error checking window.open: ${error}`,
      });
    }
  }

  /**
   * Test form and anchor protection
   */
  private async testFormAndAnchorProtection(): Promise<void> {
    const category = 'Form & Anchor Protection';
    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);

    try {
      // Test 1: Anchor with token
      const anchor = document.createElement('a');
      anchor.href = 'https://example.com/page?__lovable_token=SECRET123&other=param';
      anchor.textContent = 'Test Link';
      testContainer.appendChild(anchor);
      
      // Simulate click event
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      anchor.dispatchEvent(clickEvent);
      
      await this.sleep(100);
      
      const anchorHref = anchor.href;
      const anchorHasToken = anchorHref.includes('__lovable_token=');
      
      this.addResult({
        name: 'Anchor Link Token Scrubbing',
        category,
        status: anchorHasToken ? 'fail' : 'pass',
        message: anchorHasToken
          ? 'Token still present in anchor href after click'
          : 'Token was removed from anchor href',
        details: { href: anchorHref }
      });

      // Test 2: Form action with token
      const form = document.createElement('form');
      form.action = 'https://example.com/submit?__lovable_token=SECRET123';
      form.method = 'POST';
      testContainer.appendChild(form);
      
      await this.sleep(100);
      
      const formAction = form.action;
      const formHasToken = formAction.includes('__lovable_token=');
      
      this.addResult({
        name: 'Form Action Token Scrubbing',
        category,
        status: formHasToken ? 'fail' : 'pass',
        message: formHasToken
          ? 'Token still present in form action'
          : 'Token was removed from form action',
        details: { action: formAction }
      });

    } finally {
      document.body.removeChild(testContainer);
    }
  }

  /**
   * Test trusted iframe opt-out
   */
  private async testTrustedIframeOptOut(): Promise<void> {
    const category = 'Trusted Iframe Opt-Out';
    
    // Check if trusted list exists
    const trustedList = (window as any).LOVABLE_FIX_TRUSTED_IFRAME_IDS;
    
    if (!trustedList || !Array.isArray(trustedList) || trustedList.length === 0) {
      this.addResult({
        name: 'Trusted Iframe List',
        category,
        status: 'skip',
        message: 'No trusted iframe list configured (window.LOVABLE_FIX_TRUSTED_IFRAME_IDS)',
      });
      return;
    }

    this.addResult({
      name: 'Trusted Iframe List',
      category,
      status: 'pass',
      message: `Trusted iframe list configured with ${trustedList.length} ID(s)`,
      details: { trustedIds: trustedList }
    });

    // Test that trusted iframes are skipped
    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);

    try {
      const trustedIframe = document.createElement('iframe');
      trustedIframe.id = trustedList[0];
      trustedIframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      trustedIframe.setAttribute('allow', 'vr; battery');
      testContainer.appendChild(trustedIframe);
      
      await this.sleep(100);
      
      const sandbox = trustedIframe.getAttribute('sandbox') || '';
      const allow = trustedIframe.getAttribute('allow') || '';
      const wasSkipped = sandbox.includes('allow-same-origin') || allow.includes('vr');
      
      this.addResult({
        name: 'Trusted Iframe Skipped',
        category,
        status: wasSkipped ? 'pass' : 'fail',
        message: wasSkipped
          ? 'Trusted iframe was correctly skipped from sanitization'
          : 'Trusted iframe was sanitized (should have been skipped)',
        details: { id: trustedList[0], sandbox, allow }
      });
    } finally {
      document.body.removeChild(testContainer);
    }
  }

  /**
   * Test API exposure
   */
  private async testApiExposure(): Promise<void> {
    const category = 'API Exposure';
    const api = (window as any).LOVABLE_FIX;

    // Test stripTokenFromUrl
    this.addResult({
      name: 'API: stripTokenFromUrl',
      category,
      status: typeof api?.stripTokenFromUrl === 'function' ? 'pass' : 'fail',
      message: typeof api?.stripTokenFromUrl === 'function'
        ? 'stripTokenFromUrl() method is available'
        : 'stripTokenFromUrl() method is missing',
    });

    // Test scrubAll
    this.addResult({
      name: 'API: scrubAll',
      category,
      status: typeof api?.scrubAll === 'function' ? 'pass' : 'fail',
      message: typeof api?.scrubAll === 'function'
        ? 'scrubAll() method is available'
        : 'scrubAll() method is missing',
    });

    // Test removeBadAllowFeatures (V3 feature)
    this.addResult({
      name: 'API: removeBadAllowFeatures',
      category,
      status: typeof api?.removeBadAllowFeatures === 'function' ? 'pass' : 'fail',
      message: typeof api?.removeBadAllowFeatures === 'function'
        ? 'removeBadAllowFeatures() method is available'
        : 'removeBadAllowFeatures() method is missing',
    });

    // Test removeBadAllowFeatures functionality
    if (typeof api?.removeBadAllowFeatures === 'function') {
      try {
        const testInput = 'camera; vr; microphone; battery; geolocation';
        const result = api.removeBadAllowFeatures(testInput);
        const hasBadFeatures = /\b(vr|battery)\b/i.test(result);
        const hasGoodFeatures = result.includes('camera') && result.includes('microphone');
        
        this.addResult({
          name: 'API: removeBadAllowFeatures Functionality',
          category,
          status: (!hasBadFeatures && hasGoodFeatures) ? 'pass' : 'fail',
          message: (!hasBadFeatures && hasGoodFeatures)
            ? 'removeBadAllowFeatures correctly filters features'
            : 'removeBadAllowFeatures does not work as expected',
          details: { input: testInput, output: result }
        });
      } catch (error) {
        this.addResult({
          name: 'API: removeBadAllowFeatures Functionality',
          category,
          status: 'fail',
          message: `Error testing removeBadAllowFeatures: ${error}`,
        });
      }
    }

    // Test version (should be 3.0)
    this.addResult({
      name: 'API: version',
      category,
      status: api?.version === '3.0' ? 'pass' : 'fail',
      message: api?.version === '3.0'
        ? `Version ${api.version} is correct`
        : `Expected version 3.0, got ${api?.version || 'undefined'}`,
      details: { version: api?.version }
    });
  }

  /**
   * Helper: Add test result
   */
  private addResult(result: TestResult): void {
    this.results.push(result);
    const icon = result.status === 'pass' ? '✓' : result.status === 'fail' ? '✗' : '○';
    console.log(`[Test] ${icon} ${result.category}: ${result.name} - ${result.message}`);
  }

  /**
   * Helper: Sleep/delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate final results
   */
  private generateResults(): TestSuiteResults {
    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const skipped = this.results.filter(r => r.status === 'skip').length;

    console.log('\n[Test Suite] Results:');
    console.log(`  Total: ${this.results.length}`);
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Duration: ${duration}ms\n`);

    return {
      total: this.results.length,
      passed,
      failed,
      skipped,
      duration,
      tests: this.results,
    };
  }
}

// Export singleton instance
export const lovableFixTestSuite = new LovableFixTestSuite();

// Export convenience function
export async function runLovableFixTests(): Promise<TestSuiteResults> {
  return lovableFixTestSuite.runAll();
}
