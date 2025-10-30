const PBKDF2_ITERATIONS = 100000; // 推奨されるイテレーション回数
const AES_KEY_LENGTH = 256; // AES-256
const IV_LENGTH = 12; // AES-GCMでは12バイトが推奨
const PBKDF2_SALT_LENGTH = 16; // PBKDF2ソルトの長さ

/**
 * ArrayBufferをBase64文字列に変換するメソッド
 * @param buffer
 * @returns
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

/**
 * Base64文字列をArrayBufferに変換メソッド
 * @param base64
 * @returns
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * user_saltをユーザーパスワードで暗号化する
 * @param plainText 暗号化するuser_salt
 * @param password ユーザーが設定したPIN/パスワード
 * @returns 暗号化された文字列 (PBKDF2_Salt.IV.Ciphertext.Auth_Tag のBase64結合)
 */
export async function encrypt(
  plainText: string,
  password: string,
): Promise<string> {
  const textEncoder = new TextEncoder();
  const data = textEncoder.encode(plainText);

  // PBKDF2ソルトを生成
  const pbkdf2Salt = window.crypto.getRandomValues(
    new Uint8Array(PBKDF2_SALT_LENGTH),
  );

  // パスワードから鍵を導出
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: pbkdf2Salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );

  // IVを生成
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // 暗号化
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data,
  );

  // 暗号文と認証タグを分離
  const ciphertext = encrypted.slice(0, encrypted.byteLength - 16); // 最後の16バイトが認証タグ
  const authTag = encrypted.slice(encrypted.byteLength - 16);

  // 各要素をBase64エンコードして結合
  return `${arrayBufferToBase64(pbkdf2Salt.buffer)}.${arrayBufferToBase64(iv.buffer)}.${arrayBufferToBase64(ciphertext)}.${arrayBufferToBase64(authTag)}`;
}

/**
 * 暗号化されたuser_saltをユーザーパスワードで復号する
 * @param encryptedString 暗号化された文字列
 * @param password ユーザーが設定したPIN/パスワード
 * @returns 復号されたuser_salt (プレーンテキスト)
 * @throws Error 復号に失敗した場合（パスワード間違い、データ改ざんなど）
 */
export async function decrypt(
  encryptedString: string,
  password: string,
): Promise<string> {
  const parts = encryptedString.split(".");
  if (parts.length !== 4) {
    throw new Error("Invalid encrypted string format");
  }

  const pbkdf2Salt = base64ToArrayBuffer(parts[0]);
  const iv = base64ToArrayBuffer(parts[1]);
  const ciphertext = base64ToArrayBuffer(parts[2]);
  const authTag = base64ToArrayBuffer(parts[3]);

  // パスワードから鍵を導出
  const textEncoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: pbkdf2Salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    false,
    ["encrypt", "decrypt"],
  );

  // 暗号文と認証タグを結合
  const encryptedData = new Uint8Array(
    ciphertext.byteLength + authTag.byteLength,
  );
  encryptedData.set(new Uint8Array(ciphertext), 0);
  encryptedData.set(new Uint8Array(authTag), ciphertext.byteLength);

  // 復号
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encryptedData.buffer,
  );

  const textDecoder = new TextDecoder();
  return textDecoder.decode(decrypted);
}
