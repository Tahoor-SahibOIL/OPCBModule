define(['ecm/externalJS/PGS/js/PGS_GridUtils'], function (GridUtils) {
  return {
    loadChecklistGrid: function (wiEditable, stageNum, propType, isEditable) {
      var suffix = propType === 'Checklist' ? 'Checklist' : 'Deliverables'
      var propName =
        'OPCB_Phase' +
        stageNum +
        (suffix === 'Checklist' ? 'ChoiceList' : suffix)
      var resultProp = 'OPCB_Phase' + stageNum + suffix + 'Results1'

      var choices = wiEditable.getProperty('F_CaseFolder', propName)?.choiceList?.choices || []
      var savedList = wiEditable.getProperty('F_CaseFolder', resultProp)?.value || []
    
      var savedItems = savedList.map(function (str) {
        try {
          return JSON.parse(str)
        } catch (e) {
          return null
        }
      }).filter(Boolean)

      var data = choices.map(function (choice) {
        var match = savedItems.find(function (r) {
          return r.value === choice.value
        })
        return {
          SrNo: choice.value,
          Criteria: choice.displayName || '[Missing Criteria]',
          Assessed: match?.assessed || false,
          Comments: match?.comments || '',
        }
      })

      var gridId =
        (suffix === 'Checklist' ? 'assessmentGrid_' : 'deliverablesGrid_') +
        wiEditable.id
      var containerId =
        suffix === 'Checklist'
          ? 'assessmentGridContainer'
          : 'deliverablesGridContainer'

      GridUtils.createChecklistGrid(containerId, gridId, '', data, isEditable)
    },
    saveChecklistGrid: function (
      wiEditable,
      stageNum,
      propType,
      propsController
    ) {
      var suffix = propType === 'Checklist' ? 'Checklist' : 'Deliverables'
      var resultProp = 'OPCB_Phase' + stageNum + suffix + 'Results1'
      var gridId =
        (suffix === 'Checklist' ? 'assessmentGrid_' : 'deliverablesGrid_') +
        wiEditable.id

      var grid = dijit.byId(gridId)
      if (!grid) {
        console.warn('Grid not found:', gridId)
        return
      }

      var items = grid.store.query().map(function (item) {
        return {
          value: item.SrNo,
          assessed: item.Assessed,
          comments: item.Comments,
        }
      })

      // Convert each object into a JSON string
      var stringifiedItems = items.map(JSON.stringify);

      var propCtrl = propsController.getPropertyController(resultProp);     
      if (propCtrl) {
        propCtrl.set('value', stringifiedItems);
      } else {
        console.warn("Property controller not found for:", resultProp);
      }
    },
    saveTeamComments: function (wiEditable) {
      var commentInputId = "txtComments_" + wiEditable.id;
      var commentInput = document.getElementById(commentInputId);

      if (!commentInput) {
          console.warn("❌ Comment input not found:", commentInputId);
          return;
      }

      var newComment = commentInput.value.trim();
      var commentPropName = "OPCB_AddComments"; // This is an Array in F_CaseTask

      // Access F_CaseTask properties
      var taskProps = wiEditable.propertiesCollection;

      if (taskProps && taskProps[commentPropName]) {
          // OPTIONAL: Append to existing comments
          // taskProps[commentPropName].value.push(newComment);

          // RECOMMENDED: Replace with new single comment
          taskProps[commentPropName].value = [newComment];

          console.log("✅ OPCB_AddComments saved via propertiesCollection:", taskProps[commentPropName].value);
      } else {
          console.warn("❌ OPCB_AddComments not found in F_CaseTask properties");
      }
    },
    validateChecklistGrid: function (wiEditable, propType) {
      var suffix = propType === 'Checklist' ? 'Checklist' : 'Deliverables';
      var gridId =
        (suffix === 'Checklist' ? 'assessmentGrid_' : 'deliverablesGrid_') +
        wiEditable.id;

      var grid = dijit.byId(gridId);
      if (!grid) {
        console.warn('Grid not found:', gridId);
        var result = { isValid: true };
        return result;
      }

      var rows = grid.store.query();
      var invalidRows = [];

      rows.forEach(function (item, index) {
        if (!item.Assessed && (!item.Comments || item.Comments.trim() === '')) {
          invalidRows.push(index + 1); // Optional: row index or SrNo
        }
      });

      var result;
      if (invalidRows.length > 0) {
        result = {
          isValid: false,
          message:
            'Comments are required for the following '+propType+' item(s) where the "Assessed" option is not checked: ' +
            invalidRows.join(', '),
          rows: invalidRows
        };
      } else {
        result = { isValid: true };
      }

      return result;
    }

  }
})
