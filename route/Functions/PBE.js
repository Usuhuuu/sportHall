const crypto = require('crypto');
const argon2 = require("argon2");

const secure_password_function = async (password, salt) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("Salt (Buffer):", Buffer.from(salt));
            const hashValue = await argon2.hash(password, {
                type: argon2.argon2id,
                memoryCost: 4096, 
                timeCost: 3,      
                parallelism: 1,   
                salt: Buffer.from(salt)       
            });

            resolve(hashValue);
        } catch (err) {
            reject(err);
        }
    });
};

const verify_password_promise = async (password, hashValue) => {
    return new Promise(async (resolve, reject) => {
        try {
            const isVerified = await argon2.verify(hashValue, password);
            resolve(isVerified);
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = { secure_password_function,verify_password_promise };