module.exports = {
  testEnvironment: 'node',
  projects: [
    {
      displayName: 'test',
      testEnvironment: 'node'
    },
    {
      runner: 'jest-runner-eslint',
      displayName: 'lint',
      testMatch: ['<rootDir>/rules/**/*.test.js']
    }
  ]
}
