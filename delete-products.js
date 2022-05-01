//woocommerce API
var WooCommerceAPI = require("woocommerce-api");
const fs = require("fs");
const csv = require("csvtojson");
const { all, del } = require("express/lib/application");
const res = require("express/lib/response");

var WooCommerce = new WooCommerceAPI({
  url: "https://vitalcent.com",
  consumerKey: "ck_a57df1fb4a7f64a22e05b3f25ea6da01617ee027",
  consumerSecret: "cs_73a6a650233a895afb0b8ade7f516f1e4f8a13ba",
  wpAPI: true,
  version: "wc/v3",
});

async function main() {
  for (var i = 0; i < 10; i++) {
    var products = await getProducts();
    if (products.length < 1) {
      console.log(`All products deleted`);
      return;
    }
    console.log(`${products.length} left to delete`);
    for (var s = 0; s < products.length; s++) {
      var deleted = WooCommerce.delete(`products/${products[s].id}`);
    }
    setTimeout(() => {}, 1000);
  }
}

main();

async function getProducts() {
  var products = await WooCommerce.getAsync(`products?per_page=100`);
  products = JSON.parse(products.body);
  return products;
}
