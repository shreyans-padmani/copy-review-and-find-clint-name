// Load saved data when popup opens
document.addEventListener('DOMContentLoaded', () => {
  loadSavedData();
});

// Listen for API responses from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "API_RESPONSE") {
    displayResults(message.payload);
  } else if (message.type === "API_ERROR") {
    showError(message.payload.error);
  }
});

// Save data to chrome.storage.local
function saveDataToLocalStorage(data) {
  try {
    chrome.storage.local.set({ extractedData: data }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving to storage:', chrome.runtime.lastError);
      }
    });
  } catch (error) {
    console.error('Error saving to storage:', error);
  }
}

// Load saved data from chrome.storage.local
function loadSavedData() {
  try {
    chrome.storage.local.get(['extractedData'], (result) => {
      if (chrome.runtime.lastError) {
        console.error('Error loading from storage:', chrome.runtime.lastError);
        return;
      }
      if (result.extractedData) {
        displayResults(result.extractedData, false); // false = don't update status
      }
    });
  } catch (error) {
    console.error('Error loading from storage:', error);
  }
}

document.getElementById("start").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const statusEl = document.getElementById("status");

  // Update status but keep previous data visible
  statusEl.innerText = "Processing page...";
  statusEl.className = "status-message processing";

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

function displayResults(data, updateStatus = true) {
  const statusEl = document.getElementById("status");
  const resultsEl = document.getElementById("results");

  if (updateStatus) {
    statusEl.innerText = "Extraction completed!";
    statusEl.className = "status-message success";
  }
  resultsEl.style.display = "block";

  // Save data to localStorage
  saveDataToLocalStorage(data);

  // Display Client Details
  if (data.client) {
    displayClientDetails(data.client);
  }

  // Display Job Details
  if (data.job) {
    displayJobDetails(data.job);
  }

  // Display LinkedIn Discovery
  if (data.linkedin_discovery) {
    displayLinkedInDetails(data.linkedin_discovery);
  }
}

function displayClientDetails(client) {
  const container = document.getElementById("clientDetails");

  const clientName = client.name || client.inferred_name || "Unknown";
  const nameSource = client.name_source ? ` (${client.name_source})` : "";
  const confidence = client.name_confidence ? ` - ${client.name_confidence} confidence` : "";

  container.innerHTML = `
    <div class="detail-card">
      <div class="detail-row">
        <span class="label">Name:</span>
        <span class="value highlight">${escapeHtml(clientName)}${escapeHtml(nameSource)}${escapeHtml(confidence)}</span>
      </div>
      ${client.type ? `
      <div class="detail-row">
        <span class="label">Type:</span>
        <span class="value">${escapeHtml(client.type)}</span>
      </div>
      ` : ''}
      ${client.location ? `
      <div class="detail-row">
        <span class="label">Location:</span>
        <span class="value">📍 ${escapeHtml(client.location)}</span>
      </div>
      ` : ''}
      ${client.rating !== undefined ? `
      <div class="detail-row">
        <span class="label">Rating:</span>
        <span class="value rating">${client.rating.toFixed(1)} ⭐</span>
      </div>
      ` : ''}
      ${client.total_spent !== undefined ? `
      <div class="detail-row">
        <span class="label">Total Spent:</span>
        <span class="value">${formatCurrency(client.total_spent, 'USD')}</span>
      </div>
      ` : ''}
      ${client.hire_rate_percent !== undefined ? `
      <div class="detail-row">
        <span class="label">Hire Rate:</span>
        <span class="value">${client.hire_rate_percent}%</span>
      </div>
      ` : ''}
      ${client.avg_hourly_rate !== undefined ? `
      <div class="detail-row">
        <span class="label">Avg Hourly Rate:</span>
        <span class="value">${formatCurrency(client.avg_hourly_rate, 'USD')}/hr</span>
      </div>
      ` : ''}
      ${client.total_hires !== undefined ? `
      <div class="detail-row">
        <span class="label">Total Hires:</span>
        <span class="value">${client.total_hires}</span>
      </div>
      ` : ''}
      ${client.payment_verified !== undefined ? `
      <div class="detail-row">
        <span class="label">Payment Verified:</span>
        <span class="value ${client.payment_verified ? 'verified' : 'not-verified'}">
          ${client.payment_verified ? '✓ Verified' : '✗ Not Verified'}
        </span>
      </div>
      ` : ''}
    </div>
  `;
}

