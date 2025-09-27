/**
 * Example blockchain usage demonstrating Spec Kit methodology
 * This shows how specifications translate into working code
 */

import { Blockchain, Transaction } from '../src/core/blockchain';

// Example 1: Basic blockchain operations
function basicBlockchainExample() {
  console.log('=== Basic Blockchain Example ===');
  
  const blockchain = new Blockchain();
  
  // Create some transactions
  const transactions: Transaction[] = [
    {
      from: 'alice',
      to: 'bob',
      amount: 50,
      fee: 1,
      timestamp: Date.now(),
      signature: 'alice_signature_1'
    },
    {
      from: 'bob',
      to: 'charlie',
      amount: 25,
      fee: 1,
      timestamp: Date.now(),
      signature: 'bob_signature_1'
    }
  ];
  
  // Add transactions to the blockchain
  transactions.forEach(tx => {
    const success = blockchain.addTransaction(tx);
    console.log(`Transaction ${tx.from} → ${tx.to}: ${success ? 'Added' : 'Failed'}`);
  });
  
  // Mine a block
  console.log('Mining block...');
  const minedBlock = blockchain.mineBlock('miner1');
  console.log(`Block #${minedBlock.index} mined with ${minedBlock.transactions.length} transactions`);
  
  // Check chain validity
  const isValid = blockchain.validateChain();
  console.log(`Blockchain valid: ${isValid}`);
  
  // Check balances
  console.log(`Alice balance: ${blockchain.getBalance('alice')}`);
  console.log(`Bob balance: ${blockchain.getBalance('bob')}`);
  console.log(`Charlie balance: ${blockchain.getBalance('charlie')}`);
  console.log(`Miner balance: ${blockchain.getBalance('miner1')}`);
}

// Example 2: Multiple blocks
function multipleBlocksExample() {
  console.log('\n=== Multiple Blocks Example ===');
  
  const blockchain = new Blockchain();
  
  // Add multiple rounds of transactions and mining
  for (let round = 1; round <= 3; round++) {
    console.log(`\n--- Round ${round} ---`);
    
    // Add some transactions
    const tx1: Transaction = {
      from: `user${round}`,
      to: `user${round + 1}`,
      amount: round * 10,
      fee: 1,
      timestamp: Date.now(),
      signature: `signature_${round}_1`
    };
    
    const tx2: Transaction = {
      from: `user${round + 1}`,
      to: `user${round + 2}`,
      amount: round * 5,
      fee: 1,
      timestamp: Date.now(),
      signature: `signature_${round}_2`
    };
    
    blockchain.addTransaction(tx1);
    blockchain.addTransaction(tx2);
    
    // Mine block
    const block = blockchain.mineBlock(`miner${round}`);
    console.log(`Block #${block.index} mined by miner${round}`);
  }
  
  // Display final chain state
  console.log(`\nFinal chain length: ${blockchain.getChain().length}`);
  console.log(`Chain is valid: ${blockchain.validateChain()}`);
}

// Run examples
if (import.meta.url === `file://${process.argv[1]}`) {
  basicBlockchainExample();
  multipleBlocksExample();
}