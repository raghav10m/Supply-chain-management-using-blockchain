let contract;
let accounts;

window.addEventListener('load', async () => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    await window.ethereum.enable();
  }

  accounts = await web3.eth.getAccounts();

  const res = await fetch('./SupplyChain.json'); // We'll set this up shortly
  const artifact = await res.json();

  const networkId = await web3.eth.net.getId();
  const deployed = artifact.networks[networkId];

  contract = new web3.eth.Contract(artifact.abi, '0x7591EB142a36C439D9CFc63aDA448E2A3D2B3154');
});

async function createProduct() {
  const name = document.getElementById('name').value;
  const desc = document.getElementById('description').value;

  await contract.methods.createProduct(name, desc).send({ from: accounts[0] });
  alert("Product created!");
}

async function updateStage() {
  const id = document.getElementById('updateId').value;
  const stage = document.getElementById('stage').value;

  await contract.methods.updateProductStage(id, stage).send({ from: accounts[0] });
  alert("Product stage updated!");
}

async function getProduct() {
  const id = document.getElementById('getId').value;
  const result = await contract.methods.getProduct(id).call();

  document.getElementById('output').textContent =
    `ID: ${result[0]}\nName: ${result[1]}\nDescription: ${result[2]}\nStage: ${["Manufactured", "Shipped", "Delivered"][result[3]]}`;
}
