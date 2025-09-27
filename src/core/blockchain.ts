/**
 * Core blockchain implementation following the blockchain specification
 * Implements block and transaction management with validation
 */

import { createHash } from 'crypto';

export interface Transaction {
  from: string;
  to: string;
  amount: number;
  fee: number;
  timestamp: number;
  signature: string;
}

export interface Block {
  index: number;
  previousHash: string;
  timestamp: number;
  transactions: Transaction[];
  nonce: number;
  hash: string;
}

export class Blockchain {
  private chain: Block[];
  private pendingTransactions: Transaction[];
  private difficulty: number;

  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = 4; // Number of leading zeros required
  }

  /**
   * Creates the genesis block (first block in the chain)
   */
  private createGenesisBlock(): Block {
    const genesisBlock: Block = {
      index: 0,
      previousHash: '0',
      timestamp: Date.now(),
      transactions: [],
      nonce: 0,
      hash: ''
    };
    
    genesisBlock.hash = this.calculateHash(genesisBlock);
    return genesisBlock;
  }

  /**
   * Calculates the SHA-256 hash of a block
   */
  private calculateHash(block: Block): string {
    const blockString = block.index + 
                       block.previousHash + 
                       block.timestamp + 
                       JSON.stringify(block.transactions) + 
                       block.nonce;
    
    return createHash('sha256').update(blockString).digest('hex');
  }

  /**
   * Gets the latest block in the chain
   */
  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Adds a new transaction to the pending pool
   */
  public addTransaction(transaction: Transaction): boolean {
    // Basic transaction validation
    if (!this.isValidTransaction(transaction)) {
      return false;
    }
    
    this.pendingTransactions.push(transaction);
    return true;
  }

  /**
   * Validates a transaction
   */
  private isValidTransaction(transaction: Transaction): boolean {
    // Basic validation - can be extended with signature verification, balance checks, etc.
    return transaction.from !== '' && 
           transaction.to !== '' && 
           transaction.amount > 0 && 
           transaction.fee >= 0;
  }

  /**
   * Mines a new block with pending transactions
   */
  public mineBlock(minerAddress: string): Block {
    // Add mining reward transaction
    const rewardTransaction: Transaction = {
      from: 'system',
      to: minerAddress,
      amount: 50, // Block reward
      fee: 0,
      timestamp: Date.now(),
      signature: 'system_reward'
    };
    
    const transactions = [...this.pendingTransactions, rewardTransaction];
    
    const newBlock: Block = {
      index: this.chain.length,
      previousHash: this.getLatestBlock().hash,
      timestamp: Date.now(),
      transactions: transactions,
      nonce: 0,
      hash: ''
    };
    
    // Mine the block (find valid nonce)
    newBlock.hash = this.mineBlockWithProofOfWork(newBlock);
    
    // Add block to chain and clear pending transactions
    this.chain.push(newBlock);
    this.pendingTransactions = [];
    
    return newBlock;
  }

  /**
   * Implements proof-of-work mining algorithm
   */
  private mineBlockWithProofOfWork(block: Block): string {
    const target = '0'.repeat(this.difficulty);
    
    while (true) {
      const hash = this.calculateHash(block);
      
      if (hash.substring(0, this.difficulty) === target) {
        console.log(`⛏️  Block mined: ${hash} (nonce: ${block.nonce})`);
        return hash;
      }
      
      block.nonce++;
    }
  }

  /**
   * Validates the entire blockchain
   */
  public validateChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      // Verify current block hash
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        return false;
      }
      
      // Verify link to previous block
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
      
      // Verify proof of work
      const target = '0'.repeat(this.difficulty);
      if (currentBlock.hash.substring(0, this.difficulty) !== target) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Gets the complete blockchain
   */
  public getChain(): Block[] {
    return this.chain;
  }

  /**
   * Gets pending transactions
   */
  public getPendingTransactions(): Transaction[] {
    return this.pendingTransactions;
  }

  /**
   * Gets balance for an address
   */
  public getBalance(address: string): number {
    let balance = 0;
    
    for (const block of this.chain) {
      for (const transaction of block.transactions) {
        if (transaction.from === address) {
          balance -= (transaction.amount + transaction.fee);
        }
        if (transaction.to === address) {
          balance += transaction.amount;
        }
      }
    }
    
    return balance;
  }
}