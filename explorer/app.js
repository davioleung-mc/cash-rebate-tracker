// Cash Rebate Explorer Application

// Enhanced ethers.js loading with multiple fallbacks
let ethersLoadPromise = null;

function loadEthersLibrary() {
    if (ethersLoadPromise) return ethersLoadPromise;
    
    if (typeof ethers !== 'undefined') {
        ethersLoadPromise = Promise.resolve(true);
        return ethersLoadPromise;
    }

    const ethersSources = [
        'https://cdn.ethers.io/lib/ethers-5.7.2.umd.min.js',
        'https://unpkg.com/ethers@5.7.2/dist/ethers.umd.min.js',
        'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.umd.min.js'
    ];

    ethersLoadPromise = new Promise((resolve, reject) => {
        let sourceIndex = 0;

        function tryLoadEthers() {
            if (sourceIndex >= ethersSources.length) {
                reject(new Error('All ethers.js CDN sources failed'));
                return;
            }

            console.log(`Loading ethers from source ${sourceIndex + 1}:`, ethersSources[sourceIndex]);
            
            const script = document.createElement('script');
            script.src = ethersSources[sourceIndex];
            script.onload = function() {
                if (typeof ethers !== 'undefined') {
                    console.log('✅ Ethers.js loaded successfully from:', ethersSources[sourceIndex]);
                    resolve(true);
                } else {
                    sourceIndex++;
                    tryLoadEthers();
                }
            };
            script.onerror = function() {
                console.warn(`Failed to load ethers from source ${sourceIndex + 1}`);
                sourceIndex++;
                tryLoadEthers();
            };
            document.head.appendChild(script);
        }

        tryLoadEthers();
    });

    return ethersLoadPromise;
}

