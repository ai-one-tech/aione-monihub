/**
 * Snowflake ID 生成器（TypeScript实现）
 *
 * Snowflake ID 结构（64位）：
 * - 1位符号位（固定为0）
 * - 41位时间戳（毫秒级，从自定义纪元开始）
 * - 10位机器ID（数据中心ID + 工作机器ID）
 * - 12位序列号（毫秒内的序列号）
 */

class SnowflakeGenerator {
  // 自定义纪元（2020-01-01 00:00:00 UTC 的毫秒时间戳）
  private readonly epoch = 1577836800000

  // 机器ID（10位，0-1023）
  private machineId: number

  // 序列号（12位，0-4095）
  private sequence = 0

  // 上次生成ID的时间戳
  private lastTimestamp = 0

  constructor(machineId?: number) {
    // 如果未提供机器ID，则基于随机数生成
    if (machineId === undefined) {
      this.machineId = Math.floor(Math.random() * 1024)
    } else {
      if (machineId < 0 || machineId > 1023) {
        throw new Error('Machine ID must be between 0 and 1023')
      }
      this.machineId = machineId
    }
  }

  /**
   * 生成下一个 Snowflake ID
   */
  nextId(): string {
    let timestamp = this.currentTimestamp()

    // 如果当前时间小于上次生成时间，说明时钟回退了
    if (timestamp < this.lastTimestamp) {
      throw new Error(
        `Clock moved backwards. Refusing to generate id for ${this.lastTimestamp - timestamp} milliseconds`
      )
    }

    // 如果是同一毫秒内生成的ID，序列号递增
    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & 0xfff // 12位序列号掩码

      // 如果序列号溢出，等待下一毫秒
      if (this.sequence === 0) {
        timestamp = this.waitNextMillis(this.lastTimestamp)
      }
    } else {
      // 新的毫秒，序列号重置为0
      this.sequence = 0
    }

    this.lastTimestamp = timestamp

    // 组装 Snowflake ID
    // JavaScript 的位运算是32位的，所以需要使用 BigInt 来处理64位数字
    const id =
      (BigInt(timestamp - this.epoch) << BigInt(22)) | // 时间戳部分（41位）
      (BigInt(this.machineId) << BigInt(12)) | // 机器ID部分（10位）
      BigInt(this.sequence) // 序列号部分（12位）

    return id.toString()
  }

  /**
   * 获取当前时间戳（毫秒）
   */
  private currentTimestamp(): number {
    return Date.now()
  }

  /**
   * 等待下一毫秒
   */
  private waitNextMillis(lastTimestamp: number): number {
    let timestamp = this.currentTimestamp()
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp()
    }
    return timestamp
  }

  /**
   * 从 Snowflake ID 中提取时间戳
   */
  extractTimestamp(snowflakeId: string): number {
    const id = BigInt(snowflakeId)
    return Number(id >> BigInt(22)) + this.epoch
  }

  /**
   * 从 Snowflake ID 中提取机器ID
   */
  extractMachineId(snowflakeId: string): number {
    const id = BigInt(snowflakeId)
    return Number((id >> BigInt(12)) & BigInt(0x3ff)) // 10位机器ID掩码
  }

  /**
   * 从 Snowflake ID 中提取序列号
   */
  extractSequence(snowflakeId: string): number {
    const id = BigInt(snowflakeId)
    return Number(id & BigInt(0xfff)) // 12位序列号掩码
  }

  /**
   * 验证 Snowflake ID 格式
   */
  static validate(idStr: string): boolean {
    try {
      BigInt(idStr)
      return true
    } catch {
      return false
    }
  }
}

// 全局 Snowflake ID 生成器实例
// 机器ID可以基于浏览器特征生成一个相对稳定的值
let globalGenerator: SnowflakeGenerator | null = null

function getGlobalGenerator(): SnowflakeGenerator {
  if (!globalGenerator) {
    // 尝试从 localStorage 获取或生成机器ID
    let machineId: number | undefined

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedId = localStorage.getItem('snowflake_machine_id')
        if (storedId) {
          const parsed = parseInt(storedId, 10)
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1023) {
            machineId = parsed
          }
        }

        // 如果没有存储的ID，生成一个新的并存储
        if (machineId === undefined) {
          machineId = Math.floor(Math.random() * 1024)
          localStorage.setItem('snowflake_machine_id', machineId.toString())
        }
      } catch (e) {
        // localStorage 不可用，使用随机ID
        console.warn('Failed to access localStorage for machine ID:', e)
      }
    }

    globalGenerator = new SnowflakeGenerator(machineId)
  }

  return globalGenerator
}

/**
 * 生成下一个 Snowflake ID（全局函数）
 */
export function generateSnowflakeId(): string {
  return getGlobalGenerator().nextId()
}

/**
 * 从 Snowflake ID 中提取时间戳（全局函数）
 */
export function extractTimestampFromId(idStr: string): number {
  return getGlobalGenerator().extractTimestamp(idStr)
}

/**
 * 验证 Snowflake ID 格式（全局函数）
 */
export function validateSnowflakeId(idStr: string): boolean {
  return SnowflakeGenerator.validate(idStr)
}

/**
 * 导出类（用于高级用法）
 */
export { SnowflakeGenerator }
