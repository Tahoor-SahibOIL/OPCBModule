var selfs = this;
define([
  'icm/base/Constants',
  'icm/model/properties/controller/ControllerManager',
  "ecm/externalJS/CustomJS",
  'ecm/externalJS/PGS/js/PGS_ChecklistUtils',
  'ecm/externalJS/PGS/js/PGS_GateUtils',
  'ecm/externalJS/PGS/js/PGS_HTMLLoader',
  "ecm/model/Request",
  "ecm/model/ContentItem",
  'dojo/domReady!',
], function (
  Constants,
  ControllerManager,
  KGOCCustomJS,
  ChecklistUtils,
  GateUtils,
  HTMLLoader,
  Request, ContentItem
) {
  return function (payload) {
    var coord = payload.coordination
    var wiEditable = payload.workItemEditable

    var currentRole = ecm.model.desktop.currentRole.auth_name; 
    var customJS = new KGOCCustomJS();
    var currentStage = wiEditable.getProperty('F_CaseFolder', 'OPCB_CurrentStage')?.value || '';
    var stageNum = currentStage.replace(/\D/g, '');
    var isEditable = [
      'Controlling Team Leader',
      'Controlling Team Representative',
    ].includes(ecm.model.desktop.currentRole.auth_name)

    /*================================= BEFORELOADWIDGET ================================= */
    coord.participate(
      Constants.CoordTopic.BEFORELOADWIDGET,
      function (context, complete) {
        var observer = new MutationObserver(function () {
          var controllingTeamEl = document.getElementById('controllingTeam')
          if (!controllingTeamEl) return

            console.log(window.KGOCTeams);
            console.log(window.KGOCGroups);
            console.log(window);
          observer.disconnect();
          document.getElementById('infoMessage').textContent =  wiEditable.getProperty('F_CaseFolder', 'OPCB_InfoMessage')?.value || '';

          document.getElementById('controllingTeam').value =
            wiEditable.getProperty('F_CaseFolder', 'OPCB_ControllingTeam')
              ?.value || ''
          document.getElementById('initiatorName').value =
            wiEditable.getProperty('F_CaseFolder', 'OPCB_InitiatorName')
              ?.value || ''
          var raisedDate = wiEditable.getProperty(
            'F_CaseFolder',
            'OPCB_RaisedDate'
          )?.value
          document.getElementById('raisedDate').value = raisedDate
            ? new Date(raisedDate).toLocaleDateString()
            : ''
          document.getElementById('studyTitle').value =
            wiEditable.getProperty('F_CaseFolder', 'OPCB_StudyTitle')?.value ||
            ''
          document.getElementById('currentStage').value = currentStage

          var ownerTeamCode = wiEditable.getProperty("F_CaseFolder", "OPCB_ControllingTeam").value;
          var assignees = customJS.getMembersByDepartment(ownerTeamCode);
          console.log("taskUser", assignees);
          console.log("currentStage", currentStage);

          // Load Assessment Checklist Grid
          ChecklistUtils.loadChecklistGrid(
            wiEditable,
            stageNum,
            'Checklist',
            isEditable
          )

          if (stageNum !== 1 && stageNum !== 6) {
            ChecklistUtils.loadChecklistGrid(
              wiEditable,
              stageNum,
              'Deliverables',
              isEditable
            );
          } else {
            console.log("Deliverables checklist not loaded for stage", stageNum);
          }

          complete();
        })

        var observeTarget = document.getElementById('initiateGate')
        if (observeTarget) {
          observer.observe(observeTarget, { childList: true, subtree: true })
        } else {
          complete()
        }
      }
    )

    /*================================= BEFORECOMPLETE ================================= */
    coord.participate(
      Constants.CoordTopic.BEFORECOMPLETE,
      function (context, complete, abort) {
        var propsController = ControllerManager.bind(wiEditable)
        propsController.beginChangeSet()

        // Save Assessment Checklist Grid Data
        ChecklistUtils.saveChecklistGrid(
          wiEditable,
          stageNum,
          'Checklist',
          propsController
        )
        ChecklistUtils.saveChecklistGrid(
          wiEditable,
          stageNum,
          'Deliverables',
          propsController
        )

        // Increment Stage Number if Approved
        GateUtils.advanceGateIfApproved(wiEditable, context, propsController, complete, abort);

        propsController.endChangeSet()

      }
    )

    /*================================= BEFORESAVE ================================= */
    coord.participate(
      Constants.CoordTopic.BEFORESAVE,
      function (context, complete, abort) {
        var propsController = ControllerManager.bind(wiEditable)
        propsController.beginChangeSet()
        console.error("❌ Failed to add document to parent folder:");
        var caseObject = wiEditable.getCase();
        var currentStage = wiEditable.getProperty("F_CaseFolder", "OPCB_CurrentStage")?.value?.trim();
     
      caseObject.retrieveCaseFolder(function (rootFolder) {
          rootFolder.retrieveFolderContents(false, function (resultSet) {
            var items = resultSet.items || [];

            var stageFolder = items.find(function (item) {
              return item.mimetype === "folder" && item.name === currentStage;
            });

            console.log("stageFolder,",stageFolder);
            if (!stageFolder) {
              console.warn("⚠️ No folder found for current stage:", currentStage);
            } else {
              stageFolder.retrieveFolderContents(false, function (stageContents) {
                var docs = stageContents.items || [];
                console.log("docs",docs);
                if (docs.length > 0) {
                  wiEditable.getProperty("F_WorkflowField", "Gate_Attachments").setAttachments(docs);
                  console.log("✅ Gate_Attachments set with documents from stage:", currentStage);
                } else {
                  console.warn("⚠️ No documents found in stage folder:", currentStage);
                }
              });
            };
          });


        // Save Assessment Checklist Grid Data
        ChecklistUtils.saveChecklistGrid(
          wiEditable,
          stageNum,
          'Checklist',
          propsController
        )

        ChecklistUtils.saveChecklistGrid(
          wiEditable,
          stageNum,
          'Deliverables',
          propsController
        )

        // Increment Stage Number if Approved
        GateUtils.advanceGateIfApproved(wiEditable, context, propsController, complete, abort);

        propsController.endChangeSet()

        complete();

      }
    )}
  )



    HTMLLoader.load(
      '/navigator/ecm/externalJS/PGS/html/PGS_InitiateGate.html?v=1.0.0',
      'initiateGate',
      stageNum
    )
  }





})
