import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

/**
 * 安全工具类
 */
export class SecurityUtils {
  /**
   * 生成随机字符串
   * @param length 字符串长度
   * @returns 随机字符串
   */
  static generateRandomString(length: number = 32): string {
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  /**
   * 生成UUID
   * @returns UUID v4
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * 哈希密码
   * @param password 原始密码
   * @param rounds 加密轮数(默认10)
   * @returns 哈希后的密码
   */
  static async hashPassword(password: string, rounds: number = 10): Promise<string> {
    const salt = await bcrypt.genSalt(rounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * 验证密码
   * @param password 原始密码
   * @param hash 哈希后的密码
   * @returns 是否匹配
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * 生成JWT密钥
   * @returns JWT密钥
   */
  static generateJWTSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * 生成API密钥
   * @returns API密钥
   */
  static generateAPIKey(): string {
    const prefix = 'crm_';
    const key = crypto.randomBytes(32).toString('hex');
    return `${prefix}${key}`;
  }

  /**
   * 生成验证码
   * @param length 验证码长度(默认6)
   * @returns 验证码
   */
  static generateVerificationCode(length: number = 6): string {
    const digits = '0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += digits[Math.floor(Math.random() * digits.length)];
    }
    return code;
  }

  /**
   * 生成临时令牌
   * @param expiryMinutes 过期时间(分钟,默认30)
   * @returns 临时令牌
   */
  static generateTempToken(expiryMinutes: number = 30): { token: string; expiresAt: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return { token, expiresAt };
  }

  /**
   * 验证令牌是否过期
   * @param expiresAt 过期时间
   * @returns 是否过期
   */
  static isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * 清理HTML,防止XSS攻击
   * @param html HTML字符串
   * @returns 清理后的字符串
   */
  static sanitizeHTML(html: string): string {
    const dangerousTags = ['<script', '</script>', '<iframe', '</iframe>', '<object', '</object>'];
    let sanitized = html;

    for (const tag of dangerousTags) {
      sanitized = sanitized.replace(new RegExp(tag, 'gi'), '');
    }

    return sanitized;
  }

  /**
   * 清理SQL注入
   * @param input 输入字符串
   * @returns 清理后的字符串
   */
  static sanitizeSQL(input: string): string {
    const dangerousPatterns = [
      /(\b(OR|AND)\b.*=.*\b(OR|AND)\b)/gi,
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/gi,
      /(--|;|\/\*|\*\/)/g,
      /(\b(WHERE|HAVING)\b.*\b(OR|AND)\b)/gi,
    ];

    let sanitized = input;
    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  /**
   * 验证邮箱格式
   * @param email 邮箱地址
   * @returns 是否有效
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证手机号格式(中国)
   * @param phone 手机号
   * @returns 是否有效
   */
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * 验证密码强度
   * @param password 密码
   * @returns 强度等级(0-4)
   */
  static checkPasswordStrength(password: string): number {
    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    return strength;
  }

  /**
   * 加密数据
   * @param data 数据
   * @param key 密钥
   * @param iv 初始化向量
   * @returns 加密后的数据
   */
  static encrypt(data: string, key: string, iv: string): string {
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * 解密数据
   * @param encryptedData 加密的数据
   * @param key 密钥
   * @param iv 初始化向量
   * @returns 解密后的数据
   */
  static decrypt(encryptedData: string, key: string, iv: string): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * 生成加密密钥和IV
   * @returns 密钥和IV
   */
  static generateEncryptionKeys(): { key: string; iv: string } {
    const key = crypto.randomBytes(32).toString('hex');
    const iv = crypto.randomBytes(16).toString('hex');
    return { key, iv };
  }

  /**
   * 生成数据签名
   * @param data 数据
   * @param secret 密钥
   * @returns 签名
   */
  static sign(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * 验证数据签名
   * @param data 数据
   * @param signature 签名
   * @param secret 密钥
   * @returns 是否有效
   */
  static verify(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.sign(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  }

  /**
   * 生成CSRF令牌
   * @returns CSRF令牌
   */
  static generateCSRFToken(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * 验证CSRF令牌
   * @param token 令牌
   * @param secret 密钥
   * @returns 是否有效
   */
  static verifyCSRFToken(token: string, secret: string): boolean {
    const expected = crypto.createHash('sha256').update(token + secret).digest('hex');
    return expected === token;
  }
}
