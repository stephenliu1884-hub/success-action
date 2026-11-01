// 加密/解密测试。运行：npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { encrypt, decrypt, unlockAny } from "../crypto.js";

// 全部是假数据
const ACCOUNT = {
  name: "测试朋友",
  email: "test@example.com",
  password: "p@ss-中文-🔑",
  totpSecret: "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ",
};

test("加密后能用正确密码解密回原文", async () => {
  const record = await encrypt(ACCOUNT, "blue-river-2026");
  assert.deepEqual(await decrypt(record, "blue-river-2026"), ACCOUNT);
});

test("密文里看不到明文", async () => {
  const record = await encrypt(ACCOUNT, "blue-river-2026");
  const serialized = JSON.stringify(record);
  assert.ok(!serialized.includes("test@example.com"));
  assert.ok(!serialized.includes(ACCOUNT.totpSecret));
});

test("错误密码会报错", async () => {
  const record = await encrypt(ACCOUNT, "blue-river-2026");
  await assert.rejects(decrypt(record, "blue-river-2025"), /密码错误/);
});

test("同样的数据和密码，每次加密结果都不同（随机 salt 和 IV）", async () => {
  const a = await encrypt(ACCOUNT, "blue-river-2026");
  const b = await encrypt(ACCOUNT, "blue-river-2026");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ciphertext, b.ciphertext);
});

test("密文被篡改会被发现", async () => {
  const record = await encrypt(ACCOUNT, "blue-river-2026");
  const bytes = Uint8Array.from(atob(record.ciphertext), (c) => c.charCodeAt(0));
  bytes[0] ^= 1; // 翻转一个比特
  const tampered = { ...record, ciphertext: btoa(String.fromCharCode(...bytes)) };
  await assert.rejects(decrypt(tampered, "blue-river-2026"), /密码错误/);
});

test("unlockAny 根据密码找到对应的账户", async () => {
  const records = [
    await encrypt({ name: "A" }, "password-a"),
    await encrypt({ name: "B" }, "password-b"),
    await encrypt({ name: "C" }, "password-c"),
  ];
  assert.deepEqual(await unlockAny(records, "password-b"), { name: "B" });
  assert.deepEqual(await unlockAny(records, "password-c"), { name: "C" });
  assert.equal(await unlockAny(records, "wrong"), null);
});
