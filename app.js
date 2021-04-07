const express = require("express");
const ejs = require("ejs");
const port = 3000;

const mongoose = require("mongoose");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://jpskonee:jpskonee@cluster0.rfukp.mongodb.net/CartDB", { useNewUrlParser: true, useUnifiedTopology: true })

const CartSchema = {
    "product_name": String,
    "product_des": String,
    "price": Number,
    "quantity": String,
    "imported": String
}

const Cart = new mongoose.model("cart", CartSchema);
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

    let nameToLowerCase = req.body.name;
    let name = nameToLowerCase.toLowerCase();
    const range = req.body.range;
    const imported = req.body.imported;

    Cart.find({ $or: [{ product_name: name }, { price: { $lte: range } }, { imported: imported }] }, (err, results) => {
        if (err) {
            console.log(err)
        } else if (!results) {
            res.render("alert", { name: name })
        } else {
            res.render("cart", { products: results });
        }
    });
});


//read route (searchAll)
app.post("/searchAll", (req, res) => {

    Cart.find((err, results) => {
        if (err) {
            console.log(err)
        } else {
            res.render("cart", { products: results });
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
app.listen(port || process.env.PORT, () => {
    console.log(`Server is up and running on port ${port}`)
});