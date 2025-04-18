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
      const product = await contract.methods.products(id).call();

      const div = document.createElement('a');
      div.className = 'product';
      div.href = '#';

      div.innerHTML = `
        <div class="product-info">
          <p><strong>Product ID: ${id}</strong></p>
          <p>Weight: ${product.weight} kg</p>
          <p>Price: ${web3.utils.fromWei(product.price, 'ether')} ETH</p>
          <p>Status (stage): ${product.stage}</p>
        </div>
      `;

      div.addEventListener('click', () => handleProductClick(id));
      container.appendChild(div);
    }

  } catch (err) {
    container.innerHTML = "⚠️ Failed to load products.";
    console.error(err);
  }
}

async function handleProductClick(id) {
  if (!isReady) {
    alert("⚠️ Contract is still loading.");
    return;
  }

  try {
    const product = await contract.methods.products(id).call();
    const nextStage = parseInt(product.stage) + 1;

    if (nextStage > 5) {
      alert("✅ Product has already reached the final stage.");
      return;
    }

    await contract.methods.updateProductStage(id, nextStage).send({ from: accounts[0] });
    alert(`✅ Product ID ${id} moved to stage ${nextStage}`);
    loadPostedProducts();
  } catch (error) {
    alert("❌ Failed to update product stage: " + error.message);
  }
}
