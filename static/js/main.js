// State Management
let state = {
    rawEntries: [],
    items: [],
    selectedIds: new Set(),
    categoryFilter: 'all',
    searchQuery: '',
    lastUpdated: null
};

// DOM Elements
const elements = {
    refreshBtn: document.getElementById('refresh-btn'),
    lastUpdatedText: document.getElementById('last-updated-text'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    categoryFilters: document.getElementById('category-filters'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    emptyState: document.getElementById('empty-state'),
    notesList: document.getElementById('notes-list'),
    retryBtn: document.getElementById('retry-btn'),
    resetFiltersBtn: document.getElementById('reset-filters-btn'),
    
    // Selection Bar
    selectionBar: document.getElementById('selection-bar'),
    selectionCount: document.getElementById('selection-count'),
    clearSelectionBtn: document.getElementById('clear-selection-btn'),
    tweetSelectionBtn: document.getElementById('tweet-selection-btn'),
    
    // Modal
    tweetModal: document.getElementById('tweet-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    charCount: document.getElementById('char-count'),
    charWarning: document.getElementById('char-warning'),
    tweetPreviewText: document.getElementById('tweet-preview-text'),
    copyTweetBtn: document.getElementById('copy-tweet-btn'),
    postTweetBtn: document.getElementById('post-tweet-btn'),
    
    // Toast
    toastContainer: document.getElementById('toast-container')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleaseNotes();
});

// Event Listeners
function setupEventListeners() {
    // Refresh Button
    elements.refreshBtn.addEventListener('click', fetchReleaseNotes);
    elements.retryBtn.addEventListener('click', fetchReleaseNotes);
    
    // Search Input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        elements.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
        renderFeed();
    });
    
    elements.clearSearchBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearchBtn.style.display = 'none';
        elements.searchInput.focus();
        renderFeed();
    });
    
    // Category Filters
    elements.categoryFilters.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        
        // Update active class
        elements.categoryFilters.querySelectorAll('.filter-pill').forEach(btn => {
            btn.classList.remove('active');
        });
        pill.classList.add('active');
        
        state.categoryFilter = pill.dataset.category;
        renderFeed();
    });
    
    // Reset Filters Button
    elements.resetFiltersBtn.addEventListener('click', () => {
        elements.searchInput.value = '';
        state.searchQuery = '';
        elements.clearSearchBtn.style.display = 'none';
        
        state.categoryFilter = 'all';
        elements.categoryFilters.querySelectorAll('.filter-pill').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === 'all');
        });
        
        renderFeed();
    });
    
    // Selection Bar Actions
    elements.clearSelectionBtn.addEventListener('click', clearSelection);
    elements.tweetSelectionBtn.addEventListener('click', openComposerModal);
    
    // Modal Actions
    elements.closeModalBtn.addEventListener('click', closeComposerModal);
    elements.tweetModal.addEventListener('click', (e) => {
        if (e.target === elements.tweetModal) closeComposerModal();
    });
    
    elements.tweetTextarea.addEventListener('input', handleTweetTextareaInput);
    elements.copyTweetBtn.addEventListener('click', copyTweetText);
    elements.postTweetBtn.addEventListener('click', postTweetToTwitter);
}

// Fetch Release Notes from backend API
async function fetchReleaseNotes() {
    setLoadingState(true);
    
    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (data.status === 'success') {
            state.rawEntries = data.entries;
            processReleaseNotes(data.entries);
            
            state.lastUpdated = new Date();
            updateLastUpdatedTimestamp();
            setLoadingState(false);
            
            showToast('Release notes successfully updated!', 'success');
        } else {
            throw new Error(data.message || 'API responded with error');
        }
    } catch (error) {
        console.error('Fetch error:', error);
        elements.errorMessage.textContent = error.message || 'Could not connect to release notes service.';
        
        setLoadingState(false);
        elements.notesList.style.display = 'none';
        elements.errorState.style.display = 'flex';
        elements.emptyState.style.display = 'none';
        
        showToast('Failed to fetch updates.', 'error');
    }
}

// Update the Last Updated Text in Header
function updateLastUpdatedTimestamp() {
    if (!state.lastUpdated) return;
    const timeString = state.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    elements.lastUpdatedText.textContent = `Last refreshed at ${timeString}`;
}

// Set UI states for loading/fetching
function setLoadingState(isLoading) {
    if (isLoading) {
        elements.refreshBtn.classList.add('loading');
        elements.refreshBtn.disabled = true;
        
        elements.loadingState.style.display = 'block';
        elements.notesList.style.display = 'none';
        elements.errorState.style.display = 'none';
        elements.emptyState.style.display = 'none';
        
        // Disable search controls during fetch
        elements.searchInput.disabled = true;
        elements.categoryFilters.querySelectorAll('.filter-pill').forEach(btn => btn.disabled = true);
    } else {
        elements.refreshBtn.classList.remove('loading');
        elements.refreshBtn.disabled = false;
        
        elements.loadingState.style.display = 'none';
        elements.searchInput.disabled = false;
        elements.categoryFilters.querySelectorAll('.filter-pill').forEach(btn => btn.disabled = false);
    }
}

