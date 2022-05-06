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

var categories = [
  "Personal Protective Equipment",
  "Cotton & Paper Supplies",
  "Saliva Ejectors, HVE & Aspirator Tips",
  "Prophy Angles, Brushes & Cups",
  "Preventative & Oral Hygiene Products",
  "Sterilization, Disinfectants, & Line Cleaners",
  "First Aid Kits & Supplies",
  "Bur & Diamond Rotary Instruments",
  "Finishing & Polishing Rotary Instruments",
  "Office Supplies",
  "X-Ray Film & Digital Holders",
  "Restorative/Cosmetic Materials",
  "Retainers, Bands, & Wedges",
  "Dispensing Tips & Applicator Brushes",
  "Topica/Injectable Anesthetics & Needles",
  "Barrier Protection",
  "Endodontics",
  "Biohazard Supplies",
  "Dispensable Medications",
  "Pemanent & Temporary Cements & Desensitizers",
  "Temporary Crown & Bridge Material",
  "Autoclave Supplies",
  "Orthodontic Accessories",
  "Impression Trays",
  "Handpieces",
  "Instruments",
  "Retraction Materials",
  "Pins & Posts",
  "Surgical Materials",
  "Curing Lights & Accessories",
  "Mixing Wells",
  "Bleaching/Tooth Whitening",
  "Temporary Crown and Bridge Materials",
  "Nitrous Oxide Products",
];

async function main() {
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    var data = {
      name: category,
    };
    var cats = await WooCommerce.postAsync("products/categories", data);
    if (cats.statusCode == "201") {
      console.log(`Successfully created category: ${category}`);
    } else {
      console.log(`Error creating cateogry: ${category}: --- Error ${cats.body}`);
    }
  }

}

main();
