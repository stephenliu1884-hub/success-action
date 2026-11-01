// TOTP（RFC 6238）实现。浏览器和 Node 通用，只依赖内置的 Web Crypto API。

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// 把 Base32 字符串（二维码里的 secret）解码成字节数组。
// Base32 每个字符代表 5 个比特，攒够 8 个比特就输出一个字节。
export function base32Decode(input) {
  const clean = input.toUpperCase().replace(/[\s=-]/g, "");
  const out = [];
  let value = 0; // 比特缓冲区
  let bits = 0;  // 缓冲区里还没输出的比特数
  for (const ch of clean) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new Error(`非法的 Base32 字符: ${ch}`);
    value = ((value << 5) | idx) & 0xffff; // 只需保留低位，防止溢出
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

// HOTP（RFC 4226）：给定密钥和计数器，算出 digits 位数字。
export async function hotp(keyBytes, counter, digits = 6) {
  // 1. 计数器编码为 8 字节大端整数
  const msg = new ArrayBuffer(8);
  new DataView(msg).setBigUint64(0, BigInt(counter));

  // 2. HMAC-SHA1(密钥, 计数器)，得到 20 字节
  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));

  // 3. 动态截断：最后一个字节的低 4 位作为偏移量，从该位置取 4 字节，
  //    最高位清零（避免有符号整数的歧义），得到一个 31 位整数
  const offset = mac[mac.length - 1] & 0x0f;
  const bin =
    ((mac[offset] & 0x7f) << 24) |
    (mac[offset + 1] << 16) |
    (mac[offset + 2] << 8) |
    mac[offset + 3];

  // 4. 取模得到 digits 位数字，不足位数前面补 0
  return String(bin % 10 ** digits).padStart(digits, "0");
}

// TOTP：就是计数器 = floor(当前时间 / 周期) 的 HOTP。
export function totp(keyBytes, timeSeconds = Date.now() / 1000, { digits = 6, period = 30 } = {}) {
  return hotp(keyBytes, Math.floor(timeSeconds / period), digits);
}

// 当前验证码还剩几秒过期（给页面上的倒计时条用）。
export function secondsRemaining(timeSeconds = Date.now() / 1000, period = 30) {
  return period - (Math.floor(timeSeconds) % period);
}
