import express from 'express'
import cors from 'cors'
import fs from 'fs'
import bodyParser from 'body-parser'
import os from 'os'
import cookieParser from 'cookie-parser'
import path from 'path'

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(cookieParser())

/*
app.get('/', function (req, res) {
    
    let readHTMLPromise = fs.promises.readFile(path.resolve('week2.html'), 'utf-8')
    readHTMLPromise.then((html) => {
        res.status(200)
        res.send(html)
    }, (err) => {
        res.status(400)
        res.send(err)
        console.log(err)
        console.log("Unknown Error occured during reading week2.html")
    })
    
})
*/
//ngnix how returns week2.html which is called index.html inside the ngnix


app.post("/api/signup", async function (req, res) {
    let ifSuccess = true

    try {
        let jsonUserDataPromise = await fs.promises.readFile(path.resolve('userData.json'), "utf8")
        var newJsonUserData = JSON.parse(jsonUserDataPromise)
        newJsonUserData.push({
            "username": req.body.username,
            "password": req.body.password, "email": req.body.email
        })
        newJsonUserData = JSON.stringify(newJsonUserData)
        await fs.promises.writeFile(path.resolve('userData.json'), newJsonUserData, "utf8")
    } catch (err) {
        res.status(400)
        res.send(err)
        console.log(err)
        console.log("Unknown Error occured during adding user data to userData.json")
        ifSuccess = false
    }
    if (ifSuccess) {
        res.status(201)
        res.send(newJsonUserData)
    }

})

app.post('/api/login', async function (req, res) {
    const loginJson = JSON.stringify({
        username: req.body.username,
        password: req.body.password
    })

    try {
        var userData = await fs.promises.readFile(path.resolve('userData.json'), 'utf-8')

    } catch (err) {
        res.status(400)
        res.send(err)
        console.log(err)
        console.log("Unknown Error occured during reading userData.json")
        return
    }

    let userDataArr = JSON.parse(userData)
    for (let userEntry of userDataArr) {
        if (userEntry.username == req.body.username && userEntry.password == req.body.password) {
            res.status(200)

            res.cookie(userEntry.username, userEntry.password, { path: "/api/users", maxAge: 60 * 60 * 1000000, httpOnly: false, secure: false })
            res.cookie(userEntry.username, userEntry.password, { path: "/api/os", maxAge: 60 * 60 * 1000000, httpOnly: false, secure: false })

            res.send("Cookie has been set\nEntered username and password matches with the database")
            return
        }
    }
    res.status(401)
    res.send("Entered username and password does not match with the database")

})

app.get('/api/users', async function (req, res) {
    try {
        var userData = await fs.promises.readFile(path.resolve('userData.json'), 'utf-8')
    } catch (err) {
        res.status(400)
        res.send(err)
        console.log(err)
        console.log("Unknown Error occured during reading userData.json")
        return
    }

    let userDataObjArrNoPasswd = []
    let userDataObjArr = JSON.parse(userData)
    userDataObjArr.forEach(userData => {
        userDataObjArrNoPasswd.push({
            "username": userData.username, "email": userData.email
        })
    });

    for (let userEntry of userDataObjArr) {
        for (let cookieEntry of Object.entries(req.cookies)) {
            //console.log(cookieEntry)
            if (userEntry.username == cookieEntry[0] && userEntry.password == cookieEntry[1]) {
                res.status(200)
                res.send(userDataObjArrNoPasswd)
                return
            }
        }

    }
    res.status(401)
    res.send("Unauthorized user")

})

app.get('/api/os', async function (req, res) {
    try {
        var userData = await fs.promises.readFile(path.resolve('userData.json'), 'utf-8')
    } catch (err) {
        res.status(400)
        res.send(err)
        console.log(err)
        console.log("Unknown Error occured during reading userData.json")
        return
    }
    let userDataObj = JSON.parse(userData)
    for (let userEntry of userDataObj) {
        for (let cookieEntry of Object.entries(req.cookies)) {
            //console.log(cookieEntry)
            if (userEntry.username == cookieEntry[0] && userEntry.password == cookieEntry[1]) {
                res.status(200)
                res.send({
                    "type": os.type(),
                    "hostname": os.hostname(),
                    "cpu_num": os.availableParallelism(),
                    "total_mem": os.totalmem() / 1048576 + "MB"
                })
                return
            }
        }

    }
    res.status(401)
    res.send("Unauthorized user")

})

app.get('/api/health_check', async function(req, res){
    res.send("Health Check Success")
    res.status(200)
})
app.listen(3000)