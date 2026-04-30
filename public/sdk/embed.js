/**
 * Kastia Embed SDK
 * Usage:
 *   <div id="kastia-embed-MARKET_ID"></div>
 *   <script src="https://kastia.lovable.app/sdk/embed.js"
 *           data-market="MARKET_ID"
 *           data-size="standard"
 *           data-theme="auto"
 *           data-responsive="true"
 *           data-spinner="true"></script>
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var marketId = script.getAttribute("data-market");
  if (!marketId) {
    console.warn("[Kastia] Missing data-market attribute on embed script.");
    return;
  }

  var size = script.getAttribute("data-size") || "standard";
  var theme = script.getAttribute("data-theme") || "auto"; // light | dark | auto
  var responsive = script.getAttribute("data-responsive") !== "false";
  var spinner = script.getAttribute("data-spinner") !== "false";
  var origin = new URL(script.src).origin;

  var heights = { compact: 170, standard: 220, large: 300 };
  var height = heights[size] || heights.standard;

  var qs =
    "?ref=script" +
    (size === "compact" ? "&compact=true" : "") +
    "&theme=" + encodeURIComponent(theme) +
    "&spinner=" + (spinner ? "true" : "false");

  var container =
    document.getElementById("kastia-embed-" + marketId) ||
    (function () {
      var d = document.createElement("div");
      script.parentNode.insertBefore(d, script);
      return d;
    })();

  var iframe = document.createElement("iframe");
  iframe.src = origin + "/embed/" + marketId + qs;
  iframe.width = "100%";
  iframe.height = String(height);
  iframe.frameBorder = "0";
  iframe.style.cssText =
    "border:none;border-radius:12px;overflow:hidden;display:block;" +
    (responsive ? "width:100%;max-width:100%;" : "max-width:520px;");
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("loading", "lazy");
  iframe.title = "Kastia prediction market";

  container.innerHTML = "";
  container.appendChild(iframe);
})();
