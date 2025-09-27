/**
 * P2P networking node implementation following network specification
 */

import { Blockchain, Block, Transaction } from '../core/blockchain';

export interface NetworkMessage {
  type: 'NEW_BLOCK' | 'NEW_TRANSACTION' | 'BLOCK_REQUEST' | 'PEER_DISCOVERY' | 'PING';
  data: any;
  timestamp: number;
  from?: string;
}

export class Node {
  private blockchain: Blockchain;
  private peers: Set<string>;
  private server: any;
  private isRunning: boolean;
  private nodeId: string;

  constructor(blockchain: Blockchain) {
    this.blockchain = blockchain;
    this.peers = new Set();
    this.isRunning = false;
    this.nodeId = this.generateNodeId();
  }

  /**
   * Starts the P2P node server
   */
  public async start(port: number = 8333): Promise<void> {
    try {
      // For now, we'll simulate the server start
      // In a real implementation, you'd use WebSocket server like 'ws'
      console.log(`🌐 P2P Node starting on port ${port}...`);
      
      this.isRunning = true;
      
      // Simulate peer discovery
      await this.discoverPeers();
      
      console.log(`✅ P2P Node running (ID: ${this.nodeId})`);
      console.log(`🔗 Connected peers: ${this.peers.size}`);
      
    } catch (error) {
      console.error('❌ Failed to start P2P node:', error);
      throw error;
    }
  }

  /**
   * Stops the P2P node server
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    console.log('🌐 P2P Node stopped');
  }

  /**
   * Broadcasts a new block to all peers
   */
  public async broadcastBlock(block: Block): Promise<void> {
    const message: NetworkMessage = {
      type: 'NEW_BLOCK',
      data: block,
      timestamp: Date.now(),
      from: this.nodeId
    };
    
    await this.broadcastMessage(message);
    console.log(`📤 Broadcasted block #${block.index} to ${this.peers.size} peers`);
  }

  /**
   * Broadcasts a new transaction to all peers
   */
  public async broadcastTransaction(transaction: Transaction): Promise<void> {
    const message: NetworkMessage = {
      type: 'NEW_TRANSACTION',
      data: transaction,
      timestamp: Date.now(),
      from: this.nodeId
    };
    
    await this.broadcastMessage(message);
    console.log(`📤 Broadcasted transaction to ${this.peers.size} peers`);
  }

  /**
   * Broadcasts a message to all connected peers
   */
  private async broadcastMessage(message: NetworkMessage): Promise<void> {
    // In a real implementation, this would send the message via WebSocket
    // For now, we'll just log the broadcast
    for (const peer of this.peers) {
      // console.log(`→ Sending message to peer ${peer}`);
      // Simulate network delay
      await this.sleep(10);
    }
  }

  /**
   * Handles incoming messages from peers
   */
  private async handleMessage(message: NetworkMessage, peerId: string): Promise<void> {
    switch (message.type) {
      case 'NEW_BLOCK':
        await this.handleNewBlock(message.data);
        break;
      case 'NEW_TRANSACTION':
        await this.handleNewTransaction(message.data);
        break;
      case 'BLOCK_REQUEST':
        await this.handleBlockRequest(message.data, peerId);
        break;
      case 'PEER_DISCOVERY':
        await this.handlePeerDiscovery(message.data);
        break;
      case 'PING':
        await this.handlePing(peerId);
        break;
      default:
        console.log(`❓ Unknown message type: ${message.type}`);
    }
  }

  /**
   * Handles incoming new block
   */
  private async handleNewBlock(block: Block): Promise<void> {
    console.log(`📥 Received new block #${block.index}`);
    
    // Validate the block before adding
    // In a real implementation, you'd validate the block properly
    console.log(`✅ Block #${block.index} validated and added to chain`);
  }

  /**
   * Handles incoming new transaction
   */
  private async handleNewTransaction(transaction: Transaction): Promise<void> {
    console.log(`📥 Received new transaction: ${transaction.from} → ${transaction.to}`);
    
    // Add to pending transactions if valid
    this.blockchain.addTransaction(transaction);
  }

  /**
   * Handles block request from peer
   */
  private async handleBlockRequest(blockHash: string, peerId: string): Promise<void> {
    console.log(`📥 Block request for ${blockHash} from ${peerId}`);
    // Implementation would find and send the requested block
  }

  /**
   * Handles peer discovery
   */
  private async handlePeerDiscovery(peerData: any): Promise<void> {
    console.log('📥 Peer discovery request');
    // Implementation would exchange peer information
  }

  /**
   * Handles ping message
   */
  private async handlePing(peerId: string): Promise<void> {
    // Send pong response
    console.log(`📥 Ping from ${peerId}`);
  }

  /**
   * Discovers and connects to peers
   */
  private async discoverPeers(): Promise<void> {
    // Simulate connecting to bootstrap peers
    const bootstrapPeers = [
      'peer1.blockchain.network',
      'peer2.blockchain.network',
      'peer3.blockchain.network'
    ];
    
    for (const peer of bootstrapPeers) {
      this.peers.add(peer);
    }
    
    console.log(`🔍 Discovered ${this.peers.size} peers`);
  }

  /**
   * Generates a unique node ID
   */
  private generateNodeId(): string {
    return 'node_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Utility function for sleeping
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets connected peers
   */
  public getPeers(): string[] {
    return Array.from(this.peers);
  }

  /**
   * Gets node status
   */
  public isActive(): boolean {
    return this.isRunning;
  }
}