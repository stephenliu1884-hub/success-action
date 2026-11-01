// 用 RFC 官方测试向量验证 TOTP 实现。运行：npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { base32Decode, hotp, totp, secondsRemaining } from "../totp.js";

// 两份 RFC 都用这个密钥：ASCII 字符串 "12345678901234567890"
const RFC_KEY = new TextEncoder().encode("12345678901234567890");

test("Base32 解码", () => {
  // "12345678901234567890" 的 Base32 编码
  const decoded = base32Decode("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
  assert.deepEqual(decoded, RFC_KEY);
  // 小写、空格、补位符 = 都应被容忍
  assert.deepEqual(base32Decode("gezd gnbv gy3t qojq gezd gnbv gy3t qojq"), RFC_KEY);
  assert.throws(() => base32Decode("ABC1"), /非法/);
});

test("HOTP：RFC 4226 附录 D（6 位）", async () => {
  const expected = [
    "755224", "287082", "359152", "969429", "338314",
    "254676", "287922", "162583", "399871", "520489",
  ];
  for (let counter = 0; counter < expected.length; counter++) {
    assert.equal(await hotp(RFC_KEY, counter), expected[counter], `counter=${counter}`);
  }
});

test("TOTP：RFC 6238 附录 B（SHA-1，8 位）", async () => {
  const cases = [
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ];
  for (const [time, code] of cases) {
    assert.equal(await totp(RFC_KEY, time, { digits: 8 }), code, `time=${time}`);
  }
});

test("剩余秒数", () => {
  assert.equal(secondsRemaining(0), 30);
  assert.equal(secondsRemaining(29.9), 1);
  assert.equal(secondsRemaining(30), 30);
  assert.equal(secondsRemaining(1234567890), 30 - (1234567890 % 30));
});
