# Consensus Mechanism Specification

## Overview
This specification defines the Proof of Work (PoW) consensus mechanism for the blockchain.

## Proof of Work Algorithm

### Mining Process
1. **Target Calculation**: Determine difficulty target based on network hash rate
2. **Nonce Search**: Iterate through nonce values to find valid hash
3. **Hash Validation**: Ensure hash meets difficulty requirement (leading zeros)
4. **Block Reward**: Miner receives reward for successful mining

### Difficulty Adjustment
- **Target Block Time**: 10 minutes per block
- **Adjustment Period**: Every 2016 blocks (approximately 2 weeks)
- **Calculation**: Adjust difficulty based on actual vs. target time

### Mining Algorithm
```
while (true) {
  block.nonce = generateNonce()
  hash = sha256(block.header + block.nonce)
  if (hash < target) {
    return block // Valid block found
  }
}
```

## Alternative Consensus (Future)

### Proof of Stake (PoS)
- **Validator Selection**: Based on stake amount and randomization
- **Block Proposal**: Validators take turns proposing blocks
- **Finalization**: Supermajority voting for block finalization
- **Slashing**: Penalties for malicious behavior

## Implementation Requirements

### PoW Functions
- `calculateTarget(difficulty)`: Convert difficulty to hash target
- `adjustDifficulty(blocks)`: Recalculate difficulty based on block times
- `mine(block)`: Mine block until valid nonce found
- `validateWork(block)`: Verify proof-of-work is valid

### Network Consensus
- `selectChain(chains)`: Choose longest valid chain
- `handleFork(newBlock)`: Process competing chain branches
- `syncWithPeers()`: Synchronize with network consensus