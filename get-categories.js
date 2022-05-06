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
  var cats = await WooCommerce.getAsync("products/categories?per_page=100");
  cats = JSON.parse(cats.body);
  console.log(cats);
  var output = {};
  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    output[cat.name] = cat.id;
  }
  console.log(output);
}

main();
