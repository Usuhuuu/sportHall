const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const axios = require('axios');
const { User } = require('../../../model/dataModel');
const crypto = require('crypto');
const { secure_password_function } = require('../../Functions/PBE');


const facebookUserLoginRouter = async ({ token }) => {
  try {
    const facebook_graph_api = await classicFacebookLogin({ token })
    return ({
      data: {
        facebookID: facebook_graph_api.data.id,
        email: facebook_graph_api.data.email || null,
        firstName: facebook_graph_api.data.firstName,
        lastName: facebook_graph_api.data.lastName,
        message: facebook_graph_api.data.message,
      },
      success: true,
      existUser: facebook_graph_api.existUser ? true : false
    })
  } catch (err) {
    console.log("user not using classic login")
    try {
      const limitedLogin = await getLimitedFacebookUser({ token, appId: process.env.FACEBOOK_APP_ID })
      console.log("limitedLogin", limitedLogin)
      if (!limitedLogin.success) {
        return { success: false, error: limitedLogin.error }
      }
      return ({
        data: limitedLogin.data,
        success: limitedLogin.success,
        existUser: limitedLogin.existUser ? true : false
      })
    } catch (innerError) {
      console.error("Error in getLimitedFacebookUser", innerError)
      return { success: innerError.success, error: innerError.error }
    }
  }
}

const classicFacebookLogin = async ({ token }) => {
  try {
    const facebookGraphApi = await axios.get('https://graph.facebook.com/v21.0/me', {
      params: {
        access_token: token,
        fields: 'id,name,email'
      }
    });
    if (!facebookGraphApi.data || !facebookGraphApi.data.email) {
      return { data: { message: 'Invalid Facebook token or no email provided', success: false } }
    } else if (facebookGraphApi.status === 200) {
      const user = facebookGraphApi.data;
      const [firstName, lastName = ''] = user.name.split(' ');
      const userFInd = await User.findOne({
        third_party_user_ID: {
          $elemMatch: {
            provider: "facebook",
            provided_ID: user.id
          }
        }
      })
      if (userFInd) {
        const accessToken = jwt.sign({
          userID: userFInd._id,
          unique_user_ID: userFInd.unique_user_ID,
          userType: userFInd.userType,

        }, process.env.JWT_ACCESS_SECRET, {
          algorithm: process.env.JWT_ALGORITHM,
          expiresIn: process.env.JWT_EXPIRES_IN
        })
        const refreshToken = jwt.sign({
          userID: userFInd._id,
        }, process.env.JWT_REFRESH_SECRET, {
          algorithm: process.env.JWT_ALGORITHM,
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
        })
        return {
          data: {
            accessToken,
            refreshToken,
            message: "Successfully logged in with Facebook",
          },
          success: true,
          existUser: true
        }
      } else {
        return {
          data: {
            firstName,
            lastName,
            id: user.id,
            email: user.email,
            message: "User not found",
          },
          success: true,
          existUser: false
        }
      }
    }
  } catch (err) {
    return { returnValue: { message: 'Error fetching data from Facebook', success: false } }
  }

}

