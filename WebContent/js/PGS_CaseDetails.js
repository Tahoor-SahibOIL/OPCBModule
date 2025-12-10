var selfs = this;
define([
  'icm/base/Constants',
  'icm/model/properties/controller/ControllerManager',
  "ecm/externalJS/CustomJS",
  'ecm/externalJS/PGS/js/PGS_ChecklistUtils',
  'ecm/externalJS/PGS/js/PGS_GateUtils',
  'ecm/externalJS/PGS/js/PGS_HTMLLoader',
  'dojo/domReady!',
], function (
  Constants,
  ControllerManager,
  KGOCCustomJS,
  ChecklistUtils,
  GateUtils,
  HTMLLoader
) {
  return function (payload) {
    var coord = payload.coordination
    var editable = payload.workItemEditable
    
var editable = payload.caseEditable;

    var customJS = new KGOCCustomJS();
    // var currentStage = editable.getProperty('F_CaseFolder', 'OPCB_CurrentStage')?.value || ''
    
	var currentStage = editable.getProperty("F_CaseFolder", "OPCB_CurrentStage").value;
    console.log("currentStage",currentStage);
    // var stageNum = currentStage.replace(/\D/g, '')
    var isEditable = [
      'Controlling Team Leader',
      'Controlling Team Representative',
    ].includes(ecm.model.desktop.currentRole.auth_name)

    /*================================= BEFORELOADWIDGET ================================= */
    coord.participate(
      Constants.CoordTopic.BEFORELOADWIDGET,
      function (context, complete) {

        console.log("POINT1");
        var observer = new MutationObserver(function () {
          var controllingTeamEl = document.getElementById('controllingTeam')
          if (!controllingTeamEl) return

        console.log("POINT2");
          observer.disconnect()

        console.log("POINT3");
          document.getElementById('controllingTeam1').value = editable.getProperty('F_CaseFolder', 'OPCB_ControllingTeam') ? editable.getProperty('F_CaseFolder', 'OPCB_ControllingTeam').value || '';
          document.getElementById('initiatorName1').value = editable.getProperty('F_CaseFolder', 'OPCB_InitiatorName') ? editable.getProperty('F_CaseFolder', 'OPCB_InitiatorName').value || '';
          var raisedDate = editable.getProperty(
            'F_CaseFolder',
            'OPCB_RaisedDate'
          )?.value
          document.getElementById('raisedDate1').value = raisedDate
            ? new Date(raisedDate).toLocaleDateString()
            : ''
          document.getElementById('studyTitle1').value =
            editable.getProperty('F_CaseFolder', 'OPCB_StudyTitle')?.value ||
            ''
          document.getElementById('currentStage1').value = currentStage
          console.log("currentStage", currentStage);

        complete();
        })

        var observeTarget = document.getElementById('initiateGateDetails')
        if (observeTarget) {
          observer.observe(observeTarget, { childList: true, subtree: true })
        } else {
          complete()
        }
      }
    )

    HTMLLoader.load(
      '/navigator/ecm/externalJS/PGS/html/PGS_CaseDetails.html?v=1.0.0',
      'initiateGateDetails'
    )
  }





})