class CashRebateExplorer {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.isConnected = false;
        // Don't call init() in constructor - will be called externally
    }

    async init() {
        // Set up event listeners first (they work without blockchain connection)
        this.setupEventListeners();
        
        try {
            // First ensure ethers.js is loaded
            await loadEthersLibrary();
            console.log('🔄 Ethers.js loaded, initializing explorer...');
            
            // Initialize Web3 connection
            await this.initializeWeb3();
            console.log('🔄 Web3 initialized, loading data...');
            
            // Load initial data
            await this.loadContractStats();
            await this.loadRecentRecords();
            console.log('✅ Explorer initialization complete');
            
        } catch (error) {
            console.error('Failed to initialize:', error);
            this.showOfflineMode();
        }
    }

    showOfflineMode() {
        // Show static information when blockchain connection fails
        document.getElementById('total-records').textContent = 'Offline';
        document.getElementById('active-records').textContent = 'Offline';
        document.getElementById('total-amount').textContent = 'Offline';
        document.getElementById('network-name').textContent = CONFIG.network.name;
        document.getElementById('contract-address').textContent = CONFIG.contractAddress;
        
        // Show offline message
        const offlineMessage = `
            <div class="offline-notice">
                <h3>⚠️ Offline Mode</h3>
                <p>Unable to connect to the Polygon network. You can still view contract information:</p>
                <div class="contract-info">
                    <p><strong>Contract Address:</strong> ${CONFIG.contractAddress}</p>
                    <p><strong>Network:</strong> ${CONFIG.network.name}</p>
                    <p><strong>View on Explorer:</strong> 
                        <a href="${CONFIG.network.explorerUrl}/address/${CONFIG.contractAddress}" target="_blank">
                            PolygonScan
                        </a>
                    </p>
                </div>
                <p>Try refreshing the page or check your internet connection.</p>
            </div>
        `;
        
        document.getElementById('recent-records').innerHTML = offlineMessage;
    }

    async initializeWeb3() {
        // Check if ethers is available
        if (typeof ethers === 'undefined') {
            throw new Error('ethers.js library not loaded');
        }

        const rpcUrls = CONFIG.network.rpcUrls;
        let lastError;
        
        for (let i = 0; i < rpcUrls.length; i++) {
            try {
                console.log(`🔗 Attempting connection ${i + 1}/${rpcUrls.length}: ${rpcUrls[i]}`);
                
                // Create provider for Amoy testnet (ethers v5 syntax)
                this.provider = new ethers.providers.JsonRpcProvider(rpcUrls[i], {
                    chainId: CONFIG.network.chainId,
                    name: CONFIG.network.name
                });
                
                // Test connection with timeout
                try {
                    // Test basic connectivity
                    const network = await this.provider.getNetwork();
                    console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
                    
                    // Verify chain ID matches
                    if (Number(network.chainId) !== CONFIG.network.chainId) {
                        throw new Error(`Chain ID mismatch: expected ${CONFIG.network.chainId}, got ${network.chainId}`);
                    }
                    
                    // Create contract instance
                    this.contract = new ethers.Contract(
                        CONFIG.contractAddress,
                        CONFIG.contractABI,
                        this.provider
                    );
                    
                    // Test contract connectivity
                    const totalRecords = await this.contract.getTotalRecords();
                    console.log(`✅ Contract connection successful - Total records: ${totalRecords}`);
                    
                    this.isConnected = true;
                    this.updateConnectionStatus(true);
                    return;
                    
                } catch (error) {
                    throw error;
                }
                
            } catch (error) {
                lastError = error;
                console.warn(`❌ RPC ${i + 1} failed:`, error.message);
                
                if (i === rpcUrls.length - 1) {
                    console.error('🚫 All RPC endpoints failed');
                    this.updateConnectionStatus(false);
                    
                    // Provide more specific error message
                    let errorMsg = 'Unable to connect to Polygon network. ';
                    if (error.message.includes('fetch')) {
                        errorMsg += 'Network connectivity issue.';
                    } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
                        errorMsg += 'Connection timeout.';
                    } else {
                        errorMsg += `Error: ${error.message}`;
                    }
                    
                    throw new Error(errorMsg);
                }
            }
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Search forms
        document.getElementById('search-client').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchByClient();
        });

        document.getElementById('search-product').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchByProduct();
        });

        document.getElementById('search-record').addEventListener('submit', (e) => {
            e.preventDefault();
            this.searchByRecord();
        });

        // Refresh button
        document.getElementById('refresh-stats').addEventListener('click', () => {
            this.loadContractStats();
            this.loadRecentRecords();
        });

        // Reconnect button
        document.getElementById('reconnect').addEventListener('click', async () => {
            document.getElementById('reconnect').style.display = 'none';
            this.showLoading();
            try {
                await this.initializeWeb3();
                await this.loadContractStats();
                await this.loadRecentRecords();
            } catch (error) {
                console.error('Reconnection failed:', error);
                this.showError('Reconnection failed. Please try again.');
                document.getElementById('reconnect').style.display = 'inline-block';
            }
            this.hideLoading();
        });

        // Load more button
        document.getElementById('load-more').addEventListener('click', () => {
            this.loadMoreRecords();
        });
    }

    switchTab(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show corresponding tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Clear previous results
        this.clearSearchResults();
    }

    async loadContractStats() {
        console.log('📊 Loading contract stats...');
        
        try {
            // Check if required elements exist
            const requiredElements = ['total-records', 'active-records', 'total-amount', 'network-name', 'contract-address'];
            for (const elementId of requiredElements) {
                if (!document.getElementById(elementId)) {
                    throw new Error(`Required element '${elementId}' not found in DOM`);
                }
            }
            
            this.showLoading();
            console.log('📊 Loading overlay shown, fetching total records...');
            
            // Load stats individually to ensure compatibility
            const totalRecords = await this.contract.getTotalRecords();
            console.log('📊 Total records loaded:', totalRecords.toString());
            
            // Try to get full stats, fallback to individual calls
            let totalAmount, activeRecords;
            try {
                console.log('📊 Attempting to get contract stats...');
                const stats = await this.contract.getContractStats();
                totalAmount = stats[2];
                activeRecords = stats[1];
                console.log('📊 Contract stats loaded successfully');
            } catch (error) {
                console.warn('📊 getContractStats failed, using individual calls:', error);
                // Fallback - calculate active records by checking recent records
                activeRecords = totalRecords; // For now, assume all are active
                totalAmount = ethers.BigNumber.from(0); // Default to 0
                
                // Try to calculate total amount by iterating recent records
                try {
                    console.log('📊 Calculating total amount from individual records...');
                    const limit = Math.min(Number(totalRecords), 100); // Limit to avoid timeout
                    let sum = ethers.BigNumber.from(0);
                    
                    for (let i = Math.max(1, Number(totalRecords) - limit + 1); i <= Number(totalRecords); i++) {
                        try {
                            const record = await this.contract.getRebateRecord(i);
                            sum = sum.add(record.amount);
                        } catch (recordError) {
                            console.warn(`📊 Failed to load record ${i}:`, recordError);
                        }
                    }
                    totalAmount = sum;
                    console.log('📊 Total amount calculated:', this.formatAmount(totalAmount));
                } catch (amountError) {
                    console.warn('📊 Failed to calculate total amount:', amountError);
                }
            }
            
            // Update stats display
            console.log('📊 Updating DOM elements...');
            document.getElementById('total-records').textContent = totalRecords.toString();
            document.getElementById('active-records').textContent = activeRecords.toString();
            document.getElementById('total-amount').textContent = 
                `${this.formatAmount(totalAmount)} MATIC`;
            
            // Update network info
            document.getElementById('network-name').textContent = CONFIG.network.name;
            document.getElementById('contract-address').textContent = CONFIG.contractAddress;
            
            console.log('📊 Stats display updated successfully');
            this.hideLoading();
        } catch (error) {
            console.error('📊 Failed to load contract stats:', error);
            this.showError('Failed to load contract statistics: ' + error.message);
            this.hideLoading();
        }
    }

    async loadRecentRecords(limit = 10) {
        console.log('🕐 Loading recent records...');
        
        try {
            // Check if recent-records element exists
            if (!document.getElementById('recent-records')) {
                throw new Error("Required element 'recent-records' not found in DOM");
            }
            
            console.log('🕐 Fetching total records...');
            const totalRecords = await this.contract.getTotalRecords();
            const recordsToLoad = Math.min(Number(totalRecords), limit);
            
            console.log(`🕐 Total records: ${totalRecords}, loading: ${recordsToLoad}`);
            
            if (recordsToLoad === 0) {
                document.getElementById('recent-records').innerHTML = 
                    '<div class="no-results">No records found</div>';
                console.log('🕐 No records to display');
                return;
            }
            
            const records = [];
            const startId = Math.max(1, Number(totalRecords) - recordsToLoad + 1);
            
            console.log(`🕐 Loading records from ${startId} to ${totalRecords}...`);
            for (let i = Number(totalRecords); i >= startId; i--) {
                try {
                    const record = await this.contract.getRebateRecord(i);
                    records.push({ id: i, ...record });
                    console.log(`🕐 Loaded record ${i}: ${record.clientId}`);
                } catch (error) {
                    console.warn(`🕐 Failed to load record ${i}:`, error);
                }
            }
            
            console.log(`🕐 Displaying ${records.length} records...`);
            this.displayRecords(records, 'recent-records');
            console.log('🕐 Recent records loaded successfully');
        } catch (error) {
            console.error('🕐 Failed to load recent records:', error);
            this.showError('Failed to load recent records: ' + error.message);
        }
    }

    async searchByClient(clientId = null) {
        if (!clientId) {
            clientId = document.getElementById('client-search').value.trim();
        }
        if (!clientId) return;

        try {
            this.showLoading();
            this.clearSearchResults();
            
            const records = await this.contract.getRebatesByClient(clientId);
            
            // Calculate total amount
            let totalAmount = ethers.BigNumber.from(0);
            for (const record of records) {
                totalAmount = totalAmount.add(record.amount);
            }
            
            // Display summary
            const summaryHtml = `
                <div class="search-summary">
                    <h3>Client: ${clientId}</h3>
                    <p>Total Records: ${records.length}</p>
                    <p>Total Amount: ${this.formatAmount(totalAmount)} MATIC</p>
                </div>
            `;
            
            const resultsContainer = document.getElementById('client-results');
            resultsContainer.innerHTML = summaryHtml;
            
            // Display records
            if (records.length > 0) {
                const recordsWithIds = await this.getRecordIds(records, 'client', clientId);
                this.displayRecords(recordsWithIds, 'client-results', true);
            } else {
                resultsContainer.innerHTML += '<div class="no-results">No records found for this client</div>';
            }
            
            this.hideLoading();
        } catch (error) {
            console.error('Client search failed:', error);
            this.showError('Failed to search client records.');
            this.hideLoading();
        }
    }

    async searchByProduct(productId = null) {
        if (!productId) {
            productId = document.getElementById('product-search').value.trim();
        }
        if (!productId) return;

        try {
            this.showLoading();
            this.clearSearchResults();
            
            const records = await this.contract.getProductRebates(productId);
            
            // Calculate totals
            let totalAmount = 0n;
            records.forEach(record => {
                if (record.isActive) {
                    totalAmount += record.amount;
                }
            });
            
            // Display summary
            const summaryHtml = `
                <div class="search-summary">
                    <h3>Product: ${productId}</h3>
                    <p>Total Records: ${records.length}</p>
                    <p>Total Amount: ${this.formatAmount(totalAmount)} MATIC</p>
                </div>
            `;
            
            const resultsContainer = document.getElementById('product-results');
            resultsContainer.innerHTML = summaryHtml;
            
            // Display records
            if (records.length > 0) {
                const recordsWithIds = await this.getRecordIds(records, 'product', productId);
                this.displayRecords(recordsWithIds, 'product-results', true);
            } else {
                resultsContainer.innerHTML += '<div class="no-results">No records found for this product</div>';
            }
            
            this.hideLoading();
        } catch (error) {
            console.error('Product search failed:', error);
            this.showError('Failed to search product records.');
            this.hideLoading();
        }
    }

    async searchByRecord(recordId = null) {
        if (!recordId) {
            recordId = document.getElementById('record-search').value.trim();
        }
        if (!recordId || isNaN(recordId)) return;

        try {
            this.showLoading();
            this.clearSearchResults();
            
            const record = await this.contract.getRebateRecord(parseInt(recordId));
            
            const recordWithId = { id: parseInt(recordId), ...record };
            this.displayRecords([recordWithId], 'record-results');
            
            this.hideLoading();
        } catch (error) {
            console.error('Record search failed:', error);
            this.showError('Record not found or failed to load.');
            this.hideLoading();
        }
    }

    async getRecordIds(records, searchType, searchValue) {
        // This is a simplified approach - in a real implementation,
        // you might want to add events or mappings to track record IDs more efficiently
        const recordsWithIds = [];
        const totalRecords = await this.contract.getTotalRecords();
        
        for (let i = 1; i <= Number(totalRecords); i++) {
            try {
                const record = await this.contract.getRebateRecord(i);
                
                // Check if this record matches our search
                const matches = records.some(searchRecord => 
                    record.clientId === searchRecord.clientId &&
                    record.productId === searchRecord.productId &&
                    record.amount === searchRecord.amount &&
                    record.timestamp === searchRecord.timestamp
                );
                
                if (matches) {
                    recordsWithIds.push({ id: i, ...record });
                }
            } catch (error) {
                // Skip missing records
            }
        }
        
        return recordsWithIds;
    }

    displayRecords(records, containerId, append = false) {
        const container = document.getElementById(containerId);
        
        if (!append) {
            const existingResults = container.querySelector('.records-grid');
            if (existingResults) {
                existingResults.remove();
            }
        }
        
        if (records.length === 0) {
            if (!append) {
                container.innerHTML += '<div class="no-results">No records found</div>';
            }
            return;
        }

        const recordsGrid = document.createElement('div');
        recordsGrid.className = 'records-grid';
        
        records.forEach(record => {
            const recordCard = document.createElement('div');
            recordCard.className = `record-card ${record.isActive ? 'active' : 'inactive'}`;
            
            recordCard.innerHTML = `
                <div class="record-header">
                    <span class="record-id">Record #${record.id}</span>
                    <span class="record-status ${record.isActive ? 'active' : 'inactive'}">
                        ${record.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="record-details">
                    <p><strong>Client ID:</strong> ${record.clientId}</p>
                    <p><strong>Product ID:</strong> ${record.productId}</p>
                    <p><strong>Amount:</strong> ${this.formatAmount(record.amount)} MATIC</p>
                    <p><strong>Date:</strong> ${this.formatTimestamp(record.timestamp)}</p>
                    <p><strong>Recorded By:</strong> 
                        <a href="${CONFIG.network.explorerUrl}/address/${record.recordedBy}" 
                           target="_blank" class="address-link">
                            ${this.formatAddress(record.recordedBy)}
                        </a>
                    </p>
                    ${record.transactionHash ? `
                        <p><strong>TX Hash:</strong> 
                            <a href="${CONFIG.network.explorerUrl}/tx/${record.transactionHash}" 
                               target="_blank" class="tx-link">
                                ${this.formatTxHash(record.transactionHash)}
                            </a>
                        </p>
                    ` : ''}
                </div>
            `;
            
            recordsGrid.appendChild(recordCard);
        });
        
        container.appendChild(recordsGrid);
    }

    // Utility functions
    formatAmount(amount) {
        try {
            // Handle BigNumber from ethers v5
            if (amount && amount._isBigNumber) {
                return ethers.utils.formatEther(amount);
            }
            // Handle regular numbers or strings
            return ethers.utils.formatEther(amount.toString());
        } catch (error) {
            console.warn('Error formatting amount:', error);
            return '0.0';
        }
    }

    formatTimestamp(timestamp) {
        return new Date(Number(timestamp) * 1000).toLocaleString();
    }

    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    formatTxHash(hash) {
        return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        statusElement.textContent = connected ? 'Connected' : 'Disconnected';
        statusElement.className = `connection-status ${connected ? 'connected' : 'disconnected'}`;
        
        // Show/hide reconnect button
        const reconnectButton = document.getElementById('reconnect');
        if (reconnectButton) {
            reconnectButton.style.display = connected ? 'none' : 'inline-block';
        }
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    clearSearchResults() {
        // Clear all search result containers
        const containers = ['client-results', 'product-results', 'record-results', 'search-results'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '';
            }
        });
    }

    async loadMoreRecords() {
        // Implement pagination logic here
        console.log('Load more records functionality would be implemented here');
    }
}