// Process entries by splitting HTML content based on <h3> headers
function processReleaseNotes(entries) {
    const allItems = [];
    const parser = new DOMParser();
    
    entries.forEach(entry => {
        const doc = parser.parseFromString(entry.content, 'text/html');
        const children = Array.from(doc.body.childNodes);
        
        let currentCategory = null;
        let currentNodes = [];
        let index = 0;
        
        const createAndPushItem = (type, nodes) => {
            if (!type || nodes.length === 0) return;
            
            // Generate clean wrapper div content
            const tempDiv = document.createElement('div');
            nodes.forEach(node => tempDiv.appendChild(node.cloneNode(true)));
            
            const html = tempDiv.innerHTML.trim();
            const text = tempDiv.textContent.replace(/\s+/g, ' ').trim();
            const label = type.charAt(0).toUpperCase() + type.slice(1);
            
            allItems.push({
                id: `${entry.id}_${type.toLowerCase()}_${index++}`,
                date: entry.date,
                updated: entry.updated,
                link: entry.link,
                category: type.toLowerCase(),
                categoryLabel: label,
                html: html,
                text: text
            });
        };
        
        children.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'H3') {
                // Save previous item if it exists
                if (currentCategory && currentNodes.length > 0) {
                    createAndPushItem(currentCategory, currentNodes);
                }
                
                currentCategory = node.textContent.trim().toLowerCase();
                currentNodes = [];
            } else {
                if (currentCategory) {
                    currentNodes.push(node);
                } else if (node.textContent.trim() !== '') {
                    // Content before any header defaults to "Announcement"
                    currentCategory = 'announcement';
                    currentNodes.push(node);
                }
            }
        });
        
        // Push the final item for this entry
        if (currentCategory && currentNodes.length > 0) {
            createAndPushItem(currentCategory, currentNodes);
        }
        
        // Fallback for entries with text but no headers
        if (allItems.filter(item => item.id.startsWith(entry.id)).length === 0 && entry.content.trim() !== '') {
            allItems.push({
                id: `${entry.id}_announcement_0`,
                date: entry.date,
                updated: entry.updated,
                link: entry.link,
                category: 'announcement',
                categoryLabel: 'Announcement',
                html: entry.content,
                text: doc.body.textContent.replace(/\s+/g, ' ').trim()
            });
        }
    });
    
    state.items = allItems;
    
    // Clear selection if selected items no longer exist (shouldn't happen on reload normally)
    const validIds = new Set(state.items.map(item => item.id));
    state.selectedIds = new Set([...state.selectedIds].filter(id => validIds.has(id)));
    updateSelectionBar();
    
    renderFeed();
}

// Render the notes grid based on filters and search
function renderFeed() {
    let filteredItems = state.items;
    
    // 1. Category Filter
    if (state.categoryFilter !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === state.categoryFilter);
    }
    
    // 2. Search Filter
    if (state.searchQuery) {
        filteredItems = filteredItems.filter(item => 
            item.text.toLowerCase().includes(state.searchQuery) ||
            item.date.toLowerCase().includes(state.searchQuery) ||
            item.categoryLabel.toLowerCase().includes(state.searchQuery)
        );
    }
    
    // Render
    if (filteredItems.length === 0) {
        elements.notesList.style.display = 'none';
        elements.emptyState.style.display = 'flex';
        elements.errorState.style.display = 'none';
        return;
    }
    
    elements.emptyState.style.display = 'none';
    elements.errorState.style.display = 'none';
    elements.notesList.innerHTML = '';
    elements.notesList.style.display = 'grid';
    
    filteredItems.forEach(item => {
        const card = createNoteCard(item);
        elements.notesList.appendChild(card);
    });
}

// Create Card DOM Element for release note item
function createNoteCard(item) {
    const isSelected = state.selectedIds.has(item.id);
    
    const card = document.createElement('article');
    card.className = `note-card ${isSelected ? 'selected' : ''}`;
    card.dataset.id = item.id;
    
    card.innerHTML = `
        <div class="card-header">
            <div class="card-meta">
                <span class="type-pill ${item.category}">${item.categoryLabel}</span>
                <span class="card-date">${item.date}</span>
            </div>
            <div class="checkbox-selector" title="Select for combined tweet">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
        </div>
        <div class="card-body">
            ${item.html}
        </div>
        <div class="card-footer">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="source-link" onclick="event.stopPropagation();">
                <span>View Doc</span>
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
            </a>
            <button class="tweet-single-btn" title="Tweet this update" onclick="event.stopPropagation(); tweetSingleItem('${item.id}');">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span>Tweet</span>
            </button>
        </div>
    `;
    
    // Toggle selection on card click
    card.addEventListener('click', (e) => {
        // Prevent click trigger if copy/link clicked
        if (e.target.closest('a') || e.target.closest('button')) return;
        
        toggleItemSelection(item.id);
    });
    
    return card;
}

