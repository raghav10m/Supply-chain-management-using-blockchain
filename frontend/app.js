let web3;
let contract;
let accounts;
let isReady = false;

window.addEventListener('load', async () => {
  if (window.ethereum) {
    web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
    accounts = await web3.eth.getAccounts();

    const res = await fetch('./SupplyChain.json');
    const artifact = await res.json();

    const networkId = await web3.eth.net.getId();
    const deployed = artifact.networks[networkId];

    if (deployed) {
      contract = new web3.eth.Contract(artifact.abi, deployed.address);
      isReady = true;
      console.log("✅ Contract is ready.");
    
      const isTransporterPage = document.getElementById('postedShipments') && document.getElementById('AcquiredShipments');
    
      if (isTransporterPage) {
        loadAvailableShipments();
        loadInTransitShipments(); // This will populate the 'Shipments in Transit' section
      } else {
        loadPostedProducts();
        loadPurchasedProducts();
      }
    } else {
      alert("❌ Contract not deployed on the current network.");
    }
    
  } else {
    alert('Please install MetaMask');
  }
});

// Connect MetaMask button
async function connectMetaMask() {
  if (!web3) {
    alert('Please install MetaMask');
    return;
  }

  accounts = await web3.eth.getAccounts();
  alert('Connected to MetaMask: ' + accounts[0]);

  if (contract && isReady) {
    loadPostedProducts();
    loadPurchasedProducts();
  }
}

// Purchase product
async function purchaseProduct(id) {
  if (!isReady) {
    alert("⚠️ Contract is still loading.");
    return;
  }

  const product = await contract.methods.getProduct(id).call();
  const priceWei = product[2];

  try {
    console.log(`Purchasing product ID ${id} for ${priceWei} wei`);

    const tx = await contract.methods.purchaseProduct(id).send({
      from: accounts[0],
      value: priceWei,
      gas: 2000000,
    });

    console.log("Transaction Receipt:", tx);
    alert(`✅ Product ID ${id} purchased successfully!`);

    await loadPostedProducts();    // Refresh posted list
    await loadPurchasedProducts(); // Refresh purchased list
  } catch (error) {
    console.error("❌ Purchase failed:", error);
    alert("❌ Failed to purchase product: " + error.message);
  }
}

// Load products available for purchase
async function loadPostedProducts() {
  const container = document.getElementById('postedProducts');
  container.innerHTML = "<p>Loading...</p>";

  try {
    const ids = await contract.methods.getAllProductIds().call();
    container.innerHTML = "";

    if (ids.length === 0) {
      container.innerHTML = "<p class='empty-text'>No products available for purchase</p>";
      return;
    }

    for (let id of ids) {
      const product = await contract.methods.getProduct(id).call();
      const status = product[3] < 3 ? "Available for Purchase" : "Purchased";

      const div = document.createElement('a');
      div.className = 'product';
      div.href = "#";
      div.innerHTML = `
        <div class="product-info">
          <p><strong>Product ID: ${id}</strong></p>
          <p>Weight: ${product[1]} kg</p>
          <p>Price: ${web3.utils.fromWei(product[2], 'ether')} ETH</p>
          <p>Status (stage): ${status}</p>
        </div>
      `;

      if (product[3] < 3) {
        div.addEventListener('click', (e) => {
          e.preventDefault();
          purchaseProduct(id);
        });
      }

      container.appendChild(div);
    }
  } catch (err) {
    container.innerHTML = "⚠️ Failed to load products.";
    console.error(err);
  }
}

// Load products the user has purchased
async function loadPurchasedProducts() {
  const container = document.getElementById('purchasedProducts');
  container.innerHTML = "<p>Loading purchased products...</p>";

  try {
    const ids = await contract.methods.getPurchasedProductIds().call({ from: accounts[0] });
    container.innerHTML = "";

    if (ids.length === 0) {
      container.innerHTML = "<p class='empty-text'>You have not purchased any products</p>";
      return;
    }

    for (let id of ids) {
      const product = await contract.methods.getProduct(id).call();

      const div = document.createElement('div');
      div.className = 'product';
      div.innerHTML = `
        <div class="product-info">
          <p><strong>Product ID: ${id}</strong></p>
          <p>Weight: ${product[1]} kg</p>
          <p>Price: ${web3.utils.fromWei(product[2], 'ether')} ETH</p>
          <p>Status: Purchased</p>
        </div>
      `;

      container.appendChild(div);
    }
  } catch (err) {
    container.innerHTML = "⚠️ Failed to load purchased products.";
    console.error(err);
  }
}

// (Optional utility functions below if needed elsewhere in your app)

// Create product
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
    loadPostedProducts();
  } catch (error) {
    alert("❌ Failed to create product: " + error.message);
  }
}

// Update product stage
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
    loadPostedProducts();
  } catch (error) {
    alert("❌ Failed to update stage: " + error.message);
  }
}

// Fetch product details
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
Stage: ${["Manufactured", "Shipped", "Delivered", "Purchased"][result[3]] ?? "Unknown"}`;
  } catch (error) {
    document.getElementById('output').textContent = "❌ Product not found.";
  }
}

async function acceptShipment(id) {
  try {
    await contract.methods.acceptShipment(id).send({ from: accounts[0] });
    alert(`✅ Shipment for Product ID ${id} accepted!`);
    loadAvailableShipments(); // Refresh the list
    loadInTransitShipments();
  } catch (error) {
    alert("❌ Failed to accept shipment: " + error.message);
  }
}

async function loadAvailableShipments() {
  const container = document.getElementById('postedShipments');
  container.innerHTML = "<p>Loading available shipments...</p>";

  try {
    const ids = await contract.methods.getAllProductIds().call();
    container.innerHTML = "";

    let found = false;

    for (let id of ids) {
      const product = await contract.methods.getProduct(id).call();

      if (parseInt(product[3]) === 3) { // Status: Purchased
        found = true;

        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
          <div class="product-info">
            <p><strong>Product ID: ${id}</strong></p>
            <p>Weight: ${product[1]} kg</p>
            <p>Price: ${web3.utils.fromWei(product[2], 'ether')} ETH</p>
            <p>Status: Purchased (Awaiting Pickup)</p>
          </div>
          <button class="buy-btn" onclick="acceptShipment(${id})">Accept Shipment</button>
        `;

        container.appendChild(div);
      }
    }

    if (!found) {
      container.innerHTML = "<p class='empty-text'>No shipments available for pickup</p>";
    }
  } catch (err) {
    container.innerHTML = "⚠️ Failed to load available shipments.";
    console.error(err);
  }
}

async function loadInTransitShipments() {
  const container = document.getElementById('AcquiredShipments');
  container.innerHTML = "<p>Loading shipments in transit...</p>";

  try {
    const ids = await contract.methods.getAllProductIds().call();
    container.innerHTML = "";

    for (let id of ids) {
      const product = await contract.methods.getProduct(id).call();

      const div = document.createElement('div');
      div.className = 'product';
      div.innerHTML = `
        <div class="product-info">
          <p><strong>Product ID: ${id}</strong></p>
          <p>Weight: ${product[1]} kg</p>
          <p>Price: ${web3.utils.fromWei(product[2], 'ether')} ETH</p>
          <p>Status Code: ${product[3]}</p>
        </div>
      `;

      container.appendChild(div);
    }

    if (ids.length === 0) {
      container.innerHTML = "<p class='empty-text'>No shipments found</p>";
    }
  } catch (err) {
    container.innerHTML = "⚠ Failed to load shipments.";
    console.error(err);
  }
}


