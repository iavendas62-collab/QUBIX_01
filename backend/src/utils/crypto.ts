import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha512';

interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
  tag: string;
  algorithm: string;
  kdf: string;
  iterations: number;
  version: number;
}

/**
 * Derives a key from password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    password,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  );
}

/**
 * Encrypts seed phrase with AES-256-GCM
 */
export function encryptSeed(seed: string, password: string): string {
  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Derive key from password
  const key = deriveKey(password, salt);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt
  let encrypted = cipher.update(seed, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get auth tag
  const tag = cipher.getAuthTag();
  
  // Package everything together
  const result: EncryptedData = {
    encrypted,
    salt: salt.toString('hex'),
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    algorithm: ALGORITHM,
    kdf: 'pbkdf2',
    iterations: PBKDF2_ITERATIONS,
    version: 1
  };
  
  return JSON.stringify(result);
}

/**
 * Decrypts seed phrase
 */
export function decryptSeed(encryptedData: string, password: string): string {
  try {
    const data: EncryptedData = JSON.parse(encryptedData);
    
    // Validate version
    if (data.version !== 1) {
      throw new Error('Unsupported encryption version');
    }
    
    // Convert from hex
    const salt = Buffer.from(data.salt, 'hex');
    const iv = Buffer.from(data.iv, 'hex');
    const tag = Buffer.from(data.tag, 'hex');
    
    // Derive key
    const key = deriveKey(password, salt);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt seed phrase. Invalid password or corrupted data.');
  }
}

/**
 * Test round-trip encryption/decryption
 */
export function testCrypto(): boolean {
  const testSeed = 'test seed phrase with twelve words here for testing purposes only';
  const testPassword = 'TestPassword123!';
  
  try {
    const encrypted = encryptSeed(testSeed, testPassword);
    const decrypted = decryptSeed(encrypted, testPassword);
    
    if (decrypted !== testSeed) {
      console.error('Round-trip test failed: decrypted value does not match original');
      return false;
    }
    
    // Test wrong password
    try {
      decryptSeed(encrypted, 'WrongPassword');
      console.error('Round-trip test failed: wrong password should throw error');
      return false;
    } catch (e) {
      // Expected to fail
    }
    
    return true;
  } catch (error) {
    console.error('Round-trip test failed:', error);
    return false;
  }
}
