import hre from "hardhat";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MyToken: approve & transferFrom", () => {
  async function deployFixture() {
    const [signer0, signer1] = await hre.ethers.getSigners();
    const myToken = await hre.ethers.deployContract("MyToken", ["MyToken", "MT", 18, 1]);
    return { myToken, signer0, signer1 };
  }

  it("signer1이 approve 받은 뒤 signer0의 MT를 자신에게 전송한다", async () => {
    const { myToken, signer0, signer1 } = await loadFixture(deployFixture);
    const amount = hre.ethers.parseUnits("1", 18);

    // 배포 직후 signer0이 1 MT 보유
    expect(await myToken.balanceOf(signer0.address)).to.equal(amount);
    expect(await myToken.balanceOf(signer1.address)).to.equal(0n);

    // 1. approve: signer0 -> signer1 권한 부여
    await expect(myToken.connect(signer0).approve(signer1.address, amount))
      .to.emit(myToken, "Approval")
      .withArgs(signer0.address, signer1.address, amount);
    expect(await myToken.allowance(signer0.address, signer1.address)).to.equal(amount);

    // 2. transferFrom: signer1이 signer0의 MT를 자신에게 전송
    await expect(
      myToken.connect(signer1).transferFrom(signer0.address, signer1.address, amount)
    )
      .to.emit(myToken, "Transfer")
      .withArgs(signer0.address, signer1.address, amount);

    // 3. balance 확인
    expect(await myToken.balanceOf(signer0.address)).to.equal(0n);
    expect(await myToken.balanceOf(signer1.address)).to.equal(amount);
    expect(await myToken.allowance(signer0.address, signer1.address)).to.equal(0n);
  });

  it("approve 없이 transferFrom 하면 revert 된다", async () => {
    const { myToken, signer0, signer1 } = await loadFixture(deployFixture);
    await expect(
      myToken.connect(signer1).transferFrom(signer0.address, signer1.address, 1n)
    ).to.be.revertedWith("insufficient allowance");
  });
});
