define([
    "dojo/dom-construct",
    "dojo/store/Memory",
    "gridx/Grid",
    "gridx/core/model/cache/Sync",
    "gridx/modules/CellWidget",
    "gridx/modules/Edit",
    "gridx/modules/SingleSort"
  ], function (domConstruct, Memory, Grid, Cache, CellWidget, Edit, SingleSort) {
  
    function setupDragToCheck() {
      let isDragging = false;
      let dragState = null;
  
      window.addEventListener("mousedown", function (e) {
        const wrapper = e.target.closest(".dijitCheckBox");
        if (wrapper) {
          const checkbox = dijit.getEnclosingWidget(wrapper);
          if (checkbox) {
            isDragging = true;
            dragState = !checkbox.get("checked");
            checkbox._onClick({ preventDefault() {}, stopPropagation() {}, defaultPrevented: false });
          }
        }
      }, true);
  
      window.addEventListener("mouseup", function () {
        isDragging = false;
        dragState = null;
      }, true);
  
      window.addEventListener("mousemove", function (e) {
        if (!isDragging) return;
        const wrapper = e.target.closest(".dijitCheckBox");
        if (wrapper) {
          const checkbox = dijit.getEnclosingWidget(wrapper);
          if (checkbox && checkbox.get("checked") !== dragState) {
            checkbox._onClick({ preventDefault() {}, stopPropagation() {}, defaultPrevented: false });
          }
        }
      }, true);
    }
  
    return {
      createChecklistGrid: function (containerId, gridId, title, choices, isEditable) {
        const data = choices.map((choice, index) => ({
          id: index + 1,
          SrNo: choice.SrNo,
          Criteria: choice.Criteria,
          Assessed: choice.Assessed,
          Comments: choice.Comments
        }));
  
        domConstruct.empty(containerId);
  
        const layout = [
          { name: "Sr. No", field: "SrNo", width: "8%", sortable: false, headerStyles: "text-align: center" },
          { name: "Criteria", field: "Criteria", width: "50%", sortable: false, headerStyles: "text-align: center" },
          {
            name: "Assessed",
            field: "Assessed",
            width: "10%",
            sortable: false,
            alwaysEditing: isEditable,
            editor: isEditable ? "dijit.form.CheckBox" : undefined,
            editorArgs: isEditable ? { props: "value: true" } : undefined,
            styles: "text-align: center",
            headerStyles: "text-align: center",
            formatter: isEditable ? null : function (value) {
              const isChecked = (value.Assessed === true || value.Assessed === "true");
              return isChecked
                ? "<span style='color: green; font-size: 16px;'>&#10003;</span>"
                : "<span style='color: red; font-size: 16px;'>&#10007;</span>";
            }
          },
          {
            name: "Comments",
            field: "Comments",
            width: "auto",
            sortable: false,
            alwaysEditing: isEditable,
            editor: isEditable ? "dijit.form.TextBox" : undefined,
            editorArgs: isEditable ? { props: "trim: true" } : undefined,
            headerStyles: "text-align: center"
          }
        ];
  
        const store = new Memory({ data });
        const grid = new Grid({
          id: gridId,
          store,
          cacheClass: Cache,
          structure: layout,
          autoHeight: true,
          modules: [CellWidget, Edit, SingleSort]
        });
  
        grid.placeAt(containerId);
        grid.startup();
        setupDragToCheck();
  
        return grid;
      }
    };

    

  });
  