async function getLimitedFacebookUser({ token, appId }) {
  if (!token) {
    throw new Error('JWT token not provided');
  }
  const client = jwksClient({
    jwksUri: 'https://www.facebook.com/.well-known/oauth/openid/jwks',
  });
  const fbData = await new Promise((resolve, reject) => {
    jwt.verify(
      token,
      async (header, callback) => {
        try {
          const key = await client.getSigningKey(header.kid);
          callback(null, key.getPublicKey());
        } catch (error) {
          callback(error);
        }
      },
      {
        algorithms: ['RS256'],
        audience: appId,
        issuer: 'https://www.facebook.com',
      },
      (err, decoded) => {
        if (err) return reject({ error: err, success: false, });
        return resolve({
          data: {
            facebookID: decoded.sub,
            email: decoded.email || null,
            firstName: decoded.given_name,
            lastName: decoded.family_name,
            picture: decoded.picture
          },
          success: true
        });
      }
    );
  })
  const userFind = await User.findOne({
    third_party_user_ID: {
      $elemMatch: {
        provider: "facebook",
        provided_ID: fbData.data.facebookID
      }
    }
  })
  if (userFind) {
    const accessToken = jwt.sign({
      userID: userFind._id,
      unique_user_ID: userFind.unique_user_ID,
      userType: userFind.userType,
    }, process.env.JWT_ACCESS_SECRET, {
      algorithm: process.env.JWT_ALGORITHM,
      expiresIn: process.env.JWT_EXPIRES_IN
    })
    const refreshToken = jwt.sign({
      userID: userFind._id,
    }, process.env.JWT_REFRESH_SECRET, {
      algorithm: process.env.JWT_ALGORITHM,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    })
    return {
      data: {
        accessToken,
        refreshToken,
        message: "Successfully logged in with Facebook",
      },
      existUser: true,
      success: true,
    }
  } else {
    return {
      data: {
        firstName: fbData.data.firstName,
        lastName: fbData.data.lastName,
        facebookID: fbData.data.facebookID,
        email: fbData.data.email,
        picture: fbData.data.picture,
      },
      success: true,
      existUser: false,
      message: "User not found",
    }
  }


}

const facebookUserSignupContinue = async ({ signUpTimer, data: fulldata }) => {
  try {
    const decoded = jwt.verify(signUpTimer, process.env.JWT_ACCESS_SECRET)
    const { facebook_user_ID, verified } = decoded
    if (!verified) {
      return { success: false, message: "User not verified" }
    }
    const newUser = await User.create({
      unique_user_ID: fulldata.userName,
      email: fulldata.email,
      phoneNumber: fulldata.phoneNumber || "",
      userNames: {
        firstName: fulldata.firstName,
        lastName: fulldata.lastName
      },
      userAgreeTerms: {
        agree_terms: true,
        agree_privacy: true,
      },
      third_party_user_ID: {
        provider: "facebook",
        provided_ID: facebook_user_ID
      },
    })
    const accessToken = jwt.sign({
      userID: newUser._id,
      unique_user_ID: newUser.unique_user_ID,
      userType: newUser.userType,

    }, process.env.JWT_ACCESS_SECRET, {
      algorithm: process.env.JWT_ALGORITHM,
      expiresIn: process.env.JWT_EXPIRES_IN
    })
    const refreshToken = jwt.sign({
      userID: newUser._id,
    }, process.env.JWT_REFRESH_SECRET, {
      algorithm: process.env.JWT_ALGORITHM,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
    })

    if (newUser) {
      return { success: true, accessToken, refreshToken, message: "Successfully logged in with Facebook" }
    }
  } catch (err) {
    if (err.code === 11000) {
      try {
        const findUser = await User.findOne({ unique_user_ID: fulldata.userName, email: fulldata.email || "" })
        if (findUser) {
          const accessToken = jwt.sign({
            userID: findUser._id,
            unique_user_ID: findUser.unique_user_ID,
            userType: findUser.userType
          }, process.env.JWT_ACCESS_SECRET, {
            algorithm: process.env.JWT_ALGORITHM,
            expiresIn: process.env.JWT_EXPIRES_IN
          })
          const refreshToken = jwt.sign({
            userID: findUser._id,
          }, process.env.JWT_REFRESH_SECRET, {
            algorithm: process.env.JWT_ALGORITHM,
            expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
          })

          return {
            success: true,
            data: {
              accessToken,
              refreshToken,
              message: "Successfully logged in with Facebook",
            }
          }
        }
      } catch (innerError) {
        console.log("Error in finding user", innerError)
      }
    }
    console.log("Error in facebookUserSignupContinue", err)
  }
}

module.exports = { facebookUserLoginRouter, facebookUserSignupContinue };