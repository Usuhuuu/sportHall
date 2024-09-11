const crypto = require('crypto')

const hmacPromise = (password, salt, iterations, keylen, digest) => {
    return new Promise((resolve, reject)=>{
        crypto.pbkdf2(password,salt,iterations, keylen, digest, (err, derivedKey)=> {
            if(err) return reject(err)
            resolve(derivedKey.toString('hex'))
        })
    })
}

module.exports = {hmacPromise}