function displayJobDetails(job) {
  const container = document.getElementById("jobDetails");

  container.innerHTML = `
    <div class="detail-card">
      ${job.title ? `
      <div class="detail-row">
        <span class="label">Title:</span>
        <span class="value highlight">${escapeHtml(job.title)}</span>
      </div>
      ` : ''}
      ${job.experience_level ? `
      <div class="detail-row">
        <span class="label">Experience Level:</span>
        <span class="value">${escapeHtml(job.experience_level)}</span>
      </div>
      ` : ''}
      ${job.budget ? `
      <div class="detail-row">
        <span class="label">Budget:</span>
        <span class="value">${formatBudget(job.budget)}</span>
      </div>
      ` : ''}
      ${job.duration ? `
      <div class="detail-row">
        <span class="label">Duration:</span>
        <span class="value">${escapeHtml(job.duration)}</span>
      </div>
      ` : ''}
      ${job.description_summary ? `
      <div class="detail-row full-width">
        <span class="label">Description:</span>
        <p class="value description">${escapeHtml(job.description_summary)}</p>
      </div>
      ` : ''}
      ${job.skills && (job.skills.mandatory?.length > 0 || job.skills.preferred?.length > 0) ? `
      <div class="detail-row full-width">
        <span class="label">Skills:</span>
        <div class="skills-container">
          ${job.skills.mandatory?.length > 0 ? `
          <div class="skills-group">
            <span class="skills-label">Mandatory:</span>
            <div class="skill-tags">
              ${job.skills.mandatory.map(skill => `<span class="skill-tag mandatory">${escapeHtml(skill)}</span>`).join('')}
            </div>
          </div>
          ` : ''}
          ${job.skills.preferred?.length > 0 ? `
          <div class="skills-group">
            <span class="skills-label">Preferred:</span>
            <div class="skill-tags">
              ${job.skills.preferred.map(skill => `<span class="skill-tag preferred">${escapeHtml(skill)}</span>`).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

function displayLinkedInDetails(linkedin) {
  const container = document.getElementById("linkedinDetails");

  container.innerHTML = `
    <div class="detail-card">
      ${linkedin.confidence ? `
      <div class="detail-row">
        <span class="label">Confidence:</span>
        <span class="value">${escapeHtml(linkedin.confidence)}</span>
      </div>
      ` : ''}
      ${linkedin.reason ? `
      <div class="detail-row full-width">
        <span class="label">Reason:</span>
        <p class="value">${escapeHtml(linkedin.reason)}</p>
      </div>
      ` : ''}
      ${linkedin.search_queries?.length > 0 ? `
      <div class="detail-row full-width">
        <span class="label">Search Queries:</span>
        <ul class="search-queries">
          ${linkedin.search_queries.map(query => `<li>${escapeHtml(query)}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
  `;
}

function showError(error) {
  const statusEl = document.getElementById("status");
  statusEl.innerText = `Error: ${error}`;
  statusEl.className = "status-message error";
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

function formatBudget(budget) {
  if (budget.type === 'fixed' && budget.min === budget.max) {
    return formatCurrency(budget.min, budget.currency);
  } else if (budget.min && budget.max) {
    return `${formatCurrency(budget.min, budget.currency)} - ${formatCurrency(budget.max, budget.currency)}`;
  }
  return `${budget.type || 'Unknown'} (${budget.currency || 'USD'})`;
}