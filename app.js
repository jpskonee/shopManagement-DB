const express = require("express");
const ejs = require("ejs");
const port = 3000;


const mongoose = require("mongoose");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://jpskonee:jpskonee@cluster0.rfukp.mongodb.net/CartDB",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false

    });

const CartSchema = {
    "product_name": String,
    "product_des": String,
    "price": Number,
    "quantity": String,
    "imported": String
}

const Cart = new mongoose.model("cart", CartSchema);



//my api route
app.route("/myapi").get((req, res) => {
    res.render("my-api/my-api")
}).post((req, res) => {
    let username = req.body.username.toLowerCase();
    let pwd = req.body.pwd.toLowerCase();

    if (username === "jpskonee" && pwd === "jpskonee") {
        Cart.find((err, api) => {
            if (err) {
                throw err;
            } else if (api) {
                res.send(api)
            }
        })
    } else {
        res.render("my-api/wrongkey");
    }

});

//home route
app.get("/", (req, res) => {
    let todayDate = new Date().toLocaleDateString()
    res.render("index", { date: todayDate })
})


//insert route
app.post("/insert", (req, res) => {

    let nameToLowerCase = req.body.name
    let name = nameToLowerCase.toLowerCase();
    console.log(nameToLowerCase)

    const test = new Cart(
        {
            "product_name": name,
            "price": req.body.price,
            "product_des": req.body.description,
            "quantity": req.body.quantity,
            "imported": req.body.imported
        }
    )

    test.save(err => {
        if (err) {
            console.log(err)
        } else {
            res.render("alert", { name: name })
        }
    });

});

//read route (search)
app.post("/search", (req, res) => {
    let name = req.body.name.toLowerCase();


    if (name.length === 0) {
        name = null
    }

    const range = req.body.range;
    const imported = req.body.imported;

    Cart.find((err, results) => {
        let screenedResults = [];
        results.forEach(element => {
            if (element.product_name.includes(name)) {
                screenedResults.push(element)
            }
        });

        Cart.find({ $or: [{ price: { $lte: range } }, { imported: imported }] }, (err, secondResults) => {

            if (err) {
                console.log(err)
            } else if (screenedResults.length >= 1) {
                res.render("cart", { products: screenedResults });
            } else if (secondResults.length === 0) {
                if (name === null) {
                    res.render("noentry")
                } else {
                    res.render("bad", { name: name })
                }

            } else if (secondResults) {
                res.render("cart", { products: secondResults });
            }
        });
    });

});


//read route (searchAll)
app.get("/searchAll", (req, res) => {

    Cart.find((err, results) => {
        if (err) {
            console.log(err)
        } else {
            res.render("cart", { products: results });
            //res.send(results)
        }
    });
});


//buy/browse route
app.post("/buy", (req, res) => {
    let action;
    if (req.body.browse === "yes") {
        Cart.findById({ _id: req.body.productId }, (err, result) => {
            if (err) {
                console.log(err);
            } else if (result) {
                res.render("product", { product: result })
            }
        });

    } else if (req.body.buy === "yes") {
        Cart.findById(req.body.productId, (err, result) => {
            if (err) {
                console.log(err);
            } else if (result) {
                res.render("buy", { product: result })
            }
        });
    }
});


//payment route

app.post("/payment", (req, res) => {
    const productId = req.body.productId;
    const quantity = req.body.quantity;

    Cart.findById(productId, (err, result) => {
        let updateQuantity = result.quantity - quantity;

        Cart.findByIdAndUpdate(productId, { $set: { quantity: updateQuantity } }, (err) => {
            if (err) {
                console.log(err)
            } else if (!err) {
                res.render("aftersales", { id: req.body.productId, name: req.body.name })
            }
        });

    });

});




//listening for server
app.listen(process.env.PORT || port, () => {
    console.log(`Server is up and running on port ${port}`)
});