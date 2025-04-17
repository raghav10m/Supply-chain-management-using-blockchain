let contract;
let accounts;
let isReady = false;  // Flag to track if the contract is ready

// Wait for the page to load and initialize Web3 and the contract
window.addEventListener('load', async () => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    await window.ethereum.enable();  // Request access to the user's Ethereum accounts
  }

  accounts = await web3.eth.getAccounts();  // Get the list of accounts

  // Fetch the contract ABI and address from the JSON artifact
  const res = await fetch('./SupplyChain.json');
  const artifact = await res.json();

  const networkId = await web3.eth.net.getId();  // Get the current network ID
  const deployed = artifact.networks[networkId];  // Get the deployed contract on the current network

  if (deployed) {
    // If deployed contract is found, create a new contract instance
    contract = new web3.eth.Contract(artifact.abi, deployed.address);
    isReady = true;  // Mark the contract as ready
    console.log("Contract is ready.");
  } else {
    alert("❌ Contract not deployed on the current network.");
  }
});

// Function to create a new product
async function createProduct() {
  if (!isReady) {
    alert("⚠️ Contract is still loading. Please try again later.");
    return;
  }

  const id = parseInt(document.getElementById('name').value);  // Get product ID
  const weight = parseInt(document.getElementById('description').value);  // Get product weight
  const priceEth = document.getElementById('price').value;  // Get price in ETH
  const priceWei = web3.utils.toWei(priceEth, 'ether');  // Convert ETH to Wei

  try {
    await contract.methods.createProduct(id, weight, priceWei).send({ from: accounts[0] });
    alert("✅ Product created successfully!");
  } catch (error) {
    alert("❌ Failed to create product: " + error.message);
  }
}

// Function to update product stage
async function updateStage() {
  if (!isReady) {
    alert("⚠️ Contract is still loading. Please try again later.");
    return;
  }

  const id = parseInt(document.getElementById('updateId').value);
  const stage = parseInt(document.getElementById('stage').value);

  try {
    await contract.methods.updateProductStage(id, stage).send({ from: accounts[0] });
    alert("✅ Product stage updated!");
  } catch (error) {
    alert("❌ Failed to update stage: " + error.message);
  }
}

// Function to retrieve product details
async function getProduct() {
  if (!isReady) {
    alert("⚠️ Contract is still loading. Please try again later.");
    return;
  }

  const id = parseInt(document.getElementById('getId').value);

  try {
    const result = await contract.methods.getProduct(id).call();

    document.getElementById('output').textContent =
      `ID: ${result[0]}
Weight: ${result[1]} kg
Price: ${web3.utils.fromWei(result[2], 'ether')} ETH
Stage: ${["Manufactured", "Shipped", "Delivered"][result[3]]}`;
  } catch (error) {
    document.getElementById('output').textContent = "❌ Product not found.";
  }
}
