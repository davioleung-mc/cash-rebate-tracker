// Contract Configuration
const CONFIG = {
    // Your deployed contract address on Amoy testnet
    contractAddress: "0x4A9AE17B2CA4BB5b18f6FaceCfBF91fe42c495e6",
    
    // Amoy Testnet Configuration
    network: {
        name: "Polygon Amoy Testnet",
        chainId: 80002,
        rpcUrl: "https://polygon-amoy.drpc.org",
        explorerUrl: "https://amoy.polygonscan.com"
    },
    
    // Contract ABI (Application Binary Interface)
    // This defines how to interact with your smart contract
    contractABI: [
        {
            "inputs": [{"internalType": "address[]", "name": "initialAuthorities", "type": "address[]"}],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "address", "name": "authority", "type": "address"},
                {"indexed": true, "internalType": "address", "name": "addedBy", "type": "address"}
            ],
            "name": "AuthorityAdded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "address", "name": "authority", "type": "address"},
                {"indexed": true, "internalType": "address", "name": "removedBy", "type": "address"}
            ],
            "name": "AuthorityRemoved",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "address", "name": "previousOwner", "type": "address"},
                {"indexed": true, "internalType": "address", "name": "newOwner", "type": "address"}
            ],
            "name": "OwnershipTransferred",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "uint256", "name": "recordId", "type": "uint256"},
                {"indexed": true, "internalType": "string", "name": "clientId", "type": "string"},
                {"indexed": true, "internalType": "string", "name": "productId", "type": "string"},
                {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
                {"indexed": false, "internalType": "address", "name": "recordedBy", "type": "address"},
                {"indexed": false, "internalType": "string", "name": "transactionHash", "type": "string"}
            ],
            "name": "RebateRecorded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "uint256", "name": "recordId", "type": "uint256"},
                {"indexed": false, "internalType": "bool", "name": "status", "type": "bool"},
                {"indexed": false, "internalType": "address", "name": "updatedBy", "type": "address"}
            ],
            "name": "RebateStatusUpdated",
            "type": "event"
        },
        {
            "inputs": [{"internalType": "address", "name": "authority", "type": "address"}],
            "name": "addAuthority",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "string", "name": "clientId", "type": "string"}],
            "name": "getClientRebates",
            "outputs": [
                {
                    "components": [
                        {"internalType": "string", "name": "clientId", "type": "string"},
                        {"internalType": "string", "name": "productId", "type": "string"},
                        {"internalType": "uint256", "name": "amount", "type": "uint256"},
                        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                        {"internalType": "address", "name": "recordedBy", "type": "address"},
                        {"internalType": "string", "name": "transactionHash", "type": "string"},
                        {"internalType": "bool", "name": "isActive", "type": "bool"}
                    ],
                    "internalType": "struct CashRebateTracker.RebateRecord[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "string", "name": "clientId", "type": "string"}],
            "name": "getClientRecordIds",
            "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "string", "name": "clientId", "type": "string"}],
            "name": "getClientTotalAmount",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getContractStats",
            "outputs": [
                {"internalType": "uint256", "name": "totalRecords", "type": "uint256"},
                {"internalType": "uint256", "name": "totalActiveRecords", "type": "uint256"},
                {"internalType": "uint256", "name": "totalRebateAmount", "type": "uint256"}
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "string", "name": "productId", "type": "string"}],
            "name": "getProductRebates",
            "outputs": [
                {
                    "components": [
                        {"internalType": "string", "name": "clientId", "type": "string"},
                        {"internalType": "string", "name": "productId", "type": "string"},
                        {"internalType": "uint256", "name": "amount", "type": "uint256"},
                        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                        {"internalType": "address", "name": "recordedBy", "type": "address"},
                        {"internalType": "string", "name": "transactionHash", "type": "string"},
                        {"internalType": "bool", "name": "isActive", "type": "bool"}
                    ],
                    "internalType": "struct CashRebateTracker.RebateRecord[]",
                    "name": "",
                    "type": "tuple[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "uint256", "name": "recordId", "type": "uint256"}],
            "name": "getRebateRecord",
            "outputs": [
                {
                    "components": [
                        {"internalType": "string", "name": "clientId", "type": "string"},
                        {"internalType": "string", "name": "productId", "type": "string"},
                        {"internalType": "uint256", "name": "amount", "type": "uint256"},
                        {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                        {"internalType": "address", "name": "recordedBy", "type": "address"},
                        {"internalType": "string", "name": "transactionHash", "type": "string"},
                        {"internalType": "bool", "name": "isActive", "type": "bool"}
                    ],
                    "internalType": "struct CashRebateTracker.RebateRecord",
                    "name": "",
                    "type": "tuple"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getTotalRecords",
            "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "address", "name": "addr", "type": "address"}],
            "name": "isAuthorized",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "string", "name": "clientId", "type": "string"},
                {"internalType": "string", "name": "productId", "type": "string"},
                {"internalType": "uint256", "name": "amount", "type": "uint256"},
                {"internalType": "string", "name": "txHash", "type": "string"}
            ],
            "name": "recordRebate",
            "outputs": [{"internalType": "uint256", "name": "recordId", "type": "uint256"}],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "string[]", "name": "clientIds", "type": "string[]"},
                {"internalType": "string[]", "name": "productIds", "type": "string[]"},
                {"internalType": "uint256[]", "name": "amounts", "type": "uint256[]"},
                {"internalType": "string[]", "name": "txHashes", "type": "string[]"}
            ],
            "name": "recordRebatesBatch",
            "outputs": [{"internalType": "uint256[]", "name": "recordIds", "type": "uint256[]"}],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "address", "name": "authority", "type": "address"}],
            "name": "removeAuthority",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "renounceOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
            "name": "transferOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {"internalType": "uint256", "name": "recordId", "type": "uint256"},
                {"internalType": "bool", "name": "status", "type": "bool"}
            ],
            "name": "updateRebateStatus",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
};