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
      console.log("Contract is ready.");
      loadPostedProducts(); // Load products on startup
    } else {
      alert("❌ Contract not deployed on the current network.");
    }
  } else {
    alert('Please install MetaMask');
  }
});

// Function to purchase a product
async function purchaseProduct(id) {
  if (!isReady) {
    alert("⚠️ Contract is still loading.");
    return;
  }

  const product = await contract.methods.getProduct(id).call();
  const priceWei = product[2]; // Product price in Wei

  try {
    console.log("Attempting to purchase product with ID:", id);
    console.log("Price in Wei:", priceWei);

    const tx = await contract.methods.purchaseProduct(id).send({
      from: accounts[0],
      value: priceWei,
      gas: 2000000 // increase gas limit if necessary
    });

    console.log("Transaction Receipt:", tx); // Log the transaction receipt for debugging
    alert(`✅ Product ID ${id} purchased successfully!`);
    loadPurchasedProducts(); // Refresh the purchased products view
  } catch (error) {
    console.error("Purchase failed:", error); // Log the error details
    alert("❌ Failed to purchase product: " + error.message);
  }
}

// Load posted products (those available for purchase)
async function loadPostedProducts() {
  const container = document.getElementById('postedProducts');
  container.innerHTML = "<p>Loading...</p>";

  try {
    const ids = await contract.methods.getAllProductIds().call();
    if (ids.length === 0) {
      container.innerHTML = "<p class='empty-text'>No products available for purchase</p>";
      return;
    }

    container.innerHTML = '';

    for (let id of ids) {
      const product = await contract.methods.getProduct(id).call();

      const div = document.createElement('a');
      div.className = 'product';
      div.href = '#';

      div.innerHTML = `
        <div class="product-info">
          <p><strong>Product ID: ${id}</strong></p>
          <p>Weight: ${product[1]} kg</p>
          <p>Price: ${web3.utils.fromWei(product[2], 'ether')} ETH</p>
          <p>Status (stage): ${product[3] < 3 ? 'Available for Purchase' : 'Purchased'}</p>
        </div>
      `;

      // If the product is available for purchase, allow clicking to purchase it
      if (product[3] < 3) {
        div.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent default link action
          purchaseProduct(id); // Call the purchase function
        });
      }

      container.appendChild(div);
    }

  } catch (err) {
    container.innerHTML = "⚠️ Failed to load products.";
    console.error(err);
  }
}

// Load purchased products (those owned by the sender)
async function loadPurchasedProducts() {
  const container = document.getElementById('purchasedProducts');
  container.innerHTML = "<p>Loading purchased products...</p>";

  try {
    const ids = await contract.methods.getPurchasedProductIds().call({ from: accounts[0] });
    if (ids.length === 0) {
      container.innerHTML = "<p class='empty-text'>You have not purchased any products</p>";
      return;
    }

    container.innerHTML = '';

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

// Function to connect to MetaMask and display the connected account
async function connectMetaMask() {
  if (!web3) {
    alert('Please install MetaMask');
    return;
  }

  accounts = await web3.eth.getAccounts();
  alert('Connected to MetaMask: ' + accounts[0]);

  if (contract && isReady) {
    loadPostedProducts();
  }
}

// Existing createProduct function (no change)
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

// Existing updateStage function (no change)
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

// Existing getProduct function (no change)
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
