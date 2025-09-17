import { faker } from '@faker-js/faker'

// Set a fixed seed for consistent data generation
faker.seed(12345)

const systemUsers = Array.from({ length: 200 }, () => {
  const firstName = faker.person.firstName()
  const lastName = faker.person.lastName()
  return {
    id: faker.string.uuid(),
    firstName,
    lastName,
    username: faker.internet
      .username({ firstName, lastName })
      .toLocaleLowerCase(),
    email: faker.internet.email({ firstName }).toLocaleLowerCase(),
    phoneNumber: faker.phone.number({ style: 'international' }),
    status: faker.helpers.arrayElement([
      'active',
      'inactive',
      'invited',
      'suspended',
    ]),
    role: faker.helpers.arrayElement([
      'superadmin',
      'admin',
      'manager',
      'operator',
    ]),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    lastLoginAt: faker.date.recent(),
    department: faker.helpers.arrayElement([
      '技术部',
      '运营部',
      '产品部',
      '市场部',
      '人事部',
    ]),
  }
})

export { systemUsers }