const { User } = require("../../../model/dataModel")
const jwt = require("jsonwebtoken")
require("dotenv").config()



const googleLoginORsignup = async ({ googleID, userEmail }) => {
    try {
        const userFind = await User.findOne({
            third_party_user_ID: {
                $elemMatch: {
                    provider: "google",
                    provided_ID: googleID
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
                    message: "Successfully logged in with Google",
                },
                existUser: true,
                success: true,
            }
        } else {
            const signUpTimer = jwt.sign({
                googleID
            }, process.env.JWT_ACCESS_SECRET, {
                algorithm: process.env.JWT_ALGORITHM,
                expiresIn: "10m"
            })
            return {
                success: false,
                existUser: false,
                data: {
                    signUpTimer,
                    message: "User not found",
                }
            }
        }
    } catch (err) {
        console.error("Google login error:", err)
        return {
            success: false,
            error: err.message
        }

    }
}

const googleSignupFinal = async ({ signUpTimer, data: userData }) => {
    try {
        const decoded = jwt.verify(signUpTimer, process.env.JWT_ACCESS_SECRET)
        const userFind = await User.findOne({
            email: userData.email
        })
        if (userFind) {
            const hasGoogleLinked = userFind.third_party_user_ID.some((idObj) => idObj.provider === "google" && idObj.provided_ID == decoded.googleID)
            console.log("hasGoogleLinked", hasGoogleLinked)
            if (!hasGoogleLinked) {
                userFind.third_party_user_ID.push({
                    provider: "google",
                    provided_ID: decoded.googleID
                })
                await userFind.save()
                console.log("userFind", userFind)
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
                const data = {
                    accessToken,
                    refreshToken,
                    message: "Successfully signed up with Google",
                }
                console.log("data", data)
                return {
                    success: true,
                    data
                }

            }

        } else {
            console.log("pisda", userData)
            const newUser = await User.create({
                unique_user_ID: userData.userName,
                email: userData.email,
                userNames: {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                },
                third_party_user_ID: [
                    {
                        provider: "google",
                        provided_ID: decoded.googleID,
                    },
                ],
                userAgreeTerms: {
                    agree_terms: true,
                    agree_privacy: true,
                },
            });

            console.log("newUserPISDA", newUser)
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
            const data = {
                accessToken,
                refreshToken,
                message: "Successfully signed up with Google",
            }
            console.log("data", data)
            return {
                success: true,
                data
            }
        }
    } catch (err) {
        console.error("Google signup error:", err)

    }
}


module.exports = {
    googleLoginORsignup,
    googleSignupFinal
}