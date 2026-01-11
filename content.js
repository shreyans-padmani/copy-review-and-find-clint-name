(async function () {

  const VIEW_MORE_SELECTOR = "a.up-n-link";
  const CLICK_DELAY = 1200;
  const MAX_CLICKS = 50;
  const extractedTextSet = new Set();

  const sleep = (ms) => new Promise(res => setTimeout(res, ms));

  function isVisible(el) {
    return el && el.offsetParent !== null;
  }

  async function expandAllContent() {
    let clickCount = 0;

    while (clickCount < MAX_CLICKS) {
      const buttons = [...document.querySelectorAll(VIEW_MORE_SELECTOR)]
        .filter(btn => btn.innerText.toLowerCase().includes("view more"))
        .filter(isVisible);

      if (buttons.length === 0) break;

      for (const btn of buttons) {
        btn.click();
        clickCount++;
        await sleep(CLICK_DELAY);
      }
    }
  }

  function getCleanText() {
    // Find all elements with class="job-details-content"
    const jobDetailsElements = document.querySelectorAll('.job-details-content');

    if (jobDetailsElements.length === 0) {
      return '';
    }

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.parentElement) return NodeFilter.FILTER_REJECT;

          // Check if the node is within a job-details-content element
          const isInJobDetails = node.parentElement.closest('.job-details-content') !== null;
          if (!isInJobDetails) return NodeFilter.FILTER_REJECT;

          if (!isVisible(node.parentElement)) return NodeFilter.FILTER_REJECT;
          if (node.textContent.trim().length < 3) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    let finalText = [];

    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!extractedTextSet.has(text)) {
        extractedTextSet.add(text);
        finalText.push(text);
      }
    }

    return finalText.join("\n");
  }

  function getUpworkJobUrl() {
    // Find the input field with aria-label="Job link"
    const jobLinkInput = document.querySelector('input[aria-label="Job link"].air3-input');
    if (jobLinkInput) {
      const url = jobLinkInput.value || jobLinkInput.getAttribute('value') || '';
      if (url) {
        // Optionally click the copy button to copy to clipboard
        const copyButton = jobLinkInput.closest('div')?.querySelector('button[aria-label="Copy to clipboard"]');
        if (copyButton) {
          copyButton.click();
        }
        return url;
      }
    }
    // Fallback to current page URL if input not found
    return window.location.href;
  }

  await expandAllContent();
  const text = getCleanText();
  const upworkJobUrl = getUpworkJobUrl();

  chrome.runtime.sendMessage({
    type: "SEND_TEXT",
    payload: {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      charCount: text.length,
      text,
      upwork_job_url: upworkJobUrl
    }
  });

})();