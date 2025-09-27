# P2P Network Specification

## Overview
This specification defines the peer-to-peer networking layer for blockchain nodes.

## Network Architecture

### Node Types
- **Full Nodes**: Store complete blockchain and validate all transactions
- **Light Nodes**: Store only block headers, request data as needed
- **Mining Nodes**: Full nodes that participate in block mining

### Communication Protocol
- **Protocol**: WebSocket for real-time communication
- **Message Format**: JSON-based messaging
- **Encryption**: TLS for secure connections
- **Discovery**: Bootstrap nodes and peer exchange

## Message Types

### Block Messages
- `NEW_BLOCK`: Broadcast newly mined block
- `BLOCK_REQUEST`: Request specific block by hash
- `BLOCK_RESPONSE`: Send requested block data

### Transaction Messages
- `NEW_TRANSACTION`: Broadcast new transaction
- `TRANSACTION_REQUEST`: Request specific transaction
- `MEMPOOL_SYNC`: Synchronize pending transactions

### Network Messages
- `PEER_DISCOVERY`: Exchange peer information
- `PING/PONG`: Keep-alive and latency measurement
- `VERSION`: Node version and capability negotiation

## Network Behavior

### Peer Management
1. **Connection Limits**: Maximum 8 outbound, 125 inbound connections
2. **Peer Selection**: Prefer stable, low-latency peers
3. **Reputation System**: Track peer reliability and ban misbehaving nodes
4. **Geographic Diversity**: Connect to geographically distributed peers

### Data Propagation
1. **Flood Routing**: Broadcast to all connected peers
2. **Duplicate Detection**: Track message IDs to prevent loops
3. **Rate Limiting**: Prevent spam and DoS attacks
4. **Priority Routing**: Prioritize block announcements over transactions

## Implementation Requirements

### Core Functions
- `connectToPeer(address)`: Establish connection to peer
- `broadcastMessage(message)`: Send message to all peers
- `handleIncomingMessage(message, peer)`: Process received messages
- `managePeerConnections()`: Maintain optimal peer set

### Network Services
- `startNode(port)`: Initialize and start P2P node
- `discoverPeers()`: Find and connect to network peers
- `syncBlockchain()`: Download blockchain from peers
- `announceBlock(block)`: Broadcast new block to network