// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CashRebateTracker
 * @dev Smart contract for tracking cash rebate records with authority-controlled access
 * @notice This contract implements the rebate tracking specification for transparent rebate management
 */
contract CashRebateTracker is Ownable, ReentrancyGuard {
    
    /// @dev Structure to store individual rebate records
    struct RebateRecord {
        string clientId;           // Unique client identifier
        string productId;          // Product associated with rebate
        uint256 amount;           // Rebate amount in wei
        uint256 timestamp;        // Block timestamp of record creation
        address recordedBy;       // Authority address that recorded the rebate
        string transactionHash;   // Reference transaction hash (optional)
        bool isActive;           // Status flag for record validity
    }
    
    /// @dev Counter for generating unique record IDs
    uint256 private _recordCounter;
    
    /// @dev Mapping from record ID to rebate record
    mapping(uint256 => RebateRecord) private _rebateRecords;
    
    /// @dev Mapping from client ID to array of their record IDs
    mapping(string => uint256[]) private _clientRecords;
    
    /// @dev Mapping from product ID to array of record IDs
    mapping(string => uint256[]) private _productRecords;
    
    /// @dev Mapping to track authorized addresses
    mapping(address => bool) private _authorities;
    
    /// @dev Mapping to track total rebate amounts per client
    mapping(string => uint256) private _clientTotals;
    
    // Events
    event RebateRecorded(
        uint256 indexed recordId,
        string indexed clientId,
        string indexed productId,
        uint256 amount,
        address recordedBy,
        string transactionHash
    );
    
    event AuthorityAdded(address indexed authority, address indexed addedBy);
    event AuthorityRemoved(address indexed authority, address indexed removedBy);
    event RebateStatusUpdated(uint256 indexed recordId, bool status, address updatedBy);
    
    // Modifiers
    modifier onlyAuthorized() {
        require(_authorities[msg.sender] || msg.sender == owner(), "Not authorized to record rebates");
        _;
    }
    
    modifier validRecordId(uint256 recordId) {
        require(recordId < _recordCounter, "Invalid record ID");
        _;
    }
    
    modifier validClientId(string memory clientId) {
        require(bytes(clientId).length > 0, "Client ID cannot be empty");
        _;
    }
    
    modifier validProductId(string memory productId) {
        require(bytes(productId).length > 0, "Product ID cannot be empty");
        _;
    }
    
    modifier validAmount(uint256 amount) {
        require(amount > 0, "Rebate amount must be greater than zero");
        _;
    }
    
    /**
     * @dev Constructor - sets the deployer as the initial owner
     * @param initialAuthorities Array of addresses to set as initial authorities
     */
    constructor(address[] memory initialAuthorities) Ownable(msg.sender) {
        _recordCounter = 0;
        
        // Add initial authorities
        for (uint256 i = 0; i < initialAuthorities.length; i++) {
            if (initialAuthorities[i] != address(0)) {
                _authorities[initialAuthorities[i]] = true;
                emit AuthorityAdded(initialAuthorities[i], msg.sender);
            }
        }
    }
    
    // Authority Management Functions
    
    /**
     * @dev Add a new authority address (owner only)
     * @param authority Address to grant authority privileges
     */
    function addAuthority(address authority) external onlyOwner {
        require(authority != address(0), "Cannot add zero address as authority");
        require(!_authorities[authority], "Address is already an authority");
        
        _authorities[authority] = true;
        emit AuthorityAdded(authority, msg.sender);
    }
    
    /**
     * @dev Remove an authority address (owner only)
     * @param authority Address to revoke authority privileges
     */
    function removeAuthority(address authority) external onlyOwner {
        require(_authorities[authority], "Address is not an authority");
        
        _authorities[authority] = false;
        emit AuthorityRemoved(authority, msg.sender);
    }
    
    /**
     * @dev Check if an address is authorized
     * @param addr Address to check
     * @return bool True if address is authorized
     */
    function isAuthorized(address addr) external view returns (bool) {
        return _authorities[addr] || addr == owner();
    }
    
    // Rebate Recording Functions
    
    /**
     * @dev Record a new rebate transaction (authorities only)
     * @param clientId Unique identifier for the client
     * @param productId Product associated with the rebate
     * @param amount Rebate amount in wei
     * @param txHash Optional reference transaction hash
     * @return recordId The ID of the newly created record
     */
    function recordRebate(
        string memory clientId,
        string memory productId,
        uint256 amount,
        string memory txHash
    ) 
        external 
        onlyAuthorized 
        validClientId(clientId) 
        validProductId(productId) 
        validAmount(amount)
        nonReentrant
        returns (uint256 recordId) 
    {
        recordId = _recordCounter;
        
        // Create the rebate record
        _rebateRecords[recordId] = RebateRecord({
            clientId: clientId,
            productId: productId,
            amount: amount,
            timestamp: block.timestamp,
            recordedBy: msg.sender,
            transactionHash: txHash,
            isActive: true
        });
        
        // Update mappings
        _clientRecords[clientId].push(recordId);
        _productRecords[productId].push(recordId);
        _clientTotals[clientId] += amount;
        
        // Increment counter
        _recordCounter++;
        
        // Emit event
        emit RebateRecorded(recordId, clientId, productId, amount, msg.sender, txHash);
        
        return recordId;
    }
    
    /**
     * @dev Record multiple rebates in a single transaction (authorities only)
     * @param clientIds Array of client IDs
     * @param productIds Array of product IDs
     * @param amounts Array of rebate amounts
     * @param txHashes Array of transaction hashes
     * @return recordIds Array of newly created record IDs
     */
    function recordRebatesBatch(
        string[] memory clientIds,
        string[] memory productIds,
        uint256[] memory amounts,
        string[] memory txHashes
    ) external onlyAuthorized nonReentrant returns (uint256[] memory recordIds) {
        require(
            clientIds.length == productIds.length && 
            productIds.length == amounts.length && 
            amounts.length == txHashes.length,
            "Array lengths must match"
        );
        require(clientIds.length > 0, "Cannot process empty batch");
        require(clientIds.length <= 100, "Batch size too large"); // Gas limit protection
        
        recordIds = new uint256[](clientIds.length);
        
        for (uint256 i = 0; i < clientIds.length; i++) {
            recordIds[i] = this.recordRebate(clientIds[i], productIds[i], amounts[i], txHashes[i]);
        }
        
        return recordIds;
    }
    
    /**
     * @dev Update the status of a rebate record (authorities only)
     * @param recordId ID of the record to update
     * @param status New status for the record
     */
    function updateRebateStatus(uint256 recordId, bool status) 
        external 
        onlyAuthorized 
        validRecordId(recordId) 
    {
        RebateRecord storage record = _rebateRecords[recordId];
        require(record.isActive != status, "Status is already set to this value");
        
        // Update client total if deactivating
        if (record.isActive && !status) {
            _clientTotals[record.clientId] -= record.amount;
        } else if (!record.isActive && status) {
            _clientTotals[record.clientId] += record.amount;
        }
        
        record.isActive = status;
        emit RebateStatusUpdated(recordId, status, msg.sender);
    }
    
    // Query Functions (Public)
    
    /**
     * @dev Get a specific rebate record
     * @param recordId ID of the record to retrieve
     * @return RebateRecord The rebate record
     */
    function getRebateRecord(uint256 recordId) 
        external 
        view 
        validRecordId(recordId) 
        returns (RebateRecord memory) 
    {
        return _rebateRecords[recordId];
    }
    
    /**
     * @dev Get all rebate record IDs for a specific client
     * @param clientId Client identifier
     * @return uint256[] Array of record IDs
     */
    function getClientRecordIds(string memory clientId) 
        external 
        view 
        validClientId(clientId) 
        returns (uint256[] memory) 
    {
        return _clientRecords[clientId];
    }
    
    /**
     * @dev Get all rebate records for a specific client
     * @param clientId Client identifier
     * @return RebateRecord[] Array of rebate records
     */
    function getClientRebates(string memory clientId) 
        external 
        view 
        validClientId(clientId) 
        returns (RebateRecord[] memory) 
    {
        uint256[] memory recordIds = _clientRecords[clientId];
        RebateRecord[] memory records = new RebateRecord[](recordIds.length);
        
        for (uint256 i = 0; i < recordIds.length; i++) {
            records[i] = _rebateRecords[recordIds[i]];
        }
        
        return records;
    }
    
    /**
     * @dev Get all rebate record IDs for a specific product
     * @param productId Product identifier
     * @return uint256[] Array of record IDs
     */
    function getProductRecordIds(string memory productId) 
        external 
        view 
        validProductId(productId) 
        returns (uint256[] memory) 
    {
        return _productRecords[productId];
    }
    
    /**
     * @dev Get all rebate records for a specific product
     * @param productId Product identifier
     * @return RebateRecord[] Array of rebate records
     */
    function getProductRebates(string memory productId) 
        external 
        view 
        validProductId(productId) 
        returns (RebateRecord[] memory) 
    {
        uint256[] memory recordIds = _productRecords[productId];
        RebateRecord[] memory records = new RebateRecord[](recordIds.length);
        
        for (uint256 i = 0; i < recordIds.length; i++) {
            records[i] = _rebateRecords[recordIds[i]];
        }
        
        return records;
    }
    
    /**
     * @dev Get the total rebate amount for a client (active records only)
     * @param clientId Client identifier
     * @return uint256 Total rebate amount in wei
     */
    function getClientTotalAmount(string memory clientId) 
        external 
        view 
        validClientId(clientId) 
        returns (uint256) 
    {
        return _clientTotals[clientId];
    }
    
    /**
     * @dev Get the total number of rebate records created
     * @return uint256 Total record count
     */
    function getTotalRecords() external view returns (uint256) {
        return _recordCounter;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalRecords Total number of records
     * @return totalActiveRecords Number of active records
     * @return totalRebateAmount Total rebate amount across all records
     */
    function getContractStats() external view returns (
        uint256 totalRecords,
        uint256 totalActiveRecords,
        uint256 totalRebateAmount
    ) {
        totalRecords = _recordCounter;
        totalActiveRecords = 0;
        totalRebateAmount = 0;
        
        for (uint256 i = 0; i < _recordCounter; i++) {
            if (_rebateRecords[i].isActive) {
                totalActiveRecords++;
                totalRebateAmount += _rebateRecords[i].amount;
            }
        }
        
        return (totalRecords, totalActiveRecords, totalRebateAmount);
    }
}