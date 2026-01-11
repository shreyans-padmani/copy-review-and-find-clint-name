chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "SEND_TEXT") {
    try {
      const response = await fetch("http://localhost:8000/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: message.payload.text
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Send the response back to popup
      chrome.runtime.sendMessage({
        type: "API_RESPONSE",
        payload: data
      });

      sendResponse({ success: true, data });
    } catch (error) {
      console.error("API call failed:", error);
      chrome.runtime.sendMessage({
        type: "API_ERROR",
        payload: { error: error.message }
      });
      sendResponse({ success: false, error: error.message });
    }
    return true; // Keep the message channel open for async response
  }
});