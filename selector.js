jQuery(document).ready(function ($) {
  $("table.variations select").on("change", function () {
    setTimeout("", 300);
    checkOptions();
  });

  function checkOptions() {
    $("table.variations select").each(function () {
      console.log($(this).attr("id"));
      console.log($(this).find(":selected").text());
      if ($(this).children("option").length == 2 && $(this).find(":selected").text() == "Choose an option") {
        $(this).children(":nth-child(2)").attr("selected", "selected");
      }
    });
  }
});
