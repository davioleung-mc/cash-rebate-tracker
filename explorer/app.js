// Cash Rebate Explorer Application
class CashRebateExplorer {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.isConnected = false;
        this.init();
    }

    async init() {
        try {
            // Initialize Web3 connection
            await this.initializeWeb3();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadContractStats();
            await this.loadRecentRecords();
            
            console.log('Cash Rebate Explorer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to connect to blockchain. Please check your connection.');
        }
    }

    async initializeWeb3() {
        const rpcUrls = [
            "https://polygon-amoy.drpc.org",
            "https://rpc-amoy.polygon.technology/",
            "https://polygon-amoy.blockpi.network/v1/rpc/public",
            "https://amoy.polygonscan.com/"
        ];
        
        for (let i = 0; i < rpcUrls.length; i++) {
            try {
                console.log(`Trying RPC endpoint ${i + 1}:`, rpcUrls[i]);
                
                // Create provider for Amoy testnet
                this.provider = new ethers.JsonRpcProvider(rpcUrls[i]);
                
                // Create contract instance
                this.contract = new ethers.Contract(
                    CONFIG.contractAddress,
                    CONFIG.contractABI,
                    this.provider
                );
                
                // Test connection with timeout
                const networkPromise = this.provider.getNetwork();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                );
                
                await Promise.race([networkPromise, timeoutPromise]);
                
                console.log('Successfully connected to blockchain');
                this.isConnected = true;
                this.updateConnectionStatus(true);
                return;
                
            } catch (error) {
                console.warn(`RPC endpoint ${i + 1} failed:`, error.message);
                if (i === rpcUrls.length - 1) {
                    console.error('All RPC endpoints failed');
                    this.updateConnectionStatus(false);
                    throw new Error('Unable to connect to any RPC endpoint');
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
        try {
            this.showLoading();
            
            const stats = await this.contract.getContractStats();
            
            // Update stats display
            document.getElementById('total-records').textContent = stats[0].toString();
            document.getElementById('active-records').textContent = stats[1].toString();
            document.getElementById('total-amount').textContent = 
                `${this.formatAmount(stats[2])} ETH`;
            
            // Get network info
            const network = await this.provider.getNetwork();
            document.getElementById('network-name').textContent = CONFIG.network.name;
            document.getElementById('contract-address').textContent = CONFIG.contractAddress;
            
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load contract stats:', error);
            this.showError('Failed to load contract statistics.');
            this.hideLoading();
        }
    }

    async loadRecentRecords(limit = 10) {
        try {
            const totalRecords = await this.contract.getTotalRecords();
            const recordsToLoad = Math.min(Number(totalRecords), limit);
            
            if (recordsToLoad === 0) {
                document.getElementById('recent-records').innerHTML = 
                    '<div class="no-results">No records found</div>';
                return;
            }
            
            const records = [];
            const startId = Math.max(1, Number(totalRecords) - recordsToLoad + 1);
            
            for (let i = Number(totalRecords); i >= startId; i--) {
                try {
                    const record = await this.contract.getRebateRecord(i);
                    records.push({ id: i, ...record });
                } catch (error) {
                    console.warn(`Failed to load record ${i}:`, error);
                }
            }
            
            this.displayRecords(records, 'recent-records');
        } catch (error) {
            console.error('Failed to load recent records:', error);
            this.showError('Failed to load recent records.');
        }
    }

    async searchByClient() {
        const clientId = document.getElementById('client-id').value.trim();
        if (!clientId) return;

        try {
            this.showLoading();
            this.clearSearchResults();
            
            const records = await this.contract.getClientRebates(clientId);
            const totalAmount = await this.contract.getClientTotalAmount(clientId);
            
            // Display summary
            const summaryHtml = `
                <div class="search-summary">
                    <h3>Client: ${clientId}</h3>
                    <p>Total Records: ${records.length}</p>
                    <p>Total Amount: ${this.formatAmount(totalAmount)} ETH</p>
                </div>
            `;
            
            const resultsContainer = document.getElementById('search-results');
            resultsContainer.innerHTML = summaryHtml;
            
            // Display records
            if (records.length > 0) {
                const recordsWithIds = await this.getRecordIds(records, 'client', clientId);
                this.displayRecords(recordsWithIds, 'search-results', true);
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

    async searchByProduct() {
        const productId = document.getElementById('product-id').value.trim();
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
                    <p>Total Amount: ${this.formatAmount(totalAmount)} ETH</p>
                </div>
            `;
            
            const resultsContainer = document.getElementById('search-results');
            resultsContainer.innerHTML = summaryHtml;
            
            // Display records
            if (records.length > 0) {
                const recordsWithIds = await this.getRecordIds(records, 'product', productId);
                this.displayRecords(recordsWithIds, 'search-results', true);
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

    async searchByRecord() {
        const recordId = document.getElementById('record-id').value.trim();
        if (!recordId || isNaN(recordId)) return;

        try {
            this.showLoading();
            this.clearSearchResults();
            
            const record = await this.contract.getRebateRecord(parseInt(recordId));
            
            const recordWithId = { id: parseInt(recordId), ...record };
            this.displayRecords([recordWithId], 'search-results');
            
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
                    <p><strong>Amount:</strong> ${this.formatAmount(record.amount)} ETH</p>
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
        return ethers.formatEther(amount.toString());
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
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '';
    }

    async loadMoreRecords() {
        // Implement pagination logic here
        console.log('Load more records functionality would be implemented here');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CashRebateExplorer();
});

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