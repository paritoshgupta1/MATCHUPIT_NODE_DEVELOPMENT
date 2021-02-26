const chai = require('chai')
const chaiHttp = require('chai-http')
require('dotenv').config()
const expect = chai.expect
chai.use(chaiHttp)

describe('Server', () => {
  it('should be up', () => {
    chai.request('localhost')
      .get('/')
      .end((err, res) => {
        expect(res).to.have.status(200)
      })
  })
})

describe('Helpers', () => {
  describe('OTP', () => {
    it('Should be of length 6', () => {
      const generateOTP = require('../helpers/otp').generateOTP
      const otp = generateOTP()
      expect(otp).to.be.of.length(6)
    })
  })
  describe('JWT', () => {
    it('Should be generated and verfied', () => {
      const { generateJWT, verifyJWT } = require('../helpers/jwt')
      const payload = 'Test String'
      const token = generateJWT(payload)
      const result = verifyJWT(token)
      expect(payload).to.be.equals(result.data)
    })
  })
  describe('Hash', () => {
    it('Should be generated and verfied', async () => {
      const hashHandler = await require('../helpers/hash_handler')
      const { generateHash, compareHash } = hashHandler
      const payload = 'Test String'
      const hash = generateHash(payload)
      const result = compareHash(hash, payload)
      expect(result).to.be.equals(true)
    })
  })
  describe('ID Generation', () => {
    it('Should be generated with given prefix', () => {
      const generateId = require('../helpers/id_generator').generateId
      const id = generateId('test')
      expect(id).to.be.a('string').and.satisfy(id => id.startsWith('test-'))
    })
  })
})
