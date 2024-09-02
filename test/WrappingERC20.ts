import { WrappingERC20 } from "../types/contracts/WrappingERC20";
import hre, { ethers } from 'hardhat';
import { Permit } from "fhenixjs";

describe('Test WERC20', () =>  {
  let contractAddr: string;
  let contract: WrappingERC20;
  let permit: Permit;
  let owner: string;
  let destination: string = "0x1245dD4AdB920c460773a105e1B3345707B4834A";

  const amountToSend = BigInt(1);

  it(`Test Contract Deployment`, async () => {
    const { ethers, fhenixjs } = hre;
    const { deploy } = hre.deployments;
    const [signer] = await ethers.getSigners();

    // Set the owner to the signer's address
    owner = signer.address;

    // Deploy the WrappingERC20 contract
    const token = await deploy("WrappingERC20", {
      from: signer.address,
      args: ["Test Token", "TST"],
      log: true,
      skipIfAlreadyDeployed: false,
    });

    // Get the deployed contract address
    contractAddr = token.address;

    // Generate the permit using FhenixJS
    permit = await fhenixjs.generatePermit(contractAddr, undefined, signer);
    contract = (await ethers.getContractAt("WrappingERC20", contractAddr)) as unknown as WrappingERC20;

    console.log(`contractAddr: `, contractAddr);
  });
  it(`Wrap Tokens`, async () => {
    // Get the balance before wrapping
    let balanceBefore = await contract.balanceOf(owner);
    let privateBalanceBefore = await contract.getBalanceEncrypted(permit);
    console.log(`Public Balance before wrapping: ${balanceBefore}`);
    console.log(`Private Balance before wrapping: ${privateBalanceBefore}`);

    // Wrap the tokens
    await contract.wrap(amountToSend);

    // Get the balance after wrapping
    let balanceAfter = await contract.balanceOf(owner);
    let privateBalanceAfter = await contract.getBalanceEncrypted(permit);
    console.log(`Public Balance after wrapping: ${balanceAfter.toString()}`);
    console.log(`Private Balance after wrapping: ${privateBalanceAfter.toString()}`);
  });
  it(`Execute Transaction`, async () => {
    // Get the private balance before sending
    let privateBalanceBefore = await contract.getBalanceEncrypted(permit);
    console.log(`Private Balance before sending: ${privateBalanceBefore}`);

    // Encrypt the amount to send
    const encrypted = await hre.fhenixjs.encrypt_uint32(Number(amountToSend));

    // Transfer the encrypted amount
    await contract.transferEncrypted(destination, encrypted);

    // Get the private balance after sending
    let privateBalanceAfter = await contract.getBalanceEncrypted(permit);
    console.log(`Private Balance after sending: ${privateBalanceAfter}`);
  });
});