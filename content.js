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

  await expandAllContent();
  const text = getCleanText();

  chrome.runtime.sendMessage({
    type: "SEND_TEXT",
    payload: {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      charCount: text.length,
      text
    }
  });

})();