// Add some additional CSS for error messages and dynamic elements
const additionalStyles = `
<style>
.error-message {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff4444;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1001;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.connection-status {
    padding: 5px 10px;
    border-radius: 15px;
    font-size: 0.9em;
    font-weight: bold;
}

.connection-status.connected {
    background: #4CAF50;
    color: white;
}

.connection-status.disconnected {
    background: #f44336;
    color: white;
}

.search-summary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
}

.search-summary h3 {
    margin: 0 0 10px 0;
}

.search-summary p {
    margin: 5px 0;
}

.records-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.record-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    border-left: 4px solid #4CAF50;
    transition: transform 0.2s ease;
}

.record-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}

.record-card.inactive {
    border-left-color: #f44336;
    opacity: 0.8;
}

.record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.record-id {
    font-weight: bold;
    color: #333;
}

.record-status {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.8em;
    font-weight: bold;
}

.record-status.active {
    background: #4CAF50;
    color: white;
}

.record-status.inactive {
    background: #f44336;
    color: white;
}

.record-details p {
    margin: 8px 0;
    color: #666;
}

.record-details strong {
    color: #333;
}

.address-link, .tx-link {
    color: #667eea;
    text-decoration: none;
}

.address-link:hover, .tx-link:hover {
    text-decoration: underline;
}

.no-results {
    text-align: center;
    color: #666;
    padding: 40px;
    font-style: italic;
}

.offline-notice {
    background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
    color: white;
    padding: 30px;
    border-radius: 15px;
    text-align: center;
    margin: 20px 0;
}

.offline-notice h3 {
    margin: 0 0 15px 0;
    font-size: 1.5rem;
}

.offline-notice .contract-info {
    background: rgba(255,255,255,0.1);
    padding: 15px;
    border-radius: 8px;
    margin: 15px 0;
    text-align: left;
}

.offline-notice .contract-info a {
    color: #fff3e0;
    text-decoration: underline;
}

.button-group {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
}

@media (max-width: 768px) {
    .records-grid {
        grid-template-columns: 1fr;
    }
    
    .error-message {
        right: 10px;
        left: 10px;
        max-width: none;
    }
    
    .button-group {
        flex-direction: column;
        align-items: center;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Global explorer instance
let explorerInstance = null;

// Initialize explorer when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🔄 DOM loaded, initializing explorer...');
        
        // Create explorer instance
        explorerInstance = new CashRebateExplorer();
        
        // Initialize it (this will load ethers.js and connect to blockchain)
        await explorerInstance.init();
        
        console.log('✅ Explorer fully initialized and ready');
    } catch (error) {
        console.error('Failed to initialize explorer:', error);
        
        // Show error message to user
        const errorHtml = `
            <div style="padding: 20px; text-align: center; color: #dc3545; max-width: 600px; margin: 50px auto; background: #f8d7da; border-radius: 10px;">
                <h2>❌ Loading Error</h2>
                <p>Failed to initialize the blockchain explorer.</p>
                <p><strong>Error:</strong> ${error.message}</p>
                <p><button onclick="location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">🔄 Try Again</button></p>
            </div>
        `;
        
        const container = document.querySelector('.container') || document.body;
        container.innerHTML = errorHtml;
    }
});

// Global functions for HTML interface compatibility
function showTab(tabName) {
    // Clear active classes
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Set active tab
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Clear results
    const resultsDiv = document.getElementById(`${tabName}-results`);
    if (resultsDiv) {
        resultsDiv.innerHTML = '';
    }
}

function searchClient() {
    if (!explorerInstance) {
        alert('Explorer not initialized yet. Please wait and try again.');
        return;
    }
    
    const clientId = document.getElementById('client-search').value.trim();
    if (!clientId) {
        alert('Please enter a Client ID');
        return;
    }
    
    explorerInstance.searchByClient(clientId);
}

function searchProduct() {
    if (!explorerInstance) {
        alert('Explorer not initialized yet. Please wait and try again.');
        return;
    }
    
    const productId = document.getElementById('product-search').value.trim();
    if (!productId) {
        alert('Please enter a Product ID');
        return;
    }
    
    explorerInstance.searchByProduct(productId);
}

function searchRecord() {
    if (!explorerInstance) {
        alert('Explorer not initialized yet. Please wait and try again.');
        return;
    }
    
    const recordId = document.getElementById('record-search').value.trim();
    if (!recordId || isNaN(recordId) || recordId < 1) {
        alert('Please enter a valid Record ID (positive number)');
        return;
    }
    
    explorerInstance.searchByRecord(parseInt(recordId));
}

function loadRecentRecords() {
    if (!explorerInstance) {
        alert('Explorer not initialized yet. Please wait and try again.');
        return;
    }
    
    explorerInstance.loadRecentRecords();
}