// Toggle item selection in state
function toggleItemSelection(id) {
    if (state.selectedIds.has(id)) {
        state.selectedIds.delete(id);
    } else {
        state.selectedIds.add(id);
    }
    
    // Update active class on card element
    const cardEl = elements.notesList.querySelector(`.note-card[data-id="${id}"]`);
    if (cardEl) {
        cardEl.classList.toggle('selected', state.selectedIds.has(id));
    }
    
    updateSelectionBar();
}

// Update the bottom selection bar display
function updateSelectionBar() {
    const count = state.selectedIds.size;
    elements.selectionCount.textContent = count;
    
    if (count > 0) {
        elements.selectionBar.classList.add('active');
    } else {
        elements.selectionBar.classList.remove('active');
    }
}

// Clear all selected items
function clearSelection() {
    state.selectedIds.clear();
    elements.notesList.querySelectorAll('.note-card.selected').forEach(card => {
        card.classList.remove('selected');
    });
    updateSelectionBar();
    showToast('Selection cleared.', 'success');
}

// Tweet a single item immediately via Composer Modal
function tweetSingleItem(itemId) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;
    
    // Select just this item
    state.selectedIds.clear();
    state.selectedIds.add(itemId);
    
    // Synchronize card styles
    elements.notesList.querySelectorAll('.note-card').forEach(card => {
        card.classList.toggle('selected', card.dataset.id === itemId);
    });
    updateSelectionBar();
    
    openComposerModal();
}

// Open Composer Modal and populate with drafted text
function openComposerModal() {
    if (state.selectedIds.size === 0) return;
    
    const selectedItems = state.items.filter(item => state.selectedIds.has(item.id));
    const draftText = generateDefaultTweetText(selectedItems);
    
    elements.tweetTextarea.value = draftText;
    updateTweetComposerCounts(draftText);
    
    elements.tweetModal.classList.add('active');
    elements.tweetTextarea.focus();
}

// Close Composer Modal
function closeComposerModal() {
    elements.tweetModal.classList.remove('active');
}

// Generate default tweet text template based on selection count
function generateDefaultTweetText(selectedItems) {
    if (selectedItems.length === 0) return '';
    
    if (selectedItems.length === 1) {
        const item = selectedItems[0];
        const title = `BigQuery ${item.categoryLabel} (${item.date}): `;
        const link = item.link;
        
        // Calculate max text length: 280 - title length - link length - spacing
        const maxDescLength = 280 - title.length - link.length - 2;
        
        let desc = item.text;
        if (desc.length > maxDescLength) {
            desc = desc.substring(0, maxDescLength - 3) + '...';
        }
        return `${title}${desc} ${link}`;
    } else {
        // Multiple items selected
        const dateGroup = selectedItems[0].date;
        const count = selectedItems.length;
        const title = `BigQuery updates (${dateGroup}):\n`;
        
        let listText = '';
        selectedItems.forEach((item) => {
            const prefix = `• [${item.categoryLabel}] `;
            let desc = item.text;
            if (desc.length > 50) {
                desc = desc.substring(0, 47) + '...';
            }
            listText += `${prefix}${desc}\n`;
        });
        
        const link = selectedItems[0].link; // Use first link
        const fullText = `${title}${listText}${link}`;
        
        if (fullText.length > 280) {
            // Summary if list exceeds 280
            return `Checking out the latest BigQuery updates (${dateGroup})! Features, improvements, and other announcements: ${link}`;
        }
        return fullText;
    }
}

// Live update characters and preview in modal
function handleTweetTextareaInput(e) {
    const text = e.target.value;
    updateTweetComposerCounts(text);
}

function updateTweetComposerCounts(text) {
    const length = text.length;
    elements.charCount.textContent = length;
    elements.tweetPreviewText.textContent = text || "Draft preview will appear here...";
    
    if (length > 280) {
        elements.charCount.classList.add('error');
        elements.charWarning.style.display = 'block';
        elements.postTweetBtn.disabled = true;
    } else {
        elements.charCount.classList.remove('error');
        elements.charWarning.style.display = 'none';
        elements.postTweetBtn.disabled = false;
    }
}

// Copy drafted tweet to clipboard
function copyTweetText() {
    const text = elements.tweetTextarea.value;
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Tweet copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showToast('Failed to copy text.', 'error');
    });
}

// Open Twitter intent to tweet
function postTweetToTwitter() {
    const text = elements.tweetTextarea.value;
    if (!text || text.length > 280) return;
    
    const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
    closeComposerModal();
}

// Show standard toast notifications
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : '⚠️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto remove after 3s
    setTimeout(() => {
        toast.style.animation = 'toast-slide-in 0.25s ease reverse forwards';
        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 3000);
}
