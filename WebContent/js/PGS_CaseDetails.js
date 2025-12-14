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
    var coord = payload.coordination;
    var editable = payload.workItemEditable;
    
var editable = payload.caseEditable;

    var customJS = new KGOCCustomJS();
    // var currentStage = editable.getProperty('F_CaseFolder', 'OPCB_CurrentStage')?.value || ''
    
	var currentStage = editable.getProperty("F_CaseFolder", "OPCB_CurrentStage").value;

    // var stageNum = currentStage.replace(/\D/g, '')
    var isEditable = [
      'Controlling Team Leader',
      'Controlling Team Representative',
    ].includes(ecm.model.desktop.currentRole.auth_name);

    /*================================= BEFORELOADWIDGET ================================= */
    coord.participate(
      Constants.CoordTopic.BEFORELOADWIDGET,
      function (context, complete) {

        var observer = new MutationObserver(function () {
          var controllingTeamEl = document.getElementById('controllingTeam');
          if (!controllingTeamEl) return

          observer.disconnect();

//          document.getElementById('controllingTeam1').value = editable.getProperty('F_CaseFolder', 'OPCB_ControllingTeam') ? editable.getProperty('F_CaseFolder', 'OPCB_ControllingTeam').value || '';
//          document.getElementById('initiatorName1').value = editable.getProperty('F_CaseFolder', 'OPCB_InitiatorName') ? editable.getProperty('F_CaseFolder', 'OPCB_InitiatorName').value || '';
//          var raisedDate = editable.getProperty('F_CaseFolder','OPCB_RaisedDate')?.value;
//          document.getElementById('raisedDate1').value = raisedDate ? new Date(raisedDate).toLocaleDateString() : ''
//          document.getElementById('studyTitle1').value = editable.getProperty('F_CaseFolder', 'OPCB_StudyTitle')?.value || ''
//          document.getElementById('currentStage1').value = currentStage

          
          var controllingTeam = editable.getProperty('F_CaseFolder', 'OPCB_ControllingTeam');
          document.getElementById('controllingTeam1').value = controllingTeam ? controllingTeam.value : '';

          var initiatorName = editable.getProperty('F_CaseFolder', 'OPCB_InitiatorName');
          document.getElementById('initiatorName1').value = initiatorName ? initiatorName.value : '';

          var raisedProp = editable.getProperty('F_CaseFolder', 'OPCB_RaisedDate');
          var raisedDate = raisedProp ? raisedProp.value : null;
          document.getElementById('raisedDate1').value =
              raisedDate ? new Date(raisedDate).toLocaleDateString() : '';

          var studyTitle = editable.getProperty('F_CaseFolder', 'OPCB_StudyTitle');
          document.getElementById('studyTitle1').value = studyTitle ? studyTitle.value : '';

          document.getElementById('currentStage1').value = currentStage;  // ensure currentStage exists
          complete();

        complete();
          
          
          
          var controllingTeam = editable.getProperty('F_CaseFolder', 'OPCB_ControllingTeam');
          document.getElementById('controllingTeam1').value = controllingTeam ? controllingTeam.value : '';

          var initiatorName = editable.getProperty('F_CaseFolder', 'OPCB_InitiatorName');
          document.getElementById('initiatorName1').value = initiatorName ? initiatorName.value : '';

          var raisedProp = editable.getProperty('F_CaseFolder', 'OPCB_RaisedDate');
          var raisedDate = raisedProp ? raisedProp.value : null;
          document.getElementById('raisedDate1').value =
              raisedDate ? new Date(raisedDate).toLocaleDateString() : '';

          var studyTitle = editable.getProperty('F_CaseFolder', 'OPCB_StudyTitle');
          document.getElementById('studyTitle1').value = studyTitle ? studyTitle.value : '';

          document.getElementById('currentStage1').value = currentStage;  // ensure currentStage exists

          if (typeof complete === "function") {
              complete();
          }

        });

        var observeTarget = document.getElementById('initiateGateDetails')
        if (observeTarget) {
          observer.observe(observeTarget, { childList: true, subtree: true })
        } else {
          complete();
        }
      }
    )

    HTMLLoader.load(
      '/navigator/ecm/externalJS/PGS/html/PGS_CaseDetails.html?v=1.0.0',
      'initiateGateDetails'
    );
  }





})
