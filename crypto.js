// 用访问密码加密/解密账户数据。浏览器和 Node 通用，只依赖内置的 Web Crypto API。
//
// 流程：访问密码 + 随机 salt --PBKDF2--> AES 密钥 --AES-GCM(随机 IV)--> 密文

const PBKDF2_ITERATIONS = 600_000; // OWASP 2023 对 PBKDF2-SHA256 的推荐值

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

// 从访问密码派生出 256 位 AES 密钥。故意很慢，用来拖慢暴力破解。
async function deriveKey(password, salt, iterations) {
  const baseKey = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// 把任意 JSON 数据用密码加密，返回一条可以直接写进页面的记录。
export async function encrypt(data, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, PBKDF2_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext)
  );
  // 迭代次数也存进去，将来调整参数时旧数据仍能解密
  return {
    iterations: PBKDF2_ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
  };
}

// 用密码解密一条记录。密码错误或数据被篡改时抛出错误。
export async function decrypt(record, password) {
  const key = await deriveKey(password, fromBase64(record.salt), record.iterations);
  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(record.iv) }, key, fromBase64(record.ciphertext)
    );
  } catch {
    throw new Error("密码错误");
  }
  return JSON.parse(new TextDecoder().decode(plaintext));
}

// 用同一个密码依次尝试每条记录，返回第一条能解开的数据；都解不开返回 null。
// 这样朋友只需输入密码，不需要用户名。
export async function unlockAny(records, password) {
  for (const record of records) {
    try {
      return await decrypt(record, password);
    } catch {
      // 不是这条，继续试下一条
    }
  }
  return null;
}
