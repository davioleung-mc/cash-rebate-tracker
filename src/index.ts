/**
 * Main entry point for the blockchain application
 * Implements the Spec Kit methodology for blockchain development
 */

import { Blockchain } from './core/blockchain';
import { Node } from './networking/node';
import { Miner } from './consensus/miner';

async function main() {
  console.log('🚀 Starting Blockchain Node...');
  
  // Initialize blockchain
  const blockchain = new Blockchain();
  
  // Initialize P2P node
  const node = new Node(blockchain);
  
  // Initialize miner
  const miner = new Miner(blockchain, node);
  
  // Start services
  await node.start(8333);
  await miner.start();
  
  console.log('✅ Blockchain node is running');
  console.log(`📊 Current chain length: ${blockchain.getChain().length}`);
  console.log(`🌐 P2P node listening on port 8333`);
  
  // Example: Create a transaction
  const transaction = {
    from: 'genesis',
    to: 'alice',
    amount: 50,
    fee: 1,
    timestamp: Date.now(),
    signature: 'genesis_signature'
  };
  
  blockchain.addTransaction(transaction);
  console.log('💰 Added example transaction');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Shutting down blockchain node...');
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ Failed to start blockchain node:', error);
  process.exit(1);
});