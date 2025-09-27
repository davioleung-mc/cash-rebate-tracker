/**
 * Proof-of-Work miner implementation following consensus specification
 */

import { Blockchain, Block } from '../core/blockchain';
import { Node } from '../networking/node';

export class Miner {
  private blockchain: Blockchain;
  private node: Node;
  private isMining: boolean;
  private minerAddress: string;

  constructor(blockchain: Blockchain, node: Node, minerAddress: string = 'miner1') {
    this.blockchain = blockchain;
    this.node = node;
    this.isMining = false;
    this.minerAddress = minerAddress;
  }

  /**
   * Starts the mining process
   */
  public async start(): Promise<void> {
    this.isMining = true;
    console.log('⛏️  Miner started');
    
    // Start mining loop
    this.miningLoop();
  }

  /**
   * Stops the mining process
   */
  public stop(): void {
    this.isMining = false;
    console.log('⛏️  Miner stopped');
  }

  /**
   * Main mining loop
   */
  private async miningLoop(): Promise<void> {
    while (this.isMining) {
      try {
        // Check if there are pending transactions to mine
        const pendingTxs = this.blockchain.getPendingTransactions();
        
        if (pendingTxs.length > 0) {
          console.log(`⛏️  Mining block with ${pendingTxs.length} transactions...`);
          
          // Mine a new block
          const newBlock = this.blockchain.mineBlock(this.minerAddress);
          
          console.log(`✅ Block #${newBlock.index} mined successfully!`);
          console.log(`💰 Miner balance: ${this.blockchain.getBalance(this.minerAddress)}`);
          
          // Broadcast the new block to peers
          await this.node.broadcastBlock(newBlock);
        }
        
        // Wait before next mining attempt
        await this.sleep(5000); // 5 second delay
        
      } catch (error) {
        console.error('❌ Mining error:', error);
        await this.sleep(10000); // Wait longer on error
      }
    }
  }

  /**
   * Utility function for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets the current mining status
   */
  public isMiningActive(): boolean {
    return this.isMining;
  }

  /**
   * Gets the miner's address
   */
  public getMinerAddress(): string {
    return this.minerAddress;
  }
}