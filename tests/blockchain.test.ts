/**
 * Blockchain core tests following spec requirements
 */

import { Blockchain, Transaction } from '../src/core/blockchain';

describe('Blockchain Core', () => {
  let blockchain: Blockchain;

  beforeEach(() => {
    blockchain = new Blockchain();
  });

  describe('Genesis Block', () => {
    test('should create genesis block on initialization', () => {
      const chain = blockchain.getChain();
      expect(chain.length).toBe(1);
      expect(chain[0].index).toBe(0);
      expect(chain[0].previousHash).toBe('0');
    });
  });

  describe('Transactions', () => {
    test('should add valid transaction to pending pool', () => {
      const transaction: Transaction = {
        from: 'alice',
        to: 'bob',
        amount: 50,
        fee: 1,
        timestamp: Date.now(),
        signature: 'valid_signature'
      };

      const result = blockchain.addTransaction(transaction);
      expect(result).toBe(true);
      expect(blockchain.getPendingTransactions()).toHaveLength(1);
    });

    test('should reject invalid transaction', () => {
      const invalidTransaction: Transaction = {
        from: '',
        to: 'bob',
        amount: 50,
        fee: 1,
        timestamp: Date.now(),
        signature: 'signature'
      };

      const result = blockchain.addTransaction(invalidTransaction);
      expect(result).toBe(false);
      expect(blockchain.getPendingTransactions()).toHaveLength(0);
    });
  });

  describe('Mining', () => {
    test('should mine block with pending transactions', () => {
      const transaction: Transaction = {
        from: 'alice',
        to: 'bob',
        amount: 25,
        fee: 1,
        timestamp: Date.now(),
        signature: 'signature'
      };

      blockchain.addTransaction(transaction);
      const minedBlock = blockchain.mineBlock('miner1');

      expect(minedBlock.index).toBe(1);
      expect(minedBlock.transactions).toHaveLength(2); // transaction + reward
      expect(blockchain.getChain()).toHaveLength(2);
      expect(blockchain.getPendingTransactions()).toHaveLength(0);
    });
  });

  describe('Chain Validation', () => {
    test('should validate correct blockchain', () => {
      // Add transaction and mine block
      const transaction: Transaction = {
        from: 'alice',
        to: 'bob',
        amount: 30,
        fee: 1,
        timestamp: Date.now(),
        signature: 'signature'
      };

      blockchain.addTransaction(transaction);
      blockchain.mineBlock('miner1');

      expect(blockchain.validateChain()).toBe(true);
    });
  });

  describe('Balance Calculation', () => {
    test('should calculate correct balance', () => {
      // Initial balance should be 0
      expect(blockchain.getBalance('alice')).toBe(0);

      // Add transaction where alice receives money
      const transaction: Transaction = {
        from: 'genesis',
        to: 'alice',
        amount: 100,
        fee: 0,
        timestamp: Date.now(),
        signature: 'genesis_signature'
      };

      blockchain.addTransaction(transaction);
      blockchain.mineBlock('miner1');

      // Alice should have received 100
      expect(blockchain.getBalance('alice')).toBe(100);

      // Miner should have mining reward
      expect(blockchain.getBalance('miner1')).toBe(50);
    });
  });
});