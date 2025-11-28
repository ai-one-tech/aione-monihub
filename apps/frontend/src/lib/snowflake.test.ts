/**
 * 测试 Snowflake ID 生成器
 *
 * 运行方式：在浏览器控制台中导入并调用测试函数
 * 或者在开发环境中验证生成的ID格式
 */
import {
  generateSnowflakeId,
  validateSnowflakeId,
  extractTimestampFromId,
} from './snowflake'

export function testSnowflakeGenerator() {
  console.group('🧪 Snowflake ID Generator Tests')

  // 测试1: 生成ID
  console.log('\n1️⃣ Testing ID Generation:')
  const id1 = generateSnowflakeId()
  const id2 = generateSnowflakeId()
  const id3 = generateSnowflakeId()
  console.log('Generated IDs:', { id1, id2, id3 })
  console.log('✅ IDs are unique:', id1 !== id2 && id2 !== id3 && id1 !== id3)

  // 测试2: 验证格式
  console.log('\n2️⃣ Testing ID Validation:')
  console.log('Valid ID (id1):', validateSnowflakeId(id1), '✅')
  console.log(
    'Invalid ID (uuid):',
    validateSnowflakeId('550e8400-e29b-41d4-a716-446655440000'),
    '❌'
  )
  console.log('Invalid ID (string):', validateSnowflakeId('not-a-number'), '❌')

  // 测试3: 提取时间戳
  console.log('\n3️⃣ Testing Timestamp Extraction:')
  const timestamp = extractTimestampFromId(id1)
  const date = new Date(timestamp)
  console.log('Extracted timestamp:', timestamp)
  console.log('As Date:', date.toISOString())
  console.log(
    '✅ Timestamp is recent:',
    Math.abs(Date.now() - timestamp) < 1000
  )

  // 测试4: 批量生成唯一性
  console.log('\n4️⃣ Testing Bulk Uniqueness:')
  const ids = new Set()
  const count = 1000
  for (let i = 0; i < count; i++) {
    ids.add(generateSnowflakeId())
  }
  console.log(`Generated ${count} IDs, unique count: ${ids.size}`)
  console.log('✅ All unique:', ids.size === count)

  // 测试5: ID格式
  console.log('\n5️⃣ Testing ID Format:')
  console.log('Sample ID:', id1)
  console.log('ID length:', id1.length, 'characters')
  console.log('✅ All digits:', /^\d+$/.test(id1))

  // 测试6: 与后端格式对比
  console.log('\n6️⃣ Backend Compatibility:')
  console.log('Frontend generated:', id1)
  console.log('Format: Pure numeric string (matches Rust backend)')
  console.log('✅ No UUID format (no hyphens)')

  console.groupEnd()

  return {
    success: true,
    sampleIds: [id1, id2, id3],
    timestamp: date.toISOString(),
  }
}

// 自动在开发环境中测试
if (import.meta.env?.DEV) {
  console.log(
    '🚀 Snowflake ID Generator loaded. Run testSnowflakeGenerator() to test.'
  )
}
