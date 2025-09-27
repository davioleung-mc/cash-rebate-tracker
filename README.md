# Blockchain with Spec Kit

A blockchain implementation built using GitHub's **Spec Kit** methodology for spec-driven development. This project demonstrates how to build complex systems by writing detailed specifications first, then implementing them with AI assistance.

## 🎯 What is Spec Kit?

[Spec Kit](https://github.com/github/spec-kit) is GitHub's framework for **Spec-Driven Development** - a methodology that emphasizes:

1. **Write detailed specifications first** (in the `/specs` directory)
2. **Use AI assistance** (GitHub Copilot) to implement the specifications
3. **Follow the spec → implement → test → refine cycle**
4. **Document all architectural decisions and trade-offs**

## 🚀 Project Overview

This blockchain implementation includes:

- **Core Blockchain**: Block and transaction management with validation
- **Proof of Work Consensus**: Mining algorithm with difficulty adjustment
- **P2P Networking**: Peer-to-peer communication for decentralization
- **Cryptographic Security**: Hash functions and digital signatures
- **Modular Architecture**: Clean separation of concerns

## 📁 Project Structure

```
├── specs/                    # Detailed specifications (Spec Kit methodology)
│   ├── core-blockchain.md    # Core blockchain components
│   ├── consensus-mechanism.md # Proof of Work consensus
│   └── p2p-networking.md     # P2P networking protocol
├── src/                      # Implementation code
│   ├── core/                 # Core blockchain logic
│   ├── consensus/            # Mining and consensus
│   ├── networking/           # P2P networking
│   └── crypto/               # Cryptographic utilities
├── tests/                    # Test suites
├── docs/                     # Additional documentation
└── examples/                 # Usage examples
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- TypeScript

### Installation

1. **Clone and setup**:
   ```bash
   cd blockchain-spec-kit
   npm install
   ```

2. **Build the project**:
   ```bash
   npm run build
   ```

3. **Run the blockchain node**:
   ```bash
   npm start
   ```

4. **Development mode** (with auto-reload):
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with auto-reload
- `npm start` - Run the compiled blockchain node
- `npm test` - Run the test suite
- `npm run lint` - Lint the code
- `npm run format` - Format code with Prettier
- `npm run spec:validate` - Validate specifications

## 📋 Spec-Driven Development Workflow

This project follows the Spec Kit methodology:

### 1. Read the Specifications
Start by reading the specifications in `/specs/`:
- `core-blockchain.md` - Understand the blockchain structure
- `consensus-mechanism.md` - Learn about the mining process
- `p2p-networking.md` - Understand network communication

### 2. Implement Following Specs
The implementation in `/src/` directly corresponds to the specifications:
- Each spec defines interfaces, requirements, and behavior
- Implementation follows the spec exactly
- Any deviations are documented and justified

### 3. Test Against Specs
Tests verify that implementation matches specifications:
- Unit tests for individual components
- Integration tests for component interaction
- Spec compliance tests

### 4. Refine and Iterate
- Update specifications when requirements change
- Re-implement based on updated specs
- Maintain spec-code alignment

## 🔧 Key Components

### Blockchain Core (`src/core/blockchain.ts`)
Implements the core blockchain specification with:
- Block structure and validation
- Transaction management
- Chain validation
- Balance calculation

### Mining (`src/consensus/miner.ts`)
Implements Proof of Work consensus:
- Block mining with nonce search
- Difficulty adjustment
- Mining rewards
- Network synchronization

### P2P Networking (`src/networking/node.ts`)
Implements peer-to-peer communication:
- WebSocket-based messaging
- Peer discovery and management
- Block and transaction broadcasting
- Network consensus

## 📊 Example Usage

```typescript
import { Blockchain } from './src/core/blockchain.js';

// Create a new blockchain
const blockchain = new Blockchain();

// Add a transaction
const transaction = {
  from: 'alice',
  to: 'bob',
  amount: 10,
  fee: 1,
  timestamp: Date.now(),
  signature: 'signature_hash'
};

blockchain.addTransaction(transaction);

// Mine a block
const newBlock = blockchain.mineBlock('miner_address');
console.log('New block mined:', newBlock);

// Check balance
const balance = blockchain.getBalance('alice');
console.log('Alice balance:', balance);
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 🤝 Contributing

This project uses Spec-Driven Development:

1. **Update specifications first** in `/specs/`
2. **Implement changes** to match updated specs
3. **Add tests** to verify spec compliance
4. **Document** any architectural decisions

## 📚 Learning Resources

- [Spec Kit Documentation](https://github.com/github/spec-kit)
- [GitHub Copilot Best Practices](https://docs.github.com/en/copilot)
- [Blockchain Fundamentals](https://ethereum.org/en/developers/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using Spec Kit methodology and GitHub Copilot**