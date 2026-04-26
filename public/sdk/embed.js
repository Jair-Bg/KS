/**
 * Kastia Embed SDK
 * Usage:
 *   <div id="kastia-embed-MARKET_ID"></div>
 *   <script src="https://kastia.lovable.app/sdk/embed.js"
 *           data-market="MARKET_ID"
 *           data-size="standard"></script>
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
  var origin = new URL(script.src).origin;

  var heights = { compact: 170, standard: 220, large: 300 };
  var height = heights[size] || heights.standard;
  var compactParam = size === "compact" ? "&compact=true" : "";

  var container =
    document.getElementById("kastia-embed-" + marketId) ||
    (function () {
      var d = document.createElement("div");
      script.parentNode.insertBefore(d, script);
      return d;
    })();

  var iframe = document.createElement("iframe");
  iframe.src = origin + "/embed/" + marketId + "?ref=script" + compactParam;
  iframe.width = "100%";
  iframe.height = String(height);
  iframe.frameBorder = "0";
  iframe.style.cssText =
    "border:none;border-radius:12px;overflow:hidden;max-width:520px;display:block;";
  iframe.setAttribute("allow", "clipboard-write");
  iframe.setAttribute("loading", "lazy");
  iframe.title = "Kastia prediction market";

  container.innerHTML = "";
  container.appendChild(iframe);
})();
