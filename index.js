const { PrismaClient } = require('@prisma/client');
const jwt =require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const bodyParser = require('body-parser');
const nodemailer =require('nodemailer');
const prisma = new PrismaClient();
const express = require('express');
const cors = require('cors');

const app = express();
const axios = require("axios");
app.use(cors());
const options = {
  method: 'GET',
  url: 'https://v3.football.api-sports.io/fixtures',
  params: {date: '2023-02-28'},
  headers: {
    'X-Apisports-Key': 'dbab067259daa7d7286365bb42f35c79',
    'X-RapidAPI-Host': 'https://v3.football.api-sports.io/'
  }
};
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const JWT_SECRET =
"hvdvay6ert72839289()aiyg8t87qz12393293883lhefiuh78ttq3ifi78272jbkj?[]]az";

app.get('/addedMatches', async(req, res) => {
    const matches = await prisma.matches.findMany();
    res.send(matches);
});

app.get('/getProducts', async(req, res) => {
    const products = await prisma.shop.findMany();
    res.send(products);
});
app.post('/forgetpassword', async (req, res) => {
    const { email } = req.body;
    const User = await prisma.users.findUnique({
        where: {
            user_mail: email,
        },
    });
    if (!User) {
        return res.json({ status: "User Not Exists!!" });
    }
    try {
        const secret = JWT_SECRET + User.user_password;
        const token = jwt.sign({ email: User.user_mail, id: User.user_id }, secret, {
            expiresIn: "15m",
        });
        const link = `http://localhost:3000/resetpassword/${User.user_id}/${token}`;
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "dilekcesite@gmail.com",
                pass: "covcqjedfzkgqyrf",
            },
        });
        const mailOptions = {
            from: "dilekcesite@gmail.com",
            to: "muratyvz13@gmail.com",
            subject: "Password Reset",
            text: link,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            } else {
                console.log(`Email sent: ${info.response}`);
            }
        });
        console.log(link);
        res.send("we sent email");
        // eslint-disable-next-line no-empty
    } catch (error) {
        return res.status(502).json({ message: "db error" });
    }
});
app.post('/resetpassword/:userid/:token', async (req, res) => {
    const { userid,token } = req.params;
    const { password } = req.body;
    const User = await prisma.users.findUnique({
        where: {
            user_id: parseInt(userid, 10),
        },
    });
    const secret = JWT_SECRET + User.user_password;
    console.log(`${token}-----------${secret}`);

    try {
        const verify = jwt.verify(token, secret);

        const updatePassword = await prisma.users.update({
            where: { user_id: parseInt(userid, 10) },
            data: { user_password: bcryptjs.hashSync(password) },
        });
        res.send("doğrulandıdas");
        //     res.send("Doğrulandii");
        //    res.render("index", {
        //     email: verify.email,
        //      status: "Not Verified",
        //    });
    } catch (error) {
        //  res.send("error");
        res.send("Doğrulanmadı");
        console.log("Doğrulanmadı");
    }
});

app.post('/signup', async (req, res) => {
    const { user_name, user_password, user_mail, user_activation } =
                req.body;

    const existingUserMail = await prisma.users.findUnique({
            where: {
                user_mail,
            },
        });
        if (existingUserMail) {
            res.status(422).json({
                message: "Email address exists already!",
            });
            return;
        }
    const existingUserName = await prisma.users.findUnique({
            where: {
                user_name,
            },
        });
        if (existingUserName) {
            res.status(422).json({ message: "Username exists already!" });
            return;
        }
    const post = await prisma.users.create({
                data: {
                    user_name,
                    user_mail,
                    user_password: bcryptjs.hashSync(user_password),

                },
            });

            try {

                const User = await prisma.users.findUnique({
                    where: {
                        user_mail,
                    },
                });

                const secret = JWT_SECRET + User.user_password;

                const token = jwt.sign(
                    { email: User.user_mail, id: User.user_id },
                    secret,
                    {
                        expiresIn: "5m",
                    }
                );
                const link = `http://localhost:3000/activation/${User.user_id}/${token}`;
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: "dilekcesite@gmail.com",
                        pass: "covcqjedfzkgqyrf",
                    },
                });
                const mailOptions = {
                    from: "dilekcesite@gmail.com",
                    to: User.user_mail,
                    subject: "Password Reset",
                    text: link,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(`Email sent: ${info.response}`);
                    }
                });

            } catch (error) {
                console.log(error);
                return res.status(502).json({ message: "db error" });
            }
            res.status(201).send('User: Created')
});
app.get('/activation/:id/:token', async (req, res) => {
    const {id,token} =req.params;
    const User = await prisma.users.findUnique({
        where: {
            user_id: parseInt(id, 10),
        },
    });
    console.log(User);
    const secret = JWT_SECRET + User.user_password;
    console.log(`${token}-----------${secret}`);
    try {
        const verify = jwt.verify(token, secret);
        console.log(verify);
        const confirmMail = await prisma.users.update({
            where: { user_id: parseInt(id, 10) },
            data: { user_activation: true },
        });
        res.send("Doğrulandı");
    } catch (error) {
        res.send(error.message);
        res.send("Doğrulanmadı");
    }
});
app.post('/addmatch', async (req, res) => {
    const {matchCategory,fixture_id,home_name,away_name,league_name,country_name,home_icon,away_icon,matchTime,home_score,away_score,status} = req.body; 
    const existingMatch = await prisma.matches.findMany({
        where: {
            fixture_id,
            match_category:matchCategory
        },
    });
    
    if (existingMatch.length >0) {
        console.log(existingMatch);
        res.status(422).send('Bu maç daha önce eklenmiş!')
        return;
    }
    const matches = await prisma.matches.create({
        data: {
            fixture_id,
            home_name,
            home_icon,
            away_name,
            away_icon,
            league_name,
            country_name,
            matchTime,
            home_score,
            away_score,
            status,
            match_category:matchCategory
        },
    });
    res.status(201).send('Match: Created');

});

