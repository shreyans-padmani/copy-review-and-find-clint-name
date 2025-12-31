chrome.runtime.onMessage.addListener(async (message) => {
  if (message.type === "SEND_TEXT") {
    // await fetch("https://YOUR_API_ENDPOINT_HERE", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(message.payload)
    // });
    console.log(message.payload);
  }
});