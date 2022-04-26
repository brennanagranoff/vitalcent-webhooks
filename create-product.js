//woocommerce API
var WooCommerceAPI = require("woocommerce-api");
const fs = require("fs");
const csv = require("csvtojson");
const { all } = require("express/lib/application");

var WooCommerce = new WooCommerceAPI({
  url: "https://breagr1.dream.press",
  consumerKey: "ck_a57df1fb4a7f64a22e05b3f25ea6da01617ee027",
  consumerSecret: "cs_73a6a650233a895afb0b8ade7f516f1e4f8a13ba",
  wpAPI: true,
  version: "wc/v1",
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
    productData[i]["parent-sku"] = currentRow["parent-sku"].toUpperCase();
  }

  //PARENT PRODUCT LOOPS
  for (var i = 0; i < productData.length; i++) {
    var currentRow = productData[i];

    if (currentRow["product-type"] == "parent-variable") {
      var product = { name: currentRow["name"], sku: currentRow["sku"], type: "variable" };
      productsToUpload.push(product);
      var productAttributes = {}
        productAttributes[currentRow["sku"]] = {};
  productAttributes[currentRow["sku"]].names = []
  productAttributes[currentRow["sku"]].uniqueNames = []
  productAttributes[currentRow["sku"]].values = []
  productAttributes[currentRow["sku"]].uniqueValues = []
    }
  }

  //VARIANT Attributes LOOP
  //This generates an array of all possible attributes and values
  var allAttributes = []
  for (var i = 0; i < productData.length; i++) {
    var currentRow = productData[i];

    //go through attrbutes
    if (currentRow["product-type"] == "child") {
      for (key in currentRow){
        //skip if not an attribute column
        if((key.includes("attribute") && key.includes("name")) || !key.includes("attribute")){
          continue
        }
        //get attribute number
        var attributeNumber = key.split("-")
        //grab attribute number
        attributeNumber = (attributeNumber[1])
        //skip if either is blank
        if (currentRow[`attribute-${attributeNumber}-name`].length < 1 || currentRow[`attribute-${attributeNumber}-value`].length < 1){
          continue
        }
        
        allAttributes.push({
          sku: currentRow["sku"],
          name: currentRow[`attribute-${attributeNumber}-name`],
          parentSku: currentRow["parent-sku"],
          value: currentRow[`attribute-${attributeNumber}-value`]
        })
        
      }
    }
  }


//Merge Attributes Together By Parent Product
//We find all attributes and possible values and group to their parent
for (var i=0;i<allAttributes.length;i++){
  var currentAttribute = allAttributes[i]
  //check if parent sku exists
  var parentSkuExists = false;

  //loop over parent products array to see if it exists
  for(var s=0;s<productsToUpload.length;s++){
    var currentProduct = productsToUpload[s]
    if (currentProduct.sku == currentAttribute.parentSku){
      parentSkuExists = true;
      break;
    }
  }

  //skip if no parent product in upload
  if (!parentSkuExists){
    continue
  }

  productAttributes[currentAttribute.parentSku].names.push(currentAttribute.name)
  productAttributes[currentAttribute.parentSku].values.push({
    attributeName: currentAttribute.name,
    value: currentAttribute.value
  })

}
for (key in productAttributes){
  //get unique attributes name and values
  var currentProduct = productAttributes[key]
  productAttributes[key].attributeData = [];
  var names = currentProduct.names;
  productAttributes[key].uniqueNames = names.filter((v, i, a) => a.indexOf(v) === i);
  for (var s=0;s<productAttributes[key].uniqueNames.length;s++){
    productAttributes[key].attributeData.push({
      name: productAttributes[key].uniqueNames[s],
      visible: false,
      variation:true,
      options:[]
    })
  }
  var values = currentProduct.values;
  productAttributes[key].uniqueValues = values.filter((v,i,a)=>a.findIndex(v2=>(JSON.stringify(v2) === JSON.stringify(v)))===i)
  for (var s=0;s<productAttributes[key].uniqueValues.length;s++){
    var attributeObjectIndex = productAttributes[key].attributeData.findIndex(object => {return object.name === productAttributes[key].uniqueValues[s].attributeName;});
    (productAttributes[key].attributeData[attributeObjectIndex].options.push(productAttributes[key].uniqueValues[s].value))
  }

  for (var s=0;s<productAttributes[key].attributeData.length;s++){
    var currentAttribute = productAttributes[key].attributeData[s];
    if (currentAttribute.options.length < 2){
      currentAttribute.visible = true;
      currentAttribute.variation = false;
    }
    productAttributes[key].attributeData[s] = currentAttribute
  }

  delete productAttributes[key].uniqueValues
  delete productAttributes[key].values
  delete productAttributes[key].uniqueNames
  delete productAttributes[key].names


}
console.log(productAttributes["GLOVES-3"])
}
main();