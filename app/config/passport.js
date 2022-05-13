const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user')
const bcrypt = require('bcrypt')

function init(passport) {
    passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
        // Login
        // check if email exists
        const user = await User.findOne({ email: email })
        if(!user) {
            return done(null, false, { message: 'No user with this email' })
        }

        bcrypt.compare(password, user.password).then(match => {
            if(match) {
                return done(null, user, { message: 'Logged in succesfully' })
            }
            return done(null, false, { message: 'Wrong username or password' })
        }).catch(err => {
            return done(null, false, { message: 'Something went wrong' })
        })
    }))

    passport.serializeUser((user, done) => {
        done(null, user._id)
    })

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user)
        })
    })
}

module.exports = init

// const passportCustom = require('passport-custom')
// const CustomStrategy = passportCustom.Strategy

// function init(passport){
//     passport.use('custom', new CustomStrategy(
//         function(req, done) {
//             console.log('custom strategy')
//             // phone number login
//             if(req.body.phone) {
//                 User.findOne({ phone: req.body.phone }, (err, user) => {
//                     if(err) {
//                         console.log('err')
//                         console.log(err)
//                         return done(err)
//                     }
//                     if(!user) {
//                         console.log('no user')
//                         return done(null, false, { message: 'No user with this phone number' })
//                     }
//                     console.log(user)
//                     console.log('success')
//                     return done(null, user, { message: 'Logged in succesfully' })
//                 })
//             }
//         }
//     ))

//     passport.serializeUser((user, done) => {
//         done(null, user._id)
//     })
        
//     passport.deserializeUser((id, done) => {
//         User.findById(id, (err, user) => {
//             done(err, user)
//         })
//     })
// }

// module.exports = init