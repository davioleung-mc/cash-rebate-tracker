// Cash Rebate Admin Interface
class RebateAdmin {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.isConnected = false;
        this.currentFormData = null;
        this.init();
    }

    async init() {
        // Always setup event listeners first
        this.setupEventListeners();
        
        // Add quick network check first
        await this.checkNetworkStatus();
        
        try {
            await this.initializeWeb3();
            await this.loadRecentRecords();
            console.log('✅ Rebate Admin initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize admin interface:', error);
            this.showDetailedError(error);
        }
    }

    async checkNetworkStatus() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                const chainIdDecimal = parseInt(chainId, 16);
                
                if (chainIdDecimal !== CONFIG.network.chainId) {
                    const networkNames = {
                        1: 'Ethereum Mainnet',
                        137: 'Polygon Mainnet', 
                        80002: 'Polygon Amoy Testnet',
                        11155111: 'Sepolia Testnet'
                    };
                    
                    const currentNetworkName = networkNames[chainIdDecimal] || `Chain ID ${chainIdDecimal}`;
                    
                    // Show warning banner
                    const warningBanner = document.getElementById('network-warning');
                    const networkNameSpan = document.getElementById('current-network-name');
                    const switchBtn = document.getElementById('quick-switch-btn');
                    
                    if (warningBanner && networkNameSpan && switchBtn) {
                        networkNameSpan.textContent = currentNetworkName;
                        warningBanner.style.display = 'block';
                        
                        switchBtn.onclick = () => this.switchToAmoyNetwork();
                    }
                }
            } catch (error) {
                console.warn('Could not check network status:', error);
            }
        }
    }

    showDetailedError(error) {
        let errorHtml = `<strong>Connection Error:</strong><br>`;
        
        if (error.message.includes('not authorized')) {
            errorHtml += `
                🔐 <strong>Authorization Issue:</strong><br>
                ${error.message}<br><br>
                <strong>Solutions:</strong><br>
                • Make sure you're using the wallet that deployed the contract<br>
                • Check if your address is added as an authorized user<br>
                • Verify you're on the correct network (Polygon Amoy)<br>
                <button onclick="window.rebateAdmin.runDiagnostics()" class="btn btn-secondary" style="margin-top: 10px;">
                    🔍 Run Diagnostics
                </button>
            `;
        } else if (error.message.includes('Wrong network') || error.message.includes('switch to')) {
            errorHtml += `
                🌐 <strong>Network Issue:</strong><br>
                ${error.message}<br><br>
                <strong>Auto-Fix Available:</strong><br>
                <button onclick="window.rebateAdmin.switchToAmoyNetwork()" class="btn btn-primary" style="margin-top: 10px;">
                    🔄 Auto-Switch to Polygon Amoy
                </button>
                <button onclick="window.rebateAdmin.addAmoyNetwork()" class="btn btn-secondary" style="margin-top: 10px;">
                    ➕ Add Amoy Network
                </button>
            `;
        } else if (error.message.includes('Contract connection failed')) {
            errorHtml += `
                📡 <strong>Contract Issue:</strong><br>
                ${error.message}<br><br>
                <strong>Solutions:</strong><br>
                • Make sure you're on Polygon Amoy network<br>
                • Contract might be temporarily unavailable<br>
                • Try the wallet test page to diagnose further<br>
                <button onclick="window.location.href='wallet-test.html'" class="btn btn-secondary" style="margin-top: 10px;">
                    🧪 Run Wallet Test
                </button>
            `;
        } else if (error.message.includes('MetaMask')) {
            errorHtml += `
                🦊 <strong>MetaMask Issue:</strong><br>
                ${error.message}<br><br>
                <strong>Solutions:</strong><br>
                • Install MetaMask browser extension<br>
                • Reload the page after installing<br>
                • Make sure MetaMask is unlocked<br>
                <a href="https://metamask.io/download/" target="_blank" class="btn btn-primary" style="margin-top: 10px;">
                    📥 Download MetaMask
                </a>
            `;
        } else {
            errorHtml += `
                ⚠️ <strong>General Error:</strong><br>
                ${error.message}<br><br>
                <button onclick="window.rebateAdmin.runDiagnostics()" class="btn btn-secondary" style="margin-top: 10px;">
                    🔍 Run Diagnostics
                </button>
                <button onclick="location.reload()" class="btn btn-secondary" style="margin-top: 10px;">
                    🔄 Reload Page
                </button>
            `;
        }
        
        this.showStatus('error', errorHtml);
    }

    async addAmoyNetwork() {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: CONFIG.network.chainIdHex,
                    chainName: CONFIG.network.name,
                    nativeCurrency: CONFIG.network.nativeCurrency,
                    rpcUrls: CONFIG.network.rpcUrls,
                    blockExplorerUrls: [CONFIG.network.explorerUrl]
                }]
            });
            
            this.showStatus('success', 'Amoy network added! Please try connecting again.');
            setTimeout(() => location.reload(), 2000);
        } catch (error) {
            this.showStatus('error', `Failed to add network: ${error.message}`);
        }
    }

    async switchToAmoyNetwork() {
        try {
            // First try to switch to existing network
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONFIG.network.chainIdHex }],
            });
            
            this.showStatus('success', 'Switched to Polygon Amoy! Refreshing...');
            setTimeout(() => location.reload(), 1500);
            
        } catch (switchError) {
            console.log('Switch failed, trying to add network:', switchError);
            
            // If network doesn't exist, add it
            if (switchError.code === 4902 || switchError.code === -32603) {
                await this.addAmoyNetwork();
            } else {
                throw switchError;
            }
        }
    }

    async runDiagnostics() {
        console.log('🔍 Running comprehensive diagnostics...');
        
        let diagnosticHtml = '<h4>🔍 Diagnostic Results:</h4><br>';
        
        // Check 1: MetaMask availability
        if (typeof window.ethereum !== 'undefined') {
            diagnosticHtml += '✅ MetaMask detected<br>';
            
            try {
                // Check 2: Account access
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    diagnosticHtml += `✅ Wallet connected: ${accounts[0].slice(0,6)}...${accounts[0].slice(-4)}<br>`;
                    
                    // Check 3: Network
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    const chainIdDecimal = parseInt(chainId, 16);
                    diagnosticHtml += `🌐 Current network: Chain ID ${chainIdDecimal}<br>`;
                    
                    if (chainIdDecimal === CONFIG.network.chainId) {
                        diagnosticHtml += '✅ Correct network (Polygon Amoy)<br>';
                        
                        // Check 4: Contract accessibility
                        try {
                            const provider = new ethers.providers.Web3Provider(window.ethereum);
                            const contract = new ethers.Contract(CONFIG.contractAddress, CONFIG.contractABI, provider);
                            
                            const owner = await contract.owner();
                            diagnosticHtml += `✅ Contract accessible<br>`;
                            diagnosticHtml += `👑 Contract owner: ${owner.slice(0,6)}...${owner.slice(-4)}<br>`;
                            
                            // Check 5: Authorization
                            const isAuthorized = await contract.isAuthorized(accounts[0]);
                            const isOwner = accounts[0].toLowerCase() === owner.toLowerCase();
                            
                            if (isAuthorized || isOwner) {
                                diagnosticHtml += '✅ Wallet is authorized<br>';
                                diagnosticHtml += '<strong>✅ All checks passed! Try refreshing the page.</strong>';
                            } else {
                                diagnosticHtml += '❌ Wallet is NOT authorized<br>';
                                diagnosticHtml += `<strong>Solution:</strong> Use the owner wallet (${owner.slice(0,6)}...${owner.slice(-4)}) or add your wallet as an authority.`;
                            }
                        } catch (contractError) {
                            diagnosticHtml += `❌ Contract error: ${contractError.message}<br>`;
                        }
                    } else {
                        diagnosticHtml += `❌ Wrong network! Expected: ${CONFIG.network.chainId}<br>`;
                        diagnosticHtml += `<button onclick="window.rebateAdmin.addAmoyNetwork()" class="btn btn-primary">Add Amoy Network</button>`;
                    }
                } else {
                    diagnosticHtml += '❌ No wallet connected<br>';
                    diagnosticHtml += 'Please connect your MetaMask wallet and try again.';
                }
            } catch (error) {
                diagnosticHtml += `❌ Wallet error: ${error.message}<br>`;
            }
        } else {
            diagnosticHtml += '❌ MetaMask not detected<br>';
            diagnosticHtml += '<a href="https://metamask.io/download/" target="_blank">Download MetaMask</a>';
        }
        
        this.showStatus('info', diagnosticHtml);
    }

    async initializeWeb3() {
        // Check if ethers is available
        if (typeof ethers === 'undefined') {
            throw new Error('🦊 MetaMask Issue: ethers.js library not loaded - please refresh the page');
        }
        
        console.log('✅ Ethers.js loaded, version:', ethers.version);
        
        // Check if MetaMask is available
        if (typeof window.ethereum !== 'undefined') {
            try {
                console.log('🦊 MetaMask detected, requesting account access...');
                
                // Request account access
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                console.log('✅ Account access granted:', accounts[0]);
                
                // Create provider and signer
                this.provider = new ethers.providers.Web3Provider(window.ethereum);
                this.signer = this.provider.getSigner();
                
                // Verify network and auto-switch if needed
                const network = await this.provider.getNetwork();
                console.log(`🌐 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
                console.log(`🎯 Expected network: ${CONFIG.network.name} (Chain ID: ${CONFIG.network.chainId})`);
                
                if (network.chainId !== CONFIG.network.chainId) {
                    console.log('⚠️ Wrong network detected, attempting auto-switch...');
                    
                    this.showStatus('info', `Wrong network detected. Switching to ${CONFIG.network.name}...`);
                    
                    try {
                        await this.switchToAmoyNetwork();
                        return; // Exit here, page will reload after switch
                    } catch (switchError) {
                        console.error('Auto-switch failed:', switchError);
                        throw new Error(`❌ Please manually switch to ${CONFIG.network.name} (Chain ID: ${CONFIG.network.chainId}). Currently on Chain ID: ${network.chainId}`);
                    }
                }
                
                // Create contract instance with robust ABI
                this.contract = new ethers.Contract(
                    CONFIG.contractAddress,
                    CONFIG.contractABI,
                    this.signer
                );
                
                // Test contract connectivity immediately
                console.log('🔗 Testing contract connection...');
                try {
                    const totalRecords = await this.contract.getTotalRecords();
                    console.log('✅ Contract connection successful, total records:', totalRecords.toString());
                } catch (contractError) {
                    console.error('❌ Contract test failed:', contractError);
                    throw new Error(`Contract connection failed: ${contractError.message}`);
                }
                
                // Verify authorization
                const signerAddress = await this.signer.getAddress();
                console.log(`🔍 Checking authorization for wallet: ${signerAddress}`);
                
                // Known deployment address (should be authorized)
                const DEPLOYMENT_ADDRESS = '0x3393520e9078C0702d932569ea6E197995dc8D25';
                
                try {
                    const owner = await this.contract.owner();
                    console.log(`� Contract owner: ${owner}`);
                    
                    // Check if connected wallet is the owner
                    const isOwner = signerAddress.toLowerCase() === owner.toLowerCase();
                    console.log(`🔐 Is owner: ${isOwner}`);
                    
                    if (isOwner) {
                        console.log('✅ Connected as contract owner - full authorization');
                    } else {
                        // Check if authorized via isAuthorized function
                        const isAuthorized = await this.contract.isAuthorized(signerAddress);
                        console.log(`🔐 Authorization status: ${isAuthorized}`);
                        
                        if (!isAuthorized) {
                            throw new Error(`❌ Wallet not authorized. Expected deployment wallet: ${DEPLOYMENT_ADDRESS.slice(0,6)}...${DEPLOYMENT_ADDRESS.slice(-4)}, Your wallet: ${signerAddress.slice(0,6)}...${signerAddress.slice(-4)}`);
                        }
                    }
                } catch (authError) {
                    console.error('Authorization check failed:', authError);
                    if (authError.message.includes('not authorized')) {
                        throw authError; // Re-throw our custom error
                    }
                    throw new Error(`Contract connection failed: ${authError.message}`);
                }
                
                this.isConnected = true;
                this.updateConnectionStatus(true, signerAddress);
                
            } catch (error) {
                throw new Error(`MetaMask connection failed: ${error.message}`);
            }
        } else {
            // Fallback to read-only mode for viewing
            this.provider = new ethers.providers.JsonRpcProvider(CONFIG.network.rpcUrls[0]);
            this.contract = new ethers.Contract(
                CONFIG.contractAddress,
                CONFIG.contractABI,
                this.provider
            );
            
            this.isConnected = false;
            this.updateConnectionStatus(false);
            this.showStatus('info', 'MetaMask not detected. Install MetaMask to record rebates. Currently in view-only mode.');
        }
    }

    setupEventListeners() {
        // Form validation on input
        document.getElementById('client-id').addEventListener('blur', () => this.validateClientId());
        document.getElementById('product-id').addEventListener('blur', () => this.validateProductId());
        document.getElementById('purchase-amount').addEventListener('blur', () => this.validatePurchaseAmount());
        document.getElementById('rebate-percentage').addEventListener('change', () => this.handleRebatePercentageChange());
        document.getElementById('custom-rebate').addEventListener('blur', () => this.validateCustomRebate());
        document.getElementById('transaction-hash').addEventListener('blur', () => this.validateTransactionHash());

        // Real-time validation
        document.querySelectorAll('#rebate-form input, #rebate-form select').forEach(input => {
            input.addEventListener('input', () => this.updatePreview());
        });

        // Button actions
        document.getElementById('preview-btn').addEventListener('click', () => this.previewRebate());
        document.getElementById('record-btn').addEventListener('click', () => this.showConfirmationModal());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearForm());

        // Modal actions
        document.getElementById('cancel-recording').addEventListener('click', () => this.hideConfirmationModal());
        document.getElementById('confirm-recording').addEventListener('click', () => this.recordRebate());

        // Close modal on overlay click
        document.getElementById('confirmation-modal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmation-modal') {
                this.hideConfirmationModal();
            }
        });
    }

    // Validation Methods
    validateClientId() {
        const input = document.getElementById('client-id');
        const value = input.value.trim();
        const group = document.getElementById('client-id-group');
        const error = document.getElementById('client-id-error');

        group.classList.remove('error');

        if (!value) {
            this.showFieldError(group, error, 'Customer ID is required');
            return false;
        }

        if (value.length < 3) {
            this.showFieldError(group, error, 'Customer ID must be at least 3 characters');
            return false;
        }

        if (value.length > 50) {
            this.showFieldError(group, error, 'Customer ID must be less than 50 characters');
            return false;
        }

        // Check for valid characters (alphanumeric, underscore, dash, @ for emails)
        const validPattern = /^[a-zA-Z0-9_@.-]+$/;
        if (!validPattern.test(value)) {
            this.showFieldError(group, error, 'Customer ID can only contain letters, numbers, @, -, _, and .');
            return false;
        }

        return true;
    }

    validateProductId() {
        const input = document.getElementById('product-id');
        const value = input.value.trim();
        const group = document.getElementById('product-id-group');
        const error = document.getElementById('product-id-error');

        group.classList.remove('error');

        if (!value) {
            this.showFieldError(group, error, 'Product ID is required');
            return false;
        }

        if (value.length < 2) {
            this.showFieldError(group, error, 'Product ID must be at least 2 characters');
            return false;
        }

        if (value.length > 50) {
            this.showFieldError(group, error, 'Product ID must be less than 50 characters');
            return false;
        }

        const validPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validPattern.test(value)) {
            this.showFieldError(group, error, 'Product ID can only contain letters, numbers, underscore, and dash');
            return false;
        }

        return true;
    }

    validatePurchaseAmount() {
        const input = document.getElementById('purchase-amount');
        const value = parseFloat(input.value);
        const group = document.getElementById('purchase-amount-group');
        const error = document.getElementById('purchase-amount-error');

        group.classList.remove('error');

        if (isNaN(value) || value <= 0) {
            this.showFieldError(group, error, 'Purchase amount must be a positive number');
            return false;
        }

        if (value < 0.01) {
            this.showFieldError(group, error, 'Purchase amount must be at least $0.01');
            return false;
        }

        if (value > 1000000) {
            this.showFieldError(group, error, 'Purchase amount cannot exceed $1,000,000');
            return false;
        }

        return true;
    }

    handleRebatePercentageChange() {
        const select = document.getElementById('rebate-percentage');
        const customGroup = document.getElementById('custom-rebate-group');
        const customInput = document.getElementById('custom-rebate');

        if (select.value === 'custom') {
            customGroup.style.display = 'block';
            customInput.required = true;
        } else {
            customGroup.style.display = 'none';
            customInput.required = false;
            customInput.value = '';
        }

        this.updatePreview();
    }

    validateCustomRebate() {
        const select = document.getElementById('rebate-percentage');
        if (select.value !== 'custom') return true;

        const input = document.getElementById('custom-rebate');
        const value = parseFloat(input.value);
        const group = document.getElementById('custom-rebate-group');
        const error = document.getElementById('custom-rebate-error');

        group.classList.remove('error');

        if (isNaN(value) || value <= 0) {
            this.showFieldError(group, error, 'Custom rebate amount must be a positive number');
            return false;
        }

        if (value < 0.01) {
            this.showFieldError(group, error, 'Rebate amount must be at least $0.01');
            return false;
        }

        const purchaseAmount = parseFloat(document.getElementById('purchase-amount').value);
        if (!isNaN(purchaseAmount) && value > purchaseAmount) {
            this.showFieldError(group, error, 'Rebate amount cannot exceed purchase amount');
            return false;
        }

        return true;
    }

    validateTransactionHash() {
        const input = document.getElementById('transaction-hash');
        const value = input.value.trim();
        const group = document.getElementById('transaction-hash-group');
        const error = document.getElementById('transaction-hash-error');

        group.classList.remove('error');

        if (!value) return true; // Optional field

        // Basic format check for transaction hash
        if (value.length > 0 && value.length < 10) {
            this.showFieldError(group, error, 'Transaction hash seems too short');
            return false;
        }

        if (value.length > 200) {
            this.showFieldError(group, error, 'Transaction hash is too long');
            return false;
        }

        return true;
    }

    showFieldError(group, errorElement, message) {
        group.classList.add('error');
        errorElement.textContent = message;
    }

    validateAllFields() {
        const validations = [
            this.validateClientId(),
            this.validateProductId(),
            this.validatePurchaseAmount(),
            this.validateCustomRebate(),
            this.validateTransactionHash()
        ];

        return validations.every(valid => valid);
    }

    calculateRebateAmount() {
        const purchaseAmount = parseFloat(document.getElementById('purchase-amount').value);
        const rebatePercentage = document.getElementById('rebate-percentage').value;
        const customRebate = parseFloat(document.getElementById('custom-rebate').value);

        if (isNaN(purchaseAmount)) return 0;

        if (rebatePercentage === 'custom') {
            return isNaN(customRebate) ? 0 : customRebate;
        }

        const percentage = parseFloat(rebatePercentage);
        return isNaN(percentage) ? 0 : (purchaseAmount * percentage / 100);
    }

    updatePreview() {
        const clientId = document.getElementById('client-id').value.trim();
        const productId = document.getElementById('product-id').value.trim();
        const purchaseAmount = parseFloat(document.getElementById('purchase-amount').value);
        const rebateAmount = this.calculateRebateAmount();
        const rebatePercentage = document.getElementById('rebate-percentage').value;

        // Update preview elements
        document.getElementById('preview-customer').textContent = clientId || 'Not entered';
        document.getElementById('preview-product').textContent = productId || 'Not entered';
        document.getElementById('preview-purchase').textContent = 
            isNaN(purchaseAmount) ? 'Not entered' : `$${purchaseAmount.toFixed(2)}`;
        document.getElementById('preview-rebate').textContent = 
            rebateAmount > 0 ? `$${rebateAmount.toFixed(2)}` : 'Not calculated';

        if (rebatePercentage === 'custom') {
            document.getElementById('preview-percentage').textContent = 'Custom Amount';
        } else {
            document.getElementById('preview-percentage').textContent = 
                rebatePercentage ? `${rebatePercentage}%` : 'Not selected';
        }

        // Enable/disable record button
        const recordBtn = document.getElementById('record-btn');
        const isValid = this.validateAllFields() && rebateAmount > 0;
        recordBtn.disabled = !isValid || !this.isConnected;
    }

    previewRebate() {
        if (!this.validateAllFields()) {
            this.showStatus('error', 'Please fix the validation errors before previewing');
            return;
        }

        const rebateAmount = this.calculateRebateAmount();
        if (rebateAmount <= 0) {
            this.showStatus('error', 'Please select a rebate percentage or enter a custom amount');
            return;
        }

        document.getElementById('preview-section').classList.add('show');
        this.showStatus('success', 'Preview generated! Review the details and click "Record on Blockchain" when ready.');
        
        // Scroll to preview
        document.getElementById('preview-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }

    showConfirmationModal() {
        if (!this.validateAllFields()) {
            this.showStatus('error', 'Please fix all validation errors first');
            return;
        }

        const rebateAmount = this.calculateRebateAmount();
        if (rebateAmount <= 0) {
            this.showStatus('error', 'Please calculate a valid rebate amount');
            return;
        }

        // Store current form data
        this.currentFormData = {
            clientId: document.getElementById('client-id').value.trim(),
            productId: document.getElementById('product-id').value.trim(),
            rebateAmount: rebateAmount,
            transactionHash: document.getElementById('transaction-hash').value.trim() || `REBATE_${Date.now()}`
        };

        // Update modal preview
        document.getElementById('modal-customer').textContent = this.currentFormData.clientId;
        document.getElementById('modal-product').textContent = this.currentFormData.productId;
        document.getElementById('modal-rebate').textContent = `$${this.currentFormData.rebateAmount.toFixed(2)}`;

        // Show modal
        document.getElementById('confirmation-modal').style.display = 'flex';
    }

    hideConfirmationModal() {
        document.getElementById('confirmation-modal').style.display = 'none';
    }

    async recordRebate() {
        if (!this.currentFormData) {
            this.showStatus('error', 'No rebate data to record');
            return;
        }

        this.hideConfirmationModal();
        this.showLoading();

        try {
            // Convert amount to wei
            const amountInWei = ethers.utils.parseEther(this.currentFormData.rebateAmount.toString());
            
            console.log('🔄 Recording rebate on blockchain...');
            console.log('Data:', this.currentFormData);

            // Call smart contract
            const tx = await this.contract.recordRebate(
                this.currentFormData.clientId,
                this.currentFormData.productId,
                amountInWei,
                this.currentFormData.transactionHash
            );

            this.showStatus('info', `Transaction submitted: ${tx.hash}. Waiting for confirmation...`);
            console.log('⏳ Transaction submitted:', tx.hash);

            // Wait for confirmation
            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed:', receipt);

            // Success handling
            this.showStatus('success', `
                ✅ Rebate recorded successfully!<br>
                <strong>Transaction Hash:</strong> ${tx.hash}<br>
                <strong>Block:</strong> ${receipt.blockNumber}<br>
                <strong>Gas Used:</strong> ${receipt.gasUsed}<br>
                <a href="${CONFIG.network.explorerUrl}/tx/${tx.hash}" target="_blank">View on PolygonScan</a>
            `);

            // Clear form and refresh data
            this.clearForm();
            await this.loadRecentRecords();

        } catch (error) {
            console.error('❌ Failed to record rebate:', error);
            
            let errorMessage = 'Failed to record rebate: ';
            if (error.code === 'ACTION_REJECTED') {
                errorMessage += 'Transaction was cancelled by user';
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                errorMessage += 'Insufficient funds for gas fees';
            } else if (error.message.includes('not authorized')) {
                errorMessage += 'Your wallet is not authorized to record rebates';
            } else {
                errorMessage += error.message;
            }

            this.showStatus('error', errorMessage);
        } finally {
            this.hideLoading();
        }
    }

    clearForm() {
        document.getElementById('rebate-form').reset();
        document.getElementById('custom-rebate-group').style.display = 'none';
        document.getElementById('preview-section').classList.remove('show');
        
        // Clear all error states
        document.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
        });

        // Reset buttons
        document.getElementById('record-btn').disabled = true;
        
        this.showStatus('info', 'Form cleared. Ready for new rebate entry.');
    }

    async loadRecentRecords() {
        try {
            const totalRecords = await this.contract.getTotalRecords();
            const recordsContainer = document.getElementById('recent-records-list');
            
            if (totalRecords.eq(0)) {
                recordsContainer.innerHTML = '<div class="no-records">No rebate records found</div>';
                return;
            }

            // Load last 5 records
            const recordsToShow = Math.min(5, totalRecords.toNumber());
            const records = [];
            
            for (let i = totalRecords.toNumber(); i > totalRecords.toNumber() - recordsToShow; i--) {
                try {
                    const record = await this.contract.getRebateRecord(i);
                    records.push({ id: i, ...record });
                } catch (error) {
                    console.warn(`Failed to load record ${i}:`, error);
                }
            }

            // Display records
            recordsContainer.innerHTML = records.map(record => `
                <div class="record-item">
                    <div class="record-header">
                        Record #${record.id} - ${record.clientId}
                    </div>
                    <div class="record-details">
                        Product: ${record.productId} | 
                        Amount: $${ethers.utils.formatEther(record.amount)} | 
                        Date: ${new Date(record.timestamp.toNumber() * 1000).toLocaleDateString()}
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load recent records:', error);
            document.getElementById('recent-records-list').innerHTML = 
                '<div class="error">Failed to load recent records</div>';
        }
    }

    updateConnectionStatus(connected, address = '') {
        const statusElement = document.getElementById('connection-status');
        if (connected) {
            statusElement.innerHTML = `✅ Connected: ${address.slice(0, 6)}...${address.slice(-4)}`;
            statusElement.className = 'connection-status connected';
        } else {
            statusElement.innerHTML = '❌ Not Connected (Install MetaMask)';
            statusElement.className = 'connection-status disconnected';
        }
    }

    showStatus(type, message) {
        const statusElement = document.getElementById('status-message');
        statusElement.className = `status-message status-${type}`;
        statusElement.innerHTML = message;
        statusElement.style.display = 'block';

        // Auto-hide after 10 seconds for success/info messages
        if (type === 'success' || type === 'info') {
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 10000);
        }
    }

    showLoading() {
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.rebateAdmin = new RebateAdmin();
});

// Handle page visibility changes (refresh data when tab becomes visible)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.rebateAdmin && window.rebateAdmin.isConnected) {
        window.rebateAdmin.loadRecentRecords();
    }
});