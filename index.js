//woocommerce API
var WooCommerceAPI = require("woocommerce-api");

var WooCommerce = new WooCommerceAPI({
  url: "https://breagr1.dream.press",
  consumerKey: "ck_a57df1fb4a7f64a22e05b3f25ea6da01617ee027",
  consumerSecret: "cs_73a6a650233a895afb0b8ade7f516f1e4f8a13ba",
  wpAPI: true,
  version: "wc/v1",
});

// Require express and body-parser
const express = require("express");
const bodyParser = require("body-parser");
// Initialize express and define a port
const app = express();
const PORT = 3001;
// Tell express to use body-parser's JSON parsing
app.use(bodyParser.json());
// Start express on the defined port
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

//...
app.use(bodyParser.json());
app.post("/order-create", (req, res) => {
  var order = req.body;

  //set all orders to processing
  WooCommerce.putAsync(`orders/${order.id}`, { status: "processing" }).then(function (result) {
    console.log(`set order ${order.id} to processing`)
  });

  res.status(200).end(); // Responding is important
});

app.post("/order-update", (req, res) => {
  var order = req.body;

  res.status(200).end(); // Responding is important
});
//...

//   WooCommerce.put(`/wp-json/wc/v3/orders/${order.id})`, { status: "on-hold" }).then(function (result) {
//     console.log(result);
//   });
