module.exports = (async () => {
  const _sodium = require('libsodium-wrappers')
  await _sodium.ready
  const sodium = _sodium
  const key = sodium.from_hex('724b092810ec86d7e35c9d067702b31ef90bc43a7b598626749914d6a3e033ed')

  function encryptAndPrependNonce (message) {
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)
    const nonceArr = sodium.to_hex(nonce)
    return sodium.from_hex(nonceArr.concat(sodium.to_hex(sodium.crypto_secretbox_easy(message, nonce, key))))
  }

  function dceryptAfterExtractingNonce (nonceAndCipherText) {
    if (nonceAndCipherText.length < sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_MACBYTES) {
      throw 'Short message'
    }
    const nonce = nonceAndCipherText.slice(0, sodium.crypto_secretbox_NONCEBYTES)
    const ciphertext = nonceAndCipherText.slice(sodium.crypto_secretbox_NONCEBYTES)
    return sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)
  }

  function generateHash (plainText) {
    try {
      const hashBuffer = encryptAndPrependNonce(plainText)
      const hashString = Array.from(hashBuffer).join('-')
      return hashString
    } catch (ex) {
      console.log('Error in hash generation', ex)
      return ''
    }
  }

  function compareHash (hashString, plainText) {
    try {
      const hashBuffer = new Uint8Array(hashString && hashString.split('-'))
      const decryptedBuffer = dceryptAfterExtractingNonce(hashBuffer)
      const decryptedString = arrayToString(decryptedBuffer)
      if (decryptedString === plainText) {
        return true
      } else {
        return false
      }
    } catch (ex) {
      console.log('Error in compareHash()', ex)
      return false
    }
  }

  function stringToArray (bufferString) {
    const uint8Array = new TextEncoder('utf-8').encode(bufferString)
    return uint8Array
  }

  function arrayToString (bufferValue) {
    return new TextDecoder('utf-8').decode(bufferValue)
  }

  return {
    generateHash: generateHash,
    compareHash: compareHash
  }
})()
