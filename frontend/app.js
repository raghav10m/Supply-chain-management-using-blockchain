let contract;
let accounts;
let isReady = false;

window.addEventListener('load', async () => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
  }

  accounts = await web3.eth.getAccounts();

  const res = await fetch('./SupplyChain.json');
  const artifact = await res.json();

  const networkId = await web3.eth.net.getId();
  const deployed = artifact.networks[networkId];

  if (deployed) {
    contract = new web3.eth.Contract(artifact.abi, deployed.address);
    isReady = true;
    console.log("Contract is ready.");
    loadPostedProducts(); // Load products on startup
  } else {
    alert("❌ Contract not deployed on the current network.");
  }
});

// Create Product
async function createProduct() {
  if (!isReady) {
    alert("⚠️ Contract is still loading. Please try again later.");
    return;
  }

  const id = parseInt(document.getElementById('name').value);
  const weight = parseInt(document.getElementById('description').value);
  const priceEth = document.getElementById('price').value;
  const priceWei = web3.utils.toWei(priceEth, 'ether');

  try {
    await contract.methods.createProduct(id, weight, priceWei).send({ from: accounts[0] });
    alert("✅ Product created successfully!");
    loadPostedProducts();  // Refresh product list after creation
  } catch (error) {
    alert("❌ Failed to create product: " + error.message);
  }
}

// Update Stage
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
    loadPostedProducts();  // Optional: reload products if stage changes are important
  } catch (error) {
    alert("❌ Failed to update stage: " + error.message);
  }
}

// Get Product by ID
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
Stage: ${["Manufactured", "Shipped", "Delivered"][result[3]] ?? "Unknown"}`;
  } catch (error) {
    document.getElementById('output').textContent = "❌ Product not found.";
  }
}

// Load and display all posted products
async function loadPostedProducts() {
    const container = document.getElementById('postedProducts');
    container.innerHTML = "Loading...";
  
    try {
      const ids = await contract.methods.getAllProductIds().call();
      if (ids.length === 0) {
        container.innerHTML = "No products posted yet.";
        return;
      }
  
      let html = "<ul style='padding-left: 1rem;'>";
      for (let id of ids) {
        const product = await contract.methods.products(id).call();
        html += `<li><strong>ID:</strong> ${product.id}, 
                 <strong>Weight:</strong> ${product.weight} kg, 
                 <strong>Price:</strong> ${web3.utils.fromWei(product.price, 'ether')} ETH,
                 <strong>Stage:</strong> ${product.stage}</li>`;
      }
      html += "</ul>";
      container.innerHTML = html;
    } catch (err) {
      container.innerHTML = "⚠️ Failed to load products.";
      console.error(err);
    }
  }
  
