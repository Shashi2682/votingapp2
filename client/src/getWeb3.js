import Web3 from "web3";

const getWeb3 = async () => {
  try {
    let web3;

    if (window.ethereum) {
      web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
    } else if (window.web3) {
      web3 = new Web3(window.web3.currentProvider);
      console.log("Injected web3 detected.");
    } else {
      console.log("No MetaMask detected. Using local provider.");
      const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
      web3 = new Web3(provider);
    }

    // Get network ID and convert BigInt to Number if needed
    const networkIdRaw = await web3.eth.net.getId();
    const networkId = Number(networkIdRaw);

    const expectedNetworkId = 11155111; // Sepolia network ID

    const networkNames = {
      1: "Mainnet",
      3: "Ropsten",
      4: "Rinkeby",
      5: "Goerli",
      42: "Kovan",
      11155111: "Sepolia",
    };

    const currentNetworkName = networkNames[networkId] || "Unknown";
    const expectedNetworkName = networkNames[expectedNetworkId] || "Unknown";

    console.log(`🌐 Current Network: ${currentNetworkName} (ID: ${networkId})`);
    console.log(`🎯 Expected Network: ${expectedNetworkName} (ID: ${expectedNetworkId})`);

    if (networkId !== expectedNetworkId) {
      console.warn("⚠️ Network mismatch! Please switch to Sepolia.");
    } else {
      console.log("✅ You are on the correct network: Sepolia.");
    }

    return web3;
  } catch (error) {
    console.error("Error initializing web3:", error);
    return null;
  }
};

export default getWeb3;
