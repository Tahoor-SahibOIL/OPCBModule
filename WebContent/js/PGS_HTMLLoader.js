define(["dojo/request"], function (request) {
    return {
      load: function (url, targetId, stageId) {
        request.get(url, { handleAs: "text" }).then(function (html) {
          var container = document.getElementById(targetId);
          if (container) {
            container.innerHTML = html;
            console.log("HTML injected into #" + targetId);
             if (["1", "6"].includes(stageId)) {
            console.log("HTML injected into #" + stageId);
              var deliverablesSection = document.getElementById("deliverablesAccordion");
              if (deliverablesSection) {
                deliverablesSection.style.display = "none";
              }
            }          

          } else {
            console.warn("HTML injection target #" + targetId + " not found.");
          }
        }, function (err) {
          console.error("Failed to load HTML:", err);
        });
      }
    };
  });
  