app.post('/addSettings', async (req, res) => {
    const {startingChip,winPrizeChip} = req.body;
    const matches = await prisma.settings.update({
        where: {
            setting_id:1,
          },
          data: {
            startingChip,
            winPrizeChip
        },
    });
    res.status(201).send('Settings: Added')
});

app.post('/addProduct', async (req, res) => {
    const {product_photo,product_name,product_price,product_pricetoChip} = req.body;
    const matches = await prisma.shop.create({
        data: {
            product_photo:"https://cdn.dsmcdn.com/ty497/product/media/images/20220801/13/153053275/530207131/1/1_org_zoom.jpg",
            product_name:product_name,
            product_price:+product_price,
            product_pricetoChip:+product_pricetoChip
        },
    });
    res.status(201).send('Product: Created')
});

    app.post('/deleteProduct', async (req, res) => {
        const {product_id} = req.body;
        const existingMatch = await prisma.shop.findUnique({
            where: {
                product_id,
            },
        });
        if (!existingMatch) {
            res.status(422).send('Bu ürün daha önce eklenmemiş')
            return;
        }
        const deleteMatch = await prisma.shop.delete({
            where: {
                product_id,
            },
        });
    
        res.status(201).send('Match: Deleted')
    });

app.post('/deletematch', async (req, res) => {
    const {match_id} = req.body;
    const existingMatch = await prisma.matches.findUnique({
        where: {
            match_id,
        },
    });
    if (!existingMatch) {
        res.status(422).send('Bu maç sisteme daha önce eklenmemiş')
        return;
    }
    const deleteMatch = await prisma.matches.delete({
        where: {
            match_id,
        },
    });

    res.status(201).send('Match: Deleted')
});

app.post('/addProduct', async (req, res) => {
    const {product_photo,product_name,product_price,product_pricetoChip} = req.body;
    const matches = await prisma.shop.create({
        data: {
            product_photo:"https://cdn.dsmcdn.com/ty497/product/media/images/20220801/13/153053275/530207131/1/1_org_zoom.jpg",
            product_name:product_name,
            product_price:+product_price,
            product_pricetoChip:+product_pricetoChip
        },
    });
    res.status(201).send('Product: Created')
});

app.post('/checkUserPredictMatch', async (req, res) => {
    const {match_id , user_id, match_category,prediction } = req.body;
    const existingPredict = await prisma.predictions.findMany({
        where: {
            match_id,
            user_id
        },
    });
    if (existingMatch.length >0) {
        console.log(existingMatch);
        res.send(1) // daha önce bu maçı oylamış
        return;
    }
    res.send(0)  // daha önce bu maçı oylamamış
});

app.post('/predictMatch', async (req, res) => {
    const {match_id,user_id, match_category,prediction } = req.body;

    const existingPredict = await prisma.predictions.findMany({
        where: {
            user_id,
            match_id
        },
    });
    
    if (existingMatch.length >0) {
        console.log(existingMatch);
        res.status(422).send('Daha önce tahmin yapmışsınız!')
        return;
    }

    const matches = await prisma.predictions.create({
        data: {
            match_id,
            user_id,
            match_category,
            prediction
        },
    });
    res.status(201).send('Predict Match: Created')
});
const port = 3000;
app.listen(port, () => console.log("Listening port "));
