//woocommerce API
var WooCommerceAPI = require("woocommerce-api");
const fs = require("fs");
const csv = require("csvtojson");
const { all } = require("express/lib/application");
const res = require("express/lib/response");

var WooCommerce = new WooCommerceAPI({
  url: "https://vitalcent.com",
  consumerKey: "ck_a57df1fb4a7f64a22e05b3f25ea6da01617ee027",
  consumerSecret: "cs_73a6a650233a895afb0b8ade7f516f1e4f8a13ba",
  wpAPI: true,
  version: "wc/v3",
});

async function main() {
  const csvFilePath = "product-data.csv";
  const productData = await csv().fromFile(csvFilePath);

  var productsToUpload = [];
  var variantsToUpload = [];

  //FIELD STANDARDIZATION
  for (var i = 0; i < productData.length; i++) {
    var currentRow = productData[i];
    productData[i]["sku"] = currentRow["sku"].toUpperCase();
    productData[i]["product-type"] = currentRow["product-type"].toLowerCase();
    productData[i]["name"] = currentRow["name"].trim();
    productData[i]["parent-sku"] = currentRow["parent-sku"].toUpperCase();
    for (key in currentRow) {
      //skip if not an attribute column
      if (key.includes("attribute")) {
        productData[i][key] = productData[i][key].toLowerCase();
      }
    }
  }

  //PARENT PRODUCT LOOPS
  var productAttributes = {};
  for (var i = 0; i < productData.length; i++) {
    var currentRow = productData[i];

    if (currentRow["product-type"] == "parent-variable") {
      var product = { name: currentRow["name"], sku: currentRow["sku"], type: "variable" };
      if (currentRow["image-url"].length > 0) {
        product.images = [{ src: currentRow["image-url"] }];
      }
      productsToUpload.push(product);
      productAttributes[currentRow["sku"]] = {};
      productAttributes[currentRow["sku"]].names = [];
      productAttributes[currentRow["sku"]].uniqueNames = [];
      productAttributes[currentRow["sku"]].values = [];
      productAttributes[currentRow["sku"]].uniqueValues = [];
    }

    if (currentRow["product-type"] == "parent") {
      var product = { name: currentRow["name"], sku: currentRow["sku"], regular_price: currentRow["price"], type: "simple", attributes: [] };
      if (currentRow["image-url"].length > 0) {
        product.images = [{ src: currentRow["image-url"] }];
      }

      for (key in currentRow) {
        //skip if not an attribute column
        if ((key.includes("attribute") && key.includes("name")) || !key.includes("attribute")) {
          continue;
        }
        //get attribute number
        var attributeNumber = key.split("-");
        //grab attribute number
        attributeNumber = attributeNumber[1];
        //skip if either is blank
        if (currentRow[`attribute-${attributeNumber}-name`].length < 1 || currentRow[`attribute-${attributeNumber}-value`].length < 1) {
          continue;
        }
        product.attributes.push({
          name: currentRow[`attribute-${attributeNumber}-name`],
          options: [currentRow[`attribute-${attributeNumber}-value`]],
          visible: true,
          variation: false,
        });
      }
      if (!product.attributes.length > 0) {
        delete product.attributes;
      }

      productsToUpload.push(product);
    }
  }

  //VARIANT Attributes LOOP
  //This generates an array of all possible attributes and values
  var allAttributes = [];
  for (var i = 0; i < productData.length; i++) {
    var currentRow = productData[i];

    //go through attrbutes
    if (currentRow["product-type"] == "child") {
      variantsToUpload.push(currentRow);
      for (key in currentRow) {
        //skip if not an attribute column
        if ((key.includes("attribute") && key.includes("name")) || !key.includes("attribute")) {
          continue;
        }
        //get attribute number
        var attributeNumber = key.split("-");
        //grab attribute number
        attributeNumber = attributeNumber[1];
        //skip if either is blank
        if (currentRow[`attribute-${attributeNumber}-name`].length < 1 || currentRow[`attribute-${attributeNumber}-value`].length < 1) {
          continue;
        }

        var variantToPush = {
          sku: currentRow["sku"],
          name: currentRow[`attribute-${attributeNumber}-name`],
          parentSku: currentRow["parent-sku"],
          value: currentRow[`attribute-${attributeNumber}-value`],
        };

        allAttributes.push(variantToPush);
      }
    }
  }

  //Merge Attributes Together By Parent Product
  //We find all attributes and possible values and group to their parent
  for (var i = 0; i < allAttributes.length; i++) {
    var currentAttribute = allAttributes[i];
    //check if parent sku exists
    var parentSkuExists = false;

    //loop over parent products array to see if it exists
    for (var s = 0; s < productsToUpload.length; s++) {
      var currentProduct = productsToUpload[s];
      if (currentProduct.sku == currentAttribute.parentSku) {
        parentSkuExists = true;
        break;
      }
    }

    //skip if no parent product in upload
    if (!parentSkuExists) {
      continue;
    }

    productAttributes[currentAttribute.parentSku].names.push(currentAttribute.name);
    productAttributes[currentAttribute.parentSku].values.push({
      attributeName: currentAttribute.name,
      value: currentAttribute.value,
    });
  }
  for (key in productAttributes) {
    //get unique attributes name and values
    var currentProduct = productAttributes[key];
    productAttributes[key].attributeData = [];
    var names = currentProduct.names;
    productAttributes[key].uniqueNames = names.filter((v, i, a) => a.indexOf(v) === i);
    for (var s = 0; s < productAttributes[key].uniqueNames.length; s++) {
      productAttributes[key].attributeData.push({
        name: productAttributes[key].uniqueNames[s],
        visible: false,
        variation: true,
        options: [],
      });
    }
    var values = currentProduct.values;
    productAttributes[key].uniqueValues = values.filter((v, i, a) => a.findIndex((v2) => JSON.stringify(v2) === JSON.stringify(v)) === i);
    for (var s = 0; s < productAttributes[key].uniqueValues.length; s++) {
      var attributeObjectIndex = productAttributes[key].attributeData.findIndex((object) => {
        return object.name === productAttributes[key].uniqueValues[s].attributeName;
      });
      productAttributes[key].attributeData[attributeObjectIndex].options.push(productAttributes[key].uniqueValues[s].value);
    }

    var singleOptionCount = 0;
    for (var s = 0; s < productAttributes[key].attributeData.length; s++) {
      var currentAttribute = productAttributes[key].attributeData[s];
      if (currentAttribute.options.length < 2) {
        currentAttribute.visible = true;
        currentAttribute.variation = false;
        singleOptionCount = singleOptionCount + 1;
      }
      productAttributes[key].attributeData[s] = currentAttribute;
    }

    delete productAttributes[key].uniqueValues;
    delete productAttributes[key].values;
    delete productAttributes[key].uniqueNames;
    delete productAttributes[key].names;
  }

  //CREATE PARENT PRODUCTS
  for (var i = 0; i < productsToUpload.length; i++) {
    if (productsToUpload[i].type == "variable") {
      productsToUpload[i].attributes = productAttributes[productsToUpload[i].sku].attributeData;
    }
    var createProduct = await WooCommerce.postAsync("products", productsToUpload[i]);
    if (createProduct.statusCode == "201") {
      console.log(`Successfully created SKU: ${productsToUpload[i].sku}`);
    } else {
      console.log(`Error creating SKU: ${productsToUpload[i].sku} --- Error ${createProduct.body}`);
    }
  }
  //CREATE VARIANT PRODUCTS
  var variantDataArray = [];
  for (var i = 0; i < variantsToUpload.length; i++) {
    currentRow = variantsToUpload[i];
    var tempVariantArray = [];
    variantData = {
      regular_price: currentRow["price"],
      sku: currentRow["sku"],
      attributes: [],
    };
    if (currentRow["image-url"].length > 0) {
      variantData.image = { src: currentRow["image-url"] };
    }
    var parentProduct = await WooCommerce.getAsync(`products?sku=${currentRow["parent-sku"]}`);
    parentProduct = JSON.parse(parentProduct.body);
    if (parentProduct.length != 1) {
      console.log(`FAILED: Couldn't locate parent product for SKU: ${currentRow["parent-sku"]}`);
      continue;
    }

    parentProduct = parentProduct[0];

    variantData.parent_product_id = parentProduct.id;

    for (key in currentRow) {
      if ((key.includes("attribute") && key.includes("name")) || !key.includes("attribute")) {
        continue;
      }

      //get attribute number
      var attributeNumber = key.split("-");
      //grab attribute number
      attributeNumber = attributeNumber[1];
      //skip if either is blank
      if (currentRow[`attribute-${attributeNumber}-name`].length < 1 || currentRow[`attribute-${attributeNumber}-value`].length < 1) {
        continue;
      }

      tempVariantArray.push({
        name: currentRow[`attribute-${attributeNumber}-name`],
        option: currentRow[`attribute-${attributeNumber}-value`],
      });
    }

    var loopLength = tempVariantArray.length;
    for (var r = 0; r < loopLength; r++) {
      var variantAttribute = tempVariantArray[r];

      var parentAttribute = parentProduct.attributes.find((x) => x.name.toLowerCase() == variantAttribute.name.toLowerCase());

      if (parentAttribute.variation == true) {
        variantData.attributes.push(variantAttribute);
      }
    }

    //check if that variant already exists, if not then add it
    variantDataArray.push(variantData);
  }

  for (var i = 0; i < variantDataArray.length; i++) {
    var currentVariantInfo = variantDataArray[i];
    for (var s = 0; s < variantDataArray.length; s++) {
      var compareVariantInfo = variantDataArray[s];
      if (i == s) {
        continue;
      }
      //skip if we are talking about two different parent products
      if (currentVariantInfo.parent_product_id != compareVariantInfo.parent_product_id) {
        continue;
      }
      if (JSON.stringify(currentVariantInfo.attributes) == JSON.stringify(compareVariantInfo.attributes)) {
        variantDataArray[s] = {};
      }
    }
  }

  //remove empty variations (duplicates)
  const results = variantDataArray.filter((element) => {
    if (Object.keys(element).length !== 0) {
      return true;
    }

    return false;
  });

  for (var i = 0; i < results.length; i++) {
    var variantUpload = results[i];
    var parentID = variantUpload.parent_product_id;
    delete variantUpload.parent_product_id;
    // console.log(variantUpload);
    var createVariant = await WooCommerce.postAsync(`products/${parentID}/variations`, variantUpload);
    if (createVariant.statusCode == "201") {
      console.log(`Successfully created variant: ${parentID}: ${variantUpload.sku}`);
    } else {
      console.log(`Error creating variant: ${parentID}: ${variantUpload.sku} --- Error ${createVariant.body}`);
    }
  }
}

main();
