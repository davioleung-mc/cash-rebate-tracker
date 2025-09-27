import hre from "hardhat";
const { ethers } = hre;
import "dotenv/config";

async function main() {
  console.log("🚀 Deploying CashRebateTracker to Polygon...");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Get deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "MATIC");
  
  // Check if we have enough balance for deployment
  if (balance < ethers.parseEther("0.01")) {
    console.warn("⚠️  Warning: Low balance. You may need more MATIC for deployment.");
    console.log("🔗 Get testnet MATIC from: https://faucet.polygon.technology/");
  }
  
  // Define initial authorities (you can modify these addresses)
  const initialAuthorities = [
    deployer.address, // Deployer as initial authority
    // Add more authority addresses here if needed
    // "0x1234567890123456789012345678901234567890",
  ];
  
  console.log("👥 Initial authorities:", initialAuthorities);
  
  // Deploy the contract
  const CashRebateTracker = await ethers.getContractFactory("CashRebateTracker");
  console.log("⏳ Deploying contract...");
  
  const rebateTracker = await CashRebateTracker.deploy(initialAuthorities);
  await rebateTracker.waitForDeployment();
  
  const contractAddress = await rebateTracker.getAddress();
  console.log("✅ CashRebateTracker deployed to:", contractAddress);
  
  // Verify deployment
  const owner = await rebateTracker.owner();
  const totalRecords = await rebateTracker.getTotalRecords();
  const isDeployerAuthorized = await rebateTracker.isAuthorized(deployer.address);
  
  console.log("\n📊 Contract Information:");
  console.log("👑 Owner:", owner);
  console.log("📈 Total Records:", totalRecords.toString());
  console.log("🔐 Deployer Authorized:", isDeployerAuthorized);
  
  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());
  
  // Generate explorer links
  if (network.chainId === 80002n) { // Amoy Testnet
    console.log("🔍 View on Amoy PolygonScan:");
    console.log(`   https://amoy.polygonscan.com/address/${contractAddress}`);
  } else if (network.chainId === 137n) { // Polygon Mainnet
    console.log("🔍 View on PolygonScan:");
    console.log(`   https://polygonscan.com/address/${contractAddress}`);
  }
  
  // Save deployment information
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: {
      name: network.name,
      chainId: network.chainId.toString()
    },
    deployer: deployer.address,
    initialAuthorities: initialAuthorities,
    deploymentTime: new Date().toISOString(),
    transactionHash: rebateTracker.deploymentTransaction()?.hash
  };
  
  console.log("\n💾 Deployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  // Example usage demonstration
  console.log("\n🧪 Testing basic functionality...");
  
  try {
    // Record a test rebate
    const testRebate = await rebateTracker.recordRebate(
      "TEST_CLIENT_001",
      "TEST_PRODUCT_001", 
      ethers.parseEther("0.001"), // 0.001 MATIC rebate
      "0xtest123456789"
    );
    
    console.log("✅ Test rebate recorded. Transaction hash:", testRebate.hash);
    
    // Wait for confirmation
    await testRebate.wait();
    
    // Query the rebate
    const recordId = 0;
    const rebateRecord = await rebateTracker.getRebateRecord(recordId);
    console.log("📋 Test rebate details:");
    console.log("   Client ID:", rebateRecord.clientId);
    console.log("   Product ID:", rebateRecord.productId);
    console.log("   Amount:", ethers.formatEther(rebateRecord.amount), "MATIC");
    console.log("   Recorded by:", rebateRecord.recordedBy);
    console.log("   Active:", rebateRecord.isActive);
    
  } catch (error) {
    console.log("⚠️  Test transaction failed (this is normal on mainnet):", error.message);
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Next steps:");
  console.log("1. Save the contract address for your applications");
  console.log("2. Add additional authorities using addAuthority() if needed");
  console.log("3. Start recording rebate transactions");
  console.log("4. Build your frontend to interact with the contract");
  
  return {
    contractAddress,
    deploymentInfo
  };
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

export default main;